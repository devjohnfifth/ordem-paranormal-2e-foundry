const { NumberField, StringField, BooleanField, HTMLField } = foundry.data.fields;

/**
 * Item genérico de inventário: equipamento, pertence, evidência coletada e, no Playtest Beta,
 * armas e armaduras com regras próprias.
 */
export default class ItemGenericoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      quantidade: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      descricao: new HTMLField(),
      /** Regra mecânica opcional (dano de uma arma improvisada, o que uma chave abre etc.). */
      mecanica: new HTMLField(),

      categoria: new StringField({
        required: true,
        initial: "comum",
        choices: ["comum", "arma", "armadura", "consumivel"]
      }),
      equipado: new BooleanField({ required: true, initial: false }),

      /** Armas: corpo a corpo usa Luta; à distância usa Pontaria. Dano = RA + `danoMod`. */
      alcance: new StringField({ required: true, initial: "corpo", choices: ["corpo", "distancia"] }),
      danoMod: new NumberField({ required: true, integer: true, initial: 0 }),
      /** Bônus (positivo) ou penalidade (negativo) em passos nos testes de ataque com a arma. */
      passoAtaque: new NumberField({ required: true, integer: true, initial: 0 }),
      /** Pontos de redução de dano (RD) do alvo que o ataque ignora. */
      ignoraRD: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      /** Valor mínimo (nos dados) para dois dados iguais contarem como sucesso crítico com esta arma. */
      criticoMin: new NumberField({ required: true, integer: true, min: 2, max: 20, initial: 6 }),

      /** Armaduras: pontos de armadura fornecidos enquanto equipada. */
      armaduraPontos: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      /** Texto livre dos efeitos colaterais (ex.: "reduz Furtividade em um passo"). */
      restricao: new StringField({ required: true, initial: "" })
    };
  }
}
