// =============================
// CALENDÁRIO - Navegação de meses
// =============================

import { state } from './state.js';

export function atualizarDisplayMes() {
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  document.getElementById("currentMonthDisplay").textContent =
    `${meses[state.mesAtual]} ${state.anoAtual}`;
}

export function renderizarCalendario(onMonthSelect) {
  const grid = document.getElementById("calendarGrid");
  const yearDisplay = document.getElementById("calendarYearDisplay");
  const dropdown = document.getElementById("calendarDropdown");
  grid.innerHTML = "";

  if (state.modoCalendario === "mes") {
    yearDisplay.textContent = state.anoAtual;
    const mesesAbrev = [
      "jan", "fev", "mar", "abr", "mai", "jun",
      "jul", "ago", "set", "out", "nov", "dez"
    ];

    mesesAbrev.forEach((mes, index) => {
      const div = document.createElement("div");
      div.classList.add("calendar-item");
      if (index === state.mesAtual) div.classList.add("active");
      div.textContent = mes;
      div.addEventListener("click", () => {
        state.mesAtual = index;
        dropdown.classList.add("hidden");
        onMonthSelect();
      });
      grid.appendChild(div);
    });
  } else {
    renderizarAnos(onMonthSelect);
  }
}

export function renderizarAnos(onMonthSelect) {
  const grid = document.getElementById("calendarGrid");
  const yearDisplay = document.getElementById("calendarYearDisplay");
  const dropdown = document.getElementById("calendarDropdown");
  grid.innerHTML = "";

  yearDisplay.textContent = "Selecione o Ano";
  const anoBase = state.anoAtual - 4;

  for (let i = 0; i < 9; i++) {
    const ano = anoBase + i;
    const div = document.createElement("div");
    div.classList.add("calendar-item");
    if (ano === state.anoAtual) div.classList.add("active");
    div.textContent = ano;
    div.addEventListener("click", () => {
      state.anoAtual = ano;
      state.modoCalendario = "mes";
      renderizarCalendario(onMonthSelect);
      onMonthSelect();
    });
    grid.appendChild(div);
  }
}
