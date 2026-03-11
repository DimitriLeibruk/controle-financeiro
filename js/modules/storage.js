// =============================
// PERSISTÊNCIA - LocalStorage + Supabase (quando logado)
// =============================

import { state } from './state.js';

function getPayloadFromState() {
  return {
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
}

/** Estado "vazio" para usar quando não há dados (ex.: após logout sem dados locais). */
function getEstadoVazio() {
  return {
    transacoes: [],
    metaPercentual: 20,
    metaValorFixo: 0,
    metaAnual: 0,
    percentualPoupancaSaldoFinal: 0,
    poupancaAnualAcumulada: 0,
    objetivos: [],
    configuracaoFinanceira: { salarioMensal: 0, ativo: false, dataInicio: null },
    pagamentosDoMes: {},
    saldoManual: 0
  };
}

function applyDadosToState(dados, callbacks) {
  const payload = dados || getEstadoVazio();
  state.transacoes = payload.transacoes || [];
  state.metaPercentual = payload.metaPercentual ?? 20;
  state.metaValorFixo = payload.metaValorFixo ?? 0;
  state.metaAnual = payload.metaAnual ?? 0;
  state.percentualPoupancaSaldoFinal = payload.percentualPoupancaSaldoFinal ?? 0;
  state.poupancaAnualAcumulada = payload.poupancaAnualAcumulada ?? 0;
  state.objetivos = payload.objetivos || [];
  state.saldoManual = payload.saldoManual ?? 0;
  Object.assign(state.configuracaoFinanceira, payload.configuracaoFinanceira || {});
  state.pagamentosDoMes = payload.pagamentosDoMes || {};

  if (callbacks?.onSalarioInput) {
    callbacks.onSalarioInput(state.configuracaoFinanceira.salarioMensal);
  }
  if (callbacks?.onMetaPercent) {
    callbacks.onMetaPercent(state.metaPercentual);
  }
}

/**
 * Salva dados: se estiver logado, apenas no Supabase (não altera localStorage).
 * Se não estiver logado, apenas no localStorage.
 * Assim, ao sair da conta, o app volta a mostrar os dados locais (ou vazio).
 */
export function salvarDados() {
  const dados = getPayloadFromState();
  (async () => {
    try {
      const { getUsuario } = await import('./auth.js');
      const { supabase } = await import('./supabase.js');
      const user = await getUsuario();
      if (user?.id) {
        const sb = await supabase();
        await sb.from('user_data').upsert(
          { user_id: user.id, dados },
          { onConflict: 'user_id' }
        );
        return;
      }
    } catch (_) {
      // Supabase não configurado ou erro de rede: usa localStorage
    }
    localStorage.setItem("financeControl", JSON.stringify(dados));
  })();
}

/**
 * Carrega dados: do Supabase se estiver logado, senão do localStorage.
 * @param { object } callbacks - { onSalarioInput?, onMetaPercent? }
 * @returns { Promise<object> } configuracaoFinanceira do state
 */
export async function carregarDados(callbacks) {
  let dados = null;

  try {
    const { getUsuario } = await import('./auth.js');
    const { supabase } = await import('./supabase.js');
    const user = await getUsuario();
    if (user?.id) {
      const sb = await supabase();
      const { data } = await sb.from('user_data').select('dados').eq('user_id', user.id).single();
      if (data?.dados) dados = data.dados;
    }
  } catch (_) {
    // Supabase não configurado ou sem login: usa localStorage
  }

  if (!dados) {
    const dadosSalvos = localStorage.getItem("financeControl");
    if (dadosSalvos) dados = JSON.parse(dadosSalvos);
  }

  applyDadosToState(dados, callbacks);

  if (state.configuracaoFinanceira.ativo && !state.configuracaoFinanceira.dataInicio) {
    state.configuracaoFinanceira.dataInicio = new Date(
      state.anoAtual,
      state.mesAtual,
      1
    ).toISOString();
  }

  return state.configuracaoFinanceira;
}
