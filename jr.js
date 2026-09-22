function monterreyWallTime(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now).map((part) => [part.type, part.value]));

  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
}

function matchEndTime(card) {
  const [year, month, day] = card.dataset.date.split("-").map(Number);
  const [hour, minute] = card.dataset.time.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) + 60 * 60 * 1000;
}

function updateNextJuniorMatch(now = new Date()) {
  const cards = [...document.querySelectorAll(".jr-match-card[data-date]")];
  const currentTime = monterreyWallTime(now);
  const next = cards
    .filter((card) => !card.dataset.result && matchEndTime(card) > currentTime)
    .sort((a, b) => matchEndTime(a) - matchEndTime(b))[0] ?? null;

  cards.forEach((card) => {
    if (card.dataset.result) return;
    const isNext = card === next;
    card.classList.toggle("is-next", isNext);
    const status = card.querySelector(".jr-match-meta b");
    if (status) status.textContent = isNext ? "Próximo" : "Programado";
  });
}

updateNextJuniorMatch();
setInterval(updateNextJuniorMatch, 60_000);
