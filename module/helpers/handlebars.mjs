export function registrarHandlebarsHelpers() {
  Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
  Handlebars.registerHelper("array", (...args) => args.slice(0, -1));
}

export async function preCarregarTemplates() {
  return foundry.applications.handlebars.loadTemplates([
    "systems/op2e-playtest/templates/chat/teste-roll.hbs"
  ]);
}
