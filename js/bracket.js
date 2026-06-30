// Tosidig sluttspilltre (bracket-view).
//
// Treet utledes fra dataene: hver sluttspillkamp har et `matchNumber` og
// plassholdere som «Vinner kamp 73» / «Taper kamp 101». Ved å parse disse får vi
// alle foreldre↔barn-relasjoner, og dermed rundene og de to halvdelene som
// konvergerer mot finalen i midten.
//
// Layout: ett CSS-grid med eksplisitte rad-span per runde. R32-celler spenner 2
// basisrader, R16 4, QF 8, SF 16 — det sentrerer hver runde deterministisk mellom
// sine to matere, så albue-konnektorene kan tegnes med rene prosent/rad-forhold
// uten JS-måling.

(function () {
  "use strict";

  const LEAF_SPAN = 2; // basisrader per R32-kamp

  /** Kort rundenavn i treet — nummereres per runde (32-dels 1, Kvartfinale 1 …)
   *  i stedet for det globale kampnummeret. Finale/bronse er enkeltkamper. */
  const ROUND_LABEL = {
    R32: "16-dels",
    R16: "8-dels",
    QF: "Kvartfinale",
    SF: "Semifinale",
    FINAL: "Finale",
    BRONZE: "Bronsefinale",
  };

  /** matchNumber → visningsnavn, nummerert etter treets rekkefølge: per runde
   *  ovenfra og ned, venstre halvdel før høyre. Tar de utlagte cellene (med side
   *  + rowStart) slik at f.eks. den øverste 32-delskampen blir «32-dels 1». */
  function buildLabels(cells) {
    const sideRank = { left: 0, right: 1 };
    const byRound = new Map();
    for (const c of cells) {
      if (!byRound.has(c.match.round)) byRound.set(c.match.round, []);
      byRound.get(c.match.round).push(c);
    }
    const labels = new Map();
    for (const [round, list] of byRound) {
      list.sort(
        (a, b) => sideRank[a.side] - sideRank[b.side] || a.rowStart - b.rowStart
      );
      const base = ROUND_LABEL[round] || round;
      list.forEach((c, i) => {
        labels.set(
          c.match.matchNumber,
          list.length > 1 ? base + " " + (i + 1) : base
        );
      });
    }
    return labels;
  }

  /** Skriv om plassholdere «Vinner kamp 74» → «Vinner 32-dels 1» med treets
   *  egne rundenavn. Andre plassholdere (puljer, plasseringer) står urørt. */
  function placeholderName(t, labels) {
    const hit = /^(Vinner|Taper)\s+kamp\s+(\d+)$/i.exec(t.name || "");
    if (hit) {
      const lbl = labels.get(Number(hit[2]));
      if (lbl) return hit[1] + " " + lbl;
    }
    return t.name;
  }

  /** Kolonne (1-indeksert) per runde og side. Midtkolonnen (5) er finale/bronse. */
  function colFor(round, side) {
    const left = { R32: 1, R16: 2, QF: 3, SF: 4 };
    const right = { SF: 6, QF: 7, R16: 8, R32: 9 };
    return (side === "left" ? left : right)[round];
  }

  /** Materkampnummeret en side peker på. Enten via en plassholder («… kamp 73»
   *  → 73) eller via `from` på et avklart lag som har avansert fra den kampen. */
  function feederNumber(side) {
    if (!side) return null;
    if (side.from) return side.from;
    if (!side.placeholder) return null;
    const hit = /kamp\s+(\d+)/i.exec(side.name || "");
    return hit ? Number(hit[1]) : null;
  }

  function buildIndex(matches) {
    const ko = matches.filter((m) => m.stage === "sluttspill");
    const byNumber = new Map(ko.map((m) => [m.matchNumber, m]));
    return {
      byNumber,
      final: ko.find((m) => m.round === "FINAL") || null,
      bronze: ko.find((m) => m.round === "BRONZE") || null,
    };
  }

  /**
   * Plasserer én halvdel av treet (fra rot-semifinalen og nedover) i rader/kolonner.
   * Returnerer cellene + rot-cellen (semifinalen, som kobles videre til finalen).
   */
  function layoutSide(root, side, byNumber) {
    const cells = [];
    let leafCursor = 0;

    function place(num) {
      const m = byNumber.get(num);
      if (!m) return null;

      let rowStart, rowSpan;
      if (m.round === "R32") {
        rowStart = leafCursor * LEAF_SPAN;
        rowSpan = LEAF_SPAN;
        leafCursor += 1;
      } else {
        // Hjemmemater øverst, bortemater nederst → riktig vertikal rekkefølge.
        const a = place(feederNumber(m.home));
        const b = place(feederNumber(m.away));
        const kids = [a, b].filter(Boolean);
        rowStart = Math.min(...kids.map((k) => k.rowStart));
        const end = Math.max(...kids.map((k) => k.rowStart + k.rowSpan));
        rowSpan = end - rowStart;

        // Koble hvert barn til denne forelderen: albuens vertikale del er
        // avstanden (i basisrader) mellom barnets og forelderens sentrum.
        const parentCenter = rowStart + rowSpan / 2;
        for (const k of kids) {
          const childCenter = k.rowStart + k.rowSpan / 2;
          k.connRows = Math.abs(parentCenter - childCenter);
          k.connDir =
            childCenter < parentCenter ? "down" : childCenter > parentCenter ? "up" : "none";
        }
      }

      const cell = { match: m, side, rowStart, rowSpan, col: colFor(m.round, side) };
      cells.push(cell);
      return cell;
    }

    const rootCell = place(root);
    if (rootCell) rootCell.toFinal = true; // semifinale → finale (kun horisontal albue)
    return cells;
  }

  /** Én lagside i en celle: flagg + navn (versaler for avklart, dempet for plassholder). */
  function teamLine(t, labels) {
    const flag = t.code ? window.VMRender.flagEmoji(t.code) : "";
    const display = t.placeholder ? { ...t, name: placeholderName(t, labels) } : t;
    return (
      '<span class="bracket-team">' +
      (flag ? '<span class="bracket-team__flag">' + flag + "</span>" : "") +
      window.VMRender.teamLabel(display) +
      "</span>"
    );
  }

  function fillCell(btn, match, label, labels, selectedIds, onToggle) {
    const selected = selectedIds.has(match.id);
    btn.type = "button";
    btn.dataset.matchId = match.id;
    btn.setAttribute("aria-pressed", String(selected));
    btn.classList.toggle("is-selected", selected);

    const teams = document.createElement("div");
    teams.className = "bracket-match__teams";
    teams.innerHTML = teamLine(match.home, labels) + teamLine(match.away, labels);

    const meta = document.createElement("p");
    meta.className = "bracket-match__meta";
    meta.textContent = label + " · " + match.dateLabel;

    btn.replaceChildren(teams, meta);
    btn.addEventListener("click", () => onToggle(match.id));
  }

  function createTreeCell(cell, labels, selectedIds, onToggle) {
    const btn = document.createElement("button");
    btn.className =
      "bracket-match is-" + cell.side +
      (cell.connDir && cell.connDir !== "none" ? " conn-" + cell.connDir : "") +
      (cell.toFinal ? " conn-final" : "");
    btn.style.gridColumn = String(cell.col);
    btn.style.gridRow = cell.rowStart + 1 + " / span " + cell.rowSpan;
    if (cell.connRows) btn.style.setProperty("--conn-rows", String(cell.connRows));
    fillCell(btn, cell.match, labels.get(cell.match.matchNumber), labels, selectedIds, onToggle);
    return btn;
  }

  function createCenterCell(match, variant, labels, selectedIds, onToggle) {
    const btn = document.createElement("button");
    btn.className = "bracket-match bracket-match--" + variant;

    const label = document.createElement("p");
    label.className = "bracket-match__round";
    label.textContent = match.roundLabel;

    // Finale/bronse er enkeltkamper utenfor cellene → bruk rundenavnet direkte.
    fillCell(btn, match, labels.get(match.matchNumber) || match.roundLabel, labels, selectedIds, onToggle);
    btn.prepend(label);
    return btn;
  }

  function renderBracket(container, matches, selectedIds, onToggle) {
    container.replaceChildren();
    const { byNumber, final, bronze } = buildIndex(matches);
    if (!final) return;

    const grid = document.createElement("div");
    grid.className = "bracket__grid";

    const leftRoot = feederNumber(final.home);
    const rightRoot = feederNumber(final.away);
    const cells = [
      ...layoutSide(leftRoot, "left", byNumber),
      ...layoutSide(rightRoot, "right", byNumber),
    ];
    // Nummerering følger treets layout, så labels bygges av de utlagte cellene.
    const labels = buildLabels(cells);
    for (const cell of cells) {
      grid.appendChild(createTreeCell(cell, labels, selectedIds, onToggle));
    }

    const center = document.createElement("div");
    center.className = "bracket__center";
    center.appendChild(createCenterCell(final, "final", labels, selectedIds, onToggle));
    if (bronze) {
      center.appendChild(createCenterCell(bronze, "bronze", labels, selectedIds, onToggle));
    }
    grid.appendChild(center);

    container.appendChild(grid);
  }

  window.VMBracket = { renderBracket };
})();
