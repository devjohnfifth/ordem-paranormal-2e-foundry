/**
 * Pontos clicáveis do mapa-cola (compêndio Compêndio da Ordem > pastas "Pontos
 * de Interesse — Ato I/II" > páginas "Mapa-Cola — Legenda").
 *
 * Por quê isso é JS em vez de HTML salvo no próprio Journal: o Foundry sanitiza o
 * HTML de campos HTMLField (proteção contra XSS), removendo atributos e/ou
 * estruturas que não fazem parte do que o editor de página reconhece. Um overlay
 * de <a> posicionados por style/data-attribute salvo direto no texto da página
 * não sobrevivia a isso -- os hotspots perdiam a posição (ou o link) e o clique
 * caía na <img> por baixo, abrindo o popout de imagem do próprio Foundry. A
 * solução: a página guarda só uma <img class="op2e-mapa-cola-img"> pura, e este
 * hook monta os pontos clicáveis via DOM, ao vivo, toda vez que a página
 * renderiza -- nada disso passa por serialização/sanitização.
 *
 * Suporta múltiplos mapas (um por ato) selecionados pelo atributo
 * data-op2e-mapa="ato1"/"ato2" na própria <img>. Cada mapa tem sua tabela de
 * posições (% da largura/altura da imagem inteira, extraída do texto vetorial
 * real do PDF oficial -- não estimada à mão) e a lista de journals do
 * compêndio "Compêndio da Ordem" de onde os números das páginas são lidos.
 * Um mesmo número pode ter mais de uma posição no mapa (ex.: os 4 pôsteres do
 * Ato II compartilham o número 17) -- todas abrem a mesma página.
 */
const MAPAS = {
  ato1: {
    journais: ["O Porão (Ato I)", "A Sala Secreta (Ato I)"],
    posicoes: {
      1: [[40.24, 7.59]], 2: [[57.34, 13.23]], 3: [[48.07, 13.63]], 4: [[40.35, 17.95]],
      5: [[54.29, 26.48]], 6: [[26.56, 31.97]], 7: [[18.24, 23.82]], 8: [[9.94, 8.27]],
      9: [[25.12, 52.35]], 10: [[30.87, 54.44]], 11: [[75.02, 50.67]], 12: [[19.59, 4.92]],
      13: [[5.58, 15.58]], 14: [[5.70, 43.60]], 15: [[68.69, 40.75]], 16: [[11.12, 54.01]],
      17: [[17.89, 14.19]], 18: [[81.66, 41.83]], 19: [[75.58, 23.05]], 20: [[85.54, 21.55]],
      21: [[69.22, 28.57]], 22: [[74.83, 4.65]], 23: [[86.95, 10.96]], 24: [[81.81, 14.94]],
    },
  },
  ato2: {
    journais: ["O Porão (Ato II)"],
    posicoes: {
      1: [[16.69, 27.41]], 2: [[16.69, 31.30]], 3: [[16.69, 35.39]], 4: [[16.69, 39.21]],
      5: [[16.69, 43.06]], 6: [[33.62, 12.72]], 7: [[28.53, 12.72]], 8: [[26.48, 32.27]],
      9: [[25.15, 24.65]], 10: [[40.29, 6.17]], 11: [[57.32, 12.21]], 12: [[57.69, 5.82]],
      13: [[40.38, 17.26]], 14: [[54.28, 26.41]], 15: [[10.09, 6.89]], 16: [[74.94, 52.31]],
      17: [[19.72, 3.30], [5.76, 14.72], [5.88, 44.73], [68.62, 39.73]],
      18: [[30.96, 56.35]], 19: [[11.27, 55.89]], 20: [[81.55, 42.84]], 21: [[75.50, 22.72]],
      22: [[85.41, 21.11]], 23: [[69.15, 28.64]], 24: [[67.16, 6.61]], 25: [[86.82, 9.78]],
    },
  },
};

const PADRAO_NUMERO = /^(\d{2}) /;

// Cache do mapa {numero: {journalId, pageId}} por ato -- montado uma vez por
// sessão de cliente por ato, não a cada abertura da página (evita reconsultar
// o compêndio toda hora).
const _cachePromises = {};

async function construirMapaNumeroParaPagina(pack, ato) {
  const config = MAPAS[ato];
  if (!config) return {};

  const compendio = game.packs.get(pack);
  if (!compendio) return {};

  const index = await compendio.getIndex();
  const mapa = {};

  for (const nomeJournal of config.journais) {
    const entrada = index.find((e) => e.name === nomeJournal);
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

function montarPontosClicaveis(img, mapaNumeros, pack, ato) {
  if (img.dataset.op2eMapaColaPronto) return;
  img.dataset.op2eMapaColaPronto = "true";

  const posicoes = MAPAS[ato]?.posicoes ?? {};

  const container = document.createElement("div");
  container.className = "op2e-mapa-cola-container";
  img.replaceWith(container);
  container.appendChild(img);

  for (const [numeroStr, pontosDoNumero] of Object.entries(posicoes)) {
    const numero = Number(numeroStr);
    const alvo = mapaNumeros[numero];
    if (!alvo) continue;

    for (const [left, top] of pontosDoNumero) {
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
}

export function registrarMapaColaInterativo() {
  Hooks.on("renderJournalEntryPageTextSheet", async (app, htmlOuElemento) => {
    const raiz = htmlOuElemento instanceof HTMLElement ? htmlOuElemento : htmlOuElemento?.[0];
    const img = raiz?.querySelector?.("img.op2e-mapa-cola-img");
    if (!img) return;

    const pack = app.document?.pack;
    if (!pack) return; // só faz sentido dentro do compêndio Compêndio da Ordem

    const ato = img.dataset.op2eMapa ?? "ato1";
    if (!MAPAS[ato]) return;

    if (!_cachePromises[ato]) _cachePromises[ato] = construirMapaNumeroParaPagina(pack, ato);
    const mapaNumeros = await _cachePromises[ato];
    montarPontosClicaveis(img, mapaNumeros, pack, ato);
  });
}
