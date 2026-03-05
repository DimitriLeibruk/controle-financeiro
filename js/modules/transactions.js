// =============================
// TRANSAÇÕES - Filtros e cálculos
// =============================

import { state } from './state.js';

function obterValorSalarioMes(chaveMes) {
  const { configuracaoFinanceira } = state;
  const historico = configuracaoFinanceira.historicoValoresSalario || {};
  return historico[chaveMes] ?? configuracaoFinanceira.salarioMensal;
}

export function aplicarAlteracaoSalario(novoValor) {
  const { configuracaoFinanceira, mesAtual, anoAtual } = state;
  if (!configuracaoFinanceira.historicoValoresSalario) {
    configuracaoFinanceira.historicoValoresSalario = {};
  }
  const historico = configuracaoFinanceira.historicoValoresSalario;

  const [anoInicio, mesInicio] = configuracaoFinanceira.dataInicio
    .split("T")[0]
    .split("-")
    .map(Number);
  const mesInicio0 = mesInicio - 1;
  const valorAtual = configuracaoFinanceira.salarioMensal;

  for (let a = anoInicio; a <= anoAtual; a++) {
    const mesIni = a === anoInicio ? mesInicio0 : 0;
    const mesFim = a === anoAtual ? mesAtual - 1 : 11;
    for (let m = mesIni; m <= mesFim; m++) {
      const chave = `${a}-${String(m + 1).padStart(2, "0")}`;
      if (!(chave in historico)) {
        historico[chave] = valorAtual;
      }
    }
  }

  const chaveMesAtual = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;
  historico[chaveMesAtual] = novoValor;
  configuracaoFinanceira.salarioMensal = novoValor;
}

export function filtrarTransacoesDoMes() {
  const { transacoes, configuracaoFinanceira, mesAtual, anoAtual } = state;
  let lista = [...transacoes];

  if (configuracaoFinanceira.ativo && configuracaoFinanceira.dataInicio) {
    const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;
    const valorSalario = obterValorSalarioMes(chaveMes);

    // Verificar dataFim (finalizado a partir do mês seguinte)
    if (configuracaoFinanceira.dataFim) {
      const [anoFim, mesFim] = configuracaoFinanceira.dataFim
        .split("T")[0]
        .split("-")
        .map(Number);
      const mesFim0 = mesFim - 1;
      if (anoAtual > anoFim || (anoAtual === anoFim && mesAtual > mesFim0)) {
        // Já passou do mês de finalização, não exibir
      } else {
        // Ainda dentro do período
        const [anoInicio, mesInicio] = configuracaoFinanceira.dataInicio
          .split("T")[0]
          .split("-")
          .map(Number);
        const mesInicio0 = mesInicio - 1;
        const ehMesPosteriorOuIgual =
          anoAtual > anoInicio || (anoAtual === anoInicio && mesAtual >= mesInicio0);
        if (ehMesPosteriorOuIgual) {
          lista.push({
            id: "salario_fixo",
            tipo: "receita",
            descricao: "Salário Fixo Mensal",
            valorTotal: valorSalario,
            categoria: "Salário",
            dataInicio: new Date(anoAtual, mesAtual, 1).toISOString(),
            totalParcelas: 1,
            formaPagamento: null,
            virtual: true
          });
        }
      }
    } else {
      // Usar parsing manual para evitar bug de timezone (ex: "2026-03-01" em UTC = 28/fev em BRT)
      const [anoInicio, mesInicio] = configuracaoFinanceira.dataInicio
        .split("T")[0]
        .split("-")
        .map(Number);
      const mesInicio0 = mesInicio - 1; // 1-12 → 0-11
      const ehMesPosteriorOuIgual =
        anoAtual > anoInicio || (anoAtual === anoInicio && mesAtual >= mesInicio0);

      if (ehMesPosteriorOuIgual) {
        lista.push({
          id: "salario_fixo",
          tipo: "receita",
          descricao: "Salário Fixo Mensal",
          valorTotal: valorSalario,
          categoria: "Salário",
          dataInicio: new Date(anoAtual, mesAtual, 1).toISOString(),
          totalParcelas: 1,
          formaPagamento: null,
          virtual: true
        });
      }
    }
  }

  return lista
    .map(t => {
      const dataInicio = new Date(t.dataInicio);
      const diffMeses =
        (anoAtual - dataInicio.getFullYear()) * 12 +
        (mesAtual - dataInicio.getMonth());

      if (t.dataFim) {
        const dataFim = new Date(t.dataFim);
        const diffFim =
          (anoAtual - dataFim.getFullYear()) * 12 +
          (mesAtual - dataFim.getMonth());
        if (diffFim > 0) return null;
      }

      if (t.tipo === "receita" || t.tipo === "despesa") {
        if (dataInicio.getMonth() === mesAtual && dataInicio.getFullYear() === anoAtual) {
          return { ...t, valorMes: t.valorTotal };
        }
        return null;
      }

      if (t.tipo === "despesa_fixa" && diffMeses >= 0) {
        const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;
        const valorMes = t.historicoValores?.[chaveMes] ?? t.valorTotal;
        return { ...t, valorMes };
      }

      if (
        t.tipo === "despesa_parcelada" &&
        diffMeses >= 0 &&
        diffMeses < t.totalParcelas
      ) {
        return { ...t, valorMes: t.valorTotal / t.totalParcelas };
      }

      return null;
    })
    .filter(Boolean);
}

export function calcularTotais() {
  const { saldoManual, mesAtual, anoAtual, pagamentosDoMes } = state;
  const transacoesFiltradas = filtrarTransacoesDoMes().sort(
    (a, b) => new Date(a.dataInicio) - new Date(b.dataInicio)
  );

  let receitaTotal = 0;
  let despesaTotal = 0;
  let saldoEmConta = saldoManual;
  let valorAPagar = 0;

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
        const chaveMes = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}`;
        const pago = pagamentosDoMes[chaveMes]?.[t.id];
        if (!pago) {
          valorAPagar += t.valorMes;
        } else {
          saldoEmConta -= t.valorMes;
        }
      }
    }
  });

  return {
    receitaTotal,
    despesaTotal,
    saldoEmConta,
    valorAPagar,
    saldoAtual: saldoEmConta,
    saldoFinal: saldoEmConta - valorAPagar
  };
}

export function deletarTransacao(id) {
  if (id === "salario_fixo") {
    state.configuracaoFinanceira.ativo = false;
    state.configuracaoFinanceira.salarioMensal = 0;
    state.configuracaoFinanceira.dataInicio = null;
    state.configuracaoFinanceira.dataFim = null;
    state.configuracaoFinanceira.historicoValoresSalario = {};
    return;
  }
  const idNum = typeof id === "string" ? parseInt(id, 10) : id;
  if (!isNaN(idNum)) {
    state.transacoes = state.transacoes.filter(t => t.id !== idNum);
  }
}

export function finalizarTransacao(id) {
  const { mesAtual, anoAtual } = state;
  const dataFim = new Date(anoAtual, mesAtual + 1, 0).toISOString(); // último dia do mês atual

  if (id === "salario_fixo") {
    state.configuracaoFinanceira.dataFim = dataFim;
    return;
  }
  const idNum = typeof id === "string" ? parseInt(id, 10) : id;
  if (!isNaN(idNum)) {
    state.transacoes = state.transacoes.map(t =>
      t.id === idNum ? { ...t, dataFim } : t
    );
  }
}
