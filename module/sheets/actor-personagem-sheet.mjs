import { OP2E } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class OP2PersonagemSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["op2e", "sheet", "actor", "personagem"],
    position: { width: 760, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rolarPericia: OP2PersonagemSheet.#rolarPericia,
      rolarFerimento: OP2PersonagemSheet.#rolarFerimento,
      rolarTrauma: OP2PersonagemSheet.#rolarTrauma,
      resetarFerimento: OP2PersonagemSheet.#resetarFerimento,
      resetarTrauma: OP2PersonagemSheet.#resetarTrauma,
      gastarImpeto: OP2PersonagemSheet.#gastarImpeto,
      definirRecurso: OP2PersonagemSheet.#definirRecurso,
      rolarMorte: OP2PersonagemSheet.#rolarMorte,
      rolarLesao: OP2PersonagemSheet.#rolarLesao,
      rolarTraumaTabela: OP2PersonagemSheet.#rolarTraumaTabela,
      gastarArmadura: OP2PersonagemSheet.#gastarArmadura,
      controlarPavor: OP2PersonagemSheet.#controlarPavor,
      abracarPavor: OP2PersonagemSheet.#abracarPavor,
      ajustarAnalise: OP2PersonagemSheet.#ajustarAnalise,
      novaCena: OP2PersonagemSheet.#novaCena,
      desafioPerseguicao: OP2PersonagemSheet.#desafioPerseguicao,
      desafioFurtividade: OP2PersonagemSheet.#desafioFurtividade,
      desafioEquilibrio: OP2PersonagemSheet.#desafioEquilibrio,
      novaMissao: OP2PersonagemSheet.#novaMissao,
      invocarRelacao: OP2PersonagemSheet.#invocarRelacao,
      adicionarRelacao: OP2PersonagemSheet.#adicionarRelacao,
      removerRelacao: OP2PersonagemSheet.#removerRelacao,
      removerLesao: OP2PersonagemSheet.#removerLesao,
      removerTrauma: OP2PersonagemSheet.#removerTrauma,
      atacar: OP2PersonagemSheet.#atacar,
      alternarEquipado: OP2PersonagemSheet.#alternarEquipado,
      adicionarAptidao: OP2PersonagemSheet.#adicionarAptidao,
      removerAptidao: OP2PersonagemSheet.#removerAptidao,
      itemCriar: OP2PersonagemSheet.#itemCriar,
      itemEditar: OP2PersonagemSheet.#itemEditar,
      itemExcluir: OP2PersonagemSheet.#itemExcluir,
      itemUsar: OP2PersonagemSheet.#itemUsar
    }
  };

  static PARTS = {
    form: { template: "systems/op2e-playtest/templates/actor/personagem-sheet.hbs", scrollable: [".op2e-corpo"] }
  };

  /**
   * O tema de cor (Executor/Analista/Vigilante) e a forma do selo de cada dado (d4=triângulo,
   * d6=quadrado, d8=losango...) são lidos via `data-perfil`/`data-dado` no CSS. Fazemos isso
   * em JS, não só no template, por dois motivos:
   * 1) O elemento raiz da janela (`this.element`) não é recriado entre renders do
   *    ApplicationV2 -- só o conteúdo das PARTS é -- então `data-perfil` precisa ser
   *    reaplicado a cada render pra realmente trocar de cor ao mudar o Perfil.
   * 2) Um listener de `change` atualiza `data-dado` na hora (antes do roundtrip de
   *    salvar+re-renderizar terminar), pra trocar a forma do selo assim que o jogador
   *    escolhe outro dado, sem esperar/piscar.
   */
  /** @override */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
    this.element.addEventListener("change", (event) => {
      const select = event.target.closest("select.op2e-dado");
      if (select) select.dataset.dado = select.value;
    });
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.dataset.perfil = this.actor.system.perfil;
    for (const select of this.element.querySelectorAll("select.op2e-dado")) {
      select.dataset.dado = select.value;
    }
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.config = OP2E;
    context.habilidades = this.actor.items.filter((i) => i.type === "habilidade");
    context.ferramentas = this.actor.items.filter((i) => i.type === "ferramenta");
    context.itens = this.actor.items.filter((i) => i.type === "item");
    context.aptidaoCampos = Object.entries(this.actor.system.pericias.aptidao.campos)
      .filter(([, c]) => c.ativo)
      .map(([chave, c]) => ({ chave, dado: c.dado }));

    const edicao = this.actor.system.edicao;
    context.beta = edicao === "beta";
    context.colunas = OP2E.colunasPericias[edicao] ?? OP2E.colunasPericias.alpha;
    context.edicoes = OP2E.edicoes;
    context.patamares = OP2E.patamares;
    context.grausRelacao = { 0: "Neutro", 1: "Afinidade", 2: "Vínculo", 3: "Devoção" };
    context.pavorOpcoes = { 0: "—", 4: "d4", 6: "d6", 8: "d8", 10: "d10", 12: "d12" };
    context.armas = context.itens.filter((i) => i.system.categoria === "arma");
    context.mostrarAnalise = this.actor.system.analise.max > 0;
    context.condicoes = Object.keys(this.actor.system.condicoes).map((chave) => ({
      chave,
      ativa: this.actor.system.condicoes[chave]
    }));
    return context;
  }

  static async #rolarPericia(event, target) {
    const { pericia, campo } = target.dataset;

    // Clique simples: rola na hora, com a DT padrão. Shift+clique: abre o diálogo de opções
    // (DT customizada, aumento/redução de passo, dados extras — "Regras Adicionais de Testes").
    if (!event.shiftKey) {
      await this.actor.rolarPericia(pericia, { campo: campo || undefined });
      return;
    }

    const opcoes = await OP2PersonagemSheet.#abrirDialogoTeste(pericia, campo);
    if (!opcoes) return;
    await this.actor.rolarPericia(pericia, { campo: campo || undefined, ...opcoes });
  }

  /**
   * Diálogo para aplicar as "Regras Adicionais de Testes": DT customizada, aumento/redução de
   * passo (ajuda, vantagens/desvantagens situacionais) e até dois dados extras (máx. 4 dados no total).
   * @returns {Promise<{dt: number, passo: number, dadosExtras: number[]}|null>} `null` se cancelado.
   */
  static async #abrirDialogoTeste(pericia, campo) {
    const rotuloPericia =
      pericia === "aptidao" && campo
        ? `${game.i18n.localize("OP2E.Pericia.aptidao")} (${game.i18n.localize(OP2E.camposAptidao[campo])})`
        : game.i18n.localize(`OP2E.Pericia.${pericia}`);

    const opcoesDado = [0, 4, 6, 8, 10, 12]
      .map((d) => `<option value="${d}">${d === 0 ? game.i18n.localize("OP2E.Dialogo.Teste.Nenhum") : `d${d}`}</option>`)
      .join("");

    const content = `
      <div class="op2e-dialogo-teste">
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.Teste.DT")}</label>
          <input type="number" name="dt" value="${OP2E.dificuldadePadrao}">
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.Teste.Passo")}</label>
          <select name="passo">
            <option value="-2">-2</option>
            <option value="-1">-1</option>
            <option value="0" selected>0</option>
            <option value="1">+1</option>
            <option value="2">+2</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.Teste.DadoExtra")} 1</label>
          <select name="extra1">${opcoesDado}</select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.Teste.DadoExtra")} 2</label>
          <select name="extra2">${opcoesDado}</select>
        </div>
      </div>`;

    const dados = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.format("OP2E.Dialogo.Teste.Titulo", { pericia: rotuloPericia }) },
      content,
      rejectClose: false,
      ok: { label: game.i18n.localize("OP2E.Dialogo.Teste.Rolar") }
    });
    if (!dados) return null;

    const dadosExtras = [Number(dados.extra1), Number(dados.extra2)].filter((d) => d > 0);
    return { dt: Number(dados.dt), passo: Number(dados.passo), dadosExtras };
  }

  static async #rolarFerimento() {
    await this.actor.rolarTesteFerimento();
  }

  static async #rolarTrauma() {
    await this.actor.rolarTesteTrauma();
  }

  static async #resetarFerimento() {
    await this.actor.update({ "system.testesFerimento": 0 });
  }

  static async #resetarTrauma() {
    await this.actor.update({ "system.testesTrauma": 0 });
  }

  /**
   * Clique num "pip" da barra de PV/PD/Ímpeto define o valor atual pra posição clicada
   * (ex.: clicar no 5º quadradinho de PV deixa PV em 5). Clicar de novo no último pip
   * já preenchido reduz em 1, pra poder "desmarcar" sem digitar no campo numérico.
   */
  static async #definirRecurso(event, target) {
    const { recurso, valor } = target.dataset;
    const caminho = `system.${recurso === "impeto" ? "impeto" : `recursos.${recurso}`}.value`;
    const atual = foundry.utils.getProperty(this.actor, caminho);
    const alvo = Number(valor);
    await this.actor.update({ [caminho]: atual === alvo ? alvo - 1 : alvo });
  }

  static async #gastarImpeto() {
    const conteudo = `
      <div class="form-group">
        <label>${game.i18n.localize("OP2E.Dialogo.GastarImpeto.Quantidade")}</label>
        <input type="number" name="quantidade" value="1" min="1" max="${this.actor.system.impeto.max}">
      </div>`;
    const dados = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.localize("OP2E.Dialogo.GastarImpeto.Titulo") },
      content: conteudo,
      rejectClose: false,
      ok: { label: game.i18n.localize("OP2E.Dialogo.GastarImpeto.Confirmar") }
    });
    if (!dados) return;
    await this.actor.gastarImpeto(Number(dados.quantidade));
  }

  /**
   * Escolhe um campo de Aptidão ainda não visível na ficha e o marca como ativo. Se o dado
   * dele ainda estiver em d4 (nunca foi mexido), sobe pra d6 — mas preserva um valor maior
   * já existente (ex.: campo removido e adicionado de novo não perde o progresso).
   */
  static async #adicionarAptidao() {
    const campos = this.actor.system.pericias.aptidao.campos;
    const daEdicao = OP2E.aptidaoPorEdicao[this.actor.system.edicao] ?? Object.keys(campos);
    const restantes = Object.entries(campos)
      .filter(([chave, c]) => !c.ativo && daEdicao.includes(chave))
      .map(([chave]) => chave);

    if (restantes.length === 0) {
      ui.notifications.info(game.i18n.localize("OP2E.Aviso.AptidaoCompleta"));
      return;
    }

    const opcoes = restantes
      .map((chave) => `<option value="${chave}">${game.i18n.localize(OP2E.camposAptidao[chave])}</option>`)
      .join("");

    const dados = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.localize("OP2E.Dialogo.AdicionarAptidao.Titulo") },
      content: `
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.AdicionarAptidao.Campo")}</label>
          <select name="campo">${opcoes}</select>
        </div>`,
      rejectClose: false,
      ok: { label: game.i18n.localize("OP2E.Dialogo.AdicionarAptidao.Confirmar") }
    });
    if (!dados) return;

    const atualizacoes = { [`system.pericias.aptidao.campos.${dados.campo}.ativo`]: true };
    if (campos[dados.campo].dado <= 4) {
      atualizacoes[`system.pericias.aptidao.campos.${dados.campo}.dado`] = 6;
    }
    await this.actor.update(atualizacoes);
  }

  /** Tira um campo de Aptidão da lista visível. O dado treinado NÃO é apagado, só escondido. */
  static async #removerAptidao(event, target) {
    const campo = target.closest("[data-campo]").dataset.campo;
    await this.actor.update({ [`system.pericias.aptidao.campos.${campo}.ativo`]: false });
  }

  static async #rolarMorte() {
    await this.actor.rolarTesteMorte();
  }

  static async #rolarLesao() {
    await this.actor.rolarLesao();
  }

  static async #rolarTraumaTabela() {
    await this.actor.rolarTrauma();
  }

  static async #gastarArmadura() {
    await this.actor.gastarArmadura();
  }

  static async #controlarPavor() {
    await this.actor.controlarPavor();
  }

  static async #abracarPavor() {
    await this.actor.abracarPavor();
  }

  static async #ajustarAnalise(event, target) {
    await this.actor.ajustarAnalise(Number(target.dataset.delta));
  }

  static async #desafioPerseguicao() {
    await game.op2e.perseguicao.acoes(this.actor);
  }

  static async #desafioFurtividade() {
    await game.op2e.furtividade.acoes(this.actor);
  }

  /** Shift+clique começa uma nova travessia (recupera os dados de equilíbrio). */
  static async #desafioEquilibrio(event) {
    await game.op2e.equilibrio.rolar(this.actor, { novaTravessia: event.shiftKey });
  }

  static async #novaCena() {
    await this.actor.novaCena();
  }

  static async #novaMissao() {
    await this.actor.novaMissao();
  }

  static async #invocarRelacao(event, target) {
    await this.actor.invocarRelacao(Number(target.closest("[data-indice]").dataset.indice));
  }

  static async #adicionarRelacao() {
    const relacoes = foundry.utils.deepClone(this.actor.system.relacoes);
    relacoes.push({ nome: "", grau: 0, sentimento: "", descricao: "", usada: false });
    await this.actor.update({ "system.relacoes": relacoes });
  }

  static async #removerRelacao(event, target) {
    const indice = Number(target.closest("[data-indice]").dataset.indice);
    const relacoes = foundry.utils.deepClone(this.actor.system.relacoes);
    relacoes.splice(indice, 1);
    await this.actor.update({ "system.relacoes": relacoes });
  }

  static async #removerLesao(event, target) {
    const indice = Number(target.closest("[data-indice]").dataset.indice);
    const lista = foundry.utils.deepClone(this.actor.system.lesoes);
    lista.splice(indice, 1);
    await this.actor.update({ "system.lesoes": lista });
  }

  static async #removerTrauma(event, target) {
    const indice = Number(target.closest("[data-indice]").dataset.indice);
    const lista = foundry.utils.deepClone(this.actor.system.traumas);
    lista.splice(indice, 1);
    await this.actor.update({ "system.traumas": lista });
  }

  static async #atacar(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    if (!item) return;
    if (!event.shiftKey) {
      await this.actor.rolarAtaque(item);
      return;
    }
    const pericia = item.system.alcance === "distancia" ? "pontaria" : "luta";
    const opcoes = await OP2PersonagemSheet.#abrirDialogoTeste(pericia);
    if (!opcoes) return;
    await this.actor.rolarAtaque(item, opcoes);
  }

  static async #alternarEquipado(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    await item?.update({ "system.equipado": !item.system.equipado });
  }

  static async #itemCriar(event, target) {
    const tipo = target.dataset.tipo;
    const nome = game.i18n.format("OP2E.Item.NovoNome", {
      tipo: game.i18n.localize(`TYPES.Item.${tipo}`)
    });
    await Item.create({ name: nome, type: tipo }, { parent: this.actor });
  }

  static async #itemEditar(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    item?.sheet.render(true);
  }

  static async #itemExcluir(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    await item?.delete();
  }

  static async #itemUsar(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]").dataset.itemId);
    await item?.enviarParaChat();
  }
}
