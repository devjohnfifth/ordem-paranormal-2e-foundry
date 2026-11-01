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
  animais: { atributo: "emocao" },
  aptidao: {
    atributo: "mente",
    campos: [
      "artes", "atualidades", "burocracia", "exatas", "humanas", "tatica",
      "erudicao", "folclore", "guerra", "nobreza", "religiao"
    ]
  },
  atletismo: { atributo: "fisico" },
  crime: { atributo: "fisico" },
  disciplina: { atributo: "emocao" },
  enganacao: { atributo: "emocao" },
  furtividade: { atributo: "fisico" },
  inspecionar: { atributo: "mente" },
  intimidar: { atributo: "emocao" },
  intuicao: { atributo: "emocao" },
  luta: { atributo: "fisico" },
  maquinas: { atributo: "mente" },
  medicina: { atributo: "mente" },
  ocultismo: { atributo: "mente" },
  oficio: { atributo: "mente" },
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
  tatica: "OP2E.Aptidao.tatica",
  erudicao: "OP2E.Aptidao.erudicao",
  folclore: "OP2E.Aptidao.folclore",
  guerra: "OP2E.Aptidao.guerra",
  nobreza: "OP2E.Aptidao.nobreza",
  religiao: "OP2E.Aptidao.religiao"
};

/**
 * O Playtest Beta (Irlanda medieval) troca parte da lista de perícias e dos campos de Aptidão.
 * Cada ator escolhe a sua `edicao`: a ficha mostra só as perícias daquela edição, mas todos os
 * dados ficam guardados (trocar de edição não apaga nada).
 */
OP2E.edicoes = {
  alpha: "OP2E.Edicao.alpha",
  beta: "OP2E.Edicao.beta"
};

OP2E.colunasPericias = {
  alpha: {
    fisico: ["acrobacia", "atletismo", "crime", "furtividade", "luta", "pontaria", "vigor"],
    mente: ["maquinas", "medicina", "ocultismo", "percepcao", "pesquisar", "sobrevivencia", "tecnologia"],
    emocao: ["disciplina", "enganacao", "intimidar", "intuicao", "persuasao"]
  },
  beta: {
    fisico: ["acrobacia", "atletismo", "crime", "furtividade", "luta", "pontaria", "vigor"],
    mente: ["inspecionar", "medicina", "ocultismo", "oficio", "percepcao", "sobrevivencia"],
    emocao: ["animais", "disciplina", "enganacao", "intimidar", "intuicao", "persuasao"]
  }
};

OP2E.aptidaoPorEdicao = {
  alpha: ["artes", "atualidades", "burocracia", "exatas", "humanas", "tatica"],
  beta: ["artes", "erudicao", "folclore", "guerra", "nobreza", "religiao"]
};

/** Patamares do Beta; o bônus é somado nas tabelas de lesão e trauma. */
OP2E.patamares = {
  iniciante: "OP2E.Patamar.iniciante",
  veterano: "OP2E.Patamar.veterano",
  elite: "OP2E.Patamar.elite",
  lenda: "OP2E.Patamar.lenda"
};
OP2E.patamarBonus = { iniciante: 0, veterano: 1, elite: 2, lenda: 3 };

/** Fases de uma rodada de combate (Beta). */
OP2E.fases = ["suporte", "distancia", "corpo", "final"];

/** Graus de relação: dado de bônus ao invocar e demais benefícios. */
OP2E.grausRelacao = {
  1: { nome: "Afinidade", dado: 6, motivar: null, acaoExtra: false },
  2: { nome: "Vínculo", dado: 8, motivar: "2d4", acaoExtra: false },
  3: { nome: "Devoção", dado: 12, motivar: "2d6", acaoExtra: true }
};

/**
 * Tabela de Lesões (teste de lesão falho). Rola-se 1d20 + bônus do patamar.
 * `efeito` é aplicado automaticamente por OP2Actor#aplicarEfeito.
 */
OP2E.tabelaLesoes = [
  { de: -99, ate: 4, nome: "Morte Súbita", texto: "Você morre! Hora de criar um personagem novo.", efeito: "morte" },
  { de: 5, ate: 9, nome: "Morte Lenta", texto: "O ferimento é fatal, mas gera um surto de adrenalina que permite agir uma última vez. Você recupera 1 PV e, se estava inconsciente, acorda, podendo agir na rodada seguinte. Ao fim dela, você morre. Nenhum efeito pode impedir isso.", efeito: "morteLenta" },
  { de: 10, ate: 10, nome: "Laceração Profunda", texto: "Uma ferida que reduz sua capacidade física. Perde 2 PV (permanente; os efeitos se acumulam).", efeito: "maxPv-2", permanente: true },
  { de: 11, ate: 11, nome: "Sem Olho", texto: "Você perde o uso de um olho. Sofre –1 em Percepção e Pontaria.", permanente: true },
  { de: 12, ate: 12, nome: "Sem Mão", texto: "Você perde o uso de uma mão ou braço. Só pode empunhar um item e, em tarefas que precisam das duas mãos, sofre uma redução de passo ou falha automaticamente, a critério do mestre.", permanente: true },
  { de: 13, ate: 13, nome: "Sem Pé", texto: "Você perde o uso de um pé ou perna. Sofre duas reduções de passo em testes da ação movimentar-se e em testes de perseguição a pé.", permanente: true },
  { de: 14, ate: 14, nome: "Tendão Comprometido", texto: "Sofre –2 em Acrobacia.", permanente: true },
  { de: 15, ate: 15, nome: "Músculo Comprometido", texto: "Sofre –2 em Atletismo.", permanente: true },
  { de: 16, ate: 16, nome: "Órgão Interno Comprometido", texto: "Sofre –2 em Vigor.", permanente: true },
  { de: 17, ate: 17, nome: "Órgão Sensorial Comprometido", texto: "Sofre –2 em Percepção.", permanente: true },
  { de: 18, ate: 18, nome: "Cicatriz Assustadora", texto: "Sofre –2 em Persuasão, mas recebe +1 em Intimidar.", permanente: true },
  { de: 19, ate: 19, nome: "Contusão", texto: "Reduz seu Físico em um passo até o fim da cena." },
  { de: 20, ate: 99, nome: "Surto de Adrenalina", texto: "O ferimento não deixa sequelas e causa um surto de adrenalina: você recupera 1 PV!", efeito: "pv+1" }
];

/** Tabela de Traumas (teste de trauma falho). Rola-se 1d20 + bônus do patamar. */
OP2E.tabelaTraumas = [
  { de: -99, ate: 4, nome: "Colapso Total", texto: "Sua mente sucumbe perante o horror. Seu corpo continua vivo, mas torna-se uma casca oca… Hora de criar um novo personagem.", efeito: "morte" },
  { de: 5, ate: 6, nome: "Transtorno de Estresse Pós-Traumático", texto: "Sempre que você sofre dano emocional, aumenta esse dano em +1.", permanente: true },
  { de: 7, ate: 8, nome: "Degradação Cognitiva", texto: "O medo corrói sua capacidade de raciocínio. Sofre –1 em Mente.", permanente: true },
  { de: 9, ate: 10, nome: "Mácula Psíquica", texto: "Sua visão de mundo se torna mais cinzenta. Sofre –1 em Emoção.", permanente: true },
  { de: 11, ate: 12, nome: "Chaga da Alma", texto: "Algo em seu espírito se quebra. Perde 2 PD.", efeito: "pd-2" },
  { de: 13, ate: 14, nome: "Retração Defensiva", texto: "O trauma faz você se retrair e evitar contatos sociais. Sofre –2 em Persuasão e Intuição.", permanente: true },
  { de: 15, ate: 17, nome: "Pânico", texto: "Recebe um dado de pavor.", efeito: "pavor" },
  { de: 18, ate: 19, nome: "Estupor Catatônico", texto: "Perde sua ação na próxima rodada." },
  { de: 20, ate: 99, nome: "Injeção de Ânimo", texto: "O trauma não deixa sequelas e causa uma injeção de ânimo: você recupera 1 PD!", efeito: "pd+1" }
];

/** Tabela de Falhas Críticas (1d8). */
OP2E.tabelaFalhasCriticas = [
  { nome: "Vexame", texto: "O jogador descreve a ação de forma vergonhosa. Sem efeito em regras." },
  { nome: "Machucado", texto: "Seu Físico diminui em um passo até o fim da cena." },
  { nome: "Desatenção", texto: "Sua Mente diminui em um passo até o fim da cena." },
  { nome: "Irritação", texto: "Sua Emoção diminui em um passo até o fim da cena." },
  { nome: "Acidente", texto: "Você perde 1d4 PV." },
  { nome: "Frustração", texto: "Você perde 1d4 PD." },
  { nome: "Perda", texto: "Um item que você carrega (ou espaço de compra) se perde." },
  { nome: "Nenhum efeito adicional", texto: "Nada mais acontece." }
];

OP2E.perfis = {
  executor: "OP2E.Perfil.executor",
  analista: "OP2E.Perfil.analista",
  vigilante: "OP2E.Perfil.vigilante"
};

OP2E.papeis = {
  sobrevivente: "OP2E.Papel.sobrevivente",
  agente: "OP2E.Papel.agente",
  escolhido: "OP2E.Papel.escolhido"
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
