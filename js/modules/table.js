// =============================
// TABELA DE TRANSAÇÕES
// =============================

import { state } from './state.js';
import { filtrarTransacoesDoMes } from './transactions.js';
import { formatarMoeda, formatarDataBR, formatarTipo } from './utils.js';

function calcularParcelaAtual(transacao) {
  const dataInicio = new Date(transacao.dataInicio);
  const diffMeses =
    (state.anoAtual - dataInicio.getFullYear()) * 12 +
    (state.mesAtual - dataInicio.getMonth());
  return diffMeses + 1;
}

export function renderizarTransacoes() {
  const lista = document.getElementById("transactionList");
  lista.innerHTML = "";

  const transacoesFiltradas = filtrarTransacoesDoMes().sort((a, b) => {
    const dataA = new Date(a.dataInicio + "T00:00:00");
    const dataB = new Date(b.dataInicio + "T00:00:00");
    return dataA - dataB;
  });

  transacoesFiltradas.forEach(transacao => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        ${formatarTipo(transacao.tipo)}
        ${transacao.tipo === "despesa_parcelada"
          ? `<br><small>${calcularParcelaAtual(transacao)} / ${transacao.totalParcelas}</small>`
          : ""}
      </td>
      <td>${transacao.descricao}</td>
      <td>${formatarMoeda(transacao.valorMes)}</td>
      <td>
        ${transacao.formaPagamento
          ? transacao.formaPagamento === "debito"
            ? "💳 Débito"
            : "🧾 Crédito"
          : "-"}
      </td>
      <td>${transacao.categoria || "-"}</td>
      <td>${formatarDataBR(transacao.dataInicio)}</td>
      <td>
        ${transacao.virtual && transacao.id !== "salario_fixo" ? "-" : `
          <button type="button" class="btn-editar" data-id="${transacao.id}">✏️</button>
          <button type="button" class="btn-deletar" data-id="${transacao.id}">🗑️</button>
          ${transacao.tipo === "despesa_fixa" || transacao.id === "salario_fixo" ? `
            <button type="button" class="btn-finalizar" data-id="${transacao.id}" title="Finalizar a partir do mês seguinte">✓</button>
          ` : ""}
        `}
      </td>
    `;
    lista.appendChild(tr);
  });
}
