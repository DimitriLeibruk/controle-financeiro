// =============================
// PERSISTÊNCIA - LocalStorage
// =============================

import { state } from './state.js';

export function salvarDados() {
  const dados = {
    transacoes: state.transacoes,
    metaPercentual: state.metaPercentual,
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
