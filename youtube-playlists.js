(() => {
  const cards = [...document.querySelectorAll(".playlist-player[data-playlist]")];
  if (!cards.length) return;

  const players = [];

  function revealWhenReady(card, player) {
    let playlist = [];
    try {
      playlist = player.getPlaylist() || [];
    } catch (_) {
      return;
    }

    if (playlist.length > 0) {
      card.classList.add("has-videos");
      card.setAttribute("aria-label", "Reproductor de playlist de YouTube");
      card.querySelector(".playlist-embed")?.setAttribute("aria-hidden", "false");
    }
  }

  function buildPlayers() {
    cards.forEach((card, index) => {
      const target = card.querySelector(".playlist-embed");
      const playlistId = card.dataset.playlist;
      if (!target || !playlistId) return;

      target.id = `youtube-playlist-${index + 1}`;
      const player = new YT.Player(target.id, {
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          listType: "playlist",
          list: playlistId,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: event => revealWhenReady(card, event.target),
          onStateChange: event => revealWhenReady(card, event.target)
        }
      });
      players.push({ card, player, playlistId });
    });

    window.setInterval(() => {
      players.forEach(({ card, player, playlistId }) => {
        if (card.classList.contains("has-videos")) return;
        try {
          player.cuePlaylist({ listType: "playlist", list: playlistId });
          window.setTimeout(() => revealWhenReady(card, player), 2500);
        } catch (_) {
          // YouTube may still be initializing; the next check will retry.
        }
      });
    }, 60000);
  }

  window.onYouTubeIframeAPIReady = buildPlayers;

  if (window.YT?.Player) {
    buildPlayers();
  } else {
    const api = document.createElement("script");
    api.src = "https://www.youtube.com/iframe_api";
    api.async = true;
    document.head.appendChild(api);
  }
})();
