import { OP2E } from "../config.mjs";

/**
 * Combate por fases do Playtest Beta: não há iniciativa nem ordem de turnos. Cada rodada tem quatro
 * fases (suporte, ataques à distância, ataques corpo a corpo e fase final) e cada personagem age na fase
 * da ação que quiser realizar. Este helper guarda a rodada/fase atual como configuração do mundo e anuncia
 * cada fase no chat, para o mestre conduzir a cena com uma única macro.
 */

const CHAVE = "combate";

const FASES = {
  suporte: {
    nome: "Fase de Suporte",
    icone: "fa-hand-holding-heart",
    texto:
      "Qualquer ação relacionada ao combate que não seja um ataque nem uma movimentação pura: atrapalhar, defender-se, fintar, mirar, preparar, sacar/guardar item, usar habilidade ou item."
  },
  distancia: {
    nome: "Fase de Ataques à Distância",
    icone: "fa-bullseye",
    texto: "Quem vai atacar à distância (Pontaria) age agora. Ações da mesma fase acontecem simultaneamente."
  },
  corpo: {
    nome: "Fase de Ataques Corpo a Corpo",
    icone: "fa-burst",
    texto: "Quem vai atacar corpo a corpo (Luta) ou fazer manobras (agarrar, derrubar, desarmar, empurrar, quebrar) age agora."
  },
  final: {
    nome: "Fase Final",
    icone: "fa-person-running",
    texto: "Movimentação pura (inclusive fugir do combate) e ações não diretamente ligadas ao combate, como continuar investigando."
  }
};

export function registrarCombatePorFases() {
  game.settings.register(OP2E.id, CHAVE, {
    scope: "world",
    config: false,
    type: Object,
    default: { rodada: 0, fase: -1 }
  });

  game.op2e.combate = {
    estado: () => foundry.utils.deepClone(game.settings.get(OP2E.id, CHAVE)),
    iniciar,
    proximaFase,
    encerrar,
    painel
  };
}

async function gravar(estado) {
  await game.settings.set(OP2E.id, CHAVE, estado);
}

async function anunciar(estado) {
  const chave = OP2E.fases[estado.fase];
  const fase = FASES[chave];
  const conteudo = `
    <div class="op2e chat-item op2e-fase" data-fase="${chave}">
      <h3><i class="fa-solid ${fase.icone}"></i> Rodada ${estado.rodada} — ${fase.nome}</h3>
      <p>${fase.texto}</p>
    </div>`;
  await ChatMessage.create({ speaker: { alias: "Combate" }, content: conteudo });
}

/** Começa um combate: rodada 1, fase de suporte. */
export async function iniciar() {
  if (!game.user.isGM) return;
  const estado = { rodada: 1, fase: 0 };
  await gravar(estado);
  await ChatMessage.create({
    speaker: { alias: "Combate" },
    content: `<div class="op2e chat-item op2e-fase"><h3><i class="fa-solid fa-hand-fist"></i> Combate iniciado</h3><p>Sem iniciativa: em cada rodada, cada personagem age na fase da ação que quiser realizar.</p></div>`
  });
  await anunciar(estado);
}

/** Avança para a próxima fase; depois da fase final, começa uma nova rodada. */
export async function proximaFase() {
  if (!game.user.isGM) return;
  let { rodada, fase } = game.settings.get(OP2E.id, CHAVE);
  if (rodada === 0) return iniciar();
  fase += 1;
  if (fase >= OP2E.fases.length) {
    fase = 0;
    rodada += 1;
  }
  const estado = { rodada, fase };
  await gravar(estado);
  await anunciar(estado);
}

/** Encerra o combate e zera o contador. */
export async function encerrar() {
  if (!game.user.isGM) return;
  const { rodada } = game.settings.get(OP2E.id, CHAVE);
  await gravar({ rodada: 0, fase: -1 });
  await ChatMessage.create({
    speaker: { alias: "Combate" },
    content: `<div class="op2e chat-item op2e-fase"><h3>Combate encerrado</h3><p>${rodada ? `Duração: ${rodada} rodada(s).` : ""}</p></div>`
  });
}

/** Painel simples do mestre (usado pela macro "Combate por Fases"). */
export async function painel() {
  if (!game.user.isGM) {
    ui.notifications.warn("Apenas o mestre conduz as fases do combate.");
    return;
  }
  const { rodada, fase } = game.settings.get(OP2E.id, CHAVE);
  const situacao = rodada
    ? `Rodada <strong>${rodada}</strong> — ${FASES[OP2E.fases[fase]].nome}`
    : "Nenhum combate em andamento.";

  const escolha = await foundry.applications.api.DialogV2.wait({
    window: { title: "Combate por Fases" },
    content: `<p>${situacao}</p>`,
    rejectClose: false,
    buttons: [
      { action: "proxima", label: rodada ? "Próxima fase" : "Iniciar combate", icon: "fa-solid fa-forward", default: true },
      { action: "encerrar", label: "Encerrar combate", icon: "fa-solid fa-flag-checkered" }
    ]
  });

  if (escolha === "proxima") await proximaFase();
  else if (escolha === "encerrar") await encerrar();
}
