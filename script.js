// =============================
// ESTADO DA APLICAÇÃO
// =============================

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

  atualizarSistema();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  if (mesAtual === 11) {
    mesAtual = 0;
    anoAtual++;
  } else {
    mesAtual++;
  }

  atualizarSistema();
});

// =============================
// TRANSAÇÃO DO MÊS ATIVO
// =============================

function filtrarTransacoesDoMes() {
  return transacoes.filter(t => {
    const data = new Date(t.data);
    return (
      data.getMonth() === mesAtual &&
      data.getFullYear() === anoAtual
    );
  });
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
    const novaTransacao = {
      id: Date.now(),
      tipo,
      descricao,
      valor,
      categoria,
      data
    };

    transacoes.push(novaTransacao);
  }

  form.reset();
  atualizarSistema();
});
// =============================
// CÁLCULOS
// =============================

function calcularTotais() {
  let totalReceita = 0;
  let totalDespesa = 0;

  const transacoesFiltradas = filtrarTransacoesDoMes();

  transacoesFiltradas.forEach(transacao => {
    if (transacao.tipo === "receita") {
      totalReceita += transacao.valor;
    } else {
      totalDespesa += transacao.valor;
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

  document.getElementById("totalReceita").textContent =
    formatarMoeda(totalReceita);

  document.getElementById("totalDespesa").textContent =
    formatarMoeda(totalDespesa);

  document.getElementById("saldoAtual").textContent =
    formatarMoeda(saldo);

  atualizarMeta(totalReceita, saldo);
  renderizarTransacoes();
  atualizarDisplayMes();

  salvarDados();
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
        <td>${transacao.tipo === "receita" ? "💰 Receita" : "💸 Despesa"}</td>
        <td>${transacao.descricao}</td>
        <td>${transacao.categoria || "-"}</td>
        <td>${formatarMoeda(transacao.valor)}</td>
        <td>${transacao.data}</td>
        <td>
            <button onclick="editarTransacao(${transacao.id})" style="background:#2563eb;">
            ✏️
            </button>
            <button onclick="deletarTransacao(${transacao.id})">
            🗑️
            </button>
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
  document.getElementById("valor").value = transacao.valor;
  document.getElementById("categoria").value = transacao.categoria;
  document.getElementById("data").value = transacao.data;

  modoEdicao = true;
  idEmEdicao = id;

  document.querySelector(".btn-add").textContent = "Salvar Alteração";
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
    metaPercentual: metaPercentual
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

    document.getElementById("metaPercent").value = metaPercentual;
  }

  atualizarSistema();
}

// =============================
// INICIALIZAÇÃO
// =============================

carregarDados();
atualizarDisplayMes();