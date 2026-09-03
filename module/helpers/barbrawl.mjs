/**
 * Se o módulo Bar Brawl (barras de recurso do token) estiver ativo, registra um
 * visual padrão elegante para os tipos "personagem" (PV + PD, com 5 divisões
 * marcando visualmente a quantidade, em vez de uma barra lisa) e "ameaça" (só
 * PV, já que ameaças não têm PD neste playtest). Só define o padrão se o mundo
 * ainda não tiver um configurado para aquele tipo -- nunca sobrescreve uma
 * personalização que o mestre já tenha feito.
 */

const BAR_PV = {
  id: "bar1",
  order: 0,
  attribute: "recursos.pv",
  visibility: 20, // OWNER_HOVER
  mincolor: "#7a2f2f",
  maxcolor: "#5fbf5f",
  position: "bottom-inner",
  subdivisions: 5,
  subdivisionsOwner: true
};

const BAR_PD = {
  id: "bar2",
  order: 1,
  attribute: "recursos.pd",
  visibility: 20,
  mincolor: "#241512",
  maxcolor: "#5fa8d3",
  position: "top-inner",
  subdivisions: 5,
  subdivisionsOwner: true
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
