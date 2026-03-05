// =============================
// FORMULÁRIOS - Transação, Salário, Modal
// =============================

import { state } from './state.js';

export function setupFormHandlers(atualizarSistema, renderizarTransacoes, renderizarObjetivos) {
  const form = document.getElementById("transactionForm");
  const salarioInput = document.getElementById("salarioMensal");
  const salvarSalarioBtn = document.getElementById("salvarSalario");
  const tipoSelect = document.getElementById("tipo");

  // Formulário de transação
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const tipo = document.getElementById("tipo").value;
    const descricao = document.getElementById("descricao").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const categoria = document.getElementById("categoria").value;
    const data = document.getElementById("data").value;
    const formaPagamento = tipo.includes("despesa")
      ? document.getElementById("formaPagamento").value
      : null;

    if (!tipo || !descricao || !valor || !data) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    const totalParcelas =
      tipo === "despesa_parcelada"
        ? parseInt(document.getElementById("totalParcelas").value) || 1
        : 1;
    const chaveMes = `${state.anoAtual}-${String(state.mesAtual + 1).padStart(2, "0")}`;

    if (state.modoEdicao) {
      state.transacoes = state.transacoes.map(t => {
        if (t.id === state.idEmEdicao) {
          if (t.tipo === "despesa_fixa") {
            return {
              ...t,
              descricao,
              categoria,
              formaPagamento,
              historicoValores: {
                ...t.historicoValores,
                [chaveMes]: valor
              }
            };
          }
          return {
            ...t,
            tipo,
            descricao,
            valorTotal: valor,
            categoria,
            dataInicio: data,
            formaPagamento,
            totalParcelas
          };
        }
        return t;
      });
      state.modoEdicao = false;
      state.idEmEdicao = null;
      document.querySelector(".btn-add").textContent = "Adicionar";
    } else {
      const novaTransacao = {
        id: Date.now(),
        tipo,
        descricao,
        formaPagamento,
        valorTotal: valor,
        categoria,
        dataInicio: data,
        totalParcelas,
        ativa: true,
        dataFim: null,
        historicoValores: tipo === "despesa_fixa" ? { [chaveMes]: valor } : null
      };
      state.transacoes.push(novaTransacao);
    }

    form.reset();
    atualizarSistema();
  });

  // Parcelas dinâmico
  tipoSelect.addEventListener("change", function () {
    const parcelasInput = document.getElementById("totalParcelas");
    if (this.value === "despesa_parcelada") {
      parcelasInput.disabled = false;
      parcelasInput.value = 1;
    } else {
      parcelasInput.disabled = true;
      parcelasInput.value = 1;
    }
  });

  // Salário
  salvarSalarioBtn.addEventListener("click", () => {
    const valorSalario = parseFloat(salarioInput.value) || 0;
    if (!valorSalario) {
      alert("Digite um valor válido.");
      return;
    }

    const salarioFixoSelecionado = document.getElementById("salarioFixo").checked;
    const salarioMensalSelecionado = document.getElementById("salarioMensalUnico").checked;

    if (!salarioFixoSelecionado && !salarioMensalSelecionado) {
      alert("Selecione uma opção.");
      return;
    }

    if (salarioFixoSelecionado) {
      state.configuracaoFinanceira.salarioMensal = valorSalario;
      state.configuracaoFinanceira.ativo = true;
      state.configuracaoFinanceira.dataInicio = `${state.anoAtual}-${String(state.mesAtual + 1).padStart(2, "0")}-01`;
    }

    if (salarioMensalSelecionado) {
      const novaReceita = {
        id: Date.now(),
        tipo: "receita",
        descricao: "Salário do mês",
        formaPagamento: null,
        valorTotal: valorSalario,
        categoria: "Salário",
        dataInicio: new Date(state.anoAtual, state.mesAtual, 1).toISOString(),
        totalParcelas: 1,
        ativa: true,
        dataFim: null
      };
      state.transacoes.push(novaReceita);
    }

    salarioInput.value = "";
    atualizarSistema();
  });

  // Meta percentual
  document.getElementById("metaPercent").addEventListener("input", function () {
    state.metaPercentual = parseFloat(this.value) || 0;
    atualizarSistema();
  });

  // Objetivos
  document.getElementById("addObjetivo").addEventListener("click", () => {
    const nome = document.getElementById("objetivoNome").value;
    const valor = parseFloat(document.getElementById("objetivoValor").value);
    if (!nome || !valor) return;

    state.objetivos.push({
      id: Date.now(),
      nome,
      valor,
      acumulado: 0
    });
    renderizarObjetivos();
  });
}
