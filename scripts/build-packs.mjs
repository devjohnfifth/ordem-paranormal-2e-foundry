import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const origemBase = path.join(raiz, "packs", "_source");
const destinoBase = path.join(raiz, "packs");

const pastas = readdirSync(origemBase, { withFileTypes: true })
  .filter((entrada) => entrada.isDirectory())
  .map((entrada) => entrada.name);

for (const nome of pastas) {
  const origem = path.join(origemBase, nome);
  const destino = path.join(destinoBase, nome);
  if (!existsSync(origem)) continue;
  console.log(`Compilando ${nome}...`);
  await compilePack(origem, destino, { log: true });
}

console.log("Compêndios compilados com sucesso.");
