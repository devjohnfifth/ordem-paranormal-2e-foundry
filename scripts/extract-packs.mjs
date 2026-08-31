import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const origemBase = path.join(raiz, "packs");
const destinoBase = path.join(raiz, "packs", "_source");

/** Gera um nome de arquivo kebab-case estável a partir do nome do documento, sem depender
 *  do sanitizador padrão da CLI (que não lida bem com acentos do português). */
const MARCAS_DIACRITICAS = new RegExp("[̀-ͯ]", "g");

function nomeArquivo(doc) {
  const base = doc.name ?? doc._id;
  const slug = base
    .normalize("NFD")
    .replace(MARCAS_DIACRITICAS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || doc._id}.json`;
}

const nomesDosPacks = JSON.parse(await readFile(path.join(raiz, "system.json"), "utf-8")).packs.map((p) => p.name);

for (const nome of nomesDosPacks) {
  const origem = path.join(origemBase, nome);
  const destino = path.join(destinoBase, nome);
  if (!existsSync(origem)) continue;
  console.log(`Extraindo ${nome}...`);
  await extractPack(origem, destino, { log: true, clean: true, transformName: nomeArquivo });
}

console.log("Compêndios extraídos de volta para packs/_source.");
