// =============================
// DASHBOARD - Animações e atualizações
// =============================

import { formatarMoeda } from './utils.js';

export function animarNumero(elemento, valorFinal, duracao = 600) {
  let inicio = 0;
  const startTime = performance.now();

  function atualizar(currentTime) {
    const progresso = Math.min((currentTime - startTime) / duracao, 1);
    const valorAtual = inicio + (valorFinal - inicio) * progresso;
    elemento.textContent = formatarMoeda(valorAtual);
    if (progresso < 1) {
      requestAnimationFrame(atualizar);
    } else {
      elemento.textContent = formatarMoeda(valorFinal);
    }
  }
  requestAnimationFrame(atualizar);
}
