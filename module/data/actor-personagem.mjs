import { OP2E } from "../config.mjs";

const { SchemaField, StringField, NumberField, HTMLField } = foundry.data.fields;

function campoDado(inicial = 4) {
  return new NumberField({
    required: true,
    integer: true,
    initial: inicial,
    choices: OP2E.escalaDados
  });
}

function campoPericia() {
  return new SchemaField({ dado: campoDado(4) });
}

export default class PersonagemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const pericias = {};
    for (const chave of Object.keys(OP2E.pericias)) {
      if (chave === "aptidao") continue;
      pericias[chave] = campoPericia();
    }

    const camposAptidao = {};
    for (const campo of OP2E.pericias.aptidao.campos) {
      camposAptidao[campo] = campoDado(4);
    }
    pericias.aptidao = new SchemaField({ campos: new SchemaField(camposAptidao) });

    return {
      papel: new StringField({
        required: true,
        initial: "sobrevivente",
        choices: Object.keys(OP2E.papeis)
      }),
      perfil: new StringField({
        required: true,
        initial: "executor",
        choices: Object.keys(OP2E.perfis)
      }),
      ocupacao: new StringField({ required: true, initial: "" }),
      nivel: new NumberField({ required: true, integer: true, min: 1, max: 10, initial: 1 }),
      nex: new NumberField({ required: true, integer: true, min: 0, max: 100, step: 5, initial: 0 }),
      biografia: new HTMLField(),

      atributos: new SchemaField({
        fisico: new SchemaField({ dado: campoDado(6) }),
        mente: new SchemaField({ dado: campoDado(6) }),
        emocao: new SchemaField({ dado: campoDado(6) })
      }),

      pericias: new SchemaField(pericias),

      recursos: new SchemaField({
        pv: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 10 })
        }),
        pd: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 10 })
        })
      }),

      testesFerimento: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      testesTrauma: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
    };
  }
}
