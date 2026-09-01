import { OP2E } from "../config.mjs";
import { rolarTeste, passoDado } from "../dice/teste.mjs";

export default class OP2Actor extends Actor {
  /**
   * Rola um teste de perícia usando o atributo-base configurado (ou um atributo alternativo).
   * @param {string} chavePericia  Chave da perícia em OP2E.pericias (ex.: "percepcao").
   * @param {object} [opcoes]
   * @param {string} [opcoes.atributo]     Sobrescreve o atributo-base sugerido pela perícia.
   * @param {string} [opcoes.campo]        Campo de Aptidão, quando `chavePericia === "aptidao"`.
   * @param {number} [opcoes.dt]           Dificuldade do teste.
   * @param {number} [opcoes.passo]        Aumenta (positivo) ou diminui (negativo) o passo dos dados de
   *                                       atributo e perícia antes de rolar (ajuda, vantagens situacionais etc.).
   * @param {number[]} [opcoes.dadosExtras] Tamanhos de dados adicionais a somar ao teste (máx. 4 dados no total).
   */
  async rolarPericia(chavePericia, { atributo, campo, dt, passo = 0, dadosExtras = [] } = {}) {
    if (this.type !== "personagem") return null;

    const infoPericia = OP2E.pericias[chavePericia];
    if (!infoPericia) throw new Error(`Perícia desconhecida: ${chavePericia}`);

    const chaveAtributo = atributo ?? infoPericia.atributo;
    let dadoAtributo = this.system.atributos[chaveAtributo]?.dado;

    let dadoPericia;
    let rotuloPericia = game.i18n.localize(`OP2E.Pericia.${chavePericia}`);
    if (chavePericia === "aptidao") {
      if (!campo) throw new Error("É necessário informar o campo de Aptidão.");
      dadoPericia = this.system.pericias.aptidao.campos[campo]?.dado;
      rotuloPericia += ` (${game.i18n.localize(OP2E.camposAptidao[campo])})`;
    } else {
      dadoPericia = this.system.pericias[chavePericia]?.dado;
    }

    if (passo) {
      dadoAtributo = passoDado(dadoAtributo, passo);
      dadoPericia = passoDado(dadoPericia, passo);
    }

    const rotuloAtributo = game.i18n.localize(`OP2E.Atributo.${chaveAtributo}`);
    const flavor = game.i18n.format("OP2E.Chat.Teste", {
      atributo: rotuloAtributo,
      pericia: rotuloPericia
    });

    const resultado = await rolarTeste({
      dadoAtributo,
      dadoPericia,
      dadosExtras,
      dt,
      flavor,
      actor: this
    });

    if (!resultado.passou) await this.preencherImpeto();

    return resultado;
  }

  /** Ao falhar em um teste, preenche um espaço da barra de Ímpeto (se o personagem tiver essa habilidade). */
  async preencherImpeto() {
    if (this.type !== "personagem") return;
    const { value, max } = this.system.impeto;
    if (max <= 0 || value >= max) return;
    await this.update({ "system.impeto.value": value + 1 });
  }

  /** Gasta espaços preenchidos da barra de Ímpeto para pagar um dos efeitos listados na habilidade Ímpeto. */
  async gastarImpeto(quantidade) {
    if (this.type !== "personagem") return;
    const { value } = this.system.impeto;
    if (value < quantidade) {
      ui.notifications.warn(game.i18n.localize("OP2E.Aviso.ImpetoInsuficiente"));
      return false;
    }
    await this.update({ "system.impeto.value": value - quantidade });
    return true;
  }

  /** Teste de Vigor contra ferimento (0 PV), com DT escalando +3 a cada tentativa. */
  async rolarTesteFerimento() {
    if (this.type !== "personagem") return null;
    const tentativa = this.system.testesFerimento ?? 0;
    const dt = OP2E.dificuldadePadrao + tentativa * 3;
    const resultado = await this.rolarPericia("vigor", { dt });
    await this.update({ "system.testesFerimento": tentativa + 1 });
    return resultado;
  }

  /** Teste de Disciplina contra trauma (0 PD), com DT escalando +3 a cada tentativa. */
  async rolarTesteTrauma() {
    if (this.type !== "personagem") return null;
    const tentativa = this.system.testesTrauma ?? 0;
    const dt = OP2E.dificuldadePadrao + tentativa * 3;
    const resultado = await this.rolarPericia("disciplina", { dt });
    await this.update({ "system.testesTrauma": tentativa + 1 });
    return resultado;
  }
}
