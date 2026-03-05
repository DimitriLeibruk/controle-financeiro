// =============================
// CONTROLE DE PAGAMENTOS
// =============================

import { state } from './state.js';
import { filtrarTransacoesDoMes } from './transactions.js';
import { formatarMoeda } from './utils.js';

export function renderizarControlePagamentos() {
  const container = document.getElementById("paymentList");
  container.innerHTML = "";
  const chaveMes = `${state.anoAtual}-${String(state.mesAtual + 1).padStart(2, "0")}`;

  if (!state.pagamentosDoMes[chaveMes]) {
    state.pagamentosDoMes[chaveMes] = {};
  }

  const transacoesFiltradas = filtrarTransacoesDoMes().filter(
    t => t.tipo === "despesa_fixa" || t.tipo === "despesa_parcelada"
  );

  transacoesFiltradas.forEach(transacao => {
    const div = document.createElement("div");
    div.classList.add("payment-item");
    const pago = state.pagamentosDoMes[chaveMes][transacao.id] || false;
    if (pago) div.classList.add("payment-paid");

    div.innerHTML = `
      <label class="payment-label">
        <input type="checkbox" data-action="toggle-payment" data-id="${transacao.id}"
          ${pago ? "checked" : ""}>
        <span class="payment-name">${transacao.descricao}</span>
        <span class="payment-value">${formatarMoeda(transacao.valorMes)}</span>
      </label>
    `;
    container.appendChild(div);
  });
}

export function togglePagamento(id) {
  const chaveMes = `${state.anoAtual}-${String(state.mesAtual + 1).padStart(2, "0")}`;
  if (!state.pagamentosDoMes[chaveMes]) {
    state.pagamentosDoMes[chaveMes] = {};
  }
  state.pagamentosDoMes[chaveMes][id] = !state.pagamentosDoMes[chaveMes][id];
}
