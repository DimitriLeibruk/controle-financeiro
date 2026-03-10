// =============================
// MAIN - Inicialização e orquestração
// =============================

import { state } from './modules/state.js';
import { salvarDados, carregarDados } from './modules/storage.js';
import { filtrarTransacoesDoMes, calcularTotais, deletarTransacao, finalizarTransacao, aplicarAlteracaoSalario } from './modules/transactions.js';
import { atualizarDisplayMes, renderizarCalendario } from './modules/calendar.js';
import { animarNumero } from './modules/dashboard.js';
import { renderizarTransacoes } from './modules/table.js';
import { renderizarControlePagamentos, togglePagamento } from './modules/payments.js';
import { atualizarMeta, renderizarObjetivos, removerObjetivo } from './modules/meta.js';
import {
  renderizarResumo,
  renderizarResumoAvancado,
  baixarPDF,
  exportarCSV,
  imprimirResumo
} from './modules/resumo.js';
import { renderizarGraficoMensal, renderizarGraficoCategoria, mudarGrafico } from './modules/charts.js';
import { setupFormHandlers } from './modules/forms.js';

// =============================
// ATUALIZAR SISTEMA
// =============================

function atualizarSistema() {
  const { receitaTotal, despesaTotal, saldoEmConta, valorAPagar, saldoAtual, saldoFinal } =
    calcularTotais();

  animarNumero(document.getElementById("receitaTotal"), receitaTotal);
  animarNumero(document.getElementById("despesaTotal"), despesaTotal);
  animarNumero(document.getElementById("saldoEmConta"), saldoEmConta);
  animarNumero(document.getElementById("valorAPagar"), valorAPagar);
  animarNumero(document.getElementById("saldoAtual"), saldoAtual);
  animarNumero(document.getElementById("saldoFinal"), saldoFinal);

  const saldoElemento = document.getElementById("saldoAtual");
  saldoElemento.classList.remove("saldo-positivo", "saldo-negativo");
  saldoElemento.classList.add(saldoAtual >= 0 ? "saldo-positivo" : "saldo-negativo");

  atualizarMeta(receitaTotal, saldoAtual);
  renderizarTransacoes();
  atualizarDisplayMes();
  renderizarControlePagamentos();

  const transacoesMes = filtrarTransacoesDoMes();
  renderizarResumo(receitaTotal, despesaTotal, saldoFinal);
  renderizarResumoAvancado(transacoesMes, receitaTotal, despesaTotal, saldoFinal);
  renderizarGraficoMensal(receitaTotal, despesaTotal);
  renderizarGraficoCategoria(transacoesMes);

  salvarDados();
}

// =============================
// EVENT LISTENERS
// =============================

function setupEventListeners() {
  const dropdown = document.getElementById("calendarDropdown");
  const monthDisplay = document.getElementById("currentMonthDisplay");

  // Navegação de mês
  document.getElementById("prevMonth").addEventListener("click", () => {
    if (state.mesAtual === 0) {
      state.mesAtual = 11;
      state.anoAtual--;
    } else {
      state.mesAtual--;
    }
    animarTrocaMes("prev");
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    if (state.mesAtual === 11) {
      state.mesAtual = 0;
      state.anoAtual++;
    } else {
      state.mesAtual++;
    }
    animarTrocaMes("next");
  });

  // Calendário dropdown
  monthDisplay.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
    renderizarCalendario(atualizarSistema);
  });

  document.getElementById("calendarYearDisplay").addEventListener("click", () => {
    state.modoCalendario = "ano";
    renderizarCalendario(atualizarSistema);
  });

  // Editar saldo
  document.getElementById("editarSaldoBtn").addEventListener("click", () => {
    const novoSaldo = prompt("Digite o saldo atual em conta:");
    if (novoSaldo !== null) {
      state.saldoManual = parseFloat(novoSaldo) || 0;
      salvarDados();
      atualizarSistema();
    }
  });

  // Modal edição
  document.getElementById("cancelEdit").addEventListener("click", () => {
    document.getElementById("editModal").classList.add("hidden");
    state.idEmEdicao = null;
  });

  document.getElementById("confirmEdit").addEventListener("click", () => {
    if (!state.idEmEdicao) return;

    const tipo = document.getElementById("editTipo").value;
    const descricao = document.getElementById("editDescricao").value;
    const valor = parseFloat(document.getElementById("editValor").value);
    const categoria = document.getElementById("editCategoria").value;
    const data = document.getElementById("editData").value;
    const formaPagamento = tipo.includes("despesa")
      ? document.getElementById("editFormaPagamento").value
      : null;
    const chaveMes = `${state.anoAtual}-${String(state.mesAtual + 1).padStart(2, "0")}`;

    state.transacoes = state.transacoes.map(t => {
      if (t.id === state.idEmEdicao) {
        if (t.tipo === "despesa_fixa") {
          return {
            ...t,
            descricao,
            categoria,
            formaPagamento,
            valorTotal: valor,
            historicoValores: { ...t.historicoValores, [chaveMes]: valor }
          };
        }
        return {
          ...t,
          tipo,
          descricao,
          valorTotal: valor,
          categoria,
          dataInicio: data,
          formaPagamento
        };
      }
      return t;
    });

    state.idEmEdicao = null;
    document.getElementById("editModal").classList.add("hidden");
    atualizarSistema();
  });

  // Botões resumo (expor para HTML onclick ou usar data-*)
  document.getElementById("btnPdf").addEventListener("click", baixarPDF);
  document.getElementById("btnCsv").addEventListener("click", exportarCSV);
  document.getElementById("btnPrint").addEventListener("click", imprimirResumo);

  const btnFinalizarMes = document.getElementById("btnFinalizarMes");
  if (btnFinalizarMes) {
    btnFinalizarMes.addEventListener("click", finalizarMes);
  }

  // Carrossel gráficos
  document.querySelectorAll(".carousel-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dir = parseInt(btn.dataset.graficoDir);
      mudarGrafico(dir);
    });
  });

  // Event delegation - tabela transações
  document.getElementById("transactionList").addEventListener("click", (e) => {
    const btnEditar = e.target.closest(".btn-editar");
    const btnDeletar = e.target.closest(".btn-deletar");
    const btnFinalizar = e.target.closest(".btn-finalizar");
    const id = btnEditar?.dataset.id ?? btnDeletar?.dataset.id ?? btnFinalizar?.dataset.id;
    if (!id) return;
    if (btnEditar) editarTransacao(id);
    if (btnDeletar) {
      deletarTransacao(id);
      atualizarSistema();
    }
    if (btnFinalizar) {
      if (confirm("Finalizar? A partir do mês seguinte este item não será mais exibido.")) {
        finalizarTransacao(id);
        atualizarSistema();
      }
    }
  });

  // Event delegation - pagamentos
  document.getElementById("paymentList").addEventListener("change", (e) => {
    const input = e.target;
    if (input.matches('input[data-action="toggle-payment"]')) {
      togglePagamento(parseInt(input.dataset.id));
      salvarDados();
      atualizarSistema();
    }
  });

  // Event delegation - objetivos
  document.getElementById("listaObjetivos").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remover-objetivo");
    if (btn) {
      removerObjetivo(parseInt(btn.dataset.id));
      renderizarObjetivos();
    }
  });
}

// =============================
// EDIÇÃO DE TRANSAÇÃO
// =============================

function obterValorSalarioAtualParaEdicao() {
  const chaveMes = `${state.anoAtual}-${String(state.mesAtual + 1).padStart(2, "0")}`;
  const historico = state.configuracaoFinanceira.historicoValoresSalario || {};
  return historico[chaveMes] ?? state.configuracaoFinanceira.salarioMensal;
}

function editarTransacao(id) {
  if (id === "salario_fixo") {
    const valorExibir = obterValorSalarioAtualParaEdicao();
    const novoValor = prompt(
      "Digite o novo valor do salário fixo mensal:",
      valorExibir
    );
    if (novoValor !== null) {
      const valor = parseFloat(novoValor.replace(",", "."));
      if (!isNaN(valor) && valor > 0) {
        aplicarAlteracaoSalario(valor);
        salvarDados();
        atualizarSistema();
      }
    }
    return;
  }

  const transacao = state.transacoes.find(t => t.id === parseInt(id) || t.id === id);
  if (!transacao) return;

  state.idEmEdicao = parseInt(id) || id;
  document.getElementById("editTipo").value = transacao.tipo;
  document.getElementById("editDescricao").value = transacao.descricao;
  document.getElementById("editValor").value = transacao.valorTotal;
  document.getElementById("editCategoria").value = transacao.categoria;
  document.getElementById("editData").value = transacao.dataInicio?.split("T")[0] || "";
  document.getElementById("editFormaPagamento").value = transacao.formaPagamento || "debito";
  document.getElementById("editModal").classList.remove("hidden");
}

// =============================
// ANIMAÇÃO TROCA MÊS
// =============================

function animarTrocaMes(direcao) {
  const tabela = document.querySelector(".transactions table");
  tabela.classList.remove("slide-left", "slide-right");
  atualizarSistema();
  tabela.classList.add(direcao === "next" ? "slide-left" : "slide-right");
  setTimeout(() => tabela.classList.remove("slide-left", "slide-right"), 300);
}

// =============================
// FINALIZAR MÊS
// =============================

function finalizarMes() {
  const totais = calcularTotais();
  const { saldoFinal } = totais;

  const confirmar = confirm(
    `Deseja finalizar o mês atual?\n\nO saldo final calculado é de R$ ${saldoFinal.toFixed(
      2
    )}.\nEsse valor será usado como saldo em conta do próximo mês.`
  );

  if (!confirmar) return;

  state.saldoManual = saldoFinal;

  if (state.mesAtual === 11) {
    state.mesAtual = 0;
    state.anoAtual++;
  } else {
    state.mesAtual++;
  }

  salvarDados();
  animarTrocaMes("next");
}

// =============================
// INICIALIZAÇÃO
// =============================

document.addEventListener("DOMContentLoaded", () => {
  carregarDados({
    onSalarioInput: (val) => {
      document.getElementById("salarioMensal").value = val || "";
    },
    onMetaPercent: (val) => {
      document.getElementById("metaPercent").value = val;
    }
  });

  if (state.configuracaoFinanceira.ativo) {
    document.getElementById("salarioFixo").checked = true;
  }

  setupFormHandlers(atualizarSistema, renderizarTransacoes, renderizarObjetivos);
  setupEventListeners();

  atualizarDisplayMes();
  atualizarSistema();
  document.getElementById("totalParcelas").disabled = true;
});
