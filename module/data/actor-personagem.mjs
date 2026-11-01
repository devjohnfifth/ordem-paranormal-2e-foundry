import { OP2E } from "../config.mjs";

const { SchemaField, StringField, NumberField, BooleanField, HTMLField, ArrayField } = foundry.data.fields;

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

function campoRecurso(inicialMax = 0) {
  return new SchemaField({
    value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    max: new NumberField({ required: true, integer: true, min: 0, initial: inicialMax })
  });
}

export default class PersonagemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const pericias = {};
    for (const chave of Object.keys(OP2E.pericias)) {
      if (chave === "aptidao") continue;
      pericias[chave] = campoPericia();
    }

    // Cada campo de Aptidão guarda o dado E se está "ativo" (visível na ficha) separadamente:
    // o jogador pode deixar um campo em d4 e mesmo assim mantê-lo visível (ex.: enquanto decide
    // se vale a pena treinar), sem ele sumir sozinho só porque o dado voltou pro destreinado.
    const camposAptidao = {};
    for (const campo of OP2E.pericias.aptidao.campos) {
      camposAptidao[campo] = new SchemaField({
        dado: campoDado(4),
        ativo: new BooleanField({ required: true, initial: false })
      });
    }
    pericias.aptidao = new SchemaField({ campos: new SchemaField(camposAptidao) });

    const entradaTexto = () =>
      new SchemaField({
        nome: new StringField({ required: true, initial: "" }),
        texto: new StringField({ required: true, initial: "" })
      });

    return {
      /** Qual playtest este personagem segue (define a lista de perícias exibida). */
      edicao: new StringField({ required: true, initial: "alpha", choices: Object.keys(OP2E.edicoes) }),
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
      /** Ocupação (Alpha) / Vocação (Beta). */
      ocupacao: new StringField({ required: true, initial: "" }),
      /** Especialidade da perícia Ofício (ex.: "metalurgia"). */
      oficioEspecialidade: new StringField({ required: true, initial: "" }),
      nivel: new NumberField({ required: true, integer: true, min: 1, max: 10, initial: 1 }),
      patamar: new StringField({ required: true, initial: "iniciante", choices: Object.keys(OP2E.patamares) }),
      nex: new NumberField({ required: true, integer: true, min: 0, max: 100, step: 5, initial: 0 }),
      idade: new NumberField({ required: false, integer: true, min: 0, initial: null, nullable: true }),
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

      /** Barra de Ímpeto (habilidade de perfil do Executor). max=0 significa que o personagem não a possui. */
      impeto: campoRecurso(0),

      /** Marcadores de Análise (habilidade de perfil do Analista, máx. 4). max=0: não possui. */
      analise: campoRecurso(0),

      /**
       * Dado de pavor (medo). `dado` 0 = sem pavor; senão d4-d12. Ao rolar um teste, o dado de pavor
       * anula os resultados menores que ele (ver rolarTeste).
       */
      pavor: new SchemaField({
        dado: new NumberField({ required: true, integer: true, initial: 0, choices: [0, 4, 6, 8, 10, 12] })
      }),

      /**
       * Pontos de armadura. O total vem dos itens equipados (+ `bonus`); `gastos` conta os já usados
       * (cada ponto gasto reduz um dano em 10 e não se recupera neste playtest).
       */
      armadura: new SchemaField({
        bonus: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        gastos: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      /** Relações com outros personagens. grau 0 = neutro, 1 = afinidade, 2 = vínculo, 3 = devoção. */
      relacoes: new ArrayField(
        new SchemaField({
          nome: new StringField({ required: true, initial: "" }),
          grau: new NumberField({ required: true, integer: true, min: 0, max: 3, initial: 0 }),
          sentimento: new StringField({ required: true, initial: "" }),
          descricao: new StringField({ required: true, initial: "" }),
          usada: new BooleanField({ required: true, initial: false })
        })
      ),

      /** Lesões e traumas permanentes (efeitos 10-18 das tabelas) até serem curados. */
      lesoes: new ArrayField(entradaTexto()),
      traumas: new ArrayField(entradaTexto()),

      condicoes: new SchemaField({
        caido: new BooleanField({ required: true, initial: false }),
        atordoado: new BooleanField({ required: true, initial: false }),
        agarrado: new BooleanField({ required: true, initial: false }),
        inconsciente: new BooleanField({ required: true, initial: false }),
        moribundo: new BooleanField({ required: true, initial: false })
      }),

      testesFerimento: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      testesTrauma: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      testesMorte: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
    };
  }

  /** Pontos de armadura: soma dos itens equipados + bônus; `disponiveis` desconta os já gastos. */
  prepareDerivedData() {
    const equipados = (this.parent?.items ?? []).filter(
      (i) => i.type === "item" && i.system.categoria === "armadura" && i.system.equipado
    );
    const dosItens = equipados.reduce((soma, i) => soma + (i.system.armaduraPontos ?? 0), 0);
    this.armadura.total = dosItens + this.armadura.bonus;
    this.armadura.disponiveis = Math.max(0, this.armadura.total - this.armadura.gastos);
  }
}
