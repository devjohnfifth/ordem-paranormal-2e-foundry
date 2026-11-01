import { OP2E } from "../config.mjs";
import { rolarTeste, publicarTeste, passoDado } from "../dice/teste.mjs";

/** Escapa texto simples para uso em HTML de chat. */
function esc(texto) {
  return foundry.utils.escapeHTML(String(texto ?? ""));
}

export default class OP2Actor extends Actor {
  /** Bônus somado nas tabelas de lesão/trauma conforme o patamar do personagem. */
  get bonusPatamar() {
    return OP2E.patamarBonus[this.system.patamar] ?? 0;
  }

  /**
   * Rola um teste de perícia usando o atributo-base configurado (ou um atributo alternativo).
   * @param {string} chavePericia  Chave da perícia em OP2E.pericias (ex.: "percepcao").
   * @param {object} [opcoes]
   * @param {string} [opcoes.atributo]     Sobrescreve o atributo-base sugerido pela perícia.
   * @param {string} [opcoes.campo]        Campo de Aptidão, quando `chavePericia === "aptidao"`.
   * @param {number} [opcoes.dt]           Dificuldade do teste.
   * @param {number} [opcoes.passo]        Aumenta (positivo) ou diminui (negativo) o passo dos dados de
   *                                       atributo e perícia antes de rolar (ajuda, vantagens situacionais etc.).
   * @param {number[]} [opcoes.dadosExtras] Tamanhos de dados adicionais a somar ao teste (máx. 4 dados no total).
   * @param {boolean} [opcoes.silencioso]  Não publica o chat card (o chamador publica).
   * @param {string} [opcoes.rotulo]       Texto do teste no chat (substitui o padrão "Atributo + Perícia").
   */
  async rolarPericia(
    chavePericia,
    { atributo, campo, dt, passo = 0, dadosExtras = [], silencioso = false, rotulo, criticoMin } = {}
  ) {
    if (this.type !== "personagem") return null;

    const infoPericia = OP2E.pericias[chavePericia];
    if (!infoPericia) throw new Error(`Perícia desconhecida: ${chavePericia}`);

    const chaveAtributo = atributo ?? infoPericia.atributo;
    let dadoAtributo = this.system.atributos[chaveAtributo]?.dado;

    let dadoPericia;
    let rotuloPericia = game.i18n.localize(`OP2E.Pericia.${chavePericia}`);
    if (chavePericia === "aptidao") {
      if (!campo) throw new Error("É necessário informar o campo de Aptidão.");
      dadoPericia = this.system.pericias.aptidao.campos[campo]?.dado;
      rotuloPericia += ` (${game.i18n.localize(OP2E.camposAptidao[campo])})`;
    } else {
      dadoPericia = this.system.pericias[chavePericia]?.dado;
      if (chavePericia === "oficio" && this.system.oficioEspecialidade) {
        rotuloPericia += ` (${this.system.oficioEspecialidade})`;
      }
    }

    if (passo) {
      dadoAtributo = passoDado(dadoAtributo, passo);
      dadoPericia = passoDado(dadoPericia, passo);
    }

    const rotuloAtributo = game.i18n.localize(`OP2E.Atributo.${chaveAtributo}`);
    const flavor =
      rotulo ??
      game.i18n.format("OP2E.Chat.Teste", {
        atributo: rotuloAtributo,
        pericia: rotuloPericia
      });

    const resultado = await rolarTeste({
      dadoAtributo,
      dadoPericia,
      dadosExtras,
      dadoPavor: this.system.pavor?.dado ?? 0,
      dt,
      criticoMin,
      flavor,
      actor: this,
      silencioso
    });

    if (!resultado.passou) await this.preencherImpeto();

    return resultado;
  }

  /** Ao falhar em um teste, preenche um espaço da barra de Ímpeto (se o personagem tiver essa habilidade). */
  async preencherImpeto() {
    if (this.type !== "personagem") return;
    const { value, max } = this.system.impeto;
    if (max <= 0 || value >= max) return;
    await this.update({ "system.impeto.value": value + 1 });
  }

  /** Gasta espaços preenchidos da barra de Ímpeto para pagar um dos efeitos listados na habilidade Ímpeto. */
  async gastarImpeto(quantidade) {
    if (this.type !== "personagem") return;
    const { value } = this.system.impeto;
    if (value < quantidade) {
      ui.notifications.warn(game.i18n.localize("OP2E.Aviso.ImpetoInsuficiente"));
      return false;
    }
    await this.update({ "system.impeto.value": value - quantidade });
    return true;
  }

  /** Altera os marcadores de Análise (limitados entre 0 e o máximo da ficha). */
  async ajustarAnalise(delta) {
    const { value, max } = this.system.analise;
    if (max <= 0) return;
    await this.update({ "system.analise.value": Math.clamp(value + delta, 0, max) });
  }

  /* -------------------------------------------- */
  /*  Lesões, traumas e morte                     */
  /* -------------------------------------------- */

  /** Busca a linha da tabela correspondente a um resultado (já com o bônus de patamar somado). */
  #linhaDaTabela(tabela, resultado) {
    return tabela.find((l) => resultado >= l.de && resultado <= l.ate) ?? tabela.at(-1);
  }

  async #publicarCard({ titulo, linhas = [], destaque = "", classe = "" }) {
    const corpo = linhas.map((l) => `<p>${l}</p>`).join("");
    const conteudo = `<div class="op2e chat-item op2e-card-regra ${classe}"><h3>${esc(titulo)}</h3>${
      destaque ? `<p class="op2e-destaque">${destaque}</p>` : ""
    }${corpo}</div>`;
    return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: conteudo });
  }

  /**
   * Teste de lesão (Físico + Vigor, DT 7 +3 por teste na cena) ao chegar a 0 PV ou perder PV com 0.
   * Aplica o resultado: crítico (+1 PV), sucesso (inconsciente e moribundo), falha (rola na tabela de
   * lesões) ou falha crítica (morte).
   */
  async rolarTesteFerimento() {
    if (this.type !== "personagem") return null;
    const tentativa = this.system.testesFerimento ?? 0;
    const dt = OP2E.dificuldadePadrao + tentativa * 3;
    const resultado = await this.rolarPericia("vigor", { dt, rotulo: `Teste de Lesão (Físico + Vigor, DT ${dt})` });
    await this.update({ "system.testesFerimento": tentativa + 1 });

    if (this.system.edicao !== "beta") return resultado;

    if (resultado.falhaCritica) {
      await this.#publicarCard({
        titulo: "Teste de Lesão: falha crítica",
        destaque: "Morre! Hora de criar um personagem novo.",
        classe: "op2e-morte"
      });
      await this.update({ "system.condicoes.inconsciente": true, "system.condicoes.moribundo": false });
    } else if (resultado.critico) {
      await this.update({
        "system.recursos.pv.value": Math.max(1, this.system.recursos.pv.value),
        "system.condicoes.inconsciente": false,
        "system.condicoes.moribundo": false
      });
      await this.#publicarCard({
        titulo: "Teste de Lesão: sucesso crítico",
        destaque: "Recupera 1 PV e se recupera de inconsciente/moribundo."
      });
    } else if (resultado.passou) {
      await this.update({ "system.condicoes.inconsciente": true, "system.condicoes.moribundo": true });
      await this.#publicarCard({
        titulo: "Teste de Lesão: sucesso",
        destaque: "Fica inconsciente e moribundo.",
        linhas: ["No fim de cada rodada (exceto a que ficou moribundo), faça um teste de morte."]
      });
    } else {
      await this.rolarLesao();
    }
    return resultado;
  }

  /** Rola 1d20 + bônus do patamar na tabela de lesões e aplica o resultado. */
  async rolarLesao() {
    const roll = await new Roll("1d20 + @bonus", { bonus: this.bonusPatamar }).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: "Lesão (1d20 + patamar)" });
    const linha = this.#linhaDaTabela(OP2E.tabelaLesoes, roll.total);
    await this.#aplicarEntrada("lesoes", linha, "Lesão");
    return linha;
  }

  /**
   * Teste de trauma (Emoção + Disciplina, DT 7 +3 por teste na cena) ao chegar a 0 PD por efeito
   * externo. Em falha, rola na tabela de traumas.
   */
  async rolarTesteTrauma() {
    if (this.type !== "personagem") return null;
    const tentativa = this.system.testesTrauma ?? 0;
    const dt = OP2E.dificuldadePadrao + tentativa * 3;
    const resultado = await this.rolarPericia("disciplina", { dt, rotulo: `Teste de Trauma (Emoção + Disciplina, DT ${dt})` });
    await this.update({ "system.testesTrauma": tentativa + 1 });

    if (this.system.edicao === "beta" && !resultado.passou) await this.rolarTrauma();
    return resultado;
  }

  /** Rola 1d20 + bônus do patamar na tabela de traumas e aplica o resultado. */
  async rolarTrauma() {
    const roll = await new Roll("1d20 + @bonus", { bonus: this.bonusPatamar }).evaluate();
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: "Trauma (1d20 + patamar)" });
    const linha = this.#linhaDaTabela(OP2E.tabelaTraumas, roll.total);
    await this.#aplicarEntrada("traumas", linha, "Trauma");
    return linha;
  }

  /**
   * Teste de morte de um personagem moribundo (no fim de cada rodada): Físico + Vigor, DT 7 +3 por
   * teste já feito na cena. Falhar significa morrer.
   */
  async rolarTesteMorte() {
    if (this.type !== "personagem") return null;
    const tentativa = this.system.testesMorte ?? 0;
    const dt = OP2E.dificuldadePadrao + tentativa * 3;
    const resultado = await this.rolarPericia("vigor", { dt, rotulo: `Teste de Morte (Físico + Vigor, DT ${dt})` });
    await this.update({ "system.testesMorte": tentativa + 1 });
    if (!resultado.passou) {
      await this.#publicarCard({ titulo: "Teste de Morte: falha", destaque: "O personagem morre.", classe: "op2e-morte" });
    }
    return resultado;
  }

  /** Aplica o texto/efeitos de uma linha de lesão ou trauma e registra os permanentes na ficha. */
  async #aplicarEntrada(lista, linha, rotulo) {
    const atualizacoes = {};
    const avisos = [];

    if (linha.permanente) {
      const atuais = foundry.utils.deepClone(this.system[lista]);
      // Efeitos repetidos são rolados de novo pelo mestre (exceto os que se acumulam, como Laceração Profunda).
      const repetido = atuais.some((e) => e.nome === linha.nome) && linha.efeito !== "maxPv-2";
      if (repetido) avisos.push("Efeito permanente já presente na ficha: role novamente, a critério do mestre.");
      else {
        atuais.push({ nome: linha.nome, texto: linha.texto });
        atualizacoes[`system.${lista}`] = atuais;
      }
    }

    const ajuste = await this.#efeitoAutomatico(linha.efeito);
    Object.assign(atualizacoes, ajuste.atualizacoes);
    avisos.push(...ajuste.avisos);

    if (Object.keys(atualizacoes).length) await this.update(atualizacoes);
    await this.#publicarCard({
      titulo: `${rotulo}: ${linha.nome}`,
      destaque: esc(linha.texto),
      linhas: avisos.map(esc),
      classe: linha.efeito === "morte" ? "op2e-morte" : ""
    });
  }

  /** Traduz a chave `efeito` de uma tabela em alterações na ficha. */
  async #efeitoAutomatico(efeito) {
    const atualizacoes = {};
    const avisos = [];
    const { pv, pd } = this.system.recursos;
    switch (efeito) {
      case "pv+1":
        atualizacoes["system.recursos.pv.value"] = Math.min(pv.max, pv.value + 1);
        break;
      case "pd+1":
        atualizacoes["system.recursos.pd.value"] = Math.min(pd.max, pd.value + 1);
        break;
      case "pd-2":
        atualizacoes["system.recursos.pd.value"] = Math.max(0, pd.value - 2);
        break;
      case "maxPv-2":
        atualizacoes["system.recursos.pv.max"] = Math.max(1, pv.max - 2);
        atualizacoes["system.recursos.pv.value"] = Math.min(Math.max(1, pv.max - 2), pv.value);
        break;
      case "pavor": {
        const atual = this.system.pavor.dado;
        atualizacoes["system.pavor.dado"] = atual ? passoDado(atual, 1) : 6;
        break;
      }
      case "morteLenta":
        atualizacoes["system.recursos.pv.value"] = Math.max(1, pv.value);
        atualizacoes["system.condicoes.inconsciente"] = false;
        atualizacoes["system.condicoes.moribundo"] = false;
        avisos.push("Ao fim da próxima rodada, o personagem morre. Nada pode impedir isso.");
        break;
      case "morte":
        atualizacoes["system.condicoes.inconsciente"] = true;
        avisos.push("Personagem morto: hora de criar um novo.");
        break;
      default:
        break;
    }
    return { atualizacoes, avisos };
  }

  /** Zera os contadores de testes de lesão/trauma/morte (início de uma nova cena). */
  async novaCena() {
    // Ímpeto Fervilhante: no início de cada cena, preenche um espaço da barra de Ímpeto.
    const fervilhante = this.items.some((i) => i.type === "habilidade" && i.name === "Ímpeto Fervilhante");
    await this.update({
      "system.testesFerimento": 0,
      "system.testesTrauma": 0,
      "system.testesMorte": 0,
      "system.impeto.value": fervilhante && this.system.impeto.max > 0 ? 1 : 0,
      "system.analise.value": 0
    });
  }

  /* -------------------------------------------- */
  /*  Armadura, pavor e relações                  */
  /* -------------------------------------------- */

  /** Gasta 1 ponto de armadura (ação livre) para reduzir um dano sofrido em 10. */
  async gastarArmadura() {
    if (this.type !== "personagem") return false;
    if (this.system.armadura.disponiveis <= 0) {
      ui.notifications.warn(game.i18n.localize("OP2E.Aviso.SemArmadura"));
      return false;
    }
    await this.update({ "system.armadura.gastos": this.system.armadura.gastos + 1 });
    await this.#publicarCard({
      titulo: "Ponto de Armadura gasto",
      destaque: "O dano sofrido é reduzido em <strong>10</strong>.",
      linhas: [`Restam ${this.system.armadura.disponiveis} ponto(s) de armadura (não se recuperam neste playtest).`]
    });
    return true;
  }

  /** Controlando o Pavor: gasta 1 PD para reduzir o dado de pavor em um passo (d4 → se o resultado for 1, termina). */
  async controlarPavor() {
    const dado = this.system.pavor.dado;
    if (!dado) return false;
    if (this.system.recursos.pd.value < 1) {
      ui.notifications.warn(game.i18n.localize("OP2E.Aviso.PDInsuficiente"));
      return false;
    }
    const novo = dado <= 4 ? 0 : passoDado(dado, -1);
    await this.update({
      "system.recursos.pd.value": this.system.recursos.pd.value - 1,
      "system.pavor.dado": novo
    });
    return true;
  }

  /** Abraçando o Pavor: gasta 5 PD para converter o dado de pavor em um dado bônus (que termina o efeito). */
  async abracarPavor() {
    const dado = this.system.pavor.dado;
    if (!dado) return false;
    if (this.system.recursos.pd.value < 5) {
      ui.notifications.warn(game.i18n.localize("OP2E.Aviso.PDInsuficiente"));
      return false;
    }
    await this.update({
      "system.recursos.pd.value": this.system.recursos.pd.value - 5,
      "system.pavor.dado": 0
    });
    await this.#publicarCard({
      titulo: "Abraçando o Pavor",
      destaque: `O dado de pavor (d${dado}) vira um <strong>dado bônus</strong> de d${dado} para o próximo teste.`
    });
    return true;
  }

  /**
   * Invoca uma relação (uma vez por missão): o jogador descreve o sentimento e escolhe um benefício do
   * grau da relação. Marca a relação como usada e publica o benefício escolhido no chat.
   */
  async invocarRelacao(indice) {
    const relacoes = foundry.utils.deepClone(this.system.relacoes);
    const rel = relacoes[indice];
    if (!rel) return;
    if (rel.grau < 1) {
      ui.notifications.info(game.i18n.localize("OP2E.Aviso.RelacaoNeutra"));
      return;
    }
    if (rel.usada) {
      ui.notifications.warn(game.i18n.localize("OP2E.Aviso.RelacaoUsada"));
      return;
    }
    const g = OP2E.grausRelacao[rel.grau];
    const beneficios = [
      { id: "teste", texto: `Receber +1d${g.dado} em um teste diretamente relacionado a ${rel.nome}` },
      { id: "ajuda", texto: `Ao ajudar, fornecer +1d${g.dado} no teste da pessoa (além do aumento de passo)` }
    ];
    if (g.motivar) beneficios.push({ id: "motivar", texto: `Gastar uma ação e motivar ${rel.nome}: recupera ${g.motivar} PD` });
    if (g.acaoExtra) beneficios.push({ id: "extra", texto: `Se ${rel.nome} estiver em perigo, fazer uma ação extra em seu turno para ajudá-la` });

    const opcoes = beneficios.map((b) => `<option value="${b.id}">${esc(b.texto)}</option>`).join("");
    const dados = await foundry.applications.api.DialogV2.input({
      window: { title: `Invocar relação: ${rel.nome} (${g.nome})` },
      content: `
        <div class="form-group"><label>O que você sente por ${esc(rel.nome)}, e como isso o ajuda a perseverar?</label>
          <textarea name="sentimento" rows="2">${esc(rel.sentimento)}</textarea></div>
        <div class="form-group"><label>Benefício</label><select name="beneficio">${opcoes}</select></div>`,
      rejectClose: false,
      ok: { label: "Invocar" }
    });
    if (!dados) return;

    relacoes[indice].usada = true;
    await this.update({ "system.relacoes": relacoes });
    const escolhido = beneficios.find((b) => b.id === dados.beneficio);
    await this.#publicarCard({
      titulo: `Relação invocada: ${rel.nome}`,
      destaque: esc(escolhido.texto),
      linhas: [`<em>“${esc(dados.sentimento)}”</em>`]
    });
  }

  /** Libera todas as relações para serem invocadas de novo (início de uma nova missão). */
  async novaMissao() {
    const relacoes = foundry.utils.deepClone(this.system.relacoes).map((r) => ({ ...r, usada: false }));
    await this.update({
      "system.relacoes": relacoes,
      "system.armadura.gastos": 0,
      "system.pavor.dado": 0
    });
  }

  /* -------------------------------------------- */
  /*  Combate                                     */
  /* -------------------------------------------- */

  /**
   * Faz um ataque com uma arma (item com categoria "arma"). Corpo a corpo usa Luta; à distância, Pontaria.
   * Dano = RA + modificador da arma; em sucesso crítico, soma as duas maiores rolagens.
   * @param {Item} arma
   * @param {object} [opcoes]  Mesmas opções de rolarPericia (dt, passo, dadosExtras).
   */
  async rolarAtaque(arma, opcoes = {}) {
    if (this.type !== "personagem") return null;
    const pericia = arma.system.alcance === "distancia" ? "pontaria" : "luta";
    const passo = (opcoes.passo ?? 0) + (arma.system.passoAtaque ?? 0);
    const resultado = await this.rolarPericia(pericia, {
      ...opcoes,
      passo,
      criticoMin: arma.system.criticoMin,
      silencioso: true,
      rotulo: `Ataque com ${arma.name} (${game.i18n.localize(`OP2E.Pericia.${pericia}`)})`
    });
    if (!resultado) return null;

    const mod = arma.system.danoMod ?? 0;
    const base = resultado.critico ? resultado.ra2 : resultado.ra;
    const dano = resultado.passou ? base + mod : 0;
    const ignora = arma.system.ignoraRD ? ` Ignora ${arma.system.ignoraRD} ponto(s) de RD.` : "";
    const extra = resultado.passou
      ? `<strong>Dano: ${dano}</strong> (${resultado.critico ? "duas maiores rolagens" : "RA"} ${base} ${mod >= 0 ? "+" : "–"} ${Math.abs(mod)}).${ignora}`
      : "O ataque erra.";

    await publicarTeste(resultado, {
      flavor: `Ataque com ${arma.name}`,
      actor: this,
      extra
    });
    return { ...resultado, dano };
  }
}
