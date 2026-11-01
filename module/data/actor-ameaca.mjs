import { OP2E } from "../config.mjs";

const { SchemaField, StringField, NumberField, HTMLField, ArrayField } = foundry.data.fields;

function campoDado(inicial = 4) {
  return new NumberField({ required: true, integer: true, initial: inicial, choices: OP2E.escalaDados });
}

/**
 * Ficha de ameaça (criaturas e NPCs). No Playtest Beta uma criatura é descrita por atributos (d4–d20),
 * algumas perícias, PV, redução de dano (RD) e uma lista de ações. Um teste de ação rola o dado do
 * atributo e o da perícia (como os personagens); o dano de um ataque é RA + modificador.
 */
export default class AmeacaData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      elemento: new StringField({ required: false, initial: "" }),
      /** Descrição curta exibida no cabeçalho (ex.: "criatura, Morte"). */
      tipo: new StringField({ required: true, initial: "" }),
      notas: new HTMLField(),
      recursos: new SchemaField({
        pv: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 10 })
        })
      }),
      /** Redução de dano: valor subtraído de cada dano sofrido (0 = nenhuma). */
      rd: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      atributos: new SchemaField({
        fisico: new SchemaField({ dado: campoDado(6) }),
        mente: new SchemaField({ dado: campoDado(4) }),
        emocao: new SchemaField({ dado: campoDado(4) })
      }),
      /** Só as perícias relevantes da criatura (as demais contam como d4). */
      pericias: new ArrayField(
        new SchemaField({
          chave: new StringField({ required: true, initial: "luta", choices: Object.keys(OP2E.pericias) }),
          dado: campoDado(6)
        })
      ),
      acoes: new ArrayField(
        new SchemaField({
          nome: new StringField({ required: true, initial: "" }),
          categoria: new StringField({ required: true, initial: "ataque", choices: ["ataque", "habilidade"] }),
          alcance: new StringField({ required: true, initial: "corpo", choices: ["corpo", "distancia", "nenhum"] }),
          atributo: new StringField({ required: true, initial: "fisico", choices: Object.keys(OP2E.atributos) }),
          /** Perícia do teste ("" = a ação não faz teste de dados). */
          pericia: new StringField({ required: true, initial: "luta" }),
          /** Dano = RA + este valor (vazio/-99 = a ação não causa dano direto). */
          danoMod: new NumberField({ required: false, integer: true, initial: null, nullable: true }),
          descricao: new StringField({ required: true, initial: "" })
        })
      ),
      condicoes: new SchemaField({
        atordoado: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        caido: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      })
    };
  }
}
