import { OP2E } from "../config.mjs";
import {
  anunciar,
  esc,
  escolherParticipantes,
  atorAtual,
  aplicarDanoPV,
  aplicarDanoPD,
  rolarFormula,
  sortear,
  lerFlag,
  definirTratador,
  pedirAoMestre
} from "./desafios-comum.mjs";
import { publicarTeste } from "../dice/teste.mjs";

/**
 * Furtividade e esconderijo do Playtest Beta.
 *
 * Cada personagem faz um teste de esconderijo no início da cena; os dados rolados (sem somar) viram seus
 * "dados de esconderijo". Enquanto tiver pelo menos um, está escondido. A cada rodada há a fase dos
 * personagens (ações especiais) e a fase das criaturas (tabela d10 do mestre), em que as criaturas
 * procuram: dados de esconderijo iguais aos valores rolados são descartados.
 *
 * Estado do mundo (configuração "furtividade"): rodada, participantes e quantas vezes "Distrair" foi usada.
 * Estado do personagem (flag "furtividade"): dados de esconderijo, usos de "Esconder-se" e se já testou.
 */

const CHAVE = "furtividade";

const PADRAO_ATOR = () => ({ dados: [], escondeuUsos: 0, testou: false, agiu: false });
const PADRAO_MUNDO = () => ({ ativa: false, rodada: 0, participantes: [], distrair: 0 });

export function registrarFurtividade() {
  game.settings.register(OP2E.id, CHAVE, { scope: "world", config: false, type: Object, default: PADRAO_MUNDO() });

  definirTratador("furtividade:adicionar", async ({ actorId, dado }) => {
    const actor = game.actors.get(actorId);
    if (!actor) return;
    const d = dadosAtor(actor);
    d.dados.push(dado);
    await gravarAtor(actor, d);
  });
  definirTratador("furtividade:distrair", async () => {
    const estado = estadoMundo();
    estado.distrair += 1;
    await gravarMundo(estado);
  });

  game.op2e.furtividade = { estado: estadoMundo, iniciar, painel, acoes, faseCriaturas, encerrar, TABELA };
}

function estadoMundo() {
  return foundry.utils.deepClone(game.settings.get(OP2E.id, CHAVE));
}
async function gravarMundo(estado) {
  await game.settings.set(OP2E.id, CHAVE, estado);
}
export function dadosAtor(actor) {
  return { ...PADRAO_ATOR(), ...lerFlag(actor, CHAVE, {}) };
}
async function gravarAtor(actor, dados) {
  // Arrays são substituídos por inteiro na atualização, então não há resíduos de dados descartados.
  await actor.setFlag(OP2E.id, CHAVE, dados);
}

const textoDados = (dados) => (dados.length ? dados.map((x) => `d${x.tamanho}: <strong>${x.valor}</strong>`).join(" · ") : "<em>nenhum</em>");
const nomePericia = (c) => game.i18n.localize(`OP2E.Pericia.${c}`);

/** Tabela da fase das criaturas (d10): resultados altos são melhores para os personagens. */
export const TABELA = {
  1: "O mestre diz dois números: os personagens descartam os dados de esconderijo desses valores.",
  2: "Sopro na nuca! Um personagem sorteado fica parado (perde 2d6 PD) ou sai de perto (perde um dado de esconderijo).",
  3: "As criaturas procuram todos os personagens, rolando 1d10.",
  4: "As criaturas procuram todos os personagens, rolando 2d8.",
  5: "As criaturas procuram todos os personagens, rolando 3d6.",
  6: "As criaturas procuram todos os personagens, rolando 1d8.",
  7: "As criaturas procuram todos os personagens, rolando 2d6.",
  8: "Uma criatura salta na direção de um personagem sorteado: rola 1d12, 2d10 ou 3d8 conforme o maior dado de esconderijo dele (d12 / d10 / d8 ou menor).",
  9: "Uma criatura procura um personagem sorteado: rola 1d10, 2d8 ou 3d6 conforme o maior dado de esconderijo dele (d12 / d10 / d8 ou menor).",
  10: "As criaturas se distraem por um momento e não procuram nesta rodada."
};

/* ------------------------------------------------------------------------- */
/* Mestre                                                                    */
/* ------------------------------------------------------------------------- */

export async function iniciar() {
  if (!game.user.isGM) return;
  const escolha = await escolherParticipantes("Iniciar desafio de furtividade");
  if (!escolha) return;
  if (!escolha.ids.length) return ui.notifications.warn("Escolha pelo menos um participante.");
  const estado = PADRAO_MUNDO();
  estado.ativa = true;
  estado.rodada = 1;
  estado.participantes = escolha.ids;
  await gravarMundo(estado);
  for (const id of escolha.ids) {
    const actor = game.actors.get(id);
    if (actor) await gravarAtor(actor, PADRAO_ATOR());
  }
  await anunciar({
    titulo: "Desafio de furtividade",
    icone: "fa-user-secret",
    alias: "Furtividade",
    html: `<p>Cada personagem faz o <strong>teste de esconderijo</strong> (por padrão Furtividade; Acrobacia pelos galhos, Vigor rastejando, Sobrevivência camuflando-se…). Os dados não são somados: viram seus <strong>dados de esconderijo</strong>. Enquanto tiver um, está escondido; sem nenhum, é encontrado e sofre 1d6 no fim de cada rodada.</p>
      <p><em>Use o botão “Furtividade” da ficha.</em></p>`
  });
}

export async function encerrar() {
  if (!game.user.isGM) return;
  const estado = estadoMundo();
  estado.ativa = false;
  await gravarMundo(estado);
  await anunciar({ titulo: "Furtividade encerrada", icone: "fa-user-secret", alias: "Furtividade", html: "<p>A cena de furtividade terminou.</p>" });
}

export async function painel() {
  if (!game.user.isGM) return acoes();
  const estado = estadoMundo();
  if (!estado.ativa) {
    const escolha = await foundry.applications.api.DialogV2.wait({
      window: { title: "Furtividade" },
      content: "<p>Nenhum desafio de furtividade em andamento.</p>",
      rejectClose: false,
      buttons: [{ action: "iniciar", label: "Iniciar desafio", icon: "fa-solid fa-user-secret", default: true }]
    });
    if (escolha === "iniciar") await iniciar();
    return;
  }
  const linhas = estado.participantes
    .map((id) => game.actors.get(id))
    .filter(Boolean)
    .map((a) => {
      const d = dadosAtor(a);
      const situacao = !d.testou ? "Sem teste" : d.dados.length ? "Escondido" : "<strong>Encontrado</strong>";
      return `<tr><td>${esc(a.name)}</td><td>${textoDados(d.dados)}</td><td>${situacao}</td></tr>`;
    })
    .join("");
  const escolha = await foundry.applications.api.DialogV2.wait({
    window: { title: `Furtividade — rodada ${estado.rodada}` },
    content: `<table class="op2e-tabela-desafio"><thead><tr><th>Personagem</th><th>Dados de esconderijo</th><th>Situação</th></tr></thead><tbody>${linhas}</tbody></table>
      <p class="notes">“Distrair” já usada ${estado.distrair}× (DT ${7 + 3 * estado.distrair} para todos).</p>`,
    rejectClose: false,
    buttons: [
      { action: "criaturas", label: "Fase das criaturas", icon: "fa-solid fa-eye", default: true },
      { action: "encerrar", label: "Encerrar", icon: "fa-solid fa-flag-checkered" }
    ]
  });
  if (escolha === "criaturas") await faseCriaturas();
  else if (escolha === "encerrar") await encerrar();
}

/** Resolve a fase das criaturas da rodada atual e depois aplica o dano de quem foi encontrado. */
export async function faseCriaturas() {
  if (!game.user.isGM) return;
  const estado = estadoMundo();
  if (!estado.ativa) return ui.notifications.warn("Nenhum desafio de furtividade em andamento.");
  const atores = estado.participantes.map((id) => game.actors.get(id)).filter(Boolean);
  const escondidos = () => atores.filter((a) => dadosAtor(a).dados.length);

  const d10 = await rolarFormula("1d10");
  await d10.toMessage({ speaker: { alias: "Criaturas" }, flavor: `Fase das criaturas — rodada ${estado.rodada}` });
  const resultado = d10.total;
  const relato = [`<p><strong>${resultado}:</strong> ${esc(TABELA[resultado])}</p>`];

  const procurar = async (alvos, formula, quem = "As criaturas") => {
    const roll = await rolarFormula(formula);
    await roll.toMessage({ speaker: { alias: quem }, flavor: `${quem} procuram (${formula})` });
    const valores = [...new Set(roll.dice.flatMap((x) => x.results.map((r) => r.result)))];
    relato.push(`<p>${quem} rolam ${formula}: <strong>${valores.join(", ")}</strong>.</p>`);
    for (const actor of alvos) await descartarValores(actor, valores, relato);
  };

  switch (resultado) {
    case 1: {
      const dlg = await foundry.applications.api.DialogV2.input({
        window: { title: "Dois números" },
        content: `<div class="form-group"><label>Primeiro número</label><input type="number" name="a" value="1" min="1" max="12"></div>
          <div class="form-group"><label>Segundo número</label><input type="number" name="b" value="2" min="1" max="12"></div>`,
        rejectClose: false
      });
      const numeros = dlg ? [Number(dlg.a), Number(dlg.b)] : [];
      relato.push(`<p>Números falados: <strong>${numeros.join(" e ")}</strong>.</p>`);
      for (const actor of atores) await descartarValores(actor, numeros, relato);
      break;
    }
    case 2: {
      const [alvo] = sortear(escondidos(), 1);
      if (!alvo) {
        relato.push("<p>Ninguém está escondido para ser alvo.</p>");
        break;
      }
      const escolha = await foundry.applications.api.DialogV2.wait({
        window: { title: `Sopro na nuca — ${alvo.name}` },
        content: `<p>Uma criatura chega muito perto de <strong>${esc(alvo.name)}</strong>. O que o jogador faz?</p>`,
        rejectClose: false,
        buttons: [
          { action: "parado", label: "Ficar parado (−2d6 PD)", icon: "fa-solid fa-hand", default: true },
          { action: "sair", label: "Sair de perto (−1 dado)", icon: "fa-solid fa-person-walking" }
        ]
      });
      if (escolha === "sair") {
        const d = dadosAtor(alvo);
        const [perdido] = d.dados.splice(Math.floor(Math.random() * d.dados.length), 1);
        await gravarAtor(alvo, d);
        relato.push(`<p><strong>${esc(alvo.name)}</strong> sai de perto e perde o dado d${perdido.tamanho} (${perdido.valor}).</p>`);
      } else {
        const perda = await rolarFormula("2d6");
        await perda.toMessage({ speaker: { alias: "Tensão" }, flavor: `${alvo.name} fica parado` });
        const pd = await aplicarDanoPD(alvo, perda.total);
        relato.push(`<p><strong>${esc(alvo.name)}</strong> fica parado e perde ${perda.total} PD (PD ${pd}).</p>`);
      }
      break;
    }
    case 3:
      await procurar(atores, "1d10");
      break;
    case 4:
      await procurar(atores, "2d8");
      break;
    case 5:
      await procurar(atores, "3d6");
      break;
    case 6:
      await procurar(atores, "1d8");
      break;
    case 7:
      await procurar(atores, "2d6");
      break;
    case 8:
    case 9: {
      const [alvo] = sortear(escondidos(), 1);
      if (!alvo) {
        relato.push("<p>Ninguém está escondido para ser alvo.</p>");
        break;
      }
      const maior = Math.max(...dadosAtor(alvo).dados.map((x) => x.tamanho));
      const faixa = maior >= 12 ? 0 : maior >= 10 ? 1 : 2;
      const formula = (resultado === 8 ? ["1d12", "2d10", "3d8"] : ["1d10", "2d8", "3d6"])[faixa];
      relato.push(`<p>Alvo sorteado: <strong>${esc(alvo.name)}</strong> (maior dado de esconderijo: d${maior}).</p>`);
      await procurar([alvo], formula, "A criatura");
      break;
    }
    default:
      break;
  }

  // Fim da rodada: quem não tem dados é encontrado e sofre 1d6.
  const encontrados = atores.filter((a) => dadosAtor(a).testou && !dadosAtor(a).dados.length);
  for (const actor of encontrados) {
    const dano = await rolarFormula("1d6");
    await dano.toMessage({ speaker: { alias: "Criaturas" }, flavor: `${actor.name} foi encontrado` });
    const pv = await aplicarDanoPV(actor, dano.total);
    relato.push(`<p><strong>${esc(actor.name)}</strong> está exposto: pedras e arranhões causam ${dano.total} de dano (PV ${pv}).</p>`);
  }

  for (const actor of atores) {
    const d = dadosAtor(actor);
    d.agiu = false;
    await gravarAtor(actor, d);
  }
  estado.rodada += 1;
  await gravarMundo(estado);

  await anunciar({
    titulo: `Fase das criaturas — rodada ${estado.rodada - 1}`,
    icone: "fa-eye",
    alias: "Furtividade",
    html: relato.join("")
  });
}

/** Descarta os dados de esconderijo com algum dos valores indicados e relata o efeito. */
async function descartarValores(actor, valores, relato) {
  const d = dadosAtor(actor);
  if (!d.testou) return;
  const antes = d.dados.length;
  if (!antes) return;
  const perdidos = d.dados.filter((x) => valores.includes(x.valor));
  if (!perdidos.length) return;
  d.dados = d.dados.filter((x) => !valores.includes(x.valor));
  await gravarAtor(actor, d);
  relato.push(
    `<p><strong>${esc(actor.name)}</strong> perde ${perdidos.map((x) => `d${x.tamanho} (${x.valor})`).join(", ")}${
      d.dados.length ? "." : " e <strong>é descoberto!</strong>"
    }</p>`
  );
}

/* ------------------------------------------------------------------------- */
/* Jogadores                                                                 */
/* ------------------------------------------------------------------------- */

export async function acoes(actor = atorAtual()) {
  if (!actor) return ui.notifications.warn("Selecione o token (ou defina o personagem do usuário) para agir na furtividade.");
  const estado = estadoMundo();
  if (!estado.ativa) return ui.notifications.warn("Nenhum desafio de furtividade em andamento.");
  if (!estado.participantes.includes(actor.id)) return ui.notifications.warn(`${actor.name} não participa deste desafio.`);

  const d = dadosAtor(actor);
  const status = `<p><strong>${esc(actor.name)}</strong> — rodada ${estado.rodada}. Dados de esconderijo: ${textoDados(d.dados)}.</p>`;

  if (!d.testou) {
    const dlg = await foundry.applications.api.DialogV2.input({
      window: { title: "Teste de esconderijo" },
      content: `${status}<p>Role o teste de esconderijo: os dados <strong>não são somados</strong>.</p>
        <div class="form-group"><label>Perícia</label><select name="pericia">${opcoesPericia("furtividade")}</select></div>
        <div class="form-group"><label>Ajuste do mestre (passos)</label><select name="passo"><option value="-2">-2</option><option value="-1">-1</option><option value="0" selected>0</option><option value="1">+1</option><option value="2">+2</option></select></div>`,
      rejectClose: false,
      ok: { label: "Rolar" }
    });
    if (!dlg) return;
    return testeDeEsconderijo(actor, dlg.pericia, Number(dlg.passo));
  }

  const escolha = await foundry.applications.api.DialogV2.wait({
    window: { title: `Furtividade — ${actor.name}` },
    content: `${status}<p class="notes">Esconder-se: DT ${7 + 3 * d.escondeuUsos} · Distrair: DT ${7 + 3 * estado.distrair}</p>${d.agiu ? "<p><em>Você já agiu nesta rodada.</em></p>" : ""}`,
    rejectClose: false,
    buttons: [
      { action: "esconder", label: "Esconder-se", icon: "fa-solid fa-eye-slash", default: true },
      { action: "distrair", label: "Distrair", icon: "fa-solid fa-hand-point-right" },
      { action: "atencao", label: "Chamar atenção", icon: "fa-solid fa-bullhorn" },
      { action: "chamativa", label: "Ação chamativa", icon: "fa-solid fa-volume-high" },
      { action: "outra", label: "Avançar / outra ação", icon: "fa-solid fa-ellipsis" }
    ]
  });
  if (!escolha) return;
  if (d.agiu && escolha !== "chamativa") return ui.notifications.warn("Você já agiu nesta rodada.");
  switch (escolha) {
    case "esconder":
      return esconderSe(actor);
    case "distrair":
      return distrair(actor);
    case "atencao":
      return chamarAtencao(actor);
    case "chamativa":
      return acaoChamativa(actor);
    case "outra":
      return marcarAgiu(actor, "Avança pelas áreas ou faz outra ação (resolva conforme a descrição da área).");
  }
}

function opcoesPericia(padrao) {
  return Object.keys(OP2E.pericias)
    .filter((c) => c !== "aptidao")
    .map((c) => `<option value="${c}" ${c === padrao ? "selected" : ""}>${esc(nomePericia(c))}</option>`)
    .join("");
}

async function marcarAgiu(actor, texto) {
  const d = dadosAtor(actor);
  d.agiu = true;
  await gravarAtor(actor, d);
  await anunciar({ titulo: esc(actor.name), icone: "fa-user-secret", alias: actor.name, html: `<p>${esc(texto)}</p>` });
}

async function testeDeEsconderijo(actor, pericia, passo) {
  const resultado = await actor.rolarPericia(pericia, { passo, silencioso: true, dt: 0, rotulo: `${actor.name}: teste de esconderijo (${nomePericia(pericia)})` });
  const dados = resultado.resultados.filter((r) => !r.anulado).map((r) => ({ tamanho: r.tamanho, valor: r.valor }));
  let extra = "";
  if (resultado.critico && dados.length) {
    const base = dados.reduce((a, b) => (a.tamanho >= b.tamanho ? a : b));
    const bonus = await rolarFormula(`1d${base.tamanho}`);
    dados.push({ tamanho: base.tamanho, valor: bonus.total });
    extra = ` <strong>Crítico!</strong> Um dado adicional d${base.tamanho} (${bonus.total}) vira esconderijo.`;
  }
  const d = dadosAtor(actor);
  d.dados = dados;
  d.testou = true;
  await gravarAtor(actor, d);
  await publicarTeste({ ...resultado, semVeredito: true }, {
    flavor: `${actor.name}: teste de esconderijo (${nomePericia(pericia)})`,
    actor,
    extra: `Dados de esconderijo: ${textoDados(dados)}.${extra}`
  });
}

/** Pergunta qual dos dados da lista usar; retorna o índice ou null. */
async function escolherDado(dados, titulo, texto = "") {
  if (dados.length === 1) return 0;
  const escolha = await foundry.applications.api.DialogV2.wait({
    window: { title: titulo },
    content: `<p>${texto}</p>`,
    rejectClose: false,
    buttons: dados.map((x, i) => ({ action: String(i), label: `d${x.tamanho}: ${x.valor}`, default: i === 0 }))
  });
  return escolha === null || escolha === undefined ? null : Number(escolha);
}

async function esconderSe(actor) {
  const d = dadosAtor(actor);
  const dt = 7 + 3 * d.escondeuUsos;
  const resultado = await actor.rolarPericia("furtividade", { dt, silencioso: true, rotulo: `${actor.name}: esconder-se` });
  d.escondeuUsos += 1;
  d.agiu = true;
  let extra = `Esconder-se (DT ${dt}). `;
  if (resultado.passou) {
    const rolados = resultado.resultados.filter((r) => !r.anulado).map((r) => ({ tamanho: r.tamanho, valor: r.valor }));
    const i = await escolherDado(rolados, "Novo dado de esconderijo", "Escolha qual dado do teste vira dado de esconderijo.");
    if (i !== null && rolados[i]) {
      d.dados.push(rolados[i]);
      extra += `Ganha um dado de esconderijo: d${rolados[i].tamanho} (${rolados[i].valor}).`;
    }
  } else {
    extra += "Falhou: nenhum dado ganho. A próxima vez será mais difícil (+3 DT).";
  }
  await gravarAtor(actor, d);
  await publicarTeste(resultado, { flavor: `${actor.name}: esconder-se (Furtividade)`, actor, extra });
}

async function distrair(actor) {
  const estado = estadoMundo();
  const dt = 7 + 3 * estado.distrair;
  const resultado = await actor.rolarPericia("enganacao", { dt, silencioso: true, rotulo: `${actor.name}: distrair` });
  await pedirAoMestre("furtividade:distrair");
  const d = dadosAtor(actor);
  d.agiu = true;
  let extra = `Distrair (DT ${dt}; a DT de todos sobe +3). `;
  if (resultado.passou) {
    const rolados = resultado.resultados.filter((r) => !r.anulado).map((r) => ({ tamanho: r.tamanho, valor: r.valor }));
    const i = await escolherDado(rolados, "Dado de esconderijo", "Escolha qual dado do teste vira dado de esconderijo.");
    if (i !== null && rolados[i]) {
      const aliados = estado.participantes.map((id) => game.actors.get(id)).filter(Boolean);
      const dlg = await foundry.applications.api.DialogV2.input({
        window: { title: "Quem se beneficia?" },
        content: `<div class="form-group"><label>Personagem</label><select name="alvo">${aliados
          .map((a) => `<option value="${a.id}" ${a.id === actor.id ? "selected" : ""}>${esc(a.name)}</option>`)
          .join("")}</select></div>`,
        rejectClose: false
      });
      const alvo = game.actors.get(dlg?.alvo ?? actor.id) ?? actor;
      if (alvo.id === actor.id) d.dados.push(rolados[i]);
      else await pedirAoMestre("furtividade:adicionar", { actorId: alvo.id, dado: rolados[i] });
      extra += `${esc(alvo.name)} ganha um dado de esconderijo: d${rolados[i].tamanho} (${rolados[i].valor}).`;
    }
  } else extra += "Falhou: as criaturas não se distraem.";
  await gravarAtor(actor, d);
  await publicarTeste(resultado, { flavor: `${actor.name}: distrair (Enganação)`, actor, extra });
}

async function chamarAtencao(actor) {
  const estado = estadoMundo();
  const d = dadosAtor(actor);
  if (d.dados.length < 2) return ui.notifications.warn("Chamar atenção exige dois dados de esconderijo (um é transferido, outro descartado).");
  const aliados = estado.participantes.map((id) => game.actors.get(id)).filter((a) => a && a.id !== actor.id);
  if (!aliados.length) return ui.notifications.warn("Não há aliados no desafio.");
  const dlg = await foundry.applications.api.DialogV2.input({
    window: { title: "Chamar atenção" },
    content: `<p>Você perde <strong>dois</strong> dados para que o aliado ganhe <strong>um</strong>.</p>
      <div class="form-group"><label>Aliado</label><select name="alvo">${aliados.map((a) => `<option value="${a.id}">${esc(a.name)}</option>`).join("")}</select></div>
      <div class="form-group"><label>Dado transferido</label><select name="dado">${d.dados.map((x, i) => `<option value="${i}">d${x.tamanho}: ${x.valor}</option>`).join("")}</select></div>
      <div class="form-group"><label>Dado descartado</label><select name="descarte">${d.dados.map((x, i) => `<option value="${i}" ${i === 1 ? "selected" : ""}>d${x.tamanho}: ${x.valor}</option>`).join("")}</select></div>`,
    rejectClose: false
  });
  if (!dlg) return;
  const i = Number(dlg.dado);
  const j = Number(dlg.descarte);
  if (i === j) return ui.notifications.warn("Escolha dois dados diferentes.");
  const alvo = game.actors.get(dlg.alvo);
  const transferido = d.dados[i];
  const descartado = d.dados[j];
  d.dados = d.dados.filter((_, k) => k !== i && k !== j);
  d.agiu = true;
  await gravarAtor(actor, d);
  await pedirAoMestre("furtividade:adicionar", { actorId: alvo.id, dado: transferido });
  await anunciar({
    titulo: `${esc(actor.name)} chama atenção!`,
    icone: "fa-bullhorn",
    alias: actor.name,
    html: `<p>Perde d${transferido.tamanho} (${transferido.valor}) e d${descartado.tamanho} (${descartado.valor}); <strong>${esc(alvo.name)}</strong> ganha um dado de esconderijo d${transferido.tamanho} (${transferido.valor}).</p>`
  });
}

async function acaoChamativa(actor) {
  const d = dadosAtor(actor);
  if (!d.dados.length) return ui.notifications.warn("Você já não tem dados de esconderijo.");
  const i = await escolherDado(d.dados, "Ação chamativa", "Uma ação barulhenta ou espalhafatosa (como correr) custa um dado de esconderijo. Qual descartar?");
  if (i === null) return;
  const [perdido] = d.dados.splice(i, 1);
  await gravarAtor(actor, d);
  await anunciar({
    titulo: `${esc(actor.name)} faz barulho!`,
    icone: "fa-volume-high",
    alias: actor.name,
    html: `<p>Descarta o dado de esconderijo d${perdido.tamanho} (${perdido.valor}).${d.dados.length ? "" : " <strong>Está exposto!</strong>"}</p>`
  });
}
