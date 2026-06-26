// Kampprogram for fotball-VM 2026 (USA, Canada, Mexico).
// Kilde: NRK – https://www.nrk.no/fotballvm2026/fotball-vm-i-usa_-canada-og-mexico.-her-er-oversikten-over-mesterskapet-1.17449167
// Alle tidspunkter er norsk tid (CEST, UTC+02:00).

(function () {
  "use strict";

  const NB_MONTH = "juni";
  const NB_MONTHS = { 6: "juni", 7: "juli" };

  /**
   * @param {string} group
   * @param {number} idx 1-basert kampnummer i puljen
   * @param {number} day dag i juni
   * @param {string} time "HH:MM" norsk tid
   * @param {string} broadcaster
   * @param {[string, string]} home [navn, alpha-3]
   * @param {[string, string]} away [navn, alpha-3]
   * @param {string} venue
   */
  function m(group, idx, day, time, broadcaster, home, away, venue) {
    const dd = String(day).padStart(2, "0");
    return {
      id: `grp-${group.toLowerCase()}-${idx}`,
      group,
      stage: "gruppespill",
      datetime: `2026-06-${dd}T${time}:00+02:00`,
      dateLabel: `${day}. ${NB_MONTH}`,
      timeLabel: time,
      broadcaster,
      home: { name: home[0], code: home[1] },
      away: { name: away[0], code: away[1] },
      venue,
    };
  }

  /**
   * En lagside i sluttspillet. Enten et avklart lag (med flagg) eller en
   * plassholder som «Vinner pulje F» / «3. plass (C/E/F/H/I)».
   * @param {[string, string] | string} spec [navn, alpha-3] eller plassholdertekst
   */
  function team(spec) {
    if (Array.isArray(spec)) return { name: spec[0], code: spec[1] };
    return { name: spec, placeholder: true };
  }

  /**
   * @param {number} num offisielt kampnummer (73–104)
   * @param {string} round "R32" | "R16" | "QF" | "SF" | "BRONZE" | "FINAL"
   * @param {string} roundLabel norsk visningsnavn for runden
   * @param {number} month 6 (juni) eller 7 (juli)
   * @param {number} day dag i måneden
   * @param {string} time "HH:MM" norsk tid (CEST, UTC+02:00)
   * @param {string} broadcaster "NRK" | "TV 2" | "TBD"
   * @param {[string, string] | string} home avklart lag eller plassholder
   * @param {[string, string] | string} away avklart lag eller plassholder
   * @param {string} venue
   */
  function ko(num, round, roundLabel, month, day, time, broadcaster, home, away, venue) {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return {
      id: `ko-${num}`,
      group: null,
      stage: "sluttspill",
      round,
      roundLabel,
      matchNumber: num,
      datetime: `2026-${mm}-${dd}T${time}:00+02:00`,
      dateLabel: `${day}. ${NB_MONTHS[month]}`,
      timeLabel: time,
      broadcaster,
      home: team(home),
      away: team(away),
      venue,
    };
  }

  window.MATCHES = [
    // Gruppe A
    m("A", 1, 11, "21:00", "TV 2", ["Mexico", "MEX"], ["Sør-Afrika", "ZAF"], "Mexico City"),
    m("A", 2, 12, "04:00", "NRK",  ["Sør-Korea", "KOR"], ["Tsjekkia", "CZE"], "Guadalajara"),
    m("A", 3, 18, "18:00", "NRK",  ["Tsjekkia", "CZE"], ["Sør-Afrika", "ZAF"], "Atlanta"),
    m("A", 4, 19, "03:00", "TV 2", ["Mexico", "MEX"], ["Sør-Korea", "KOR"], "Guadalajara"),
    m("A", 5, 25, "03:00", "TV 2", ["Mexico", "MEX"], ["Tsjekkia", "CZE"], "Mexico City"),
    m("A", 6, 25, "03:00", "TV 2", ["Sør-Afrika", "ZAF"], ["Sør-Korea", "KOR"], "Monterrey"),

    // Gruppe B
    m("B", 1, 12, "21:00", "NRK",  ["Canada", "CAN"], ["Bosnia og Herzegovina", "BIH"], "Toronto"),
    m("B", 2, 13, "21:00", "NRK",  ["Qatar", "QAT"], ["Sveits", "CHE"], "San Francisco"),
    m("B", 3, 18, "21:00", "TV 2", ["Sveits", "CHE"], ["Bosnia og Herzegovina", "BIH"], "Los Angeles"),
    m("B", 4, 19, "00:00", "TV 2", ["Canada", "CAN"], ["Qatar", "QAT"], "Vancouver"),
    m("B", 5, 24, "21:00", "NRK",  ["Sveits", "CHE"], ["Canada", "CAN"], "Vancouver"),
    m("B", 6, 24, "21:00", "NRK",  ["Bosnia og Herzegovina", "BIH"], ["Qatar", "QAT"], "Seattle"),

    // Gruppe C
    m("C", 1, 14, "00:00", "TV 2", ["Brasil", "BRA"], ["Marokko", "MAR"], "New York"),
    m("C", 2, 14, "03:00", "TV 2", ["Haiti", "HTI"], ["Skottland", "SCO"], "Boston"),
    m("C", 3, 20, "00:00", "NRK",  ["Skottland", "SCO"], ["Marokko", "MAR"], "Boston"),
    m("C", 4, 20, "02:30", "NRK",  ["Brasil", "BRA"], ["Haiti", "HTI"], "Philadelphia"),
    m("C", 5, 25, "00:00", "NRK",  ["Skottland", "SCO"], ["Brasil", "BRA"], "Miami"),
    m("C", 6, 25, "00:00", "NRK",  ["Marokko", "MAR"], ["Haiti", "HTI"], "Atlanta"),

    // Gruppe D
    m("D", 1, 13, "03:00", "TV 2", ["USA", "USA"], ["Paraguay", "PRY"], "Los Angeles"),
    m("D", 2, 14, "06:00", "TV 2", ["Australia", "AUS"], ["Tyrkia", "TUR"], "Vancouver"),
    m("D", 3, 19, "21:00", "NRK",  ["USA", "USA"], ["Australia", "AUS"], "Seattle"),
    m("D", 4, 20, "05:00", "NRK",  ["Tyrkia", "TUR"], ["Paraguay", "PRY"], "San Francisco"),
    m("D", 5, 26, "04:00", "NRK",  ["Tyrkia", "TUR"], ["USA", "USA"], "Los Angeles"),
    m("D", 6, 26, "04:00", "NRK",  ["Paraguay", "PRY"], ["Australia", "AUS"], "San Francisco"),

    // Gruppe E
    m("E", 1, 14, "19:00", "NRK",  ["Tyskland", "DEU"], ["Curaçao", "CUW"], "Houston"),
    m("E", 2, 15, "01:00", "TV 2", ["Elfenbenskysten", "CIV"], ["Ecuador", "ECU"], "Philadelphia"),
    m("E", 3, 20, "22:00", "TV 2", ["Tyskland", "DEU"], ["Elfenbenskysten", "CIV"], "Toronto"),
    m("E", 4, 21, "02:00", "TV 2", ["Ecuador", "ECU"], ["Curaçao", "CUW"], "Kansas City"),
    m("E", 5, 25, "22:00", "TV 2", ["Curaçao", "CUW"], ["Elfenbenskysten", "CIV"], "Philadelphia"),
    m("E", 6, 25, "22:00", "TV 2", ["Ecuador", "ECU"], ["Tyskland", "DEU"], "New York"),

    // Gruppe F
    m("F", 1, 14, "22:00", "TV 2", ["Nederland", "NLD"], ["Japan", "JPN"], "Dallas"),
    m("F", 2, 15, "04:00", "TV 2", ["Sverige", "SWE"], ["Tunisia", "TUN"], "Monterrey"),
    m("F", 3, 20, "19:00", "NRK",  ["Nederland", "NLD"], ["Sverige", "SWE"], "Houston"),
    m("F", 4, 21, "06:00", "NRK",  ["Tunisia", "TUN"], ["Japan", "JPN"], "Monterrey"),
    m("F", 5, 26, "01:00", "TV 2", ["Tunisia", "TUN"], ["Nederland", "NLD"], "Kansas City"),
    m("F", 6, 26, "01:00", "TV 2", ["Japan", "JPN"], ["Sverige", "SWE"], "Dallas"),

    // Gruppe G
    m("G", 1, 15, "21:00", "NRK",  ["Belgia", "BEL"], ["Egypt", "EGY"], "Seattle"),
    m("G", 2, 16, "03:00", "NRK",  ["Iran", "IRN"], ["New Zealand", "NZL"], "Los Angeles"),
    m("G", 3, 21, "21:00", "TV 2", ["Belgia", "BEL"], ["Iran", "IRN"], "Los Angeles"),
    m("G", 4, 22, "03:00", "TV 2", ["New Zealand", "NZL"], ["Egypt", "EGY"], "Vancouver"),
    m("G", 5, 27, "05:00", "TV 2", ["Egypt", "EGY"], ["Iran", "IRN"], "Seattle"),
    m("G", 6, 27, "05:00", "TV 2", ["New Zealand", "NZL"], ["Belgia", "BEL"], "Vancouver"),

    // Gruppe H
    m("H", 1, 15, "18:00", "TV 2", ["Spania", "ESP"], ["Kapp Verde", "CPV"], "Atlanta"),
    m("H", 2, 16, "00:00", "NRK",  ["Saudi Arabia", "SAU"], ["Uruguay", "URY"], "Miami"),
    m("H", 3, 21, "18:00", "NRK",  ["Spania", "ESP"], ["Saudi Arabia", "SAU"], "Atlanta"),
    m("H", 4, 22, "00:00", "TV 2", ["Uruguay", "URY"], ["Kapp Verde", "CPV"], "Miami"),
    m("H", 5, 27, "02:00", "NRK",  ["Kapp Verde", "CPV"], ["Saudi Arabia", "SAU"], "Houston"),
    m("H", 6, 27, "02:00", "NRK",  ["Uruguay", "URY"], ["Spania", "ESP"], "Guadalajara"),

    // Gruppe I — Norges gruppe
    m("I", 1, 16, "21:00", "TV 2", ["Frankrike", "FRA"], ["Senegal", "SEN"], "New York"),
    m("I", 2, 17, "00:00", "TV 2", ["Irak", "IRQ"], ["Norge", "NOR"], "Boston"),
    m("I", 3, 22, "23:00", "NRK",  ["Frankrike", "FRA"], ["Irak", "IRQ"], "Philadelphia"),
    m("I", 4, 23, "02:00", "NRK",  ["Norge", "NOR"], ["Senegal", "SEN"], "New York"),
    m("I", 5, 26, "21:00", "NRK",  ["Norge", "NOR"], ["Frankrike", "FRA"], "Boston"),
    m("I", 6, 26, "21:00", "NRK",  ["Senegal", "SEN"], ["Irak", "IRQ"], "Toronto"),

    // Gruppe J
    m("J", 1, 17, "03:00", "NRK",  ["Argentina", "ARG"], ["Algerie", "DZA"], "Kansas City"),
    m("J", 2, 17, "06:00", "NRK",  ["Østerrike", "AUT"], ["Jordan", "JOR"], "San Francisco"),
    m("J", 3, 22, "19:00", "TV 2", ["Argentina", "ARG"], ["Østerrike", "AUT"], "Dallas"),
    m("J", 4, 23, "05:00", "TV 2", ["Jordan", "JOR"], ["Algerie", "DZA"], "San Francisco"),
    m("J", 5, 28, "04:00", "NRK",  ["Algerie", "DZA"], ["Østerrike", "AUT"], "Kansas City"),
    m("J", 6, 28, "04:00", "NRK",  ["Jordan", "JOR"], ["Argentina", "ARG"], "Dallas"),

    // Gruppe K
    m("K", 1, 17, "19:00", "NRK",  ["Portugal", "PRT"], ["DR Kongo", "COD"], "Houston"),
    m("K", 2, 18, "04:00", "TV 2", ["Usbekistan", "UZB"], ["Colombia", "COL"], "Mexico City"),
    m("K", 3, 23, "19:00", "TV 2", ["Portugal", "PRT"], ["Usbekistan", "UZB"], "Houston"),
    m("K", 4, 24, "04:00", "TV 2", ["Colombia", "COL"], ["DR Kongo", "COD"], "Guadalajara"),
    m("K", 5, 28, "01:30", "NRK",  ["Colombia", "COL"], ["Portugal", "PRT"], "Miami"),
    m("K", 6, 28, "01:30", "NRK",  ["DR Kongo", "COD"], ["Usbekistan", "UZB"], "Atlanta"),

    // Gruppe L
    m("L", 1, 17, "22:00", "TV 2", ["England", "ENG"], ["Kroatia", "HRV"], "Dallas"),
    m("L", 2, 18, "01:00", "TV 2", ["Ghana", "GHA"], ["Panama", "PAN"], "Toronto"),
    m("L", 3, 23, "22:00", "NRK",  ["England", "ENG"], ["Ghana", "GHA"], "Boston"),
    m("L", 4, 24, "01:00", "NRK",  ["Panama", "PAN"], ["Kroatia", "HRV"], "Toronto"),
    m("L", 5, 27, "23:00", "TV 2", ["Panama", "PAN"], ["England", "ENG"], "New York"),
    m("L", 6, 27, "23:00", "TV 2", ["Kroatia", "HRV"], ["Ghana", "GHA"], "Philadelphia"),

    // ── Sluttspill ──────────────────────────────────────────────────────
    // Datoer, tider (omregnet til norsk tid) og arenaer fra FIFAs offisielle
    // sluttspillprogram. Avklarte lag fylles inn etter hvert som puljene
    // sikres; resten står som plassholdere. Kanal er kun bekreftet for
    // semifinaler (TV 2), bronsefinale og finale (NRK) — ellers «TBD».

    // 16-delsfinaler (Round of 32) — 28. juni–4. juli
    ko(73, "R32", "16-delsfinale", 6, 28, "21:00", "TBD", ["Sør-Afrika", "ZAF"], ["Canada", "CAN"], "Los Angeles"),
    ko(74, "R32", "16-delsfinale", 6, 29, "22:30", "TBD", ["Tyskland", "DEU"], "3. plass (A/B/C/D/F)", "Boston"),
    ko(76, "R32", "16-delsfinale", 6, 29, "19:00", "TBD", ["Brasil", "BRA"], ["Japan", "JPN"], "Houston"),
    ko(75, "R32", "16-delsfinale", 6, 30, "03:00", "TBD", ["Nederland", "NLD"], ["Marokko", "MAR"], "Monterrey"),
    ko(78, "R32", "16-delsfinale", 6, 30, "19:00", "TBD", ["Elfenbenskysten", "CIV"], "2'er pulje I", "Dallas"),
    ko(77, "R32", "16-delsfinale", 6, 30, "23:00", "TBD", "Vinner pulje I", "3. plass (C/D/F/G/H)", "New York"),
    ko(79, "R32", "16-delsfinale", 7, 1, "03:00", "TBD", ["Mexico", "MEX"], "3. plass (C/E/F/H/I)", "Mexico City"),
    ko(80, "R32", "16-delsfinale", 7, 1, "18:00", "TBD", "Vinner pulje L", "3. plass (E/H/I/J/K)", "Atlanta"),
    ko(82, "R32", "16-delsfinale", 7, 1, "22:00", "TBD", "Vinner pulje G", "3. plass (A/H/I/J)", "Seattle"),
    ko(81, "R32", "16-delsfinale", 7, 2, "02:00", "TBD", ["USA", "USA"], "3. plass (B/E/F/I/J)", "San Francisco"),
    ko(84, "R32", "16-delsfinale", 7, 2, "21:00", "TBD", "Vinner pulje H", "2'er pulje J", "Los Angeles"),
    ko(83, "R32", "16-delsfinale", 7, 3, "01:00", "TBD", "2'er pulje K", "2'er pulje L", "Toronto"),
    ko(85, "R32", "16-delsfinale", 7, 3, "05:00", "TBD", ["Sveits", "CHE"], "3. plass (E/F/G/I/J)", "Vancouver"),
    ko(88, "R32", "16-delsfinale", 7, 3, "20:00", "TBD", ["Australia", "AUS"], "2'er pulje G", "Dallas"),
    ko(86, "R32", "16-delsfinale", 7, 4, "00:00", "TBD", ["Argentina", "ARG"], "2'er pulje H", "Miami"),
    ko(87, "R32", "16-delsfinale", 7, 4, "03:30", "TBD", "Vinner pulje K", "3. plass (D/E/I/J/L)", "Kansas City"),

    // 8-delsfinaler (Round of 16) — 4.–7. juli
    ko(90, "R16", "8-delsfinale", 7, 4, "19:00", "TBD", "Vinner kamp 73", "Vinner kamp 75", "Houston"),
    ko(89, "R16", "8-delsfinale", 7, 4, "23:00", "TBD", "Vinner kamp 74", "Vinner kamp 77", "Philadelphia"),
    ko(91, "R16", "8-delsfinale", 7, 5, "22:00", "TBD", "Vinner kamp 76", "Vinner kamp 78", "New York"),
    ko(92, "R16", "8-delsfinale", 7, 6, "02:00", "TBD", "Vinner kamp 79", "Vinner kamp 80", "Mexico City"),
    ko(93, "R16", "8-delsfinale", 7, 6, "21:00", "TBD", "Vinner kamp 83", "Vinner kamp 84", "Dallas"),
    ko(94, "R16", "8-delsfinale", 7, 7, "02:00", "TBD", "Vinner kamp 81", "Vinner kamp 82", "Seattle"),
    ko(95, "R16", "8-delsfinale", 7, 7, "18:00", "TBD", "Vinner kamp 86", "Vinner kamp 88", "Atlanta"),
    ko(96, "R16", "8-delsfinale", 7, 7, "22:00", "TBD", "Vinner kamp 85", "Vinner kamp 87", "Vancouver"),

    // Kvartfinaler — 9.–12. juli
    ko(97, "QF", "Kvartfinale", 7, 9, "22:00", "TBD", "Vinner kamp 89", "Vinner kamp 90", "Boston"),
    ko(98, "QF", "Kvartfinale", 7, 10, "21:00", "TBD", "Vinner kamp 93", "Vinner kamp 94", "Los Angeles"),
    ko(99, "QF", "Kvartfinale", 7, 11, "23:00", "TBD", "Vinner kamp 91", "Vinner kamp 92", "Miami"),
    ko(100, "QF", "Kvartfinale", 7, 12, "03:00", "TBD", "Vinner kamp 95", "Vinner kamp 96", "Kansas City"),

    // Semifinaler — 14.–15. juli
    ko(101, "SF", "Semifinale", 7, 14, "21:00", "TV 2", "Vinner kamp 97", "Vinner kamp 98", "Dallas"),
    ko(102, "SF", "Semifinale", 7, 15, "21:00", "TV 2", "Vinner kamp 99", "Vinner kamp 100", "Atlanta"),

    // Bronsefinale — 18. juli
    ko(103, "BRONZE", "Bronsefinale", 7, 18, "23:00", "NRK", "Taper kamp 101", "Taper kamp 102", "Miami"),

    // Finale — 19. juli
    ko(104, "FINAL", "Finale", 7, 19, "21:00", "NRK", "Vinner kamp 101", "Vinner kamp 102", "New York"),
  ];
})();
