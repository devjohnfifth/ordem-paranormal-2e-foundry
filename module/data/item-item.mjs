const { NumberField, HTMLField } = foundry.data.fields;

/** Item genérico de inventário (equipamento, pertence, evidência coletada etc.). */
export default class ItemGenericoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      quantidade: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      descricao: new HTMLField(),
      /** Regra mecânica opcional (dano de uma arma improvisada, o que uma chave abre etc.). */
      mecanica: new HTMLField()
    };
  }
}
