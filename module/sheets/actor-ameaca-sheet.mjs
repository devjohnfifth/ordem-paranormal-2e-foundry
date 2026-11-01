import { OP2E } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class OP2AmeacaSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["op2e", "sheet", "actor", "ameaca"],
    position: { width: 600, height: 700 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rolarAcao: OP2AmeacaSheet.#rolarAcao,
      descreverAcao: OP2AmeacaSheet.#descreverAcao,
      adicionarAcao: OP2AmeacaSheet.#adicionarAcao,
      removerAcao: OP2AmeacaSheet.#removerAcao,
      adicionarPericia: OP2AmeacaSheet.#adicionarPericia,
      removerPericia: OP2AmeacaSheet.#removerPericia,
      aplicarDano: OP2AmeacaSheet.#aplicarDano,
      definirRecurso: OP2AmeacaSheet.#definirRecurso
    }
  };

  static PARTS = {
    form: { template: "systems/op2e-playtest/templates/actor/ameaca-sheet.hbs", scrollable: [".op2e-corpo"] }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.config = OP2E;
    context.periciasOpcoes = Object.fromEntries(
      Object.keys(OP2E.pericias)
        .filter((c) => c !== "aptidao")
        .map((c) => [c, game.i18n.localize(`OP2E.Pericia.${c}`)])
    );
    context.periciasOpcoesAcao = { "": "—", ...context.periciasOpcoes };
    context.categorias = { ataque: "Ataque", habilidade: "Habilidade" };
    context.alcances = { corpo: "Corpo a corpo", distancia: "À distância", nenhum: "—" };
    return context;
  }

  static async #rolarAcao(event, target) {
    const indice = Number(target.closest("[data-indice]").dataset.indice);
    if (!event.shiftKey) return this.actor.rolarAcao(indice);
    const dados = await foundry.applications.api.DialogV2.input({
      window: { title: "Opções do teste" },
      content: `
        <div class="form-group"><label>Dificuldade (DT)</label><input type="number" name="dt" value="${OP2E.dificuldadePadrao}"></div>
        <div class="form-group"><label>Aumento/redução de passo</label>
          <select name="passo"><option value="-2">-2</option><option value="-1">-1</option><option value="0" selected>0</option><option value="1">+1</option><option value="2">+2</option></select></div>`,
      rejectClose: false,
      ok: { label: "Rolar" }
    });
    if (!dados) return;
    return this.actor.rolarAcao(indice, { dt: Number(dados.dt), passo: Number(dados.passo) });
  }

  static async #descreverAcao(event, target) {
    const indice = Number(target.closest("[data-indice]").dataset.indice);
    const acao = this.actor.system.acoes[indice];
    if (!acao) return;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="op2e chat-item"><h3>${foundry.utils.escapeHTML(this.actor.name)}: ${foundry.utils.escapeHTML(acao.nome)}</h3><p>${foundry.utils.escapeHTML(acao.descricao)}</p></div>`
    });
  }

  static async #adicionarAcao() {
    const acoes = foundry.utils.deepClone(this.actor.system.acoes);
    acoes.push({ nome: "Nova ação", categoria: "ataque", alcance: "corpo", atributo: "fisico", pericia: "luta", danoMod: null, descricao: "" });
    await this.actor.update({ "system.acoes": acoes });
  }

  static async #removerAcao(event, target) {
    const indice = Number(target.closest("[data-indice]").dataset.indice);
    const acoes = foundry.utils.deepClone(this.actor.system.acoes);
    acoes.splice(indice, 1);
    await this.actor.update({ "system.acoes": acoes });
  }

  static async #adicionarPericia() {
    const pericias = foundry.utils.deepClone(this.actor.system.pericias);
    const usadas = new Set(pericias.map((p) => p.chave));
    const livre = Object.keys(OP2E.pericias).find((c) => c !== "aptidao" && !usadas.has(c));
    if (!livre) return;
    pericias.push({ chave: livre, dado: 6 });
    await this.actor.update({ "system.pericias": pericias });
  }

  static async #removerPericia(event, target) {
    const indice = Number(target.closest("[data-indice]").dataset.indice);
    const pericias = foundry.utils.deepClone(this.actor.system.pericias);
    pericias.splice(indice, 1);
    await this.actor.update({ "system.pericias": pericias });
  }

  static async #aplicarDano() {
    const dados = await foundry.applications.api.DialogV2.input({
      window: { title: "Aplicar dano" },
      content: `
        <div class="form-group"><label>Dano (antes da RD)</label><input type="number" name="dano" value="1" min="0"></div>
        <div class="form-group"><label>RD ignorada</label><input type="number" name="ignora" value="0" min="0"></div>`,
      rejectClose: false,
      ok: { label: "Aplicar" }
    });
    if (!dados) return;
    await this.actor.aplicarDano(Number(dados.dano), { ignoraRD: Number(dados.ignora) });
  }

  static async #definirRecurso(event, target) {
    const valor = Number(target.dataset.valor);
    const atual = this.actor.system.recursos.pv.value;
    await this.actor.update({ "system.recursos.pv.value": atual === valor ? valor - 1 : valor });
  }
}
