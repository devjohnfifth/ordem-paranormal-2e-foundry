const { StringField, HTMLField } = foundry.data.fields;

export default class HabilidadeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      origem: new StringField({
        required: true,
        initial: "perfil",
        choices: ["perfil", "ocupacao", "nivel", "outro"]
      }),
      descricao: new HTMLField()
    };
  }
}
