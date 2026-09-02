/**
 * Troca o ícone que o Foundry mostra na tela (semitransparente, ao apertar Espaço /
 * pausar o jogo) pelo logo de Ordem Paranormal RPG 2. A aplicação de pausa (GamePause)
 * renderiza um <img> dentro de um elemento com id="pause" -- é só trocar o src no hook
 * de render dela.
 */

const LOGO = "systems/op2e-playtest/assets/ui/logo-pausa.webp";

export function registrarLogoDePausa() {
  Hooks.on("renderGamePause", (app, htmlOuElemento) => {
    const raiz = htmlOuElemento instanceof HTMLElement ? htmlOuElemento : htmlOuElemento?.[0];
    const img = raiz?.querySelector?.("img");
    if (img) img.src = LOGO;
  });
}
