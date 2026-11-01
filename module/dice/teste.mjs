import { OP2E } from "../config.mjs";

/**
 * Implementa a mecânica de Teste do playtest de Ordem Paranormal 2:
 * rola um dado de atributo e um dado de perícia (mais dados extras, se houver),
 * soma os três melhores resultados (máximo de 4 dados rolados) e compara com a DT.
 *
 * Sucesso crítico: dois ou mais dados rolados empatam em um valor >= 6.
 * Falha crítica: todos os dados rolados mostram 1.
 *
 * Dado de pavor (Playtest Beta): não é somado; anula os resultados menores que ele. Se anular
 * todos os dados do teste, é falha crítica.
 *
 * @param {object} options
 * @param {number} options.dadoAtributo   Tamanho do dado de atributo (4-20).
 * @param {number} options.dadoPericia    Tamanho do dado de perícia (4-12).
 * @param {number[]} [options.dadosExtras] Tamanhos de dados adicionais (aumento de passo, ajuda etc.).
 * @param {number} [options.dadoPavor]    Tamanho do dado de pavor (0 = sem pavor).
 * @param {number} [options.dt]           Dificuldade do teste. Padrão 7.
 * @param {number} [options.criticoMin]   Valor mínimo de dois dados iguais para sucesso crítico (padrão 6).
 * @param {string} [options.flavor]       Texto descritivo do teste, exibido no chat.
 * @param {Actor}  [options.actor]        Ator que está testando, para o chat card.
 * @param {boolean} [options.silencioso]  Se verdadeiro, não publica o chat card (o chamador publica).
 * @returns {Promise<object>} Resultado detalhado do teste.
 */
export async function rolarTeste({
  dadoAtributo,
  dadoPericia,
  dadosExtras = [],
  dadoPavor = 0,
  dt = OP2E.dificuldadePadrao,
  criticoMin = 6,
  flavor = "",
  actor = null,
  silencioso = false
} = {}) {
  const tamanhos = [dadoAtributo, dadoPericia, ...dadosExtras].filter(Boolean).slice(0, 4);

  const rolls = await Promise.all(tamanhos.map((tamanho) => new Roll(`1d${tamanho}`).evaluate()));
  let pavor = null;
  if (dadoPavor > 0) {
    const rollPavor = await new Roll(`1d${dadoPavor}`).evaluate();
    pavor = { tamanho: dadoPavor, valor: rollPavor.total, roll: rollPavor };
    rolls.push(rollPavor);
  }

  const resultados = tamanhos.map((tamanho, i) => ({
    tamanho,
    valor: rolls[i].total,
    roll: rolls[i],
    anulado: pavor ? rolls[i].total < pavor.valor : false
  }));

  // Só os dados não anulados pelo pavor contam para soma, crítico, RA e RB.
  const validos = resultados.filter((r) => !r.anulado);
  const ordenados = [...validos].sort((a, b) => b.valor - a.valor);
  const usados = ordenados.slice(0, 3);
  const total = usados.reduce((soma, r) => soma + r.valor, 0);

  const ra = validos.length ? Math.max(...validos.map((r) => r.valor)) : 0;
  const rb = validos.length ? Math.min(...validos.map((r) => r.valor)) : 0;
  // Em ataques, um sucesso crítico soma as duas maiores rolagens ao dano (e não só a maior).
  const ra2 = ordenados.slice(0, 2).reduce((soma, r) => soma + r.valor, 0);

  const contagem = {};
  for (const r of validos) contagem[r.valor] = (contagem[r.valor] ?? 0) + 1;
  const critico = Object.entries(contagem).some(([valor, qtd]) => qtd >= 2 && Number(valor) >= criticoMin);
  const todosUm = resultados.length > 0 && resultados.every((r) => r.valor === 1);
  const pavorAnulouTudo = Boolean(pavor) && validos.length === 0;
  const falhaCritica = todosUm || pavorAnulouTudo;

  const passou = !falhaCritica && (critico || total >= dt);

  let efeitoFalhaCritica = null;
  if (falhaCritica) {
    const roll = await new Roll("1d8").evaluate();
    efeitoFalhaCritica = { valor: roll.total, ...OP2E.tabelaFalhasCriticas[roll.total - 1] };
  }

  const resultado = {
    tamanhos,
    resultados,
    pavor,
    usados,
    total,
    dt,
    ra,
    rb,
    ra2,
    critico,
    falhaCritica,
    efeitoFalhaCritica,
    passou,
    rolls
  };

  if (!silencioso) {
    await publicarTeste(resultado, { flavor, actor });
  }

  return resultado;
}

/** Publica o chat card de um teste já rolado. */
export async function publicarTeste(resultado, { flavor = "", actor = null, extra = "" } = {}) {
  const conteudo = await foundry.applications.handlebars.renderTemplate(
    "systems/op2e-playtest/templates/chat/teste-roll.hbs",
    { ...resultado, flavor, extra }
  );

  return ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
    content: conteudo,
    rolls: resultado.rolls,
    sound: CONFIG.sounds.dice
  });
}

/** Move um tamanho de dado um número de passos na escala d4-d12 (ou d20, se permitido). */
export function passoDado(tamanho, passos, { permitirD20 = false } = {}) {
  const escala = permitirD20 ? OP2E.escalaDados : OP2E.escalaDados.filter((d) => d !== 20);
  const indice = escala.indexOf(tamanho);
  if (indice === -1) return tamanho;
  const novoIndice = Math.clamp(indice + passos, 0, escala.length - 1);
  return escala[novoIndice];
}
