import { OP2E } from "../config.mjs";

/**
 * Implementa a mecânica de Teste do playtest de Ordem Paranormal 2:
 * rola um dado de atributo e um dado de perícia (mais dados extras, se houver),
 * soma os três melhores resultados (máximo de 4 dados rolados) e compara com a DT.
 *
 * Sucesso crítico: dois ou mais dados rolados empatam em um valor >= 6.
 * Falha crítica: todos os dados rolados mostram 1.
 *
 * @param {object} options
 * @param {number} options.dadoAtributo   Tamanho do dado de atributo (4-20).
 * @param {number} options.dadoPericia    Tamanho do dado de perícia (4-12).
 * @param {number[]} [options.dadosExtras] Tamanhos de dados adicionais (aumento de passo, ajuda etc.).
 * @param {number} [options.dt]           Dificuldade do teste. Padrão 7.
 * @param {string} [options.flavor]       Texto descritivo do teste, exibido no chat.
 * @param {Actor}  [options.actor]        Ator que está testando, para o chat card.
 * @returns {Promise<object>} Resultado detalhado do teste.
 */
export async function rolarTeste({
  dadoAtributo,
  dadoPericia,
  dadosExtras = [],
  dt = OP2E.dificuldadePadrao,
  flavor = "",
  actor = null
} = {}) {
  const tamanhos = [dadoAtributo, dadoPericia, ...dadosExtras].filter(Boolean).slice(0, 4);

  const rolls = await Promise.all(tamanhos.map((tamanho) => new Roll(`1d${tamanho}`).evaluate()));
  const resultados = rolls.map((roll, i) => ({ tamanho: tamanhos[i], valor: roll.total, roll }));

  const ordenados = [...resultados].sort((a, b) => b.valor - a.valor);
  const usados = ordenados.slice(0, 3);
  const total = usados.reduce((soma, r) => soma + r.valor, 0);

  const ra = Math.max(...resultados.map((r) => r.valor));
  const rb = Math.min(...resultados.map((r) => r.valor));

  const contagem = {};
  for (const r of resultados) contagem[r.valor] = (contagem[r.valor] ?? 0) + 1;
  const critico = Object.entries(contagem).some(([valor, qtd]) => qtd >= 2 && Number(valor) >= 6);
  const falhaCritica = resultados.every((r) => r.valor === 1);

  const passou = !falhaCritica && (critico || total >= dt);

  const resultado = {
    tamanhos,
    resultados,
    usados,
    total,
    dt,
    ra,
    rb,
    critico,
    falhaCritica,
    passou
  };

  const conteudo = await foundry.applications.handlebars.renderTemplate(
    "systems/op2e-playtest/templates/chat/teste-roll.hbs",
    { ...resultado, flavor }
  );

  await ChatMessage.create({
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
    content: conteudo,
    rolls,
    sound: CONFIG.sounds.dice
  });

  return resultado;
}

/** Move um tamanho de dado um número de passos na escala d4-d12 (ou d20, se permitido). */
export function passoDado(tamanho, passos, { permitirD20 = false } = {}) {
  const escala = permitirD20 ? OP2E.escalaDados : OP2E.escalaDados.filter((d) => d !== 20);
  const indice = escala.indexOf(tamanho);
  if (indice === -1) return tamanho;
  const novoIndice = Math.clamp(indice + passos, 0, escala.length - 1);
  return escala[novoIndice];
}
