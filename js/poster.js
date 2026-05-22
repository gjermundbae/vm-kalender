(function () {
  "use strict";

  const MONTHS_NB = [
    "januar", "februar", "mars", "april", "mai", "juni",
    "juli", "august", "september", "oktober", "november", "desember",
  ];

  /** Henter ukedag i norsk via Intl, men låst til Europe/Oslo-tidssonen.
   *  Uten dette ville en bruker i et annet tidsbelte få feil ukedag fordi
   *  Date#getDay bruker lokal tidssone. */
  const WEEKDAY_FMT = new Intl.DateTimeFormat("nb-NO", {
    weekday: "long",
    timeZone: "Europe/Oslo",
  });

  /** Pastellpaletten kortene roterer gjennom. Mettet nok til å føles "lekent",
   *  dempet nok til at svart tekst leses godt – også på print. */
  const CARD_PALETTE = [
    { bg: "#ffe5b4", ink: "#3a2a0e" }, // fersken
    { bg: "#cdeac0", ink: "#1f3a1a" }, // mynte
    { bg: "#c7e3ff", ink: "#0f2a4a" }, // himmel
    { bg: "#ffd1dc", ink: "#3a1622" }, // bubblegum
    { bg: "#fff3a8", ink: "#3a2f0a" }, // sitron
    { bg: "#e2d4ff", ink: "#2a1f4a" }, // lavendel
  ];

  /** Små, deterministiske rotasjoner per kort gir polaroid-følelse uten å
   *  bli urolig. Avhenger av kort-indeks slik at samme plakat ser lik ut
   *  hver gang den lages. */
  function tiltForIndex(i) {
    const sequence = [-1.6, 1.1, -0.8, 1.7, -1.3, 0.9, -1.9, 1.4];
    return sequence[i % sequence.length];
  }

  function paletteForIndex(i) {
    return CARD_PALETTE[i % CARD_PALETTE.length];
  }

  /** Bygger "torsdag 11. juni" e.l. Vi bruker dataens dateLabel for selve
   *  datodelen (allerede i norsk tid) og henter bare ukedagen ut fra
   *  datetime-stempelet. */
  function formatLongDate(match) {
    const weekday = WEEKDAY_FMT.format(new Date(match.datetime));
    return `${weekday} ${match.dateLabel}`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderMatchCard(match, index) {
    const palette = paletteForIndex(index);
    const tilt = tiltForIndex(index);
    const hf = window.VMRender.flagEmoji(match.home.code);
    const af = window.VMRender.flagEmoji(match.away.code);
    const longDate = formatLongDate(match);

    return `
      <li class="match"
          style="--card-bg:${palette.bg};--card-ink:${palette.ink};--tilt:${tilt}deg">
        <div class="match__sticker" aria-hidden="true">${stickerForIndex(index)}</div>
        <div class="match__when">
          <div class="match__date">${escapeHtml(longDate)}</div>
          <div class="match__time">${escapeHtml(match.timeLabel)}</div>
        </div>
        <div class="match__main">
          <div class="match__teams">
            <span class="match__flag" aria-hidden="true">${hf}</span>
            <span class="match__team">${escapeHtml(match.home.name)}</span>
            <span class="match__vs">vs</span>
            <span class="match__team">${escapeHtml(match.away.name)}</span>
            <span class="match__flag" aria-hidden="true">${af}</span>
          </div>
          <div class="match__meta">
            <span class="pill pill--group">Pulje ${escapeHtml(match.group)}</span>
            <span class="match__dot" aria-hidden="true">•</span>
            <span>${escapeHtml(match.venue)}</span>
            <span class="match__dot" aria-hidden="true">•</span>
            <span class="match__channel">${escapeHtml(match.broadcaster)}</span>
          </div>
        </div>
      </li>
    `;
  }

  const STICKERS = ["⚽", "🏆", "🥅", "🎉", "🌟", "🔥", "🎯", "🙌"];
  function stickerForIndex(i) {
    return STICKERS[i % STICKERS.length];
  }

  function renderConfetti() {
    // Faste, "tilfeldige" punkter — deterministisk så plakaten ser lik ut
    // hver gang. Posisjoner i prosent av plakaten.
    const dots = [
      { top: 4,  left: 6,  color: "#ff7a59", size: 14, shape: "circle" },
      { top: 7,  left: 92, color: "#4ec1c9", size: 18, shape: "triangle" },
      { top: 12, left: 50, color: "#ffd83d", size: 10, shape: "circle" },
      { top: 22, left: 3,  color: "#b266ff", size: 12, shape: "square" },
      { top: 33, left: 96, color: "#ff7a59", size: 10, shape: "circle" },
      { top: 48, left: 2,  color: "#4ec1c9", size: 14, shape: "circle" },
      { top: 60, left: 97, color: "#ffd83d", size: 16, shape: "triangle" },
      { top: 72, left: 4,  color: "#ff5da2", size: 12, shape: "square" },
      { top: 84, left: 95, color: "#4ec1c9", size: 12, shape: "circle" },
      { top: 92, left: 8,  color: "#ffd83d", size: 14, shape: "circle" },
      { top: 96, left: 88, color: "#ff7a59", size: 12, shape: "triangle" },
    ];
    return dots
      .map(
        (d) =>
          `<span class="confetti__dot confetti__dot--${d.shape}"
                  style="top:${d.top}%;left:${d.left}%;--c:${d.color};--s:${d.size}px"
                  aria-hidden="true"></span>`
      )
      .join("");
  }

  function buildPosterHtml(matches, opts) {
    const sorted = [...matches].sort(
      (a, b) => new Date(a.datetime) - new Date(b.datetime)
    );
    const cards = sorted.map(renderMatchCard).join("");
    const generatedAt = new Date();
    const generatedLabel =
      `${generatedAt.getDate()}. ${MONTHS_NB[generatedAt.getMonth()]} ` +
      `${generatedAt.getFullYear()}`;
    const matchCount = sorted.length;
    const matchWord = matchCount === 1 ? "kamp" : "kamper";

    // Vi åpner popupen via window.open("") + document.write, så base-URL
    // er "about:blank" og relative <script src>-stier funker ikke. Vi sender
    // derfor inn opener-URL-en og bruker den som <base>.
    const baseHref = (opts && opts.baseHref) || "";
    const baseTag = baseHref ? `<base href="${escapeHtml(baseHref)}">` : "";

    return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${baseTag}
<title>Min VM-plakat</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- crossorigin på selve stylesheeten er viktig: ellers blokkerer browseren
     html-to-image fra å lese CSS-reglene når den lager PNG-en, og fontene
     blir ikke embeddet i bildet. -->
<link rel="stylesheet" crossorigin href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;800&display=swap">
<style>
  :root {
    --paper: #fff6df;
    --paper-edge: #f3e7c3;
    --ink: #1d2233;
    --ink-soft: #5a5567;
    --accent: #ff5d4d;
    --accent-2: #2bb673;
    --accent-3: #2a6df4;
    --font-display: "Fredoka", "Avenir Next", "Trebuchet MS", system-ui, sans-serif;
    --font-body: "Nunito", "Avenir Next", "Segoe UI", system-ui, sans-serif;
  }

  * { box-sizing: border-box; }

  html, body { margin: 0; padding: 0; }

  body {
    font-family: var(--font-body);
    color: var(--ink);
    background:
      radial-gradient(circle at 20% 10%, #ffe9b3 0, transparent 45%),
      radial-gradient(circle at 90% 80%, #d6f1ff 0, transparent 50%),
      #faf3df;
    min-height: 100vh;
    padding: 2rem 1rem 4rem;
    -webkit-font-smoothing: antialiased;
  }

  /* === Topbar med handlingsknapper (skjules ved print) === */
  .topbar {
    max-width: 820px;
    margin: 0 auto 1.25rem;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .topbar__hint {
    margin-right: auto;
    font-size: 0.875rem;
    color: var(--ink-soft);
    font-weight: 600;
  }

  .btn {
    appearance: none;
    border: none;
    padding: 0.65rem 1.1rem;
    border-radius: 999px;
    font: inherit;
    font-weight: 800;
    font-size: 0.9rem;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
  }

  .btn--primary {
    background: var(--ink);
    color: #fff7e2;
    box-shadow: 0 4px 0 #000;
  }
  .btn--primary:hover { transform: translateY(-1px); box-shadow: 0 5px 0 #000; }
  .btn--primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #000; }

  .btn--ghost {
    background: transparent;
    color: var(--ink);
    border: 2px solid var(--ink);
  }
  .btn--ghost:hover { background: var(--ink); color: #fff7e2; }

  .btn:disabled {
    opacity: 0.55;
    cursor: progress;
    transform: none;
  }
  .btn--primary:disabled { box-shadow: 0 4px 0 #000; }

  /* === Selve plakaten === */
  .poster {
    position: relative;
    max-width: 820px;
    margin: 0 auto;
    padding: 3.5rem 2.5rem 2.5rem;
    background: var(--paper);
    background-image:
      radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px);
    background-size: 18px 18px;
    border-radius: 18px;
    box-shadow:
      0 1px 0 var(--paper-edge),
      0 30px 60px -30px rgba(20, 20, 40, 0.35);
    overflow: hidden;
  }

  /* Konfettidekor i bakgrunnen */
  .confetti { position: absolute; inset: 0; pointer-events: none; }
  .confetti__dot {
    position: absolute;
    width: var(--s);
    height: var(--s);
    background: var(--c);
    opacity: 0.85;
  }
  .confetti__dot--circle  { border-radius: 50%; }
  .confetti__dot--square  { border-radius: 3px; transform: rotate(15deg); }
  .confetti__dot--triangle {
    background: transparent;
    width: 0; height: 0;
    border-left: calc(var(--s) / 2) solid transparent;
    border-right: calc(var(--s) / 2) solid transparent;
    border-bottom: var(--s) solid var(--c);
  }

  .poster__header {
    position: relative;
    text-align: center;
    margin-bottom: 2rem;
  }

  .poster__pre {
    display: inline-block;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--accent);
    transform: rotate(-3deg);
    letter-spacing: 0.05em;
  }

  .poster__title {
    margin: 0.2rem 0 0.35rem;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(2.6rem, 8vw, 4.4rem);
    line-height: 0.95;
    letter-spacing: -0.02em;
    color: var(--ink);
    transform: rotate(-1.5deg);
    text-shadow: 4px 4px 0 #ffd83d;
  }

  .poster__title .ball {
    display: inline-block;
    transform: rotate(20deg);
    margin-left: 0.3rem;
  }

  .poster__sub {
    font-family: var(--font-display);
    font-weight: 500;
    font-size: 1rem;
    color: var(--ink-soft);
    max-width: 30rem;
    margin: 0.5rem auto 0;
  }

  .poster__sub strong {
    color: var(--ink);
    font-weight: 700;
  }

  /* === Kampkort === */
  .matches {
    position: relative;
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 1rem;
  }

  .match {
    position: relative;
    display: grid;
    grid-template-columns: 7.5rem 1fr;
    gap: 0.75rem;
    align-items: stretch;
    padding: 0.95rem 1.1rem;
    background: var(--card-bg, #fff);
    color: var(--card-ink, var(--ink));
    border-radius: 14px;
    border: 2.5px solid var(--ink);
    box-shadow: 4px 4px 0 var(--ink);
    transform: rotate(var(--tilt, 0deg));
    break-inside: avoid;
  }

  .match__sticker {
    position: absolute;
    top: -14px;
    right: -10px;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    background: var(--paper);
    border: 2.5px solid var(--ink);
    border-radius: 50%;
    font-size: 18px;
    transform: rotate(calc(var(--tilt, 0deg) * -1.5));
    box-shadow: 2px 2px 0 var(--ink);
  }

  .match__when {
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-right: 2px dashed currentColor;
    padding-right: 0.75rem;
  }

  .match__date {
    font-family: var(--font-body);
    font-weight: 800;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.78;
    line-height: 1.2;
  }

  .match__time {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 2rem;
    line-height: 1;
    margin-top: 0.2rem;
    letter-spacing: -0.01em;
  }

  .match__main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.45rem;
    min-width: 0;
  }

  .match__teams {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.55rem;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 1.25rem;
    line-height: 1.1;
  }

  .match__flag {
    font-size: 1.4rem;
    line-height: 1;
  }

  .match__vs {
    font-family: var(--font-body);
    font-weight: 800;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.65;
    padding: 0 0.15rem;
  }

  .match__meta {
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.85rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    opacity: 0.85;
  }

  .match__dot { opacity: 0.5; }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 0.12rem 0.55rem;
    border-radius: 999px;
    background: rgba(0,0,0,0.12);
    font-weight: 800;
    font-size: 0.78rem;
    letter-spacing: 0.02em;
  }

  /* === Bunntekst === */
  .poster__footer {
    position: relative;
    margin-top: 2.5rem;
    text-align: center;
    font-family: var(--font-display);
  }

  .signoff {
    font-weight: 700;
    font-size: 1.6rem;
    transform: rotate(-1deg);
    display: inline-block;
    background: var(--ink);
    color: #fff7e2;
    padding: 0.4rem 1.1rem;
    border-radius: 999px;
    box-shadow: 4px 4px 0 var(--accent);
  }

  .meta {
    margin-top: 0.85rem;
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.78rem;
    color: var(--ink-soft);
  }

  /* === Tom tilstand === */
  .empty {
    text-align: center;
    padding: 2rem 1rem;
    font-family: var(--font-display);
    color: var(--ink-soft);
  }

  /* === Print ===
   * Mål: ingen browser-marger/headers/footers ødelegger plakaten. Vi setter
   * @page margin til 0 og lar plakaten dekke hele arket, men beholder noen
   * mm "trygg sone" innvendig så ingen printer-hardware-marger kapper noe. */
  @page {
    size: A4 portrait;
    margin: 0;
  }

  @media print {
    .no-print { display: none !important; }

    html, body {
      background: var(--paper);
      padding: 0;
      margin: 0;
    }

    .poster {
      max-width: none;
      width: 100%;
      min-height: 100vh;
      margin: 0;
      /* ~6mm intern padding er nok luft til at hardware-marger ikke
       * spiser innhold, og holder seg under nettleserens advarsler. */
      padding: 12mm 10mm;
      border-radius: 0;
      box-shadow: none;
      background-image: none;
      background: var(--paper);
      /* Tving fargeutskrift – mange nettlesere fjerner ellers bakgrunner. */
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .match {
      box-shadow: 2.5px 2.5px 0 var(--ink);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Klistremerket henger normalt OVER kortets boks (top:-14px, right:-10px),
     * noe som ser fint ut på skjerm men gjør at sideskifte i print klipper
     * stickeren halvveis – siden break-inside: avoid bare beskytter selve
     * kortets bounding-box. Flytt stickeren inn i boksen for print. */
    .match__sticker {
      top: 6px;
      right: 6px;
      box-shadow: none;
      width: 32px;
      height: 32px;
      font-size: 15px;
    }

    .signoff {
      box-shadow: 2.5px 2.5px 0 var(--accent);
    }
  }

  /* Mobil-preview */
  @media (max-width: 600px) {
    .poster { padding: 2rem 1.1rem 1.5rem; }
    .match { grid-template-columns: 5.5rem 1fr; padding: 0.8rem 0.9rem; }
    .match__time { font-size: 1.6rem; }
    .match__teams { font-size: 1.05rem; }
    .poster__title { text-shadow: 3px 3px 0 #ffd83d; }
  }
</style>
</head>
<body>

<div class="topbar no-print">
  <span class="topbar__hint">Velg «Last ned» for bilde til kjøleskap/melding, eller «Skriv ut» for papir/PDF.</span>
  <button class="btn btn--ghost" type="button" onclick="window.close()">Lukk</button>
  <button class="btn btn--ghost" type="button" id="btn-print" onclick="window.print()">Skriv ut</button>
  <button class="btn btn--primary" type="button" id="btn-png">Last ned som bilde</button>
</div>

<article class="poster">
  <div class="confetti" aria-hidden="true">${renderConfetti()}</div>

  <header class="poster__header">
    <div class="poster__pre">min helt egen</div>
    <h1 class="poster__title">VM-PLAN<span class="ball">⚽</span></h1>
    <p class="poster__sub">
      Fotball-VM 2026 i USA, Canada og Mexico —
      <strong>${matchCount} ${matchWord}</strong> jeg <em>ikke</em> har lov å gå glipp av!
    </p>
  </header>

  ${
    sorted.length === 0
      ? `<div class="empty">Du har ikke valgt noen kamper enda. Lukk og velg minst én!</div>`
      : `<ol class="matches">${cards}</ol>`
  }

  <footer class="poster__footer">
    <div class="signoff">Heia! ⚽ 🎉</div>
    <div class="meta">Laget ${escapeHtml(generatedLabel)} med VM-kalenderen</div>
  </footer>
</article>

<script src="js/vendor/html-to-image.js"></script>
<script>
(function () {
  // Hyggelig navn på print-jobben / nedlasta fil.
  document.title = "Min VM-plakat";

  const btn = document.getElementById("btn-png");
  const printBtn = document.getElementById("btn-print");
  const DEFAULT_LABEL = btn.textContent;

  function setBusy(busy) {
    btn.disabled = busy;
    printBtn.disabled = busy;
    btn.textContent = busy ? "Lager bilde …" : DEFAULT_LABEL;
  }

  async function downloadPng() {
    if (!window.htmlToImage) {
      alert("Kunne ikke laste bildemotoren. Sjekk nettverket og prøv igjen.");
      return;
    }
    setBusy(true);
    try {
      // Vent på at custom-fontene faktisk er klare før vi snapshoter,
      // ellers ender vi opp med fallback-typografi i bildet.
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const node = document.querySelector(".poster");

      // html-to-image har en kjent quirk med sentrerte/posisjonerte noder:
      // hvis vi ikke eksplisitt angir width/height og overstyrer margin,
      // ender innholdet ofte skjøvet til siden i bildet. Vi bruker derfor
      // bounding-rect-en til noden + en style-override som nuller margin
      // og evt. transform under selve snapshottingen.
      const rect = node.getBoundingClientRect();
      const blob = await window.htmlToImage.toBlob(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#fff6df",
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
        style: {
          margin: "0",
          transform: "none",
          maxWidth: "none",
        },
      });
      if (!blob) throw new Error("tom blob");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "min-vm-plakat.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      console.error(err);
      alert("Klarte ikke lage bildet: " + (err && err.message ? err.message : err));
    } finally {
      setBusy(false);
    }
  }

  btn.addEventListener("click", downloadPng);
})();
</script>

</body>
</html>`;
  }

  /**
   * Åpne en selvstendig plakat-side i en ny fane, populer den, og la
   * brukeren printe eller lagre som PDF derfra. Returnerer true ved
   * suksess, false hvis nettleseren blokkerte popupen.
   * @param {Array} matches
   */
  function openPoster(matches) {
    // Popupen er about:blank, så vi må gi den en eksplisitt base-URL for at
    // relative <script src> (html-to-image-biblioteket) skal kunne lastes.
    const baseHref = new URL(".", window.location.href).href;
    const html = buildPosterHtml(matches, { baseHref });
    const win = window.open("", "_blank");
    if (!win) return false;
    win.document.open();
    win.document.write(html);
    win.document.close();
    return true;
  }

  window.VMPoster = { openPoster, buildPosterHtml };
})();
