(function () {
  "use strict";

  /** Tag-sekvens-flagg for nasjoner innen Storbritannia (RFC emoji tag sequence). */
  function tagFlagEmoji(...letters) {
    const TAG_BASE = 0xe0000;
    return String.fromCodePoint(
      0x1f3f4,
      ...letters.map((c) => TAG_BASE + c.toLowerCase().charCodeAt(0))
    );
  }

  /** ISO 3166-1 alpha-3 → flagg-emoji (regional indicators eller tag-sekvens). */
  function flagEmoji(code) {
    if (code === "ENG") return tagFlagEmoji("g", "b", "e", "n", "g");
    if (code === "SCO") return tagFlagEmoji("g", "b", "s", "c", "t");

    const map = {
      ARG: "AR",
      AUS: "AU",
      AUT: "AT",
      BEL: "BE",
      BIH: "BA",
      BRA: "BR",
      CAN: "CA",
      CHE: "CH",
      CIV: "CI",
      COD: "CD",
      COL: "CO",
      CPV: "CV",
      CUW: "CW",
      CZE: "CZ",
      DEU: "DE",
      DZA: "DZ",
      ECU: "EC",
      EGY: "EG",
      ESP: "ES",
      FRA: "FR",
      GHA: "GH",
      HRV: "HR",
      HTI: "HT",
      IRN: "IR",
      IRQ: "IQ",
      JOR: "JO",
      JPN: "JP",
      KOR: "KR",
      MAR: "MA",
      MEX: "MX",
      NLD: "NL",
      NOR: "NO",
      NZL: "NZ",
      PAN: "PA",
      PRT: "PT",
      PRY: "PY",
      QAT: "QA",
      SAU: "SA",
      SEN: "SN",
      SWE: "SE",
      TUN: "TN",
      TUR: "TR",
      URY: "UY",
      USA: "US",
      UZB: "UZ",
      ZAF: "ZA",
    };
    const iso2 = map[code] || code.slice(0, 2);
    return [...iso2.toUpperCase()]
      .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
      .join("");
  }

  function dateKey(match) {
    return match.dateLabel;
  }

  function compareDatetime(a, b) {
    return new Date(a.datetime) - new Date(b.datetime);
  }

  /** Sluttspillrunder sorteres etter puljene (A–L) i gruppe-modus. */
  const ROUND_RANK = { R32: 1, R16: 2, QF: 3, SF: 4, BRONZE: 5, FINAL: 6 };

  /** Grupperingsnøkkel i gruppe-modus: puljebokstav eller sluttspillrunde. */
  function phaseKey(match) {
    return match.group || match.round;
  }

  /** Puljer (A=65 …) før sluttspillrunder (100+). */
  function phaseRank(key) {
    return ROUND_RANK[key] ? 100 + ROUND_RANK[key] : key.charCodeAt(0);
  }

  /**
   * @param {typeof window.MATCHES} matches
   * @param {'group' | 'time'} sortMode
   */
  function buildSections(matches, sortMode) {
    const sorted = [...matches].sort(compareDatetime);

    if (sortMode === "time") {
      const sections = [];
      let current = null;

      for (const match of sorted) {
        const key = dateKey(match);
        if (!current || current.dateKey !== key) {
          current = { heading: match.dateLabel, dateKey: key, matches: [] };
          sections.push(current);
        }
        current.matches.push(match);
      }

      return sections.map((s) => ({
        heading: s.heading,
        matches: s.matches,
        showDateAt: computeShowDateAt(s.matches),
      }));
    }

    const byGroup = new Map();
    for (const match of sorted) {
      const key = phaseKey(match);
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(match);
    }

    const flat = [...byGroup.entries()]
      .sort(([a], [b]) => phaseRank(a) - phaseRank(b))
      .flatMap(([, groupMatches]) => groupMatches);

    return [
      {
        heading: null,
        matches: flat,
        showDateAt: computeShowDateAtByGroup(flat),
      },
    ];
  }

  /** @param {typeof window.MATCHES} sectionMatches */
  function computeShowDateAt(sectionMatches) {
    const seen = new Set();
    return sectionMatches.map((m) => {
      const key = dateKey(m);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /** Dato vises på første kamp per dag innen hver pulje/runde. */
  function computeShowDateAtByGroup(matches) {
    const seenByGroup = new Map();
    return matches.map((m) => {
      const groupKey = phaseKey(m);
      if (!seenByGroup.has(groupKey)) seenByGroup.set(groupKey, new Set());
      const dates = seenByGroup.get(groupKey);
      const key = dateKey(m);
      if (dates.has(key)) return false;
      dates.add(key);
      return true;
    });
  }

  /**
   * @param {typeof window.MATCHES[0]} match
   * @param {boolean} showDate
   * @param {boolean} isSelected
   * @param {(id: string) => void} onToggle
   */
  function createMatchRow(match, showDate, isSelected, onToggle, groupStart) {
    const row = document.createElement("button");
    row.type = "button";
    row.className =
      "match-row" +
      (groupStart ? " match-row--group-start" : "") +
      (isSelected ? " is-selected" : "");
    row.dataset.matchId = match.id;
    row.setAttribute("aria-pressed", String(isSelected));

    const card = document.createElement("div");
    card.className = "match-card";

    const timeCol = document.createElement("div");
    timeCol.className = "match-card__time";

    if (showDate) {
      const dateEl = document.createElement("span");
      dateEl.className = "match-card__date";
      dateEl.textContent = match.dateLabel;
      timeCol.appendChild(dateEl);
    }

    const timeEl = document.createElement("span");
    timeEl.className = "match-card__time-value";
    timeEl.textContent = match.timeLabel;
    const channelEl = document.createElement("span");
    channelEl.className = "match-card__channel";
    channelEl.textContent = match.broadcaster;
    timeCol.append(timeEl, channelEl);

    const infoCol = document.createElement("div");
    infoCol.className = "match-card__info";
    const teamsEl = document.createElement("p");
    const hasPlaceholder = match.home.placeholder || match.away.placeholder;
    teamsEl.className =
      "match-card__teams" + (hasPlaceholder ? " match-card__teams--ko" : "");
    teamsEl.innerHTML = formatTeams(match);

    const metaEl = document.createElement("p");
    metaEl.className = "match-card__meta";
    const groupEl = document.createElement("span");
    groupEl.className = "match-card__group";
    groupEl.textContent = match.group ? `Pulje ${match.group}` : match.roundLabel;
    const venueEl = document.createElement("span");
    venueEl.className = "match-card__venue";
    venueEl.textContent = match.venue;
    metaEl.append(groupEl, metaSep(), venueEl);

    if (match.matchNumber) {
      const matchNoEl = document.createElement("span");
      matchNoEl.className = "match-card__matchno";
      matchNoEl.textContent = `Kamp ${match.matchNumber}`;
      metaEl.append(metaSep(), matchNoEl);
    }

    infoCol.append(teamsEl, metaEl);

    const check = document.createElement("span");
    check.className = "match-card__check";
    check.setAttribute("aria-hidden", "true");
    check.innerHTML =
      '<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path fill="currentColor" d="M4.5 8.2 2.3 6l-.8.8 3 3 6.5-6.5-.8-.8-5.7 5.7z"/></svg>';

    card.append(timeCol, infoCol, check);
    row.appendChild(card);

    row.addEventListener("click", () => onToggle(match.id));

    return row;
  }

  /** Diskret «·»-skille mellom meta-elementene. */
  function metaSep() {
    const sep = document.createElement("span");
    sep.className = "match-card__meta-sep";
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = "·";
    return sep;
  }

  /** Avklart lag vises i versaler; plassholder (Vinner pulje F …) dempet. */
  function teamLabel(t) {
    if (t.placeholder) {
      return `<span class="match-card__team match-card__team--tbd">${t.name}</span>`;
    }
    return `<span class="match-card__team">${t.name.toUpperCase()}</span>`;
  }

  function formatTeams(match) {
    const hf = match.home.code ? flagEmoji(match.home.code) : "";
    const af = match.away.code ? flagEmoji(match.away.code) : "";
    return (
      teamLabel(match.home) +
      `<span class="match-card__flags">` +
      (hf ? `<span class="match-card__flag">${hf}</span>` : "") +
      `<span class="match-card__sep">–</span>` +
      (af ? `<span class="match-card__flag">${af}</span>` : "") +
      `</span>` +
      teamLabel(match.away)
    );
  }

  /**
   * @param {HTMLElement} container
   * @param {typeof window.MATCHES} matches
   * @param {'group' | 'time'} sortMode
   * @param {Set<string>} selectedIds
   * @param {(id: string) => void} onToggle
   */
  const STAGE_LABELS = { gruppespill: "Gruppespill", sluttspill: "Sluttspill" };

  function isKnockout(match) {
    return match.stage === "sluttspill";
  }

  function renderList(container, matches, sortMode, selectedIds, onToggle) {
    container.replaceChildren();

    // Del listen i gruppespill og sluttspill så de to fasene blir tydelig
    // adskilt. Faseoverskriften vises bare når begge faser faktisk er synlige
    // — ellers ville den bare være støy.
    const groupStage = matches.filter((mm) => !isKnockout(mm));
    const knockout = matches.filter(isKnockout);
    const blocks = [];
    if (groupStage.length) blocks.push(["gruppespill", groupStage]);
    if (knockout.length) blocks.push(["sluttspill", knockout]);
    const showStageHeadings = blocks.length > 1;

    for (const [stage, stageMatches] of blocks) {
      if (showStageHeadings) {
        const stageHeading = document.createElement("h2");
        stageHeading.className = "stage-heading";
        stageHeading.textContent = STAGE_LABELS[stage];
        container.appendChild(stageHeading);
      }
      appendSections(
        container,
        buildSections(stageMatches, sortMode),
        sortMode,
        selectedIds,
        onToggle
      );
    }
  }

  function appendSections(container, sections, sortMode, selectedIds, onToggle) {
    for (const section of sections) {
      if (section.heading) {
        const heading = document.createElement("h2");
        heading.className = "section-heading";
        heading.textContent = section.heading;
        container.appendChild(heading);
      }

      const list = document.createElement("div");
      list.className = "section-matches";

      let prevGroup = null;
      section.matches.forEach((match, i) => {
        const showDate = section.showDateAt[i];
        const key = phaseKey(match);
        const groupStart =
          sortMode === "group" && prevGroup !== null && prevGroup !== key;
        prevGroup = key;
        list.appendChild(
          createMatchRow(
            match,
            showDate,
            selectedIds.has(match.id),
            onToggle,
            groupStart
          )
        );
      });

      container.appendChild(list);
    }
  }

  window.VMRender = {
    buildSections,
    renderList,
    flagEmoji,
    formatTeams,
    teamLabel,
  };
})();
