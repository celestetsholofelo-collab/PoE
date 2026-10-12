/* Tsholofelo Tshwenyane | Student Tutor E-Portfolio 2026 */
(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const tabs   = $$(".tab");
  const panels = $$(".panel");
  const ids    = tabs.map(t => t.dataset.tab);
  let current  = ids[0];

  /* safe localStorage helpers (can throw in private mode) */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v)        { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };

  /* ---------- Tabs ---------- */
  function show(id, { scroll = true, push = true } = {}) {
    if (!ids.includes(id)) id = ids[0];
    current = id;

    tabs.forEach(t => {
      const on = t.dataset.tab === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(p => { p.hidden = p.id !== id; });

    const active = tabs[ids.indexOf(id)];
    const bar = $(".tabs");
    bar.scrollTo({ left: active.offsetLeft - bar.clientWidth / 2 + active.clientWidth / 2, behavior: "smooth" });

    const i = ids.indexOf(id);
    $("#prevBtn").disabled = i === 0;
    $("#nextBtn").disabled = i === ids.length - 1;
    $("#pageInfo").textContent = `Section ${i + 1} of ${ids.length}`;

    if (push) history.replaceState(null, "", "#" + id);
    if (scroll) window.scrollTo({ top: $("#portfolio").offsetTop - 64, behavior: "smooth" });
  }

  tabs.forEach(t => t.addEventListener("click", () => show(t.dataset.tab)));

  $(".tabs").addEventListener("keydown", e => {
    const i = ids.indexOf(current);
    let n = null;
    if (e.key === "ArrowRight") n = (i + 1) % ids.length;
    if (e.key === "ArrowLeft")  n = (i - 1 + ids.length) % ids.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End")  n = ids.length - 1;
    if (n !== null) { e.preventDefault(); show(ids[n], { scroll: false }); tabs[n].focus(); }
  });

  $("#prevBtn").addEventListener("click", () => show(ids[Math.max(0, ids.indexOf(current) - 1)]));
  $("#nextBtn").addEventListener("click", () => show(ids[Math.min(ids.length - 1, ids.indexOf(current) + 1)]));

  /* hero buttons that open a tab */
  $$("[data-open]").forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    show(a.dataset.open);
  }));

  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (ids.includes(id)) show(id, { push: false });
  });

  /* ---------- Theme ---------- */
  const themeBtn = $("#themeBtn");
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    themeBtn.textContent = t === "dark" ? "Light" : "Dark";
    store.set("tutor-theme", t);
  }
  const saved = store.get("tutor-theme", null);
  setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  themeBtn.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

  /* ---------- Print ---------- */
  $("#printBtn").addEventListener("click", () => window.print());

  /* ---------- Tutorial activity records ---------- */
  const form   = $("#recordForm");
  const list   = $("#records");
  let records  = store.get("tutor-records", []);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = d => { try { return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }); } catch { return d; } };

  function recordText(r) {
    return [
      `Tutorial: ${r.topic}`,
      `Date: ${fmtDate(r.date)}`,
      `Learning objective: ${r.objective || "-"}`,
      `What I did: ${r.did || "-"}`,
      `Outcome or lesson learned: ${r.outcome || "-"}`
    ].join("\n");
  }

  function render() {
    if (!records.length) { list.innerHTML = ""; return; }
    list.innerHTML = records.map(r => `
      <article class="record" data-id="${r.id}">
        <h4>${esc(r.topic)}</h4>
        <p class="when">${esc(fmtDate(r.date))}</p>
        ${r.objective ? `<p><strong>Learning objective:</strong> ${esc(r.objective)}</p>` : ""}
        ${r.did ? `<p><strong>What I did:</strong> ${esc(r.did)}</p>` : ""}
        ${r.outcome ? `<p><strong>Outcome or lesson learned:</strong> ${esc(r.outcome)}</p>` : ""}
        <div class="record-actions">
          <button type="button" data-act="copy">Copy</button>
          <button type="button" data-act="delete">Delete</button>
        </div>
      </article>`).join("");
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    records.unshift({ id: Date.now(), ...d });
    store.set("tutor-records", records);
    render();
    form.reset();
  });

  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      ta.remove();
    }
    const old = btn.textContent; btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = old; }, 1400);
  }

  list.addEventListener("click", e => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = Number(btn.closest(".record").dataset.id);
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    if (btn.dataset.act === "copy") copyText(recordText(rec), btn);
    if (btn.dataset.act === "delete" && confirm("Delete this record?")) {
      records = records.filter(r => r.id !== id);
      store.set("tutor-records", records);
      render();
    }
  });

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  document.addEventListener("click", e => {
    const img = e.target.closest(".fig img");
    if (!img || typeof lb.showModal !== "function") return;
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    const cap = img.closest(".fig").querySelector("figcaption");
    lbCap.textContent = cap ? cap.textContent.trim() : "";
    lb.showModal();
  });
  $("#lbClose").addEventListener("click", () => lb.close());
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Start ---------- */
  const start = location.hash.slice(1);
  show(ids.includes(start) ? start : ids[0], { scroll: false, push: false });
  render();
})();
