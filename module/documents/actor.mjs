import { OP2E } from "../config.mjs";
import { rolarTeste } from "../dice/teste.mjs";

export default class OP2Actor extends Actor {
  /**
   * Rola um teste de perícia usando o atributo-base configurado (ou um atributo alternativo).
   * @param {string} chavePericia  Chave da perícia em OP2E.pericias (ex.: "percepcao").
   * @param {object} [opcoes]
   * @param {string} [opcoes.atributo]   Sobrescreve o atributo-base sugerido pela perícia.
   * @param {string} [opcoes.campo]      Campo de Aptidão, quando `chavePericia === "aptidao"`.
   * @param {number} [opcoes.dt]         Dificuldade do teste.
   */
  async rolarPericia(chavePericia, { atributo, campo, dt } = {}) {
    if (this.type !== "personagem") return null;

    const infoPericia = OP2E.pericias[chavePericia];
    if (!infoPericia) throw new Error(`Perícia desconhecida: ${chavePericia}`);

    const chaveAtributo = atributo ?? infoPericia.atributo;
    const dadoAtributo = this.system.atributos[chaveAtributo]?.dado;

    let dadoPericia;
    let rotuloPericia = game.i18n.localize(`OP2E.Pericia.${chavePericia}`);
    if (chavePericia === "aptidao") {
      if (!campo) throw new Error("É necessário informar o campo de Aptidão.");
      dadoPericia = this.system.pericias.aptidao.campos[campo];
      rotuloPericia += ` (${game.i18n.localize(OP2E.camposAptidao[campo])})`;
    } else {
      dadoPericia = this.system.pericias[chavePericia]?.dado;
    }

    const rotuloAtributo = game.i18n.localize(`OP2E.Atributo.${chaveAtributo}`);
    const flavor = game.i18n.format("OP2E.Chat.Teste", {
      atributo: rotuloAtributo,
      pericia: rotuloPericia
    });

    return rolarTeste({
      dadoAtributo,
      dadoPericia,
      dt,
      flavor,
      actor: this
    });
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
