import { OP2E } from "./config.mjs";

import PersonagemData from "./data/actor-personagem.mjs";
import AmeacaData from "./data/actor-ameaca.mjs";
import HabilidadeData from "./data/item-habilidade.mjs";
import FerramentaData from "./data/item-ferramenta.mjs";
import ItemGenericoData from "./data/item-item.mjs";

import OP2Actor from "./documents/actor.mjs";
import OP2Item from "./documents/item.mjs";

import OP2PersonagemSheet from "./sheets/actor-personagem-sheet.mjs";
import OP2AmeacaSheet from "./sheets/actor-ameaca-sheet.mjs";
import OP2ItemSheet from "./sheets/item-sheet.mjs";

import { registrarHandlebarsHelpers, preCarregarTemplates } from "./helpers/handlebars.mjs";
import { registrarMapaColaInterativo } from "./helpers/mapa-cola.mjs";

Hooks.once("init", () => {
  console.log("Ordem Paranormal RPG 2 (Playtest) | Inicializando sistema");

  registrarHandlebarsHelpers();
  preCarregarTemplates();

  game.op2e = { config: OP2E };
  CONFIG.OP2E = OP2E;

  CONFIG.Actor.documentClass = OP2Actor;
  CONFIG.Item.documentClass = OP2Item;

  CONFIG.Actor.dataModels.personagem = PersonagemData;
  CONFIG.Actor.dataModels.ameaca = AmeacaData;
  CONFIG.Item.dataModels.habilidade = HabilidadeData;
  CONFIG.Item.dataModels.ferramenta = FerramentaData;
  CONFIG.Item.dataModels.item = ItemGenericoData;

  const { DocumentSheetConfig } = foundry.applications.apps;

  DocumentSheetConfig.registerSheet(Actor, OP2E.id, OP2PersonagemSheet, {
    types: ["personagem"],
    makeDefault: true,
    label: "OP2E.Sheet.Personagem"
  });
  DocumentSheetConfig.registerSheet(Actor, OP2E.id, OP2AmeacaSheet, {
    types: ["ameaca"],
    makeDefault: true,
    label: "OP2E.Sheet.Ameaca"
  });
  DocumentSheetConfig.registerSheet(Item, OP2E.id, OP2ItemSheet, {
    types: ["habilidade", "ferramenta", "item"],
    makeDefault: true,
    label: "OP2E.Sheet.Item"
  });

  CONFIG.Combat.initiative = { formula: "1d20", decimals: 0 };

  registrarMapaColaInterativo();
});

Hooks.once("ready", () => {
  console.log("Ordem Paranormal RPG 2 (Playtest) | Sistema pronto");
});
