// =============================
// GRÁFICOS - Chart.js
// =============================

import { state } from './state.js';

export function renderizarGraficoMensal(receita, despesa) {
  const ctx = document.getElementById("graficoMensal");
  if (state.graficoMensal) state.graficoMensal.destroy();

  state.graficoMensal = new Chart(ctx, {
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

export function renderizarGraficoCategoria(transacoesMes) {
  const categorias = {};
  transacoesMes.forEach(t => {
    if (t.tipo.includes("despesa")) {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valorMes;
    }
  });

  const ctx = document.getElementById("graficoCategoria");
  if (state.graficoCategoria) state.graficoCategoria.destroy();

  state.graficoCategoria = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias),
        backgroundColor: [
          "#3b82f6", "#f97316", "#facc15",
          "#14b8a6", "#8b5cf6", "#ef4444"
        ]
      }]
    }
  });
}

let graficoAtual = 0;

export function mudarGrafico(direcao) {
  const itens = document.querySelectorAll(".grafico-item");
  itens[graficoAtual].classList.remove("ativo");
  graficoAtual += direcao;
  if (graficoAtual < 0) graficoAtual = itens.length - 1;
  if (graficoAtual >= itens.length) graficoAtual = 0;
  itens[graficoAtual].classList.add("ativo");
}
