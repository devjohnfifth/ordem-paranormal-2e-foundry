import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// O sistema só existe em português. Mas o Foundry escolhe qual arquivo de idioma carregar
// com base na configuração de idioma da instância/mundo, que pode estar em outro valor
// (ex.: "en", padrão de muitas instalações). Para garantir que o conteúdo apareça em
// português *independente* dessa configuração, espelhamos pt-BR.json também como en.json.
const fonte = path.join(raiz, "lang", "pt-BR.json");
const destino = path.join(raiz, "lang", "en.json");

const conteudo = readFileSync(fonte, "utf-8");
writeFileSync(destino, conteudo, "utf-8");

console.log("lang/en.json sincronizado a partir de lang/pt-BR.json.");
