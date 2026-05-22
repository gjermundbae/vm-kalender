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
      if (!byGroup.has(match.group)) byGroup.set(match.group, []);
      byGroup.get(match.group).push(match);
    }

    const flat = [...byGroup.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
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

  /** Dato vises på første kamp per dag innen hver pulje. */
  function computeShowDateAtByGroup(matches) {
    const seenByGroup = new Map();
    return matches.map((m) => {
      if (!seenByGroup.has(m.group)) seenByGroup.set(m.group, new Set());
      const dates = seenByGroup.get(m.group);
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
    teamsEl.className = "match-card__teams";
    teamsEl.innerHTML = formatTeams(match);

    const metaEl = document.createElement("p");
    metaEl.className = "match-card__meta";
    const groupEl = document.createElement("span");
    groupEl.className = "match-card__group";
    groupEl.textContent = `Pulje ${match.group}`;
    const sepEl = document.createElement("span");
    sepEl.className = "match-card__meta-sep";
    sepEl.setAttribute("aria-hidden", "true");
    sepEl.textContent = "·";
    const venueEl = document.createElement("span");
    venueEl.className = "match-card__venue";
    venueEl.textContent = match.venue;
    metaEl.append(groupEl, sepEl, venueEl);

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

  function formatTeams(match) {
    const h = match.home.name.toUpperCase();
    const a = match.away.name.toUpperCase();
    const hf = flagEmoji(match.home.code);
    const af = flagEmoji(match.away.code);
    return (
      `<span class="match-card__team">${h}</span>` +
      `<span class="match-card__flags"><span class="match-card__flag">${hf}</span>` +
      `<span class="match-card__sep">–</span>` +
      `<span class="match-card__flag">${af}</span></span>` +
      `<span class="match-card__team">${a}</span>`
    );
  }

  /**
   * @param {HTMLElement} container
   * @param {typeof window.MATCHES} matches
   * @param {'group' | 'time'} sortMode
   * @param {Set<string>} selectedIds
   * @param {(id: string) => void} onToggle
   */
  function renderList(container, matches, sortMode, selectedIds, onToggle) {
    container.replaceChildren();
    const sections = buildSections(matches, sortMode);

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
        const groupStart =
          sortMode === "group" &&
          prevGroup !== null &&
          prevGroup !== match.group;
        prevGroup = match.group;
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
  };
})();
