/**
 * Pontos clicáveis do mapa-cola (compêndio Compêndio da Ordem > pasta "Pontos de
 * Interesse — Ato I" > página "Mapa-Cola — Legenda").
 *
 * Por quê isso é JS em vez de HTML salvo no próprio Journal: o Foundry sanitiza o
 * HTML de campos HTMLField (proteção contra XSS), removendo atributos e/ou
 * estruturas que não fazem parte do que o editor de página reconhece. Um overlay
 * de 24 <a> posicionados por style/data-attribute salvo direto no texto da página
 * não sobrevivia a isso -- os hotspots perdiam a posição (ou o link) e o clique
 * caía na <img> por baixo, abrindo o popout de imagem do próprio Foundry. A
 * solução: a página guarda só uma <img class="op2e-mapa-cola-img"> pura, e este
 * hook monta os 24 pontos clicáveis via DOM, ao vivo, toda vez que a página
 * renderiza -- nada disso passa por serialização/sanitização.
 */

// Posição (% da largura/altura da imagem inteira) de cada número, extraída do
// texto vetorial real do PDF oficial (não estimada à mão). Gerado por
// scripts Python (ver scratchpad da sessão) a partir das mesmas coordenadas
// usadas para conferir os pontos de interesse -- se o mapa-cola for
// re-renderizado a partir do PDF de novo, regenere esta tabela junto.
const MAPA_COLA_POSICOES = {
  1: [40.24, 7.59], 2: [57.34, 13.23], 3: [48.07, 13.63], 4: [40.35, 17.95],
  5: [54.29, 26.48], 6: [26.56, 31.97], 7: [18.24, 23.82], 8: [9.94, 8.27],
  9: [25.12, 52.35], 10: [30.87, 54.44], 11: [75.02, 50.67], 12: [19.59, 4.92],
  13: [5.58, 15.58], 14: [5.70, 43.60], 15: [68.69, 40.75], 16: [11.12, 54.01],
  17: [17.89, 14.19], 18: [81.66, 41.83], 19: [75.58, 23.05], 20: [85.54, 21.55],
  21: [69.22, 28.57], 22: [74.83, 4.65], 23: [86.95, 10.96], 24: [81.81, 14.94]
};

const NOME_JOURNAL_PORAO = "O Porão (Ato I)";
const NOME_JOURNAL_SALA = "A Sala Secreta (Ato I)";
const PADRAO_NUMERO = /^(\d{2}) /;

// Cache do mapa {numero: {pack, journalId, pageId}} -- montado uma vez por sessão de
// cliente, não a cada abertura da página (evita reconsultar o compêndio toda hora).
let _cachePromise = null;

async function construirMapaNumeroParaPagina(pack) {
  const compendio = game.packs.get(pack);
  if (!compendio) return {};

  const index = await compendio.getIndex();
  const entradaPorao = index.find((e) => e.name === NOME_JOURNAL_PORAO);
  const entradaSala = index.find((e) => e.name === NOME_JOURNAL_SALA);
  const mapa = {};

  for (const entrada of [entradaPorao, entradaSala]) {
    if (!entrada) continue;
    const journal = await compendio.getDocument(entrada._id);
    for (const pagina of journal.pages) {
      const m = pagina.name.match(PADRAO_NUMERO);
      if (m) {
        mapa[Number(m[1])] = { journalId: journal.id, pageId: pagina.id };
      }
    }
  }
  return mapa;
}

function montarPontosClicaveis(img, mapaNumeros, pack) {
  if (img.dataset.op2eMapaColaPronto) return;
  img.dataset.op2eMapaColaPronto = "true";

  const container = document.createElement("div");
  container.className = "op2e-mapa-cola-container";
  img.replaceWith(container);
  container.appendChild(img);

  for (const [numeroStr, [left, top]] of Object.entries(MAPA_COLA_POSICOES)) {
    const numero = Number(numeroStr);
    const alvo = mapaNumeros[numero];
    if (!alvo) continue;

    const ponto = document.createElement("a");
    ponto.className = "op2e-mapa-cola-ponto";
    ponto.style.left = `${left}%`;
    ponto.style.top = `${top}%`;
    ponto.title = `Ponto ${String(numero).padStart(2, "0")}`;
    ponto.addEventListener("click", async (event) => {
      event.preventDefault();
      // Abre o JournalEntry (não a página sozinha): o sheet da página isolada
      // reabre no último modo usado (geralmente edição, já que este é o
      // conteúdo que a gente mexeu o tempo todo), enquanto o "livro" do
      // JournalEntry sempre abre em modo de leitura e tem goToPage() para
      // virar direto pra pagina certa -- é o mesmo comportamento de clicar
      // num link comum @UUID[...] pra uma pagina de Journal.
      const journal = await fromUuid(`Compendium.${pack}.JournalEntry.${alvo.journalId}`);
      if (!journal) return;
      const app = await journal.sheet.render(true);
      (app ?? journal.sheet).goToPage?.(alvo.pageId);
    });
    container.appendChild(ponto);
  }
}

export function registrarMapaColaInterativo() {
  Hooks.on("renderJournalEntryPageTextSheet", async (app, htmlOuElemento) => {
    const raiz = htmlOuElemento instanceof HTMLElement ? htmlOuElemento : htmlOuElemento?.[0];
    const img = raiz?.querySelector?.("img.op2e-mapa-cola-img");
    if (!img) return;

    const pack = app.document?.pack;
    if (!pack) return; // só faz sentido dentro do compêndio Compêndio da Ordem

    if (!_cachePromise) _cachePromise = construirMapaNumeroParaPagina(pack);
    const mapaNumeros = await _cachePromise;
    montarPontosClicaveis(img, mapaNumeros, pack);
  });
}
