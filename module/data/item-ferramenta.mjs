const { SchemaField, StringField, NumberField, BooleanField, HTMLField } = foundry.data.fields;

/** Ferramentas da Ordo Realitas: equipamentos de investigação exclusivos de agentes. */
export default class FerramentaData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      possuiCargas: new BooleanField({ required: true, initial: false }),
      cargas: new SchemaField({
        value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        max: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      elementosDetectados: new StringField({ required: false, initial: "" }),
      descricao: new HTMLField(),
      mecanica: new HTMLField()
    };
  }
}
