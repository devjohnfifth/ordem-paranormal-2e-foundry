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
}

export async function preCarregarTemplates() {
  return foundry.applications.handlebars.loadTemplates([
    "systems/op2e-playtest/templates/chat/teste-roll.hbs"
  ]);
}
