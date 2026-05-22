# VM 2026 — mine kamper

Statisk kampplanlegger for fotball-VM 2026. Marker kamper du vil se, sorter etter gruppe eller tid, og last ned valgte kamper som PDF.

## Kom i gang

Åpne [`index.html`](index.html) i nettleseren, eller start en enkel lokal server:

```bash
python3 -m http.server 8080
```

Gå deretter til `http://localhost:8080`.

## Bruk

1. Klikk på en kamp for å markere den som valgt.
2. Bytt mellom **Gruppe** og **Tid** for å endre sortering.
3. Klikk **Last ned valgte** — PDF-filen `vm-2026-mine-kamper.pdf` lastes ned automatisk.

Valgte kamper huskes kun i denne nettleserøkten og forsvinner ved refresh.

## Filstruktur

- `index.html` — side og kontroller
- `css/base.css` — layout og kampkort
- `css/pdf.css` — stil for PDF-eksport
- `js/data.js` — kampdata (eksempelkamper)
- `js/render.js` — rendering og sortering
- `js/app.js` — interaksjon og nedlasting
- `js/vendor/html2pdf.bundle.min.js` — PDF-generering i nettleseren
