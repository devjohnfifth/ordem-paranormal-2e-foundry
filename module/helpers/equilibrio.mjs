import { OP2E } from "../config.mjs";
import { anunciar, esc, atorAtual, rolarFormula, lerFlag } from "./desafios-comum.mjs";

/**
 * Teste de equilíbrio do Playtest Beta: rola-se 2d10 sem somar. Se os resultados forem iguais ou
 * diferirem em 1 ponto, o personagem se equilibra; senão começa a cair. Ao cair, ele pode gastar
 * "dados de equilíbrio" (d4, em número igual à metade da sua Acrobacia, gastos até o fim da travessia):
 * rola um e soma o resultado a um dos d10, à escolha.
 */

const CHAVE = "equilibrio";

export function registrarEquilibrio() {
  game.op2e.equilibrio = { rolar, reiniciar, restantes };
}

/** Dados de equilíbrio disponíveis (inicializa a travessia na primeira chamada). */
export function restantes(actor) {
  const dados = lerFlag(actor, CHAVE, null);
  if (dados && Number.isInteger(dados.restantes)) return dados.restantes;
  return Math.floor((actor.system.pericias.acrobacia?.dado ?? 4) / 2);
}

/** Começa uma nova travessia: recupera todos os dados de equilíbrio. */
export async function reiniciar(actor = atorAtual()) {
  if (!actor) return ui.notifications.warn("Selecione um personagem.");
  const total = Math.floor((actor.system.pericias.acrobacia?.dado ?? 4) / 2);
  await actor.setFlag(OP2E.id, CHAVE, { restantes: total });
  return total;
}

const equilibrado = (a, b) => Math.abs(a - b) <= 1;

export async function rolar(actor = atorAtual(), { novaTravessia = false } = {}) {
  if (!actor || actor.type !== "personagem") return ui.notifications.warn("Selecione um personagem para o teste de equilíbrio.");
  if (novaTravessia || lerFlag(actor, CHAVE, null) === null) await reiniciar(actor);

  let sobra = restantes(actor);
  const inicio = sobra;
  const roll = await rolarFormula("2d10");
  const valores = roll.dice[0].results.map((r) => r.result);
  await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `${actor.name}: teste de equilíbrio (2d10, sem somar)` });

  const historico = [`Rolagem: <strong>${valores[0]}</strong> e <strong>${valores[1]}</strong>.`];
  let [a, b] = valores;

  while (!equilibrado(a, b) && sobra > 0) {
    const usar = await foundry.applications.api.DialogV2.wait({
      window: { title: `Equilíbrio — ${actor.name}` },
      content: `<p>Está caindo! Resultados <strong>${a}</strong> e <strong>${b}</strong> (precisam diferir em até 1 ponto).</p>
        <p>Dados de equilíbrio restantes: <strong>${sobra}d4</strong>.</p>`,
      rejectClose: false,
      buttons: [
        { action: "usar", label: "Rolar dado de equilíbrio", icon: "fa-solid fa-dice-d6", default: true },
        { action: "cair", label: "Aceitar a queda", icon: "fa-solid fa-person-falling" }
      ]
    });
    if (usar !== "usar") break;

    const d4 = await rolarFormula("1d4");
    await d4.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: "Dado de equilíbrio (d4)" });
    sobra -= 1;
    const alvo = await foundry.applications.api.DialogV2.wait({
      window: { title: `Somar ${d4.total}` },
      content: `<p>Dado de equilíbrio: <strong>${d4.total}</strong>. Some a qual resultado?</p>`,
      rejectClose: false,
      buttons: [
        { action: "a", label: `${a} → ${a + d4.total}`, default: true },
        { action: "b", label: `${b} → ${b + d4.total}` }
      ]
    });
    if (alvo === "b") b += d4.total;
    else a += d4.total;
    historico.push(`d4 = ${d4.total}: resultados <strong>${a}</strong> e <strong>${b}</strong> (restam ${sobra}d4).`);
  }

  await actor.setFlag(OP2E.id, CHAVE, { restantes: sobra });
  const ok = equilibrado(a, b);
  await anunciar({
    titulo: `${esc(actor.name)} ${ok ? "se equilibra" : "cai!"}`,
    icone: ok ? "fa-person-walking" : "fa-person-falling",
    alias: actor.name,
    classe: ok ? "sucesso" : "falha",
    html: `<p>${historico.join("</p><p>")}</p><p>${ok ? "Equilibrou-se." : "Os resultados diferem em mais de 1 ponto: caiu."} Dados de equilíbrio: ${sobra}/${inicio}.</p>`
  });
  return ok;
}
