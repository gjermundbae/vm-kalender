(function () {
  "use strict";

  const PDF_FILENAME = "vm-2026-mine-kamper.pdf";
  const BTN_LABEL_DEFAULT = "Last ned valgte";
  const BTN_LABEL_LOADING = "Laster ned …";

  const state = {
    sortMode: "time",
    selectedIds: new Set(),
  };

  const matchListEl = document.getElementById("match-list");
  const selectionCountEl = document.getElementById("selection-count");
  const selectionCountNumEl = document.getElementById("selection-count-num");
  const btnDownloadEl = document.getElementById("btn-download");
  const printRootEl = document.getElementById("print-root");
  const sortButtons = document.querySelectorAll(".sort-toggle__btn");

  function updateChrome() {
    const n = state.selectedIds.size;
    selectionCountNumEl.textContent = String(n);
    selectionCountEl.hidden = n === 0;
    btnDownloadEl.disabled = n === 0;
    btnDownloadEl.title =
      n === 0
        ? "Velg minst én kamp før nedlasting"
        : "Last ned PDF med valgte kamper";
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

  async function downloadPdf() {
    if (state.selectedIds.size === 0 || typeof html2pdf === "undefined") return;

    window.VMRender.renderPrintSummary(
      printRootEl,
      window.MATCHES,
      state.selectedIds,
      state.sortMode
    );

    printRootEl.classList.add("print-root--exporting");
    printRootEl.setAttribute("aria-hidden", "false");

    btnDownloadEl.disabled = true;
    btnDownloadEl.textContent = BTN_LABEL_LOADING;

    try {
      await html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename: PDF_FILENAME,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(printRootEl)
        .save();
    } finally {
      printRootEl.classList.remove("print-root--exporting");
      printRootEl.replaceChildren();
      printRootEl.setAttribute("aria-hidden", "true");
      btnDownloadEl.textContent = BTN_LABEL_DEFAULT;
      updateChrome();
    }
  }

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.sort !== state.sortMode) {
        setSortMode(btn.dataset.sort);
      }
    });
  });

  btnDownloadEl.addEventListener("click", downloadPdf);

  updateChrome();
  render();
})();
