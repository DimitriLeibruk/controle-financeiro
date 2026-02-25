// =============================
// ESTADO DA APLICAÇÃO
// =============================

let configuracaoFinanceira = {
  salarioMensal: 0,
  ativo: false
};
let transacoes = [];
let metaPercentual = 20;
let modoEdicao = false;
let idEmEdicao = null;
let hoje = new Date();
let mesAtual = hoje.getMonth(); // 0-11
let anoAtual = hoje.getFullYear();
let modoCalendario = "mes";


// =============================
// ATUALIZAR NOME DO MÊS
// =============================

function atualizarDisplayMes() {
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  document.getElementById("currentMonthDisplay").textContent =
    `${meses[mesAtual]} ${anoAtual}`;
}

// =============================
// NAVEGAÇÃO ENTRE MESES
// =============================

document.getElementById("prevMonth").addEventListener("click", () => {
  if (mesAtual === 0) {
    mesAtual = 11;
    anoAtual--;
  } else {
    mesAtual--;
  }

  animarTrocaMes("prev");
});

document.getElementById("nextMonth").addEventListener("click", () => {
  if (mesAtual === 11) {
    mesAtual = 0;
    anoAtual++;
  } else {
    mesAtual++;
  }

  animarTrocaMes("next");
});

// =============================
// TRANSAÇÃO DO MÊS ATIVO
// =============================

function filtrarTransacoesDoMes() {
  return transacoes.map(t => {

    const dataInicio = new Date(t.dataInicio);
    const diffMeses =
      (anoAtual - dataInicio.getFullYear()) * 12 +
      (mesAtual - dataInicio.getMonth());

    // VERIFICAR SE FOI ENCERRADA
    if (t.dataFim) {
      const dataFim = new Date(t.dataFim);

      const diffFim =
        (anoAtual - dataFim.getFullYear()) * 12 +
        (mesAtual - dataFim.getMonth());

      if (diffFim > 0) {
        return null;
      }
    }

    // RECEITA NORMAL
    if (t.tipo === "receita") {
      if (
        dataInicio.getMonth() === mesAtual &&
        dataInicio.getFullYear() === anoAtual
      ) {
        return { ...t, valorMes: t.valorTotal };
      }
      return null;
    }

    // DESPESA NORMAL
    if (t.tipo === "despesa") {
      if (
        dataInicio.getMonth() === mesAtual &&
        dataInicio.getFullYear() === anoAtual
      ) {
        return { ...t, valorMes: t.valorTotal };
      }
      return null;
    }

    // DESPESA FIXA
    if (t.tipo === "despesa_fixa" && diffMeses >= 0) {
      return { ...t, valorMes: t.valorTotal };
    }

    // DESPESA PARCELADA
    if (
      t.tipo === "despesa_parcelada" &&
      diffMeses >= 0 &&
      diffMeses < t.totalParcelas
    ) {
      return {
        ...t,
        valorMes: t.valorTotal / t.totalParcelas
      };
    }

    return null;

  }).filter(Boolean);
}

// =============================
// ABRIR E FECHAR DROPDOWN
// =============================

const monthDisplay = document.getElementById("currentMonthDisplay");
const dropdown = document.getElementById("calendarDropdown");

monthDisplay.addEventListener("click", () => {
  dropdown.classList.toggle("hidden");
  renderizarCalendario();
});

// =============================
// RENDERIZAR MESES
// =============================

function renderizarCalendario() {
  const grid = document.getElementById("calendarGrid");
  const yearDisplay = document.getElementById("calendarYearDisplay");

  grid.innerHTML = "";

  if (modoCalendario === "mes") {
    yearDisplay.textContent = anoAtual;

    const mesesAbrev = [
      "jan","fev","mar","abr",
      "mai","jun","jul","ago",
      "set","out","nov","dez"
    ];

    mesesAbrev.forEach((mes, index) => {
      const div = document.createElement("div");
      div.classList.add("calendar-item");

      if (index === mesAtual) {
        div.classList.add("active");
      }

      div.textContent = mes;

      div.addEventListener("click", () => {
        mesAtual = index;
        dropdown.classList.add("hidden");
        atualizarSistema();
      });

      grid.appendChild(div);
    });

  } else {
    renderizarAnos();
  }
}

// =============================
// VISÃO DE ANOS
// =============================
document.getElementById("calendarYearDisplay")
  .addEventListener("click", () => {
    modoCalendario = "ano";
    renderizarCalendario();
});

// =============================
// RENDERIZAR ANOS
// =============================

function renderizarAnos() {
  const grid = document.getElementById("calendarGrid");
  const yearDisplay = document.getElementById("calendarYearDisplay");

  grid.innerHTML = "";

  yearDisplay.textContent = "Selecione o Ano";

  const anoBase = anoAtual - 4;

  for (let i = 0; i < 9; i++) {
    const ano = anoBase + i;

    const div = document.createElement("div");
    div.classList.add("calendar-item");

    if (ano === anoAtual) {
      div.classList.add("active");
    }

    div.textContent = ano;

    div.addEventListener("click", () => {
      anoAtual = ano;
      modoCalendario = "mes";
      renderizarCalendario();
      atualizarSistema();
    });

    grid.appendChild(div);
  }
}

// =============================
// ANIMAÇÃO NUMEROS DASHBOARD
// =============================

function animarNumero(elemento, valorFinal, duracao = 600) {
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

// =============================
// SALÁRIO
// =============================

const salarioInput = document.getElementById("salarioMensal");
const salarioAtivo = document.getElementById("salarioAtivo");
const salvarSalarioBtn = document.getElementById("salvarSalario");

salvarSalarioBtn.addEventListener("click", () => {
  configuracaoFinanceira.salarioMensal =
    parseFloat(salarioInput.value) || 0;

  configuracaoFinanceira.ativo = salarioAtivo.checked;

  salvarDados();
  atualizarSistema();
});

// =============================
// CAPTURANDO FORMULÁRIO
// =============================

const form = document.getElementById("transactionForm");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const descricao = document.getElementById("descricao").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const categoria = document.getElementById("categoria").value;
  const data = document.getElementById("data").value;

  if (!tipo || !descricao || !valor || !data) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  if (modoEdicao) {
    // 🔥 UPDATE
    transacoes = transacoes.map(t => {
      if (t.id === idEmEdicao) {
        return {
          ...t,
          tipo,
          descricao,
          valor,
          categoria,
          data
        };
      }
      return t;
    });

    modoEdicao = false;
    idEmEdicao = null;
    document.querySelector(".btn-add").textContent = "Adicionar";

  } else {
    // 🔥 CREATE

    const totalParcelas =
    tipo === "despesa_parcelada"
      ? parseInt(document.getElementById("totalParcelas").value)
      : 0;

    const novaTransacao = {
      id: Date.now(),
      tipo,
      descricao,
      valorTotal: valor,
      categoria,
      dataInicio: data,
      totalParcelas,
      ativa: true,
      dataFim: null
    };

    transacoes.push(novaTransacao);
  }

  form.reset();
  atualizarSistema();
});

// =============================
// CAMPO DE PARCELAS DINAMICO
// =============================

const tipoSelect = document.getElementById("tipo");
const parcelasContainer = document.getElementById("parcelasContainer");

tipoSelect.addEventListener("change", function () {
  if (this.value === "despesa_parcelada") {
    parcelasContainer.style.display = "block";
  } else {
    parcelasContainer.style.display = "none";
  }
});

// =============================
// CÁLCULOS
// =============================

function calcularTotais() {
  let totalReceita = 0;
  let totalDespesa = 0;

  const transacoesFiltradas = filtrarTransacoesDoMes();

  if (configuracaoFinanceira.ativo) {
    totalReceita += configuracaoFinanceira.salarioMensal;
  }

  transacoesFiltradas.forEach(transacao => {
    if (transacao.tipo === "receita") {
      totalReceita += transacao.valorMes;
    } else {
      totalDespesa += transacao.valorMes;
    }
  });

  const saldo = totalReceita - totalDespesa;

  return {
    totalReceita,
    totalDespesa,
    saldo
  };
}

// =============================
// ATUALIZAR SISTEMA
// =============================

function atualizarSistema() {
  const { totalReceita, totalDespesa, saldo } = calcularTotais();

  animarNumero(document.getElementById("totalReceita"), totalReceita);
  animarNumero(document.getElementById("totalDespesa"), totalDespesa);
  animarNumero(document.getElementById("saldoAtual"), saldo);

  const saldoElemento = document.getElementById("saldoAtual");

  saldoElemento.classList.remove("saldo-positivo", "saldo-negativo");

  if (saldo >= 0) {
    saldoElemento.classList.add("saldo-positivo");
  } else {
    saldoElemento.classList.add("saldo-negativo");
  }

  atualizarMeta(totalReceita, saldo);
  renderizarTransacoes();
  atualizarDisplayMes();

  salvarDados();
}

// =============================
// LOADING
// =============================

function animarTrocaMes(direcao) {
  const tabela = document.querySelector(".transactions table");

  tabela.classList.remove("slide-left", "slide-right");

  atualizarSistema();

  tabela.classList.add(direcao === "next" ? "slide-left" : "slide-right");

  setTimeout(() => {
    tabela.classList.remove("slide-left", "slide-right");
  }, 300);
}

// =============================
// VERIFICAR TIPO DE TRANSAÇÃO
// =============================

function formatarTipo(tipo) {
  switch (tipo) {
    case "receita":
      return "💰 Receita";
    case "despesa":
      return "💸 Despesa";
    case "despesa_fixa":
      return "🔁 Despesa Fixa";
    case "despesa_parcelada":
      return "💳 Despesa Parcelada";
    default:
      return tipo;
  }
}

// =============================
// RENDERIZAR TABELA
// =============================

function renderizarTransacoes() {
    const lista = document.getElementById("transactionList");

    lista.innerHTML = "";

    const transacoesFiltradas = filtrarTransacoesDoMes();

    transacoesFiltradas.forEach(transacao => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${formatarTipo(transacao.tipo)}</td>
        <td>${transacao.descricao}</td>
        <td>${formatarMoeda(transacao.valorMes)}</td>
        <td>${transacao.categoria || "-"}</td>
        <td>${transacao.dataInicio}</td>
        <td>
            <button onclick="editarTransacao(${transacao.id})" style="background:#2563eb;">
              ✏️
            </button>
            <button onclick="deletarTransacao(${transacao.id})">
              🗑️
            </button>

            ${transacao.tipo === "despesa_fixa" && transacao.ativa
              ? `<button onclick="encerrarDespesa(${transacao.id})">⛔</button>`
              : ""}
        </td>
    `;

    lista.appendChild(tr);
  });
}

// =============================
// DELETAR TRANSAÇÃO
// =============================

function deletarTransacao(id) {
  transacoes = transacoes.filter(t => t.id !== id);

  atualizarSistema();
  renderizarTransacoes();
}

// META FINANCEIRA
function atualizarMeta(totalReceita, saldo) {
  const metaIdeal = (totalReceita * metaPercentual) / 100;

  document.getElementById("metaIdeal").textContent =
    formatarMoeda(metaIdeal);

  document.getElementById("metaAtual").textContent =
    formatarMoeda(saldo);

  const progresso = saldo > 0
    ? (saldo / metaIdeal) * 100
    : 0;

  document.getElementById("metaProgress").style.width =
    Math.min(progresso, 100) + "%";

  const status = saldo >= metaIdeal
    ? "Meta Atingida ✅"
    : "Abaixo da Meta ⚠️";

  document.getElementById("metaStatus").textContent = status;
}

function editarTransacao(id) {
  const transacao = transacoes.find(t => t.id === id);

  if (!transacao) return;

  document.getElementById("tipo").value = transacao.tipo;
  document.getElementById("descricao").value = transacao.descricao;
  document.getElementById("valor").value = transacao.valorTotal;
  document.getElementById("categoria").value = transacao.categoria;
  document.getElementById("data").value = transacao.dataInicio;

  modoEdicao = true;
  idEmEdicao = id;

  document.querySelector(".btn-add").textContent = "Salvar Alteração";
}

// =============================
// ENCERRAR DESPESA FIXA
// =============================

function encerrarDespesa(id) {
  transacoes = transacoes.map(t => {
    if (t.id === id) {
      return {
        ...t,
        dataFim: new Date(anoAtual, mesAtual, 1).toISOString()
      };
    }
    return t;
  });

  atualizarSistema();
}

// =============================
// ALTERAR META
// =============================

const inputMeta = document.getElementById("metaPercent");

inputMeta.addEventListener("input", function() {
  metaPercentual = parseFloat(this.value) || 0;
  atualizarSistema();
});

// FUNÇÃO PARA CONVERTER A MOEDA
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// =============================
// SALVAR NO LOCALSTORAGE
// =============================

function salvarDados() {
  const dados = {
    transacoes: transacoes,
    metaPercentual: metaPercentual,
    configuracaoFinanceira: configuracaoFinanceira
  };

  localStorage.setItem("financeControl", JSON.stringify(dados));
}

// =============================
// CARREGAR DO LOCALSTORAGE
// =============================

function carregarDados() {
  const dadosSalvos = localStorage.getItem("financeControl");

  if (dadosSalvos) {
    const dados = JSON.parse(dadosSalvos);

    transacoes = dados.transacoes || [];
    metaPercentual = dados.metaPercentual || 20;
    configuracaoFinanceira =
      dados.configuracaoFinanceira || configuracaoFinanceira;

    salarioInput.value = configuracaoFinanceira.salarioMensal;
    salarioAtivo.checked = configuracaoFinanceira.ativo;

    document.getElementById("metaPercent").value = metaPercentual;
  }

  atualizarSistema();
}

// =============================
// INICIALIZAÇÃO
// =============================

carregarDados();
atualizarDisplayMes();