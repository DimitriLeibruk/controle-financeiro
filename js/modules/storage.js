// =============================
// PERSISTÊNCIA - LocalStorage
// =============================

import { state } from './state.js';

export function salvarDados() {
  const dados = {
    transacoes: state.transacoes,
    metaPercentual: state.metaPercentual,
    metaValorFixo: state.metaValorFixo,
    metaAnual: state.metaAnual,
    percentualPoupancaSaldoFinal: state.percentualPoupancaSaldoFinal,
    poupancaAnualAcumulada: state.poupancaAnualAcumulada,
    objetivos: state.objetivos,
    configuracaoFinanceira: state.configuracaoFinanceira,
    pagamentosDoMes: state.pagamentosDoMes,
    saldoManual: state.saldoManual
  };
  localStorage.setItem("financeControl", JSON.stringify(dados));
}

export function carregarDados(callbacks) {
  const dadosSalvos = localStorage.getItem("financeControl");

  if (dadosSalvos) {
    const dados = JSON.parse(dadosSalvos);
    state.transacoes = dados.transacoes || [];
    state.metaPercentual = dados.metaPercentual ?? 20;
    state.metaValorFixo = dados.metaValorFixo ?? 0;
    state.metaAnual = dados.metaAnual ?? 0;
    state.percentualPoupancaSaldoFinal = dados.percentualPoupancaSaldoFinal ?? 0;
    state.poupancaAnualAcumulada = dados.poupancaAnualAcumulada ?? 0;
    state.objetivos = dados.objetivos || [];
    state.saldoManual = dados.saldoManual ?? 0;
    Object.assign(state.configuracaoFinanceira, dados.configuracaoFinanceira || {});
    state.pagamentosDoMes = dados.pagamentosDoMes || {};

    if (callbacks?.onSalarioInput) {
      callbacks.onSalarioInput(state.configuracaoFinanceira.salarioMensal);
    }
    if (callbacks?.onMetaPercent) {
      callbacks.onMetaPercent(state.metaPercentual);
    }
  }

  if (state.configuracaoFinanceira.ativo && !state.configuracaoFinanceira.dataInicio) {
    state.configuracaoFinanceira.dataInicio = new Date(
      state.anoAtual,
      state.mesAtual,
      1
    ).toISOString();
  }

  return state.configuracaoFinanceira;
}
