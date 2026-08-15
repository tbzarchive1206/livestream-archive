(() => {
  const all = Array.isArray(window.LIVESTREAMS)
    ? [...window.LIVESTREAMS].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)))
    : [];
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const normalize = (value = "") => String(value).toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const MEMBER_OPTIONS = [
    { value: "Sangyeon", label: "SANGYEON", aliases: ["sangyeon"] },
    { value: "Jacob", label: "JACOB", aliases: ["jacob"] },
    { value: "Younghoon", label: "YOUNGHOON", aliases: ["younghoon"] },
    { value: "Hyunjae", label: "HYUNJAE", aliases: ["hyunjae"] },
    { value: "Juyeon", label: "JUYEON", aliases: ["juyeon"] },
    { value: "Kevin", label: "KEVIN", aliases: ["kevin"] },
    { value: "Q", label: "Q", aliases: ["q", "changmin"] },
    { value: "Sunwoo", label: "SUNWOO", aliases: ["sunwoo"] },
    { value: "Eric", label: "ERIC", aliases: ["eric"] },
    { value: "Hwall", label: "HWALL (2017 - 2019)", aliases: ["hwall", "hur hyunjun", "hyunjun"] },
    { value: "Haknyeon", label: "HAKNYEON (2017 - 2025)", aliases: ["haknyeon", "ju haknyeon"] },
    { value: "New", label: "NEW (2017 - 2026)", aliases: ["new", "chanhee", "choi chanhee"] }
  ];

  const els = {
    cards: $("#cards"),
    search: $("#search"),
    year: $("#yearFilter"),
    member: $("#memberFilter"),
    platform: $("#platformFilter"),
    tabs: $("#yearTabs"),
    label: $("#resultsLabel"),
    empty: $("#empty"),
    more: $("#loadMore"),
    grid: $("#gridView"),
    list: $("#listView"),
    filterRow: $("#filterRow"),
    filterToggle: $("#filtersToggle"),
    dialog: $("#playerDialog"),
    player: $("#youtubePlayer"),
    playerTitle: $("#playerTitle")
  };

  const years = [...new Set(all.map((item) => Number(item.year)).filter(Number.isFinite))].sort((a, b) => b - a);
  const latestYear = years[0] || new Date().getFullYear();
  const platforms = [...new Set(all.map((item) => item.platform).filter((platform) => platform && platform !== "Not specified"))].sort();
  const state = { query: "", year: String(latestYear), member: "all", platform: "all", limit: 24, view: "grid" };

  function addOptions(select, values) {
    values.forEach((value) => select.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`));
  }

  addOptions(els.year, years);
  MEMBER_OPTIONS.forEach((member) => els.member.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(member.value)}">${escapeHtml(member.label)}</option>`));
  addOptions(els.platform, platforms);
  els.year.value = state.year;

  function buildTabs() {
    els.tabs.innerHTML = years.map((year) => `<button type="button" data-year="${year}" class="${String(year) === state.year ? "selected" : ""}">${year}</button>`).join("")
      + `<button type="button" data-year="all" class="${state.year === "all" ? "selected" : ""}">ALL</button>`;
  }

  function updateStats() {
    const newest = all.map((item) => item.date).filter(Boolean).sort().at(-1);
    const updated = newest
      ? new Date(`${newest}T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
      : String(latestYear);
    const stats = document.querySelectorAll(".stats p");
    stats[0].innerHTML = `<strong id="totalCount">${all.length.toLocaleString("en-US")}</strong> STREAMS`;
    stats[1].innerHTML = `2017—<strong id="lastYear">${latestYear}</strong>`;
    stats[2].innerHTML = `UPDATED <strong id="updatedDate">${updated}</strong>`;
  }

  function memberMatches(value, selectedMember) {
    if (selectedMember === "all") return true;
    if (/^all members$/i.test(String(value).trim())) return true;
    const option = MEMBER_OPTIONS.find((member) => member.value === selectedMember);
    if (!option) return false;
    const normalizedValue = ` ${normalize(value)} `;
    return option.aliases.some((alias) => normalizedValue.includes(` ${normalize(alias)} `));
  }

  function filtered() {
    const query = state.query.toLocaleLowerCase();
    return all.filter((item) => {
      const matchesQuery = !query || `${item.title} ${item.members}`.toLocaleLowerCase().includes(query);
      const matchesYear = state.year === "all" || String(item.year) === state.year;
      const matchesMember = memberMatches(item.members, state.member);
      const matchesPlatform = state.platform === "all" || item.platform === state.platform;
      return matchesQuery && matchesYear && matchesMember && matchesPlatform;
    });
  }

  function dateLabel(value) {
    if (!value) return "DATE UNKNOWN";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.valueOf())
      ? escapeHtml(value)
      : date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();
  }

  function youtubeId(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, "").toLocaleLowerCase();
      let candidate = "";
      if (host === "youtu.be") candidate = url.pathname.split("/").filter(Boolean)[0] || "";
      else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
        if (url.pathname === "/watch") candidate = url.searchParams.get("v") || "";
        else candidate = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] || "";
      }
      return /^[A-Za-z0-9_-]{6,20}$/.test(candidate) ? candidate : "";
    } catch {
      return "";
    }
  }

  function watchControl(item, videoId) {
    if (videoId) return `<button type="button" class="watch play-video" data-video-id="${escapeHtml(videoId)}" data-video-title="${escapeHtml(item.title)}">WATCH →</button>`;
    if (item.watch) return `<a class="watch" href="${escapeHtml(item.watch)}" target="_blank" rel="noreferrer">WATCH ↗</a>`;
    return `<span class="watch no-link">WATCH →</span>`;
  }

  function thumbnailControl(item, videoId, image) {
    if (videoId) return `<button type="button" class="thumb play-video" data-video-id="${escapeHtml(videoId)}" data-video-title="${escapeHtml(item.title)}" aria-label="Play ${escapeHtml(item.title)}">${image}</button>`;
    if (item.watch) return `<a class="thumb" href="${escapeHtml(item.watch)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(item.title)}">${image}</a>`;
    return `<div class="thumb">${image}</div>`;
  }

  function card(item) {
    const videoId = youtubeId(item.watch);
    const image = item.thumbnail ? `<img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : "";
    return `<article class="card">${thumbnailControl(item, videoId, image)}<div class="card-info"><span class="date">${dateLabel(item.date)}</span><h2>${escapeHtml(item.title)}</h2><div class="meta"><span>MEMBERS</span><b>${escapeHtml(item.members)}</b><span>PLATFORM</span><b>${escapeHtml(item.platform)}</b></div><div class="actions">${watchControl(item, videoId)}<button type="button" class="copy" data-link="${escapeHtml(item.watch || "")}">COPY LINK</button></div></div></article>`;
  }

  function render(reset = true) {
    if (reset) state.limit = 24;
    const list = filtered();
    const shown = list.slice(0, state.limit);
    els.cards.innerHTML = shown.map(card).join("");
    els.empty.hidden = list.length !== 0;
    els.more.hidden = shown.length >= list.length;
    els.label.textContent = `${state.year === "all" ? "ALL YEARS" : state.year} · ${list.length.toLocaleString("en-US")} ${list.length === 1 ? "STREAM" : "STREAMS"}`;
    els.tabs.querySelectorAll("button").forEach((button) => button.classList.toggle("selected", button.dataset.year === state.year));
    els.year.value = state.year;
  }

  function openPlayer(videoId, title) {
    els.playerTitle.textContent = title || "LIVESTREAM";
    els.player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
    els.dialog.showModal();
    document.body.classList.add("player-open");
  }

  function closePlayer() {
    els.dialog.close();
  }

  let searchTimer;
  els.search.addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.query = event.target.value.trim(); render(); }, 120);
  });
  els.year.addEventListener("change", (event) => { state.year = event.target.value; render(); });
  els.member.addEventListener("change", (event) => { state.member = event.target.value; render(); });
  els.platform.addEventListener("change", (event) => { state.platform = event.target.value; render(); });
  els.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-year]");
    if (!button) return;
    state.year = button.dataset.year;
    render();
  });
  els.more.addEventListener("click", () => { state.limit += 24; render(false); });
  els.cards.addEventListener("click", async (event) => {
    const playButton = event.target.closest(".play-video");
    if (playButton) {
      openPlayer(playButton.dataset.videoId, playButton.dataset.videoTitle);
      return;
    }
    const copyButton = event.target.closest(".copy");
    if (!copyButton || !copyButton.dataset.link) return;
    try {
      await navigator.clipboard.writeText(copyButton.dataset.link);
      copyButton.classList.add("done");
      setTimeout(() => copyButton.classList.remove("done"), 1500);
    } catch {
      prompt("Copy this link:", copyButton.dataset.link);
    }
  });

  function setView(view) {
    state.view = view;
    els.cards.classList.toggle("list-view", view === "list");
    els.grid.classList.toggle("selected", view === "grid");
    els.list.classList.toggle("selected", view === "list");
  }

  els.grid.addEventListener("click", () => setView("grid"));
  els.list.addEventListener("click", () => setView("list"));
  els.filterToggle.addEventListener("click", () => {
    const closed = els.filterRow.classList.toggle("closed");
    els.filterToggle.setAttribute("aria-expanded", String(!closed));
    els.filterToggle.querySelector("b").textContent = closed ? "⌄" : "⌃";
  });
  $("#closePlayer").addEventListener("click", closePlayer);
  els.dialog.addEventListener("click", (event) => { if (event.target === els.dialog) closePlayer(); });
  els.dialog.addEventListener("close", () => {
    els.player.src = "about:blank";
    document.body.classList.remove("player-open");
  });

  document.documentElement.lang = "en";
  updateStats();
  buildTabs();
  render(false);
})();
