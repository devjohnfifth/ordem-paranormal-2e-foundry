/**
 * Se o módulo Bar Brawl (barras de recurso do token) estiver ativo, registra um
 * visual padrão pros tipos "personagem" (PV + PD) e "ameaça" (só PV, já que ameaças
 * não têm PD neste playtest): gradiente de cor conforme o valor, e sempre visível
 * (não só ao passar o mouse). Só define o padrão se o mundo ainda não tiver um
 * configurado para aquele tipo -- nunca sobrescreve uma personalização que o mestre
 * já tenha feito.
 *
 * Nota: o Bar Brawl também suporta um modo "subdivisions" que desenha a barra em N
 * segmentos em vez de lisa -- mas ele troca o valor mostrado pela aproximação em N
 * partes (ex.: um PV 18/18 vira "5/5"), então não usamos aqui por padrão: prioriza
 * mostrar o valor real. Quem preferir o visual segmentado pode ligar isso na
 * configuração de cada barra dentro do próprio token.
 */

const BAR_VISIBILITY_ALWAYS = 50;

const BAR_PV = {
  id: "bar1",
  order: 0,
  attribute: "recursos.pv",
  gmVisibility: BAR_VISIBILITY_ALWAYS,
  ownerVisibility: BAR_VISIBILITY_ALWAYS,
  otherVisibility: BAR_VISIBILITY_ALWAYS,
  mincolor: "#7a2f2f",
  maxcolor: "#5fbf5f",
  position: "bottom-inner"
};

const BAR_PD = {
  id: "bar2",
  order: 1,
  attribute: "recursos.pd",
  gmVisibility: BAR_VISIBILITY_ALWAYS,
  ownerVisibility: BAR_VISIBILITY_ALWAYS,
  otherVisibility: BAR_VISIBILITY_ALWAYS,
  mincolor: "#241512",
  maxcolor: "#5fa8d3",
  position: "top-inner"
};

export function registrarBarBrawlPadrao() {
  Hooks.once("ready", async () => {
    if (!game.user.isGM) return;
    if (!game.modules.get("barbrawl")?.active) return;

    const atual = game.settings.get("barbrawl", "defaultTypeResources") ?? {};
    let mudou = false;

    if (!atual.personagem) {
      atual.personagem = { bar1: foundry.utils.deepClone(BAR_PV), bar2: foundry.utils.deepClone(BAR_PD) };
      mudou = true;
    }
    if (!atual.ameaca) {
      atual.ameaca = { bar1: foundry.utils.deepClone(BAR_PV) };
      mudou = true;
    }

    if (mudou) await game.settings.set("barbrawl", "defaultTypeResources", atual);
  });
}
