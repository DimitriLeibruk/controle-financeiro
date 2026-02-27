// =============================
// ESTADO DA APLICAÇÃO
// =============================

let configuracaoFinanceira = {
  salarioMensal: 0,
  ativo: false
};
let transacoes = [];
let pagamentosDoMes = {};
let saldoManual = 0;
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
// BOTÃO DE EDITAR SALDO
// =============================

document.getElementById("editarSaldoBtn").addEventListener("click", () => {

  const novoSaldo = prompt("Digite o saldo atual em conta:");

  if (novoSaldo !== null) {
    saldoManual = parseFloat(novoSaldo) || 0;
    salvarDados();
    atualizarSistema();
  }

});

// =============================
// SALÁRIO
// =============================

const salarioInput = document.getElementById("salarioMensal");
const salvarSalarioBtn = document.getElementById("salvarSalario");

salvarSalarioBtn.addEventListener("click", () => {

  const valorSalario = parseFloat(salarioInput.value) || 0;

  if (!valorSalario) {
    alert("Digite um valor válido.");
    return;
  }

  const salarioFixoSelecionado =
    document.getElementById("salarioFixo").checked;

  const salarioMensalSelecionado =
    document.getElementById("salarioMensalUnico").checked;

  if (!salarioFixoSelecionado && !salarioMensalSelecionado) {
    alert("Selecione uma opção.");
    return;
  }

  if (salarioFixoSelecionado) {

    configuracaoFinanceira.salarioMensal = valorSalario;
    configuracaoFinanceira.ativo = true;

  }

  if (salarioMensalSelecionado) {

    // 🔥 Criar receita automática apenas para este mês

    const novaReceita = {
      id: Date.now(),
      tipo: "receita",
      descricao: "Salário do mês",
      formaPagamento: null,
      valorTotal: valorSalario,
      categoria: "Salário",
      dataInicio: new Date(anoAtual, mesAtual, 1).toISOString(),
      totalParcelas: 1,
      ativa: true,
      dataFim: null
    };

    transacoes.push(novaReceita);

  }

  salarioInput.value = "";

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
  const formaPagamento =
    tipo.includes("despesa")
      ? document.getElementById("formaPagamento").value
      : null;

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
        ? parseInt(document.getElementById("totalParcelas").value) || 1
        : 1;

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

// =============================
// CÁLCULOS
// =============================

function calcularTotais() {

  let receitaTotal = 0;
  let despesaTotal = 0;
  let saldoEmConta = saldoManual;
  let valorAPagar = 0;

  const transacoesFiltradas = filtrarTransacoesDoMes();

  if (configuracaoFinanceira.ativo) {
    receitaTotal += configuracaoFinanceira.salarioMensal;
    saldoEmConta += configuracaoFinanceira.salarioMensal;
  }

  transacoesFiltradas.forEach(t => {

    if (t.tipo === "receita") {
      receitaTotal += t.valorMes;
      saldoEmConta += t.valorMes;
    }

    if (t.tipo.includes("despesa")) {

      despesaTotal += t.valorMes;

      if (t.formaPagamento === "debito") {
        saldoEmConta -= t.valorMes;
      }

      if (t.formaPagamento === "credito") {

        const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2,"0")}`;

        const pago = pagamentosDoMes[chaveMes]?.[t.id];

        if (!pago) {
          valorAPagar += t.valorMes;
        } else {
          saldoEmConta -= t.valorMes;
        }
      }
    }

  });

  const saldoAtual = saldoEmConta;
  const saldoFinal = saldoEmConta - valorAPagar;

  return {
    receitaTotal,
    despesaTotal,
    saldoEmConta,
    valorAPagar,
    saldoAtual,
    saldoFinal
  };
}

// =============================
// CONTROLE PAGAMENTOS
// =============================

function renderizarControlePagamentos() {
  const container = document.getElementById("paymentList");
  container.innerHTML = "";

  const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;

  if (!pagamentosDoMes[chaveMes]) {
    pagamentosDoMes[chaveMes] = {};
  }

  const transacoesFiltradas = filtrarTransacoesDoMes()
    .filter(t => t.tipo === "despesa_fixa" || t.tipo === "despesa_parcelada");

  transacoesFiltradas.forEach(transacao => {
    const div = document.createElement("div");
    div.classList.add("payment-item");

    const pago = pagamentosDoMes[chaveMes][transacao.id] || false;

    if (pago) {
      div.classList.add("payment-paid");
    }

    div.innerHTML = `
      <label class="payment-label">
        <input type="checkbox"
          ${pago ? "checked" : ""}
          onchange="togglePagamento(${transacao.id})">
        <span class="payment-name">${transacao.descricao}</span>
        <span class="payment-value">
          ${formatarMoeda(transacao.valorMes)}
        </span>
      </label>
    `;

    container.appendChild(div);
  });
}

function togglePagamento(id) {
  const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;

  if (!pagamentosDoMes[chaveMes]) {
    pagamentosDoMes[chaveMes] = {};
  }

  pagamentosDoMes[chaveMes][id] =
    !pagamentosDoMes[chaveMes][id];

  salvarDados();
  atualizarSistema();
}

// =============================
// ATUALIZAR SISTEMA
// =============================

function atualizarSistema() {

  const {
    receitaTotal,
    despesaTotal,
    saldoEmConta,
    valorAPagar,
    saldoAtual,
    saldoFinal
  } = calcularTotais();

  animarNumero(document.getElementById("receitaTotal"), receitaTotal);
  animarNumero(document.getElementById("despesaTotal"), despesaTotal);
  animarNumero(document.getElementById("saldoEmConta"), saldoEmConta);
  animarNumero(document.getElementById("valorAPagar"), valorAPagar);
  animarNumero(document.getElementById("saldoAtual"), saldoAtual);
  animarNumero(document.getElementById("saldoFinal"), saldoFinal);

  const saldoElemento = document.getElementById("saldoAtual");

  saldoElemento.classList.remove("saldo-positivo", "saldo-negativo");

  if (saldoAtual >= 0) {
    saldoElemento.classList.add("saldo-positivo");
  } else {
    saldoElemento.classList.add("saldo-negativo");
  }

  atualizarMeta(receitaTotal, saldoAtual);

  renderizarTransacoes();
  atualizarDisplayMes();
  renderizarControlePagamentos();

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

    function calcularParcelaAtual(transacao) {

      const dataInicio = new Date(transacao.dataInicio);

      const diffMeses =
        (anoAtual - dataInicio.getFullYear()) * 12 +
        (mesAtual - dataInicio.getMonth());

      return diffMeses + 1;
    }

    tr.innerHTML = `
        <td>
          ${formatarTipo(transacao.tipo)}
          ${transacao.tipo === "despesa_parcelada"
            ? `<br><small>
                ${calcularParcelaAtual(transacao)} / ${transacao.totalParcelas}
              </small>`
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
    configuracaoFinanceira: configuracaoFinanceira,
    pagamentosDoMes: pagamentosDoMes,
    saldoManual: saldoManual
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
    saldoManual = dados.saldoManual || 0;
    configuracaoFinanceira =
      dados.configuracaoFinanceira || configuracaoFinanceira;
      pagamentosDoMes = dados.pagamentosDoMes || {};

    salarioInput.value = configuracaoFinanceira.salarioMensal;

    document.getElementById("metaPercent").value = metaPercentual;
  }

  if (configuracaoFinanceira.ativo) {
    document.getElementById("salarioFixo").checked = true;
  }

  atualizarSistema();
}

// =============================
// INICIALIZAÇÃO
// =============================

carregarDados();
atualizarDisplayMes();
document.getElementById("totalParcelas").disabled = true;