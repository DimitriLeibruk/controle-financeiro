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
import { setupAuthUI } from './modules/authUI.js';

// =============================
// ATUALIZAR SISTEMA
// =============================

function atualizarSistema() {
  const {
    receitaTotal,
    despesaTotal,
    saldoEmConta,
    valorAPagar,
    resultadoMes,
    saldoFinal
  } = calcularTotais();

  animarNumero(document.getElementById("receitaTotal"), receitaTotal);
  animarNumero(document.getElementById("despesaTotal"), despesaTotal);
  animarNumero(document.getElementById("saldoEmConta"), saldoEmConta);
  animarNumero(document.getElementById("valorAPagar"), valorAPagar);
  animarNumero(document.getElementById("resultadoMes"), resultadoMes);
  animarNumero(document.getElementById("saldoFinal"), saldoFinal);

  const saldoElemento = document.getElementById("resultadoMes");
  saldoElemento.classList.remove("saldo-positivo", "saldo-negativo");
  saldoElemento.classList.add(resultadoMes >= 0 ? "saldo-positivo" : "saldo-negativo");

  atualizarMeta(receitaTotal, saldoEmConta);
  renderizarObjetivos();
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
  const themeToggle = document.getElementById("themeToggle");

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
    document.getElementById("settingsDropdown")?.classList.add("hidden");
    document.getElementById("btnSettings")?.setAttribute("aria-expanded", "false");
    dropdown.classList.toggle("hidden");
    renderizarCalendario(atualizarSistema);
  });

  document.getElementById("calendarYearDisplay").addEventListener("click", () => {
    state.modoCalendario = "ano";
    renderizarCalendario(atualizarSistema);
  });

  // Configurações (engrenagem): abre/fecha o painel
  const btnSettings = document.getElementById("btnSettings");
  const settingsDropdown = document.getElementById("settingsDropdown");
  if (btnSettings && settingsDropdown) {
    btnSettings.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown?.classList.add("hidden");
      const isOpen = !settingsDropdown.classList.toggle("hidden");
      btnSettings.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".settings-trigger") && !e.target.closest("#settingsDropdown")) {
        settingsDropdown.classList.add("hidden");
        btnSettings.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("theme-dark");
      localStorage.setItem("financeControlTheme", isDark ? "dark" : "light");
      themeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
    });
  }

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
      salvarDados();
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

  const percentualPoupanca = state.percentualPoupancaSaldoFinal || 0;
  const saldoPositivo = Math.max(0, saldoFinal);
  const poupancaDoMes = (saldoPositivo * percentualPoupanca) / 100;
  const saldoProximoMes = saldoFinal - poupancaDoMes;

  const confirmar = confirm(
    `Deseja finalizar o mês atual?\n\n` +
      `Saldo final calculado: R$ ${saldoFinal.toFixed(2)}\n` +
      `Poupança automática configurada: ${percentualPoupanca.toFixed(0)}%\n` +
      `Valor a guardar este mês: R$ ${poupancaDoMes.toFixed(2)}\n\n` +
      `Saldo que irá para o próximo mês: R$ ${saldoProximoMes.toFixed(2)}`
  );

  if (!confirmar) return;

  state.saldoManual = saldoProximoMes;

  if (poupancaDoMes > 0) {
    state.poupancaAnualAcumulada = (state.poupancaAnualAcumulada || 0) + poupancaDoMes;

    if (state.objetivos && state.objetivos.length > 0) {
      const qtd = state.objetivos.length;
      const valorPorObjetivo = poupancaDoMes / qtd;
      state.objetivos = state.objetivos.map((obj) => ({
        ...obj,
        acumulado: (obj.acumulado || 0) + valorPorObjetivo
      }));
    }
  }

  if (state.mesAtual === 11) {
    state.mesAtual = 0;
    state.anoAtual++;
  } else {
    state.mesAtual++;
  }

  salvarDados();
  animarTrocaMes("next");
  renderizarObjetivos();
}

// =============================
// INICIALIZAÇÃO
// =============================

document.addEventListener("DOMContentLoaded", async () => {
  const savedTheme = localStorage.getItem("financeControlTheme");
  const isDark = savedTheme === "dark";
  if (isDark) {
    document.body.classList.add("theme-dark");
  }
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
  }

  const callbacksCarregar = {
    onSalarioInput: (val) => {
      const el = document.getElementById("salarioMensal");
      if (el) el.value = val || "";
    },
    onMetaPercent: (val) => {
      const el = document.getElementById("metaPercent");
      if (el) el.value = val;
    }
  };
  await carregarDados(callbacksCarregar);

  if (state.configuracaoFinanceira.ativo) {
    document.getElementById("salarioFixo").checked = true;
  }

  // Restaurar campos de metas a partir do estado
  document.getElementById("metaValorFixo").value = state.metaValorFixo || "";
  document.getElementById("metaAnual").value = state.metaAnual || "";
  document.getElementById("metaPercentSaldoFinal").value =
    state.percentualPoupancaSaldoFinal || 0;

  const carregarDadosComCallbacks = async () => {
    await carregarDados(callbacksCarregar);
    document.getElementById("metaValorFixo").value = state.metaValorFixo || "";
    document.getElementById("metaAnual").value = state.metaAnual || "";
    document.getElementById("metaPercentSaldoFinal").value = state.percentualPoupancaSaldoFinal || 0;
    if (state.configuracaoFinanceira.ativo) document.getElementById("salarioFixo").checked = true;
  };
  setupFormHandlers(atualizarSistema, renderizarTransacoes, renderizarObjetivos);
  setupAuthUI(atualizarSistema, carregarDadosComCallbacks);
  setupEventListeners();

  // Renderizar objetivos salvos
  renderizarObjetivos();

  atualizarDisplayMes();
  atualizarSistema();
  document.getElementById("totalParcelas").disabled = true;
});
