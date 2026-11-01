import { OP2E } from "../config.mjs";

/**
 * Utilitários compartilhados pelos desafios do Playtest Beta (perseguição, furtividade, equilíbrio).
 *
 * Os jogadores não podem alterar documentos que não são deles (nem as configurações do mundo), então
 * toda alteração "global" ou em outro personagem passa por um relay: o cliente do jogador envia um
 * pedido pelo socket do sistema e o mestre ativo o executa.
 */

const CANAL = `system.${OP2E.id}`;
const tratadores = new Map();

export function registrarRelay() {
  game.socket.on(CANAL, async (mensagem) => {
    if (!mensagem?.op || game.users.activeGM?.id !== game.user.id) return;
    const tratador = tratadores.get(mensagem.op);
    if (!tratador) return;
    try {
      await tratador(mensagem.dados ?? {}, mensagem.autor);
    } catch (erro) {
      console.error(`OP2E | falha ao executar "${mensagem.op}" no relay`, erro);
    }
  });
}

export function definirTratador(op, funcao) {
  tratadores.set(op, funcao);
}

/** Executa direto se este cliente for o mestre ativo; senão pede ao mestre pelo socket. */
export async function pedirAoMestre(op, dados = {}) {
  if (game.users.activeGM?.id === game.user.id) return tratadores.get(op)?.(dados, game.user.id);
  if (!game.users.activeGM) {
    ui.notifications.warn("Não há mestre conectado para registrar esta ação.");
    return null;
  }
  game.socket.emit(CANAL, { op, dados, autor: game.user.id });
  return null;
}

export async function anunciar({ titulo, icone = "fa-circle-info", html = "", alias = "Desafio", classe = "" }) {
  return ChatMessage.create({
    speaker: { alias },
    content: `<div class="op2e chat-item op2e-fase ${classe}"><h3><i class="fa-solid ${icone}"></i> ${titulo}</h3>${html}</div>`
  });
}

export const esc = (texto) => foundry.utils.escapeHTML(String(texto ?? ""));

/** Personagens candidatos a participar de um desafio (jogadores ativos primeiro). */
export function candidatos() {
  const personagens = game.actors.filter((a) => a.type === "personagem");
  const ativos = (a) => game.users.some((u) => !u.isGM && u.active && a.testUserPermission(u, "OWNER"));
  return personagens
    .map((a) => ({ actor: a, ativo: ativos(a) }))
    .sort((x, y) => Number(y.ativo) - Number(x.ativo) || x.actor.name.localeCompare(y.actor.name));
}

/** Pergunta ao mestre quais personagens participam. Retorna a lista de ids ou null. */
export async function escolherParticipantes(titulo, extraHtml = "") {
  const lista = candidatos();
  if (!lista.length) {
    ui.notifications.warn("Não há personagens neste mundo.");
    return null;
  }
  const linhas = lista
    .map(
      ({ actor, ativo }) =>
        `<label class="op2e-participante"><input type="checkbox" name="${actor.id}" ${ativo ? "checked" : ""}> ${esc(actor.name)}${
          ativo ? " <em>(jogador conectado)</em>" : ""
        }</label>`
    )
    .join("");
  const dados = await foundry.applications.api.DialogV2.input({
    window: { title: titulo },
    content: `${extraHtml}<fieldset><legend>Participantes</legend>${linhas}</fieldset>`,
    rejectClose: false,
    ok: { label: "Começar" }
  });
  if (!dados) return null;
  const ids = lista.map((l) => l.actor.id).filter((id) => dados[id]);
  return { ids, dados };
}

/** Ator que o usuário atual controla neste momento (token selecionado ou personagem do usuário). */
export function atorAtual() {
  const token = canvas?.tokens?.controlled?.[0]?.actor;
  if (token?.type === "personagem") return token;
  if (game.user.character?.type === "personagem") return game.user.character;
  return null;
}

/** Quantidade de pontos de vida/dano aplicada de forma segura, retornando o novo valor. */
export async function aplicarDanoPV(actor, valor) {
  const atual = actor.system.recursos.pv.value;
  const novo = Math.max(0, atual - Math.max(0, valor));
  await actor.update({ "system.recursos.pv.value": novo });
  return novo;
}

export async function aplicarDanoPD(actor, valor) {
  const atual = actor.system.recursos.pd.value;
  const novo = Math.max(0, atual - Math.max(0, valor));
  await actor.update({ "system.recursos.pd.value": novo });
  return novo;
}

export async function rolarFormula(formula) {
  const roll = await new Roll(formula).evaluate();
  return roll;
}

/** Sorteia `quantidade` elementos distintos de uma lista. */
export function sortear(lista, quantidade = 1) {
  const copia = [...lista];
  const saida = [];
  while (copia.length && saida.length < quantidade) {
    saida.push(copia.splice(Math.floor(Math.random() * copia.length), 1)[0]);
  }
  return saida;
}

export function lerFlag(actor, chave, padrao) {
  return foundry.utils.deepClone(actor.getFlag(OP2E.id, chave) ?? padrao);
}
