import { OP2E } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class OP2PersonagemSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["op2e", "sheet", "actor", "personagem"],
    position: { width: 760, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rolarPericia: OP2PersonagemSheet.#rolarPericia,
      rolarFerimento: OP2PersonagemSheet.#rolarFerimento,
      rolarTrauma: OP2PersonagemSheet.#rolarTrauma,
      gastarImpeto: OP2PersonagemSheet.#gastarImpeto,
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

    // Clique simples: rola na hora, com a DT padrão. Shift+clique: abre o diálogo de opções
    // (DT customizada, aumento/redução de passo, dados extras — "Regras Adicionais de Testes").
    if (!event.shiftKey) {
      await this.actor.rolarPericia(pericia, { campo: campo || undefined });
      return;
    }

    const opcoes = await OP2PersonagemSheet.#abrirDialogoTeste(pericia, campo);
    if (!opcoes) return;
    await this.actor.rolarPericia(pericia, { campo: campo || undefined, ...opcoes });
  }

  /**
   * Diálogo para aplicar as "Regras Adicionais de Testes": DT customizada, aumento/redução de
   * passo (ajuda, vantagens/desvantagens situacionais) e até dois dados extras (máx. 4 dados no total).
   * @returns {Promise<{dt: number, passo: number, dadosExtras: number[]}|null>} `null` se cancelado.
   */
  static async #abrirDialogoTeste(pericia, campo) {
    const rotuloPericia =
      pericia === "aptidao" && campo
        ? `${game.i18n.localize("OP2E.Pericia.aptidao")} (${game.i18n.localize(OP2E.camposAptidao[campo])})`
        : game.i18n.localize(`OP2E.Pericia.${pericia}`);

    const opcoesDado = [0, 4, 6, 8, 10, 12]
      .map((d) => `<option value="${d}">${d === 0 ? game.i18n.localize("OP2E.Dialogo.Teste.Nenhum") : `d${d}`}</option>`)
      .join("");

    const content = `
      <div class="op2e-dialogo-teste">
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.Teste.DT")}</label>
          <input type="number" name="dt" value="${OP2E.dificuldadePadrao}">
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.Teste.Passo")}</label>
          <select name="passo">
            <option value="-2">-2</option>
            <option value="-1">-1</option>
            <option value="0" selected>0</option>
            <option value="1">+1</option>
            <option value="2">+2</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.Teste.DadoExtra")} 1</label>
          <select name="extra1">${opcoesDado}</select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("OP2E.Dialogo.Teste.DadoExtra")} 2</label>
          <select name="extra2">${opcoesDado}</select>
        </div>
      </div>`;

    const dados = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.format("OP2E.Dialogo.Teste.Titulo", { pericia: rotuloPericia }) },
      content,
      rejectClose: false,
      ok: { label: game.i18n.localize("OP2E.Dialogo.Teste.Rolar") }
    });
    if (!dados) return null;

    const dadosExtras = [Number(dados.extra1), Number(dados.extra2)].filter((d) => d > 0);
    return { dt: Number(dados.dt), passo: Number(dados.passo), dadosExtras };
  }

  static async #rolarFerimento() {
    await this.actor.rolarTesteFerimento();
  }

  static async #rolarTrauma() {
    await this.actor.rolarTesteTrauma();
  }

  static async #gastarImpeto() {
    const conteudo = `
      <div class="form-group">
        <label>${game.i18n.localize("OP2E.Dialogo.GastarImpeto.Quantidade")}</label>
        <input type="number" name="quantidade" value="1" min="1" max="${this.actor.system.impeto.max}">
      </div>`;
    const dados = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.localize("OP2E.Dialogo.GastarImpeto.Titulo") },
      content: conteudo,
      rejectClose: false,
      ok: { label: game.i18n.localize("OP2E.Dialogo.GastarImpeto.Confirmar") }
    });
    if (!dados) return;
    await this.actor.gastarImpeto(Number(dados.quantidade));
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
