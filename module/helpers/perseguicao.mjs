import { OP2E } from "../config.mjs";
import { publicarTeste } from "../dice/teste.mjs";
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

/**
 * Perseguição do Playtest Beta.
 *
 * Os personagens acumulam pontos de avanço (PA) ao longo de poucas rodadas. Em rodadas específicas, quem
 * está abaixo de um limite é atingido pela ameaça (derrubado pela água, devorado pela criatura…). Cada
 * jogador age pelo próprio personagem (ficha ou macro); o mestre resolve o fim de cada rodada no painel.
 *
 * Estado do mundo (configuração "perseguicao", só o mestre grava): rodada, predefinição e participantes.
 * Estado do personagem (flag "perseguicao"): PA, fôlego, perícias já usadas, esforços extras, situação.
 */

const CHAVE = "perseguicao";

export const PREDEFINICOES = {
  enxurrada: {
    nome: "A Enxurrada (Missão 1)",
    rodadas: 4,
    meta: 25,
    destino: "o terreno elevado (a ilhota)",
    limites: { 2: 5, 3: 15, 4: 25 },
    consequencia: "derrubado",
    cabecas: false,
    vala: false,
    resumo:
      "A água atinge, no fim da 2ª rodada, quem tem menos de 5 PA; no fim da 3ª, menos de 15; no fim da 4ª, menos de 25. Quem é atingido é derrubado e arrastado: não pode mais agir (nem ser carregado) e sofre 1d6 de dano por rodada até o fim da perseguição. Quem acumula 25 PA chega ao terreno elevado e está a salvo."
  },
  ellen: {
    nome: "As Três Cabeças da Morte (Missão 2)",
    rodadas: 5,
    meta: 30,
    destino: "a aldeia",
    limites: { 3: 15, 4: 20, 5: 30 },
    consequencia: "devorado",
    criatura: "Ellén Trechend",
    cabecas: true,
    vala: true,
    resumo:
      "No fim da 3ª rodada, quem tiver menos de 15 PA é alcançado pelo Ellén Trechend e devorado (se vários, só o de menor pontuação; empate = teste oposto de Atletismo, quem perder morre). O mesmo no fim da 4ª rodada com menos de 20 PA e no fim da 5ª com menos de 30 PA. No início de cada rodada duas cabeças atacam personagens sorteados: 1d6 de dano físico e 1d6 de dano emocional. Há uma vala oculta no caminho."
  },
  personalizada: {
    nome: "Perseguição personalizada",
    rodadas: 4,
    meta: 25,
    destino: "o destino",
    limites: {},
    consequencia: "derrubado",
    cabecas: false,
    vala: false,
    resumo: "Defina rodadas, meta e limites ao iniciar."
  }
};

const PADRAO_ATOR = () => ({
  pa: 0,
  folego: 0,
  usadas: [],
  esforcos: 0,
  situacao: "correndo", // correndo | derrubado | devorado | seguro
  agiu: false,
  carregado: false,
  vala: false
});

const PADRAO_MUNDO = () => ({ ativa: false, predefinicao: null, preset: null, rodada: 0, participantes: [], sacrificios: [], facilitar: false });

export function registrarPerseguicao() {
  game.settings.register(OP2E.id, CHAVE, { scope: "world", config: false, type: Object, default: PADRAO_MUNDO() });

  definirTratador("perseguicao:ajustar", async ({ actorId, mudancas }) => {
    const actor = game.actors.get(actorId);
    if (!actor) return;
    await actor.setFlag(OP2E.id, CHAVE, { ...dadosAtor(actor), ...mudancas });
  });
  definirTratador("perseguicao:sacrificio", async ({ actorId }) => {
    const estado = estadoMundo();
    if (!estado.sacrificios.includes(actorId)) estado.sacrificios.push(actorId);
    await gravarMundo(estado);
  });

  game.op2e.perseguicao = { estado: estadoMundo, iniciar, painel, acoes, resolverRodada, encerrar, PREDEFINICOES };
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
  await actor.setFlag(OP2E.id, CHAVE, dados);
}
/** Altera dados de qualquer personagem (via mestre, se o usuário não for dono). */
async function ajustarAtor(actor, mudancas) {
  if (actor.isOwner) return gravarAtor(actor, { ...dadosAtor(actor), ...mudancas });
  return pedirAoMestre("perseguicao:ajustar", { actorId: actor.id, mudancas });
}

function presetDe(estado) {
  return estado.preset ?? PREDEFINICOES[estado.predefinicao] ?? PREDEFINICOES.personalizada;
}

const nomeSituacao = { correndo: "Correndo", derrubado: "Derrubado", devorado: "Devorado", seguro: "A salvo" };

/* ------------------------------------------------------------------------- */
/* Mestre                                                                    */
/* ------------------------------------------------------------------------- */

export async function iniciar() {
  if (!game.user.isGM) return;
  const opcoes = Object.entries(PREDEFINICOES)
    .map(([k, v]) => `<option value="${k}">${esc(v.nome)}</option>`)
    .join("");
  const extra = `
    <div class="form-group"><label>Perseguição</label><select name="predefinicao">${opcoes}</select></div>
    <div class="form-group"><label><input type="checkbox" name="facilitar"> Facilitar a vida (cabeças causam 1d4 em vez de 1d6)</label></div>
    <fieldset><legend>Personalizada</legend>
      <div class="form-group"><label>Rodadas</label><input type="number" name="rodadas" value="4" min="1"></div>
      <div class="form-group"><label>Meta (PA)</label><input type="number" name="meta" value="25" min="1"></div>
      <div class="form-group"><label>Limites (rodada:mínimo, …)</label><input type="text" name="limites" value="2:5, 3:15, 4:25"></div>
      <div class="form-group"><label>Quem é atingido</label><select name="consequencia"><option value="derrubado">Derrubado (1d6 por rodada)</option><option value="devorado">Devorado (só o de menor PA)</option></select></div>
    </fieldset>`;
  const escolha = await escolherParticipantes("Iniciar perseguição", extra);
  if (!escolha) return;
  const { ids, dados } = escolha;
  if (!ids.length) return ui.notifications.warn("Escolha pelo menos um participante.");

  const estado = PADRAO_MUNDO();
  estado.ativa = true;
  estado.predefinicao = dados.predefinicao;
  estado.facilitar = Boolean(dados.facilitar);
  estado.rodada = 1;
  estado.participantes = ids;
  if (dados.predefinicao === "personalizada") {
    const limites = {};
    for (const parte of String(dados.limites).split(",")) {
      const [r, m] = parte.split(":").map((n) => Number(n.trim()));
      if (r && !Number.isNaN(m)) limites[r] = m;
    }
    estado.preset = {
      ...PREDEFINICOES.personalizada,
      rodadas: Number(dados.rodadas),
      meta: Number(dados.meta),
      limites,
      consequencia: dados.consequencia,
      resumo: `${dados.rodadas} rodadas, meta de ${dados.meta} PA. Limites: ${dados.limites}.`
    };
  }
  await gravarMundo(estado);

  const preset = presetDe(estado);
  const nomes = [];
  for (const id of ids) {
    const actor = game.actors.get(id);
    if (!actor) continue;
    const vigor = actor.system.pericias.vigor?.dado ?? 4;
    await gravarAtor(actor, { ...PADRAO_ATOR(), folego: Math.floor(vigor / 2) });
    nomes.push(`${esc(actor.name)} (${Math.floor(vigor / 2)}d6 de fôlego)`);
  }
  await anunciar({
    titulo: `Perseguição — ${esc(preset.nome)}`,
    icone: "fa-person-running",
    alias: "Perseguição",
    html: `<p>${esc(preset.resumo)}</p>
      <p><strong>Meta:</strong> ${preset.meta} PA para chegar a ${esc(preset.destino)} em ${preset.rodadas} rodadas.</p>
      <p><strong>Fôlego:</strong> ${nomes.join(", ")}.</p>
      <p><em>Cada jogador usa o botão “Perseguição” da própria ficha para agir.</em></p>`
  });
  await inicioDeRodada(estado);
}

/** Eventos do início de cada rodada (ataques das cabeças). */
async function inicioDeRodada(estado) {
  const preset = presetDe(estado);
  await anunciar({
    titulo: `Rodada ${estado.rodada} de ${preset.rodadas}`,
    icone: "fa-flag-checkered",
    alias: "Perseguição",
    html: "<p>Declarem as ações de perseguição: avançar, carregar outro, sacrificar-se, recuperar fôlego ou outra ação.</p>"
  });
  if (!preset.cabecas) return;

  const vivos = estado.participantes.map((id) => game.actors.get(id)).filter((a) => a && dadosAtor(a).situacao === "correndo");
  if (!vivos.length) return;
  const dado = estado.facilitar ? "1d4" : "1d6";
  const [primeiro, segundo] = sortear(vivos, 2);
  const alvoEmocional = segundo ?? primeiro;
  const fisico = await rolarFormula(dado);
  const emocional = await rolarFormula(dado);
  await fisico.toMessage({ speaker: { alias: "Cabeças do Ellén Trechend" }, flavor: `Mordida/veneno em ${primeiro.name}` });
  await emocional.toMessage({ speaker: { alias: "Cabeças do Ellén Trechend" }, flavor: `Cabeça dos muitos olhos em ${alvoEmocional.name}` });
  const pv = await aplicarDanoPV(primeiro, fisico.total);
  const pd = await aplicarDanoPD(alvoEmocional, emocional.total);
  await anunciar({
    titulo: "As cabeças atacam!",
    icone: "fa-skull",
    alias: "Ellén Trechend",
    html: `<p><strong>${esc(primeiro.name)}</strong> sofre ${fisico.total} de dano físico (PV ${pv}).</p>
      <p><strong>${esc(alvoEmocional.name)}</strong> sofre ${emocional.total} de dano emocional (PD ${pd}).</p>`
  });
}

/** Resolve o fim da rodada atual e começa a próxima (ou encerra a perseguição). */
export async function resolverRodada() {
  if (!game.user.isGM) return;
  const estado = estadoMundo();
  if (!estado.ativa) return ui.notifications.warn("Nenhuma perseguição em andamento.");
  const preset = presetDe(estado);
  const atores = estado.participantes.map((id) => game.actors.get(id)).filter(Boolean);
  const linhas = [];

  // 1. Quem chegou à meta está a salvo.
  for (const actor of atores) {
    const d = dadosAtor(actor);
    if (d.situacao === "correndo" && d.pa >= preset.meta) {
      d.situacao = "seguro";
      await gravarAtor(actor, d);
      linhas.push(`<strong>${esc(actor.name)}</strong> chegou a salvo: ${esc(preset.destino)} (${d.pa} PA).`);
    }
  }

  // 2. Quem está abaixo do limite desta rodada.
  const limite = preset.limites[estado.rodada];
  if (limite !== undefined) {
    const abaixo = atores.filter((a) => {
      const d = dadosAtor(a);
      return d.situacao === "correndo" && d.pa < limite;
    });
    if (preset.consequencia === "derrubado") {
      for (const actor of abaixo) {
        const d = dadosAtor(actor);
        d.situacao = "derrubado";
        await gravarAtor(actor, d);
        linhas.push(`<strong>${esc(actor.name)}</strong> (${d.pa} PA, limite ${limite}) é atingido, derrubado e arrastado!`);
      }
    } else if (abaixo.length) {
      const condenado = await escolherCondenado(abaixo, linhas);
      const d = dadosAtor(condenado);
      d.situacao = "devorado";
      await gravarAtor(condenado, d);
      linhas.push(
        `<strong>${esc(condenado.name)}</strong> (${d.pa} PA, limite ${limite}) é alcançado e devorado${preset.criatura ? ` pelo ${esc(preset.criatura)}` : ""}.`
      );
    } else {
      linhas.push(`Ninguém ficou abaixo de ${limite} PA nesta rodada.`);
    }
  }

  // 3. Dano contínuo de quem foi derrubado (inclui os recém-derrubados).
  if (preset.consequencia === "derrubado") {
    for (const actor of atores) {
      if (dadosAtor(actor).situacao !== "derrubado") continue;
      const roll = await rolarFormula("1d6");
      await roll.toMessage({ speaker: { alias: "Enxurrada" }, flavor: `A água castiga ${actor.name}` });
      const pv = await aplicarDanoPV(actor, roll.total);
      linhas.push(`${esc(actor.name)} sofre ${roll.total} de dano (PV ${pv}).`);
    }
  }

  // 4. Fim da perseguição ou próxima rodada.
  const final = estado.rodada >= preset.rodadas;
  if (final) {
    const pendentes = atores.filter((a) => dadosAtor(a).situacao === "correndo");
    for (const actor of pendentes) {
      linhas.push(`<strong>${esc(actor.name)}</strong> terminou com ${dadosAtor(actor).pa} PA sem alcançar a meta — decisão do mestre.`);
    }
    await anunciar({
      titulo: `Fim da rodada ${estado.rodada} — a perseguição terminou`,
      icone: "fa-flag",
      alias: "Perseguição",
      html: `<p>${linhas.join("</p><p>")}</p>${resumoFinal(atores)}`
    });
    estado.ativa = false;
    await gravarMundo(estado);
    return;
  }

  await anunciar({
    titulo: `Fim da rodada ${estado.rodada}`,
    icone: "fa-flag",
    alias: "Perseguição",
    html: linhas.length ? `<p>${linhas.join("</p><p>")}</p>` : "<p>Nada acontece além da correria.</p>"
  });

  for (const actor of atores) {
    const d = dadosAtor(actor);
    d.agiu = false;
    d.carregado = false;
    await gravarAtor(actor, d);
  }
  estado.rodada += 1;
  estado.sacrificios = [];
  await gravarMundo(estado);
  await inicioDeRodada(estado);
}

/** Entre os que estão abaixo do limite, o de menor PA é o condenado; empates são decididos por Atletismo. */
async function escolherCondenado(abaixo, linhas) {
  const menor = Math.min(...abaixo.map((a) => dadosAtor(a).pa));
  let empatados = abaixo.filter((a) => dadosAtor(a).pa === menor);
  while (empatados.length > 1) {
    const rolagens = [];
    for (const actor of empatados) {
      const resultado = await actor.rolarPericia("atletismo", { dt: 0, silencioso: true });
      rolagens.push({ actor, total: resultado.total });
      await publicarTeste(resultado, { flavor: `${actor.name}: Atletismo (desempate)`, actor });
    }
    const pior = Math.min(...rolagens.map((r) => r.total));
    empatados = rolagens.filter((r) => r.total === pior).map((r) => r.actor);
    linhas.push(`Empate em ${menor} PA: teste de Atletismo — menor total ${pior}.`);
  }
  return empatados[0];
}

function resumoFinal(atores) {
  const itens = atores.map((a) => {
    const d = dadosAtor(a);
    return `<li>${esc(a.name)}: ${d.pa} PA — ${nomeSituacao[d.situacao]}</li>`;
  });
  return `<ul>${itens.join("")}</ul>`;
}

export async function encerrar() {
  if (!game.user.isGM) return;
  const estado = estadoMundo();
  if (!estado.ativa) return;
  estado.ativa = false;
  await gravarMundo(estado);
  await anunciar({ titulo: "Perseguição encerrada", icone: "fa-flag", alias: "Perseguição", html: "<p>O mestre encerrou a perseguição.</p>" });
}

/** Painel do mestre (ou, para jogadores, as ações do personagem). */
export async function painel() {
  if (!game.user.isGM) return acoes();
  const estado = estadoMundo();
  if (!estado.ativa) {
    const escolha = await foundry.applications.api.DialogV2.wait({
      window: { title: "Perseguição" },
      content: "<p>Nenhuma perseguição em andamento.</p>",
      rejectClose: false,
      buttons: [{ action: "iniciar", label: "Iniciar perseguição", icon: "fa-solid fa-person-running", default: true }]
    });
    if (escolha === "iniciar") await iniciar();
    return;
  }
  const preset = presetDe(estado);
  const linhas = estado.participantes
    .map((id) => game.actors.get(id))
    .filter(Boolean)
    .map((a) => {
      const d = dadosAtor(a);
      const pv = a.system.recursos.pv;
      return `<tr><td>${esc(a.name)}</td><td>${d.pa}/${preset.meta}</td><td>${d.folego}d6</td><td>${pv.value}/${pv.max}</td><td>${nomeSituacao[d.situacao]}</td><td>${
        d.agiu ? "✔" : "—"
      }</td></tr>`;
    })
    .join("");
  const escolha = await foundry.applications.api.DialogV2.wait({
    window: { title: `Perseguição — rodada ${estado.rodada}/${preset.rodadas}` },
    content: `<p><strong>${esc(preset.nome)}</strong></p>
      <table class="op2e-tabela-desafio"><thead><tr><th>Personagem</th><th>PA</th><th>Fôlego</th><th>PV</th><th>Situação</th><th>Agiu</th></tr></thead><tbody>${linhas}</tbody></table>
      <p class="notes">Limite desta rodada: ${preset.limites[estado.rodada] ?? "—"} PA.</p>`,
    rejectClose: false,
    buttons: [
      { action: "resolver", label: estado.rodada >= preset.rodadas ? "Resolver e encerrar" : "Resolver fim da rodada", icon: "fa-solid fa-forward", default: true },
      { action: "encerrar", label: "Encerrar perseguição", icon: "fa-solid fa-flag-checkered" }
    ]
  });
  if (escolha === "resolver") await resolverRodada();
  else if (escolha === "encerrar") await encerrar();
}

/* ------------------------------------------------------------------------- */
/* Jogadores                                                                 */
/* ------------------------------------------------------------------------- */

export async function acoes(actor = atorAtual()) {
  if (!actor) return ui.notifications.warn("Selecione o token (ou defina o personagem do usuário) para agir na perseguição.");
  const estado = estadoMundo();
  if (!estado.ativa) return ui.notifications.warn("Nenhuma perseguição em andamento.");
  if (!estado.participantes.includes(actor.id)) return ui.notifications.warn(`${actor.name} não participa desta perseguição.`);
  const preset = presetDe(estado);
  const d = dadosAtor(actor);
  const status = `<p><strong>${esc(actor.name)}</strong> — Rodada ${estado.rodada}/${preset.rodadas}. <strong>${d.pa}</strong> / ${preset.meta} PA, fôlego ${d.folego}d6. Situação: ${nomeSituacao[d.situacao]}.</p>`;

  if (d.situacao !== "correndo") {
    return foundry.applications.api.DialogV2.prompt({
      window: { title: "Perseguição" },
      content: `${status}<p>${actor.name} não pode mais agir.</p>`,
      ok: { label: "Ok" },
      rejectClose: false
    });
  }
  const aviso = d.agiu ? "<p><em>Você já agiu nesta rodada.</em></p>" : d.carregado ? "<p><em>Você está sendo carregado: não pode avançar por conta própria nesta rodada.</em></p>" : "";
  const escolha = await foundry.applications.api.DialogV2.wait({
    window: { title: `Perseguição — ${actor.name}` },
    content: status + aviso,
    rejectClose: false,
    buttons: [
      { action: "avancar", label: "Avançar", icon: "fa-solid fa-person-running", default: true },
      { action: "carregar", label: "Carregar outro", icon: "fa-solid fa-people-carry-box" },
      { action: "sacrificio", label: "Sacrifício", icon: "fa-solid fa-hand-holding-heart" },
      { action: "folego", label: "Recuperar fôlego", icon: "fa-solid fa-wind" },
      { action: "outra", label: "Outra ação", icon: "fa-solid fa-ellipsis" }
    ]
  });
  if (!escolha) return;
  if (d.agiu) return ui.notifications.warn("Você já agiu nesta rodada.");

  switch (escolha) {
    case "avancar":
      return avancar(actor, { carregar: false });
    case "carregar":
      return avancar(actor, { carregar: true });
    case "sacrificio":
      return sacrificio(actor);
    case "folego":
      return recuperarFolego(actor);
    case "outra":
      return outraAcao(actor);
  }
}

async function avancar(actor, { carregar }) {
  const estado = estadoMundo();
  const preset = presetDe(estado);
  const d = dadosAtor(actor);
  if (d.carregado) return ui.notifications.warn("Você está sendo carregado: não pode avançar por conta própria nesta rodada.");

  // Alvo (carregar outro)
  let alvo = null;
  if (carregar) {
    const candidatos = estado.participantes
      .map((id) => game.actors.get(id))
      .filter((a) => a && a.id !== actor.id && dadosAtor(a).situacao === "correndo" && dadosAtor(a).pa <= d.pa);
    if (!candidatos.length) return ui.notifications.warn("Ninguém pode ser carregado (só quem tem tantos PA quanto você ou menos).");
    const escolhido = await foundry.applications.api.DialogV2.input({
      window: { title: "Carregar quem?" },
      content: `<div class="form-group"><label>Personagem</label><select name="alvo">${candidatos
        .map((a) => `<option value="${a.id}">${esc(a.name)} (${dadosAtor(a).pa} PA)</option>`)
        .join("")}</select></div>`,
      rejectClose: false
    });
    if (!escolhido) return;
    alvo = game.actors.get(escolhido.alvo);
  }

  const sacrificios = estado.sacrificios.filter((id) => id !== actor.id).length;
  const maxExtras = Math.max(0, 2 - sacrificios);
  const periciasLivres = Object.keys(OP2E.pericias)
    .filter((c) => c !== "aptidao" && (c === "atletismo" || !d.usadas.includes(c)))
    .map((c) => `<option value="${c}" ${c === "atletismo" ? "selected" : ""}>${esc(game.i18n.localize(`OP2E.Pericia.${c}`))}</option>`)
    .join("");
  const dlg = await foundry.applications.api.DialogV2.input({
    window: { title: carregar ? `Carregar ${alvo.name}` : "Avançar" },
    content: `
      <div class="form-group"><label>Perícia (outras só uma vez)</label><select name="pericia">${periciasLivres}</select></div>
      <div class="form-group"><label>Dados de fôlego a gastar (máx. ${Math.min(d.folego, maxExtras)})</label><input type="number" name="folego" value="0" min="0" max="${Math.min(d.folego, maxExtras)}"></div>
      <div class="form-group"><label><input type="checkbox" name="esforco"> Esforço extra (+1 passo, perde ${d.esforcos + 1}d4 PV)</label></div>
      <div class="form-group"><label>Ajuste do mestre (passos)</label><select name="passo"><option value="-2">-2</option><option value="-1">-1</option><option value="0" selected>0</option><option value="1">+1</option><option value="2">+2</option></select></div>
      ${sacrificios ? `<p><em>${sacrificios} aliado(s) se sacrificaram: +${sacrificios}d6 neste teste.</em></p>` : ""}`,
    rejectClose: false,
    ok: { label: "Rolar" }
  });
  if (!dlg) return;

  let passo = Number(dlg.passo) + (dlg.esforco ? 1 : 0) - (carregar ? 1 : 0);

  // Vala oculta (Missão 2): primeiro avanço já com 15+ PA.
  if (preset.vala && d.pa >= 15 && !d.vala) {
    const vala = await foundry.applications.api.DialogV2.input({
      window: { title: "A vala oculta!" },
      content: `<p>Há um buraco escondido pela vegetação. Percepção ou Sobrevivência (DT 10) para percebê-lo.</p>
        <div class="form-group"><label>Perícia</label><select name="pericia"><option value="percepcao">Percepção</option><option value="sobrevivencia">Sobrevivência</option></select></div>
        <div class="form-group"><label><input type="checkbox" name="avisado"> Um aliado avisou (+1 passo)</label></div>`,
      rejectClose: false
    });
    if (!vala) return;
    const resultadoVala = await actor.rolarPericia(vala.pericia, { dt: 10, passo: vala.avisado ? 1 : 0, rotulo: `${actor.name}: a vala oculta` });
    d.vala = true;
    if (!resultadoVala.passou) {
      passo -= 2;
      ui.notifications.warn(`${actor.name} tropeça na vala: duas reduções de passo no avanço.`);
    }
  }

  // Preparar PA ao carregar
  let alvoDados = null;
  if (alvo) {
    alvoDados = dadosAtor(alvo);
    if (alvoDados.pa < d.pa) d.pa = alvoDados.pa; // voltou para buscá-lo
  }

  const folegoGasto = Math.min(Number(dlg.folego) || 0, d.folego, maxExtras);
  const dadosExtras = [...Array(sacrificios).fill(6), ...Array(folegoGasto).fill(6)].slice(0, 2);

  const resultado = await actor.rolarPericia(dlg.pericia, {
    dt: 10,
    passo,
    dadosExtras,
    silencioso: true,
    rotulo: `${actor.name}: ${carregar ? "carregar " + alvo.name : "avançar"} (${game.i18n.localize(`OP2E.Pericia.${dlg.pericia}`)})`
  });
  if (!resultado) return;
  const ganho = resultado.passou ? resultado.ra : resultado.rb;
  d.pa += ganho;
  d.folego -= folegoGasto;
  d.agiu = true;
  if (dlg.pericia !== "atletismo") d.usadas.push(dlg.pericia);

  let notaEsforco = "";
  if (dlg.esforco) {
    const perdaRoll = await rolarFormula(`${d.esforcos + 1}d4`);
    await perdaRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: "Esforço extra" });
    const pv = await aplicarDanoPV(actor, perdaRoll.total);
    d.esforcos += 1;
    notaEsforco = ` Esforço extra: perde ${perdaRoll.total} PV (PV ${pv}).`;
  }

  let notaCarga = "";
  if (alvo) {
    const antes = alvoDados.pa;
    if (d.pa > alvoDados.pa) alvoDados.pa = d.pa;
    await ajustarAtor(alvo, { pa: alvoDados.pa, carregado: true });
    notaCarga = ` ${alvo.name} é carregado (${antes} → ${alvoDados.pa} PA).`;
  }
  await gravarAtor(actor, d);

  await publicarTeste(resultado, {
    flavor: `${actor.name}: ${carregar ? "carrega " + alvo.name : "avança"} (${game.i18n.localize(`OP2E.Pericia.${dlg.pericia}`)})`,
    actor,
    extra: `<strong>${resultado.passou ? "Rolagem alta" : "Rolagem baixa"}: +${ganho} PA</strong> — total ${d.pa}/${preset.meta}.${notaEsforco}${notaCarga}`
  });
}

async function sacrificio(actor) {
  const d = dadosAtor(actor);
  d.agiu = true;
  await gravarAtor(actor, d);
  await pedirAoMestre("perseguicao:sacrificio", { actorId: actor.id });
  await anunciar({
    titulo: `${esc(actor.name)} se sacrifica!`,
    icone: "fa-hand-holding-heart",
    alias: actor.name,
    html: "<p>Em vez de correr, atrapalha a ameaça: <strong>+1d6</strong> no teste de avançar dos aliados nesta rodada.</p>"
  });
}

async function recuperarFolego(actor) {
  const d = dadosAtor(actor);
  d.agiu = true;
  d.folego += 2;
  await gravarAtor(actor, d);
  await anunciar({
    titulo: `${esc(actor.name)} recupera o fôlego`,
    icone: "fa-wind",
    alias: actor.name,
    html: `<p>Recupera 2 dados de fôlego (agora ${d.folego}d6).</p>`
  });
}

async function outraAcao(actor) {
  const d = dadosAtor(actor);
  d.agiu = true;
  await gravarAtor(actor, d);
  await anunciar({
    titulo: `${esc(actor.name)} faz outra ação`,
    icone: "fa-ellipsis",
    alias: actor.name,
    html: "<p>A critério do mestre. Não avança nesta rodada.</p>"
  });
}
