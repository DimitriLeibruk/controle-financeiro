// =============================
// RESUMO DO MÊS - PDF, CSV, Imprimir
// =============================

import { state } from './state.js';
import { filtrarTransacoesDoMes, calcularTotais } from './transactions.js';
import { formatarMoeda, formatarDataBR, formatarTipo, formatarTipoPDF } from './utils.js';

export function renderizarResumo(receita, despesa, saldoFinal) {
  const transacoesMes = filtrarTransacoesDoMes();

  const totalCredito = transacoesMes
    .filter(t => t.formaPagamento === "credito")
    .reduce((acc, t) => acc + t.valorMes, 0);
  const totalDebito = transacoesMes
    .filter(t => t.formaPagamento === "debito")
    .reduce((acc, t) => acc + t.valorMes, 0);

  document.getElementById("resumoTabela").innerHTML = `
    <table style="width:100%; text-align:left;">
      <tr><td>Receita Total:</td><td>${formatarMoeda(receita)}</td></tr>
      <tr><td>Despesa Total:</td><td>${formatarMoeda(despesa)}</td></tr>
      <tr><td>Total Crédito:</td><td>${formatarMoeda(totalCredito)}</td></tr>
      <tr><td>Total Débito:</td><td>${formatarMoeda(totalDebito)}</td></tr>
      <tr><td><strong>Saldo Final:</strong></td><td><strong>${formatarMoeda(saldoFinal)}</strong></td></tr>
    </table>
  `;

  const statusDiv = document.getElementById("resumoStatus");
  if (saldoFinal >= 0) {
    statusDiv.className = "resumo-status status-positivo";
    statusDiv.innerHTML = "🟢 Mês Positivo";
  } else {
    statusDiv.className = "resumo-status status-negativo";
    statusDiv.innerHTML = "🔴 Mês Negativo";
  }
}

export function renderizarResumoAvancado(transacoesMes, receita, despesa, saldoFinal) {
  const categorias = {};
  transacoesMes.forEach(t => {
    if (t.tipo.includes("despesa")) {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valorMes;
    }
  });

  let percentuaisHTML = "";
  Object.keys(categorias).forEach(cat => {
    const percentual = despesa > 0
      ? ((categorias[cat] / despesa) * 100).toFixed(0)
      : 0;
    percentuaisHTML += `
      <div class="percent-card">${cat}<br>${percentual}%</div>
    `;
  });
  document.getElementById("resumoPercentuais").innerHTML = percentuaisHTML;
}

export async function baixarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const { receitaTotal, despesaTotal, saldoFinal } = calcularTotais();
  const transacoesMes = filtrarTransacoesDoMes();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Resumo Financeiro", 105, 20, { align: "center" });
  doc.setFontSize(14);
  doc.text(`${state.mesAtual + 1}/${state.anoAtual}`, 105, 28, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Receita Total: ${formatarMoeda(receitaTotal)}`, 20, 40);
  doc.text(`Despesa Total: ${formatarMoeda(despesaTotal)}`, 20, 48);
  doc.setFont("helvetica", "bold");
  const [r, g, b] = saldoFinal >= 0 ? [22, 163, 74] : [220, 38, 38];
  doc.setTextColor(r, g, b);
  doc.text(`Saldo Final: ${formatarMoeda(saldoFinal)}`, 20, 56);
  doc.setTextColor(0, 0, 0);

  const canvas = document.getElementById("graficoMensal");
  const imgData = canvas.toDataURL("image/png");
  doc.addImage(imgData, "PNG", 25, 65, 160, 70);

  const dadosTabela = transacoesMes.map(t => [
    formatarTipoPDF(t.tipo),
    t.descricao,
    formatarMoeda(t.valorMes),
    formatarDataBR(t.dataInicio)
  ]);

  doc.autoTable({
    startY: 145,
    head: [["Tipo", "Descrição", "Valor", "Data"]],
    body: dadosTabela,
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });

  doc.setFontSize(9);
  doc.text(`Relatório gerado em ${formatarDataBR(new Date().toISOString())}`, 105, 285, { align: "center" });
  doc.save(`Resumo-${state.mesAtual + 1}-${state.anoAtual}.pdf`);
}

export function exportarCSV() {
  const wb = XLSX.utils.book_new();
  const transacoesMes = filtrarTransacoesDoMes();
  const { receitaTotal, despesaTotal, saldoFinal } = calcularTotais();

  const dadosTransacoes = transacoesMes.map(t => ({
    Tipo: formatarTipo(t.tipo),
    Descrição: t.descricao,
    Valor: t.valorMes,
    FormaPagamento: t.formaPagamento || "-",
    Categoria: t.categoria || "-",
    Data: formatarDataBR(t.dataInicio)
  }));
  const wsTransacoes = XLSX.utils.json_to_sheet(dadosTransacoes);
  XLSX.utils.book_append_sheet(wb, wsTransacoes, "Transações");

  const dadosResumo = [
    { Item: "Receita Total", Valor: receitaTotal },
    { Item: "Despesa Total", Valor: despesaTotal },
    { Item: "Saldo Final", Valor: saldoFinal }
  ];
  const wsResumo = XLSX.utils.json_to_sheet(dadosResumo);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  const categorias = {};
  transacoesMes.forEach(t => {
    if (t.tipo.includes("despesa")) {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valorMes;
    }
  });
  const dadosCategoria = Object.keys(categorias).map(cat => ({
    Categoria: cat,
    Total: categorias[cat]
  }));
  const wsCategoria = XLSX.utils.json_to_sheet(dadosCategoria);
  XLSX.utils.book_append_sheet(wb, wsCategoria, "Categorias");

  XLSX.writeFile(wb, `Resumo-${state.mesAtual + 1}-${state.anoAtual}.xlsx`);
}

export function imprimirResumo() {
  const { receitaTotal, despesaTotal, saldoFinal } = calcularTotais();
  const transacoesMes = filtrarTransacoesDoMes();
  const categorias = {};
  transacoesMes.forEach(t => {
    if (t.tipo.includes("despesa")) {
      categorias[t.categoria] = (categorias[t.categoria] || 0) + t.valorMes;
    }
  });

  let categoriasHTML = Object.keys(categorias).map(cat => `
    <tr><td>${cat}</td><td>${formatarMoeda(categorias[cat])}</td></tr>
  `).join("");

  const janela = window.open("", "", "width=800,height=600");
  janela.document.write(`
    <html>
      <head>
        <title>Resumo do Mês</title>
        <style>
          body { font-family: Arial; padding: 30px; }
          h2 { border-bottom: 2px solid #ccc; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          td, th { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
          .total { font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Resumo do Mês - ${state.mesAtual + 1}/${state.anoAtual}</h2>
        <table>
          <tr><th>Categoria</th><th>Valor</th></tr>
          ${categoriasHTML}
        </table>
        <table>
          <tr><td>Receita Total:</td><td>${formatarMoeda(receitaTotal)}</td></tr>
          <tr><td>Despesa Total:</td><td>${formatarMoeda(despesaTotal)}</td></tr>
          <tr class="total"><td>Saldo Final:</td><td>${formatarMoeda(saldoFinal)}</td></tr>
        </table>
      </body>
    </html>
  `);
  janela.document.close();
  janela.print();
}
