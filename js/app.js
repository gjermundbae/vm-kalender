(function () {
  "use strict";

  const ICS_FILENAME = "vm-2026-mine-kamper.ics";
  const BTN_LABEL_DEFAULT = "Legg til i kalender";
  const BTN_LABEL_LOADING = "Lager fil …";
  const HINT_NEED_MATCH =
    "Velg en kamp i listen først!";
  const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

  const state = {
    sortMode: "time",
    selectedIds: new Set(),
  };

  const matchListEl = document.getElementById("match-list");
  const selectionCountEl = document.getElementById("selection-count");
  const selectionCountNumEl = document.getElementById("selection-count-num");
  const btnDownloadEl = document.getElementById("btn-download");
  const btnPosterEl = document.getElementById("btn-poster");
  const hintPosterEl = document.getElementById("hint-poster");
  const hintDownloadEl = document.getElementById("hint-download");
  const btnSelectAllEl = document.getElementById("btn-select-all");
  const sortButtons = document.querySelectorAll(".sort-toggle__btn");

  function allMatchesSelected() {
    return (
      window.MATCHES.length > 0 &&
      state.selectedIds.size === window.MATCHES.length
    );
  }

  function updateSelectAllButton() {
    const all = allMatchesSelected();
    btnSelectAllEl.textContent = all ? "Fjern alle" : "Velg alle";
    btnSelectAllEl.classList.toggle("is-all-selected", all);
    btnSelectAllEl.setAttribute("aria-pressed", String(all));
    btnSelectAllEl.title = all
      ? "Fjern markering på alle kamper"
      : "Marker alle kamper i listen";
  }

  function toggleSelectAll() {
    if (allMatchesSelected()) {
      state.selectedIds.clear();
    } else {
      for (const m of window.MATCHES) {
        state.selectedIds.add(m.id);
      }
    }
    updateChrome();
    render();
  }

  function updateChrome() {
    const n = state.selectedIds.size;
    selectionCountNumEl.textContent = String(n);
    selectionCountEl.hidden = n === 0;
    updateSelectAllButton();
    btnDownloadEl.disabled = n === 0;
    btnPosterEl.disabled = n === 0;
    syncActionHint(hintPosterEl, btnPosterEl, n === 0);
    syncActionHint(hintDownloadEl, btnDownloadEl, n === 0);
  }

  /** Disablede knapper får ikke hover — tipset sitter på wrapperen. */
  function syncActionHint(wrapEl, buttonEl, needsMatch) {
    if (needsMatch) {
      wrapEl.dataset.tip = HINT_NEED_MATCH;
      wrapEl.tabIndex = 0;
      buttonEl.removeAttribute("title");
    } else {
      delete wrapEl.dataset.tip;
      wrapEl.removeAttribute("tabindex");
      buttonEl.removeAttribute("title");
    }
  }

  function toggleSelection(id) {
    if (state.selectedIds.has(id)) {
      state.selectedIds.delete(id);
    } else {
      state.selectedIds.add(id);
    }
    updateChrome();
    render();
  }

  function render() {
    window.VMRender.renderList(
      matchListEl,
      window.MATCHES,
      state.sortMode,
      state.selectedIds,
      toggleSelection
    );
  }

  function setSortMode(mode) {
    state.sortMode = mode;
    sortButtons.forEach((btn) => {
      const active = btn.dataset.sort === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  /** UTC-basert ICS-tidsstempel "YYYYMMDDTHHMMSSZ" (RFC 5545). */
  function formatIcsUtc(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  }

  /** Escape iht. RFC 5545 §3.3.11 for TEXT-verdier. */
  function escapeIcsText(text) {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  /** Bryt linjer ved 75 oktetter (RFC 5545 §3.1). Forenklet: teller chars,
   *  som er trygt så lenge innholdet stort sett er ASCII + et lite knippe
   *  nordiske bokstaver. Fortsettelseslinjer starter med ett mellomrom. */
  function foldIcsLine(line) {
    if (line.length <= 75) return line;
    const out = [line.slice(0, 75)];
    for (let i = 75; i < line.length; i += 74) {
      out.push(" " + line.slice(i, i + 74));
    }
    return out.join("\r\n");
  }

  function buildIcs(matches) {
    const dtstamp = formatIcsUtc(new Date());
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//VM 2026//Mine kamper//NB",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:VM 2026 — mine kamper",
      "X-WR-TIMEZONE:Europe/Oslo",
    ];

    for (const m of matches) {
      const start = new Date(m.datetime);
      const end = new Date(start.getTime() + MATCH_DURATION_MS);
      const summary = `${m.home.name} – ${m.away.name}`;

      lines.push(
        "BEGIN:VEVENT",
        `UID:vm2026-${m.id}@vm-kalender`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${formatIcsUtc(start)}`,
        `DTEND:${formatIcsUtc(end)}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `LOCATION:${escapeIcsText(m.broadcaster)}`,
        `CATEGORIES:${escapeIcsText("Fotball-VM 2026")}`,
        "END:VEVENT"
      );
    }

    lines.push("END:VCALENDAR");
    return lines.map(foldIcsLine).join("\r\n") + "\r\n";
  }

  function downloadIcs() {
    if (state.selectedIds.size === 0) return;

    btnDownloadEl.disabled = true;
    btnDownloadEl.textContent = BTN_LABEL_LOADING;

    try {
      const selected = window.MATCHES
        .filter((m) => state.selectedIds.has(m.id))
        .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

      const ics = buildIcs(selected);
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = ICS_FILENAME;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } finally {
      btnDownloadEl.textContent = BTN_LABEL_DEFAULT;
      updateChrome();
    }
  }

  function openPoster() {
    if (state.selectedIds.size === 0) return;
    const selected = window.MATCHES.filter((m) => state.selectedIds.has(m.id));
    const ok = window.VMPoster.openPoster(selected);
    if (!ok) {
      // Popup-blokkering er den vanligste årsaken; gi en hjelpsom beskjed
      // i stedet for å feile stille.
      alert(
        "Vinduet ble blokkert av nettleseren. Tillat popup for denne siden, " +
        "så åpnes plakaten i en ny fane."
      );
    }
  }

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.sort !== state.sortMode) {
        setSortMode(btn.dataset.sort);
      }
    });
  });

  btnDownloadEl.textContent = BTN_LABEL_DEFAULT;
  btnDownloadEl.addEventListener("click", downloadIcs);
  btnPosterEl.addEventListener("click", openPoster);
  btnSelectAllEl.addEventListener("click", toggleSelectAll);

  updateChrome();
  render();
})();
