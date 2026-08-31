import { OP2E } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class OP2PersonagemSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["op2e", "sheet", "actor", "personagem"],
    position: { width: 680, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rolarPericia: OP2PersonagemSheet.#rolarPericia,
      rolarFerimento: OP2PersonagemSheet.#rolarFerimento,
      rolarTrauma: OP2PersonagemSheet.#rolarTrauma,
      itemCriar: OP2PersonagemSheet.#itemCriar,
      itemEditar: OP2PersonagemSheet.#itemEditar,
      itemExcluir: OP2PersonagemSheet.#itemExcluir,
      itemUsar: OP2PersonagemSheet.#itemUsar
    }
  };

  static PARTS = {
    form: { template: "systems/op2e-playtest/templates/actor/personagem-sheet.hbs", scrollable: [".op2e-corpo"] }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.config = OP2E;
    context.habilidades = this.actor.items.filter((i) => i.type === "habilidade");
    context.ferramentas = this.actor.items.filter((i) => i.type === "ferramenta");
    context.itens = this.actor.items.filter((i) => i.type === "item");
    return context;
  }

  static async #rolarPericia(event, target) {
    const { pericia, campo } = target.dataset;
    await this.actor.rolarPericia(pericia, { campo: campo || undefined });
  }

  static async #rolarFerimento() {
    await this.actor.rolarTesteFerimento();
  }

  static async #rolarTrauma() {
    await this.actor.rolarTesteTrauma();
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
