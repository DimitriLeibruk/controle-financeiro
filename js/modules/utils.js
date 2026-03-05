// =============================
// UTILITÁRIOS
// =============================

export function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

export function formatarDataBR(dataString) {
  if (!dataString) return "-";
  const dataLimpa = dataString.split("T")[0];
  const [ano, mes, dia] = dataLimpa.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarTipo(tipo) {
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

export function formatarTipoPDF(tipo) {
  switch (tipo) {
    case "receita":
      return "Receita";
    case "despesa":
      return "Despesa";
    case "despesa_fixa":
      return "Despesa Fixa";
    case "despesa_parcelada":
      return "Despesa Parcelada";
    default:
      return tipo;
  }
}
