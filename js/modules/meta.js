// =============================
// METAS FINANCEIRAS
// =============================

import { state } from './state.js';
import { formatarMoeda } from './utils.js';

export function atualizarMeta(totalReceita, saldo) {
  const percentual = parseFloat(document.getElementById("metaPercent").value) || 0;
  state.metaValorFixo = parseFloat(document.getElementById("metaValorFixo").value) || 0;
  state.metaAnual = parseFloat(document.getElementById("metaAnual").value) || 0;
  state.percentualPoupancaSaldoFinal =
    parseFloat(document.getElementById("metaPercentSaldoFinal").value) || 0;

  const metaIdealPercentual = (totalReceita * percentual) / 100;
  const metaIdealFinal = state.metaValorFixo > 0 ? state.metaValorFixo : metaIdealPercentual;

  document.getElementById("metaIdeal").textContent = formatarMoeda(metaIdealFinal);
  document.getElementById("metaAtual").textContent = formatarMoeda(saldo);

  const progresso = metaIdealFinal > 0 ? (saldo / metaIdealFinal) * 100 : 0;
  const barra = document.getElementById("metaProgress");
  barra.style.width = Math.min(progresso, 100) + "%";
  barra.classList.remove("meta-alerta-baixo", "meta-alerta-ok", "meta-alerta-excedida");
  if (progresso > 0 && progresso < 50) {
    barra.classList.add("meta-alerta-baixo");
  } else if (progresso >= 50 && progresso <= 100) {
    barra.classList.add("meta-alerta-ok");
  } else if (progresso > 100) {
    barra.classList.add("meta-alerta-excedida");
  }

  const acumuladoPoupanca = state.poupancaAnualAcumulada || 0;
  document.getElementById("metaAnualAtual").textContent = formatarMoeda(acumuladoPoupanca);
}

export function renderizarObjetivos() {
  const container = document.getElementById("listaObjetivos");
  container.innerHTML = "";

  const lista = state.objetivos || [];
  document.getElementById("metaObjetivosResumo").textContent = lista.length;

  lista.forEach(obj => {
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
