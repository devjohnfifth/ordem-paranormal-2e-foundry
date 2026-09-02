export function registrarHandlebarsHelpers() {
  Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
  Handlebars.registerHelper("array", (...args) => args.slice(0, -1));

  // Registrados por conta própria (em vez de assumir que o core do Foundry já os tem),
  // para evitar erros de "Missing helper" ao renderizar as fichas.
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("ne", (a, b) => a !== b);
  Handlebars.registerHelper("gt", (a, b) => a > b);
  Handlebars.registerHelper("gte", (a, b) => a >= b);
  Handlebars.registerHelper("lt", (a, b) => a < b);
  Handlebars.registerHelper("lte", (a, b) => a <= b);
  Handlebars.registerHelper("and", (...args) => args.slice(0, -1).every(Boolean));
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("not", (a) => !a);

  // Gera um array [0, 1, ..., n-1] -- usado para desenhar as barras de PV/PD/Ímpeto em
  // "pips" (um quadradinho por ponto), com {{#each (range max) as |i|}}.
  Handlebars.registerHelper("range", (n) => Array.from({ length: Math.max(0, Number(n) || 0) }, (_, i) => i));
  Handlebars.registerHelper("inc", (n) => Number(n) + 1);

  // Primeira letra maiúscula de uma string -- usada no selo da habilidade de Perfil
  // (Executor="E", Analista="A", Vigilante="V").
  Handlebars.registerHelper("primeiraLetra", (s) => (typeof s === "string" && s ? s.charAt(0).toUpperCase() : ""));
}

export async function preCarregarTemplates() {
  return foundry.applications.handlebars.loadTemplates([
    "systems/op2e-playtest/templates/chat/teste-roll.hbs"
  ]);
}
