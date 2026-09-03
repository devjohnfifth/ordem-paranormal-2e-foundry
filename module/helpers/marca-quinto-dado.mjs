/**
 * Insere a marca "Quinto Dado" na barra de título de toda ficha deste sistema
 * (Personagem, Ameaça, Item). Como a barra de título (.window-header) é um
 * elemento genérico do Foundry (não algo que o template da ficha controla),
 * a inserção é feita via DOM depois do render, igual ao logo de pausa e o
 * mapa-cola -- funciona pra qualquer ApplicationV2, então filtramos pela classe
 * "op2e" (presente em todas as sheets deste sistema) pra não mexer em janelas
 * de outros sistemas/módulos.
 */

const LOGO = "systems/op2e-playtest/assets/ui/quinto-dado.webp";

export function registrarMarcaQuintoDado() {
  Hooks.on("renderApplicationV2", (app, element) => {
    const raiz = element instanceof HTMLElement ? element : element?.[0];
    if (!raiz?.classList?.contains("op2e")) return;

    const cabecalho = raiz.querySelector(":scope > .window-header");
    if (!cabecalho || cabecalho.querySelector(".op2e-marca-quinto-dado")) return;

    const img = document.createElement("img");
    img.src = LOGO;
    img.className = "op2e-marca-quinto-dado";
    img.alt = "Quinto Dado";

    const controles = cabecalho.querySelector(".header-control, button, a");
    cabecalho.insertBefore(img, controles ?? null);
  });
}
