// =============================
// ESTADO DA APLICAÇÃO
// =============================

let configuracaoFinanceira = {
  salarioMensal: 0,
  ativo: false,
  dataInicio: null
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

let metaValorFixo = 0;
let metaAnual = 0;
let objetivos = [];
let graficoMensal;
let graficoCategoria;


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

  let lista = [...transacoes];

  // 🔥 SALÁRIO FIXO COMO TRANSAÇÃO AUTOMÁTICA
  if (configuracaoFinanceira.ativo && configuracaoFinanceira.dataInicio) {

    const inicio = new Date(configuracaoFinanceira.dataInicio);

    const anoInicio = inicio.getFullYear();
    const mesInicio = inicio.getMonth();

    const ehMesPosteriorOuIgual =
      anoAtual > anoInicio ||
      (anoAtual === anoInicio && mesAtual >= mesInicio);

    if (ehMesPosteriorOuIgual) {

      lista.push({
        id: "salario_fixo",
        tipo: "receita",
        descricao: "Salário Fixo Mensal",
        valorTotal: configuracaoFinanceira.salarioMensal,
        categoria: "Salário",
        dataInicio: new Date(anoAtual, mesAtual, 1).toISOString(),
        totalParcelas: 1,
        formaPagamento: null,
        virtual: true
      });

    }
  }

  return lista.map(t => {

    const dataInicio = new Date(t.dataInicio);

    const diffMeses =
      (anoAtual - dataInicio.getFullYear()) * 12 +
      (mesAtual - dataInicio.getMonth());

    if (t.dataFim) {
      const dataFim = new Date(t.dataFim);

      const diffFim =
        (anoAtual - dataFim.getFullYear()) * 12 +
        (mesAtual - dataFim.getMonth());

      if (diffFim > 0) {
        return null;
      }
    }

    if (t.tipo === "receita") {
      if (
        dataInicio.getMonth() === mesAtual &&
        dataInicio.getFullYear() === anoAtual
      ) {
        return { ...t, valorMes: t.valorTotal };
      }
      return null;
    }

    if (t.tipo === "despesa") {
      if (
        dataInicio.getMonth() === mesAtual &&
        dataInicio.getFullYear() === anoAtual
      ) {
        return { ...t, valorMes: t.valorTotal };
      }
      return null;
    }

    if (t.tipo === "despesa_fixa" && diffMeses >= 0) {

      const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2,"0")}`;

      const valorMes =
        t.historicoValores?.[chaveMes] ?? t.valorTotal;

      return { ...t, valorMes };
    }

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

    configuracaoFinanceira.dataInicio =
      `${anoAtual}-${String(mesAtual + 1).padStart(2,"0")}-01`;
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

    const totalParcelas =
      tipo === "despesa_parcelada"
        ? parseInt(document.getElementById("totalParcelas").value) || 1
        : 1;

    const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2,"0")}`;

    transacoes = transacoes.map(t => {

      if (t.id === idEmEdicao) {

        // 🔥 SE FOR DESPESA FIXA
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

        // 🔥 OUTROS TIPOS
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

    modoEdicao = false;
    idEmEdicao = null;
    document.querySelector(".btn-add").textContent = "Adicionar";
  } else {
    // 🔥 CREATE

    const totalParcelas =
      tipo === "despesa_parcelada"
        ? parseInt(document.getElementById("totalParcelas").value) || 1
        : 1;

    const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2,"0")}`;

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
      historicoValores:
        tipo === "despesa_fixa"
          ? { [chaveMes]: valor }
          : null
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

  const transacoesFiltradas = filtrarTransacoesDoMes()
    .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));


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

  const transacoesMes = filtrarTransacoesDoMes();
  renderizarGraficoMensal(receitaTotal, despesaTotal);
  renderizarGraficoCategoria(transacoesMes);

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

    const transacoesFiltradas = filtrarTransacoesDoMes()
      .sort((a, b) => {
        const dataA = new Date(a.dataInicio + "T00:00:00");
        const dataB = new Date(b.dataInicio + "T00:00:00");
        return dataA - dataB;
      });

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
        <td>${formatarDataBR(transacao.dataInicio)}</td>
        <td>
          ${transacao.virtual ? "-" : `
            <button onclick="editarTransacao(${transacao.id})" style="background:#2563eb;">
              ✏️
            </button>
            <button onclick="deletarTransacao(${transacao.id})">
              🗑️
            </button>
          `}
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

  const percentual = parseFloat(document.getElementById("metaPercent").value) || 0;
  metaValorFixo = parseFloat(document.getElementById("metaValorFixo").value) || 0;
  metaAnual = parseFloat(document.getElementById("metaAnual").value) || 0;

  const metaIdealPercentual = (totalReceita * percentual) / 100;

  const metaIdealFinal =
    metaValorFixo > 0
      ? metaValorFixo
      : metaIdealPercentual;

  document.getElementById("metaIdeal").textContent =
    formatarMoeda(metaIdealFinal);

  document.getElementById("metaAtual").textContent =
    formatarMoeda(saldo);

  const progresso = metaIdealFinal > 0
    ? (saldo / metaIdealFinal) * 100
    : 0;

  document.getElementById("metaProgress").style.width =
    Math.min(progresso, 100) + "%";

  // 🔥 META ANUAL
  const acumuladoAno = transacoes
    .filter(t => t.tipo === "receita")
    .reduce((acc, t) => acc + t.valorTotal, 0);

  document.getElementById("metaAnualAtual").textContent =
    formatarMoeda(acumuladoAno);
}

document.getElementById("addObjetivo")
  .addEventListener("click", () => {

    const nome = document.getElementById("objetivoNome").value;
    const valor = parseFloat(document.getElementById("objetivoValor").value);

    if (!nome || !valor) return;

    objetivos.push({
      id: Date.now(),
      nome,
      valor,
      acumulado: 0
    });

    renderizarObjetivos();
  });

function renderizarObjetivos() {

  const container = document.getElementById("listaObjetivos");
  container.innerHTML = "";

  objetivos.forEach(obj => {

    const div = document.createElement("div");

    const progresso =
      (obj.acumulado / obj.valor) * 100;

    div.classList.add("objetivo-card");

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>${obj.nome}</strong>
        <button onclick="removerObjetivo(${obj.id})"
          style="background:#dc2626;color:white;border:none;border-radius:5px;padding:4px 8px;cursor:pointer;">
          ✕
        </button>
      </div>
      <small>${formatarMoeda(obj.acumulado)} / ${formatarMoeda(obj.valor)}</small>
      <div class="progress-bar">
        <div class="progress" style="width:${Math.min(progresso,100)}%"></div>
      </div>
      <hr>
    `;

    container.appendChild(div);
  });
}

function removerObjetivo(id) {
  objetivos = objetivos.filter(o => o.id !== id);
  renderizarObjetivos();
}

function editarTransacao(id) {

  const transacao = transacoes.find(t => t.id === id);
  if (!transacao) return;

  idEmEdicao = id;

  document.getElementById("editTipo").value = transacao.tipo;
  document.getElementById("editDescricao").value = transacao.descricao;
  document.getElementById("editValor").value = transacao.valorTotal;
  document.getElementById("editCategoria").value = transacao.categoria;
  document.getElementById("editData").value = transacao.dataInicio;

  if (transacao.formaPagamento) {
    document.getElementById("editFormaPagamento").value = transacao.formaPagamento;
  }

  document.getElementById("editModal").classList.remove("hidden");
}

// =============================
// BOTÕES DO MODAL DE EDIÇÃO
// =============================

document.getElementById("cancelEdit").addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
  idEmEdicao = null;
});

document.getElementById("confirmEdit").addEventListener("click", () => {

  if (!idEmEdicao) return;

  const tipo = document.getElementById("editTipo").value;
  const descricao = document.getElementById("editDescricao").value;
  const valor = parseFloat(document.getElementById("editValor").value);
  const categoria = document.getElementById("editCategoria").value;
  const data = document.getElementById("editData").value;

  const formaPagamento =
    tipo.includes("despesa")
      ? document.getElementById("editFormaPagamento").value
      : null;

  const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2,"0")}`;

  transacoes = transacoes.map(t => {

    if (t.id === idEmEdicao) {

      // 🔥 SE FOR DESPESA FIXA
      if (t.tipo === "despesa_fixa") {

        return {
          ...t,
          descricao,
          categoria,
          formaPagamento,
          valorTotal: valor,
          historicoValores: {
            ...t.historicoValores,
            [chaveMes]: valor   // 👈 AQUI ESTÁ A CORREÇÃO
          }
        };

      }

      // 🔥 OUTROS TIPOS
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

  idEmEdicao = null;
  document.getElementById("editModal").classList.add("hidden");

  atualizarSistema();
});

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

// FUNÇÃO PARA FORMATAR A DATA PADRÃO BR
function formatarDataBR(dataString) {
  if (!dataString) return "-";

  const [ano, mes, dia] = dataString.split("-");

  return `${dia}/${mes}/${ano}`;
}

// =============================
// GRAFICOS
// =============================

function renderizarGraficoMensal(receita, despesa) {

  const ctx = document.getElementById("graficoMensal");

  if (graficoMensal) graficoMensal.destroy();

  graficoMensal = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Receita', 'Despesa'],
      datasets: [{
        label: 'Resumo do Mês',
        data: [receita, despesa],
        backgroundColor: ['#16a34a', '#dc2626']
      }]
    }
  });
}

function renderizarGraficoCategoria(transacoesMes) {

  const categorias = {};
  
  transacoesMes.forEach(t => {
    if (t.tipo.includes("despesa")) {
      categorias[t.categoria] =
        (categorias[t.categoria] || 0) + t.valorMes;
    }
  });

  const ctx = document.getElementById("graficoCategoria");

  if (graficoCategoria) graficoCategoria.destroy();

  graficoCategoria = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias)
      }]
    }
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

  if (
    configuracaoFinanceira.ativo &&
    !configuracaoFinanceira.dataInicio
  ) {
    configuracaoFinanceira.dataInicio =
      new Date(anoAtual, mesAtual, 1).toISOString();
  }

  atualizarSistema();
}

// =============================
// INICIALIZAÇÃO
// =============================

carregarDados();
atualizarDisplayMes();
document.getElementById("totalParcelas").disabled = true;