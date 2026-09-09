const state = { data: null, ranking: "goals" };

const formatDate = (date, options = {}) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(new Date(date + "T12:00:00Z"));

const safeNumber = (value) => value ?? "—";
const signed = (value) => (value > 0 ? `+${value}` : String(value));

function renderHero(data) {
  document.querySelector("#current-season-label").textContent = data.currentSeason;
  document.querySelector("#season-title").textContent = data.currentSeason;
  const match = data.latestMatch;
  const card = document.querySelector("#latest-match");
  if (!match) {
    card.innerHTML = '<p class="empty-state">Aún no hay resultados registrados.</p>';
    return;
  }
  card.innerHTML = `
    <div class="latest-label"><span>Último resultado</span><span>${formatDate(match.date)}</span></div>
    <div class="scoreline">
      <span class="score-team">${match.home}</span>
      <span class="score"><b>${match.homeGoals}</b><small>–</small><b>${match.awayGoals}</b></span>
      <span class="score-team">${match.away}</span>
    </div>
    <p class="latest-meta">${match.phase} · ${match.time} h</p>
  `;

  const next = data.nextMatch;
  const nextCard = document.querySelector("#next-match");
  if (!next) {
    nextCard.innerHTML = '<p class="empty-state">Próximo partido por confirmar.</p>';
    return;
  }
  nextCard.innerHTML = `
    <div class="next-label"><span>Próximo partido</span><span>J${next.matchday}</span></div>
    <div class="next-rival"><span aria-hidden="true">⚽</span> J${next.matchday} · vs ${next.rival}</div>
    <p class="next-meta">${formatDate(next.date, { weekday: "long" })} · ${next.time} h</p>
    <div class="grill-duty"><span>Asador</span><strong>${next.asador}</strong></div>
  `;
}

function renderSeason(data) {
  const item = data.current;
  const metrics = [
    ["PJ", item.played],
    ["Ganados", item.won],
    ["Empates", item.drawn],
    ["Perdidos", item.lost],
    ["GF / GC", `${item.gf} / ${item.ga}`],
    ["Diferencia", signed(item.gd)],
  ];
  document.querySelector("#season-metrics").innerHTML = metrics.map(([label, value]) =>
    `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`
  ).join("");

  const total = Math.max(item.played, 1);
  document.querySelector("#record-bar").innerHTML = `
    <span class="bar-win" style="width:${item.won / total * 100}%"></span>
    <span class="bar-draw" style="width:${item.drawn / total * 100}%"></span>
    <span class="bar-loss" style="width:${item.lost / total * 100}%"></span>
  `;
}

function renderPlayers(data) {
  const players = data.currentPlayers;
  const top = players[0];
  document.querySelector("#top-scorer").innerHTML = top ? `
    <span class="leader-badge">● Líder goleador</span>
    <div class="leader-number">${top.goals}</div>
    <h3 class="leader-name">${top.player}</h3>
    <p class="leader-detail">${top.assists} asistencia${top.assists === 1 ? "" : "s"} · ${top.played} PJ</p>
  ` : '<p class="empty-state">Sin estadísticas individuales.</p>';

  document.querySelector("#current-player-rows").innerHTML = players.map((player) => `
    <tr>
      <td>${player.player}</td>
      <td>${player.played}</td>
      <td><strong>${player.goals}</strong></td>
      <td>${player.assists}</td>
      <td>${player.goals + player.assists}</td>
    </tr>
  `).join("");
}

function renderRanking(data) {
  const metric = state.ranking;
  const label = metric === "goals" ? "goles" : "asistencias";
  const ranked = [...data.allTimePlayers]
    .sort((a, b) => b[metric] - a[metric] || b.played - a.played || a.player.localeCompare(b.player, "es"))
    .slice(0, 8);
  document.querySelector("#all-time-ranking").innerHTML = ranked.map((player) => `
    <li class="ranking-item">
      <span class="ranking-name">${player.player}</span>
      <span class="ranking-value">${player[metric]} <small>${label}</small></span>
    </li>
  `).join("");
}

function renderHistory(data) {
  document.querySelector("#season-history").innerHTML = [...data.seasons].reverse().map((season) => `
    <article class="season-card ${season.season === data.currentSeason ? "current" : ""}">
      <div>
        <h3>${season.season}</h3>
        <p>${season.finish} · ${season.gf} GF / ${season.ga} GC</p>
      </div>
      <div class="season-record">
        <strong>${season.won}–${season.drawn}–${season.lost}</strong>
        <span>G · E · P</span>
      </div>
    </article>
  `).join("");
}

function renderResults(data, season) {
  const matches = data.matches.filter((match) => match.season === season);
  const list = document.querySelector("#results-list");
  if (!matches.length) {
    list.innerHTML = '<div class="empty-state">No hay resultados para esta temporada.</div>';
    return;
  }
  list.innerHTML = matches.map((match) => `
    <article class="result-row">
      <time class="result-date" datetime="${match.date}">${formatDate(match.date, { year: undefined })}</time>
      <span class="result-team">${match.home}</span>
      <span class="result-score"><b>${match.homeGoals}</b><span>–</span><b>${match.awayGoals}</b></span>
      <span class="result-team away">${match.away}</span>
      <span class="result-pill result-${match.result}" title="${match.result === "G" ? "Ganado" : match.result === "E" ? "Empatado" : "Perdido"}">${match.result}</span>
    </article>
  `).join("");
}

function initFilters(data) {
  const select = document.querySelector("#season-filter");
  select.innerHTML = [...data.seasons].reverse().map((season) =>
    `<option value="${season.season}">${season.season}</option>`
  ).join("");
  select.value = data.currentSeason;
  select.addEventListener("change", () => renderResults(data, select.value));
  renderResults(data, data.currentSeason);

  document.querySelectorAll("[data-ranking]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ranking = button.dataset.ranking;
      document.querySelectorAll("[data-ranking]").forEach((item) => item.classList.toggle("active", item === button));
      renderRanking(data);
    });
  });
}

function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#site-nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));
}

async function init() {
  initNavigation();
  try {
    const response = await fetch("data/stats.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudieron cargar los datos");
    const data = await response.json();
    state.data = data;
    renderHero(data);
    renderSeason(data);
    renderPlayers(data);
    renderRanking(data);
    renderHistory(data);
    initFilters(data);
    const updated = `Actualizado ${formatDate(data.updatedAt)}`;
    document.querySelector("#updated-at").textContent = updated;
    document.querySelector("#footer-update").textContent = updated;
  } catch (error) {
    document.querySelector("main").innerHTML = `<section class="section"><div class="empty-state"><strong>No pudimos cargar las estadísticas.</strong><br>Intenta actualizar la página.</div></section>`;
    console.error(error);
  }
}

init();
