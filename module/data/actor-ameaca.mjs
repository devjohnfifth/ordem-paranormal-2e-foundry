const { SchemaField, StringField, NumberField, HTMLField } = foundry.data.fields;

/**
 * Ficha simplificada de ameaça/NPC. As regras completas de combate e criaturas
 * ainda não foram publicadas neste playtest, então este tipo fica deliberadamente
 * enxuto até um próximo pacote trazer as regras oficiais.
 */
export default class AmeacaData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      elemento: new StringField({ required: false, initial: "" }),
      notas: new HTMLField(),
      recursos: new SchemaField({
        pv: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 10 })
        })
      })
    };
  }
}
