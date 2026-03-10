// =============================
// ESTADO DA APLICAÇÃO
// =============================

const hoje = new Date();

export const state = {
  configuracaoFinanceira: {
    salarioMensal: 0,
    ativo: false,
    dataInicio: null
  },
  transacoes: [],
  pagamentosDoMes: {},
  saldoManual: 0,
  metaPercentual: 20,
  metaValorFixo: 0,
  metaAnual: 0,
  percentualPoupancaSaldoFinal: 0,
  poupancaAnualAcumulada: 0,
  modoEdicao: false,
  idEmEdicao: null,
  mesAtual: hoje.getMonth(),
  anoAtual: hoje.getFullYear(),
  modoCalendario: "mes",
  objetivos: [],
  graficoMensal: null,
  graficoCategoria: null
};
