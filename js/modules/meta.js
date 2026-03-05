// =============================
// METAS FINANCEIRAS
// =============================

import { state } from './state.js';
import { formatarMoeda } from './utils.js';

export function atualizarMeta(totalReceita, saldo) {
  const percentual = parseFloat(document.getElementById("metaPercent").value) || 0;
  state.metaValorFixo = parseFloat(document.getElementById("metaValorFixo").value) || 0;
  state.metaAnual = parseFloat(document.getElementById("metaAnual").value) || 0;

  const metaIdealPercentual = (totalReceita * percentual) / 100;
  const metaIdealFinal = state.metaValorFixo > 0 ? state.metaValorFixo : metaIdealPercentual;

  document.getElementById("metaIdeal").textContent = formatarMoeda(metaIdealFinal);
  document.getElementById("metaAtual").textContent = formatarMoeda(saldo);

  const progresso = metaIdealFinal > 0 ? (saldo / metaIdealFinal) * 100 : 0;
  document.getElementById("metaProgress").style.width = Math.min(progresso, 100) + "%";

  const acumuladoAno = state.transacoes
    .filter(t => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valorTotal, 0);
  document.getElementById("metaAnualAtual").textContent = formatarMoeda(acumuladoAno);
}

export function renderizarObjetivos() {
  const container = document.getElementById("listaObjetivos");
  container.innerHTML = "";

  state.objetivos.forEach(obj => {
    const div = document.createElement("div");
    const progresso = (obj.acumulado / obj.valor) * 100;
    div.classList.add("objetivo-card");
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>${obj.nome}</strong>
        <button type="button" class="btn-remover-objetivo" data-id="${obj.id}"
          style="background:#dc2626;color:white;border:none;border-radius:5px;padding:4px 8px;cursor:pointer;">✕</button>
      </div>
      <small>${formatarMoeda(obj.acumulado)} / ${formatarMoeda(obj.valor)}</small>
      <div class="progress-bar">
        <div class="progress" style="width:${Math.min(progresso, 100)}%"></div>
      </div>
      <hr>
    `;
    container.appendChild(div);
  });
}

export function removerObjetivo(id) {
  state.objetivos = state.objetivos.filter(o => o.id !== id);
}
