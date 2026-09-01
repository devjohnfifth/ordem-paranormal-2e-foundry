export const OP2E = {};

OP2E.id = "op2e-playtest";

/** Escala de dados usada por atributos e perícias, do menor ao maior passo. */
OP2E.escalaDados = [4, 6, 8, 10, 12, 20];

/** Passo máximo alcançável por perícias (sem influência paranormal). */
OP2E.dadoMaximoPericia = 12;

/**
 * Opções de dado (4-12) para uso em <select> de perícias. Só o número: o selo já usa uma
 * forma diferente por tamanho de dado (ver op2e.css), então o "d" na frente é redundante.
 */
OP2E.escalaDadosOptions = { 4: "4", 6: "6", 8: "8", 10: "10", 12: "12" };

/** Opções de dado (4-20) para uso em <select> de atributos. */
OP2E.escalaAtributoOptions = { 4: "4", 6: "6", 8: "8", 10: "10", 12: "12", 20: "20" };

OP2E.atributos = {
  fisico: "OP2E.Atributo.fisico",
  mente: "OP2E.Atributo.mente",
  emocao: "OP2E.Atributo.emocao"
};

/**
 * As 20 perícias do playtest. `atributo` é o atributo-base sugerido pelas regras;
 * o mestre pode julgar outro em situações específicas.
 */
OP2E.pericias = {
  acrobacia: { atributo: "fisico" },
  aptidao: { atributo: "mente", campos: ["artes", "atualidades", "burocracia", "exatas", "humanas", "tatica"] },
  atletismo: { atributo: "fisico" },
  crime: { atributo: "fisico" },
  disciplina: { atributo: "emocao" },
  enganacao: { atributo: "emocao" },
  furtividade: { atributo: "fisico" },
  intimidar: { atributo: "emocao" },
  intuicao: { atributo: "emocao" },
  luta: { atributo: "fisico" },
  maquinas: { atributo: "mente" },
  medicina: { atributo: "mente" },
  ocultismo: { atributo: "mente" },
  percepcao: { atributo: "mente" },
  persuasao: { atributo: "emocao" },
  pesquisar: { atributo: "mente" },
  pontaria: { atributo: "fisico" },
  sobrevivencia: { atributo: "mente" },
  tecnologia: { atributo: "mente" },
  vigor: { atributo: "fisico" }
};

OP2E.camposAptidao = {
  artes: "OP2E.Aptidao.artes",
  atualidades: "OP2E.Aptidao.atualidades",
  burocracia: "OP2E.Aptidao.burocracia",
  exatas: "OP2E.Aptidao.exatas",
  humanas: "OP2E.Aptidao.humanas",
  tatica: "OP2E.Aptidao.tatica"
};

OP2E.perfis = {
  executor: "OP2E.Perfil.executor",
  analista: "OP2E.Perfil.analista",
  vigilante: "OP2E.Perfil.vigilante"
};

OP2E.papeis = {
  sobrevivente: "OP2E.Papel.sobrevivente",
  agente: "OP2E.Papel.agente"
};

/** Os cinco elementos paranormais (herdados de Ordem Paranormal 1). */
OP2E.elementos = {
  sangue: "OP2E.Elemento.sangue",
  morte: "OP2E.Elemento.morte",
  conhecimento: "OP2E.Elemento.conhecimento",
  energia: "OP2E.Elemento.energia",
  medo: "OP2E.Elemento.medo"
};

OP2E.dificuldadePadrao = 7;
