/* app.js — UI, quiz state, autocomplete, results rendering.
 * Depends on engine.js (window.FragranceEngine) and the JSON data files.
 */

let PERFUMES = [];
let GLOSSARY = {};

// Escape text before inserting into innerHTML. The dataset is curated, but
// this keeps rendering safe if the data ever comes from an untrusted source.
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const state = {
  quiz: {
    character: null,   // fresh | warm | balanced
    sweetness: null,   // sweet | dry | balanced
    family: [],        // accord families
    season: "any",     // summer | winter | spring | any
    occasion: null,    // office | date | everyday | night
    strength: "moderate"
  },
  genders: [],         // [] = no filter
  refine: [],          // may contain "edp" and/or "beast"
  likedIds: [],
  dislikedIds: [],
  budgetMax: 150
};

/* --------------------------- data loading ----------------------------- */

async function loadData() {
  // Try fetch (works when hosted / served). Fall back to embedded data if the
  // file is opened directly from disk where fetch() of local files is blocked.
  try {
    const [p, g] = await Promise.all([
      fetch("perfumes.json").then(r => r.json()),
      fetch("notes-glossary.json").then(r => r.json())
    ]);
    PERFUMES = p; GLOSSARY = g;
  } catch (e) {
    if (window.__PERFUMES__ && window.__GLOSSARY__) {
      PERFUMES = window.__PERFUMES__; GLOSSARY = window.__GLOSSARY__;
    } else {
      document.getElementById("load-error").classList.remove("hidden");
      throw e;
    }
  }
}

/* --------------------------- single-select ---------------------------- */

function bindSingleSelect(containerId, key, target = state.quiz) {
  const el = document.getElementById(containerId);
  el.addEventListener("click", e => {
    const chip = e.target.closest(".choice");
    if (!chip) return;
    [...el.querySelectorAll(".choice")].forEach(c => c.classList.remove("selected"));
    chip.classList.add("selected");
    target[key] = chip.dataset.value;
  });
}

function bindMultiSelect(containerId, arr) {
  const el = document.getElementById(containerId);
  el.addEventListener("click", e => {
    const chip = e.target.closest(".choice");
    if (!chip) return;
    const val = chip.dataset.value;
    const i = arr.indexOf(val);
    if (i >= 0) { arr.splice(i, 1); chip.classList.remove("selected"); }
    else { arr.push(val); chip.classList.add("selected"); }
  });
}

/* ---------------------------- autocomplete ---------------------------- */

function setupAutocomplete(inputId, listId, kind) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  let activeIdx = -1;
  let matches = [];

  function close() { list.classList.remove("open"); list.innerHTML = ""; activeIdx = -1; }

  function render() {
    const q = input.value.trim().toLowerCase();
    if (!q) { close(); return; }
    const chosen = new Set([...state.likedIds, ...state.dislikedIds]);
    matches = PERFUMES
      .filter(p => !chosen.has(p.id) &&
        (p.name + " " + p.brand).toLowerCase().includes(q))
      .slice(0, 8);
    if (!matches.length) { close(); return; }
    list.innerHTML = matches.map((p, i) =>
      `<div class="ac-item${i === activeIdx ? " active" : ""}" data-id="${esc(p.id)}">
         ${esc(p.brand)} <strong>${esc(p.name)}</strong> <small>· ${esc(p.gender)}</small>
       </div>`).join("");
    list.classList.add("open");
  }

  function pick(id) {
    if (!id) return;
    if (kind === "like" && !state.likedIds.includes(id)) state.likedIds.push(id);
    if (kind === "dislike" && !state.dislikedIds.includes(id)) state.dislikedIds.push(id);
    input.value = ""; close(); renderTags();
  }

  input.addEventListener("input", () => { activeIdx = -1; render(); });
  input.addEventListener("keydown", e => {
    if (!list.classList.contains("open")) return;
    if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, matches.length - 1); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); render(); }
    else if (e.key === "Enter") { e.preventDefault(); if (activeIdx >= 0) pick(matches[activeIdx].id); }
    else if (e.key === "Escape") close();
  });
  list.addEventListener("click", e => {
    const item = e.target.closest(".ac-item");
    if (item) pick(item.dataset.id);
  });
  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !list.contains(e.target)) close();
  });
}

function renderTags() {
  const byId = Object.fromEntries(PERFUMES.map(p => [p.id, p]));
  const likeBox = document.getElementById("like-tags");
  const dislikeBox = document.getElementById("dislike-tags");
  const tag = (id, kind) => {
    const p = byId[id];
    if (!p) return ""; // ignore an id that isn't in the dataset
    return `<span class="tag ${kind}">${esc(p.brand)} ${esc(p.name)}
       <button data-id="${esc(id)}" data-kind="${kind}">×</button></span>`;
  };
  likeBox.innerHTML = state.likedIds.map(id => tag(id, "like")).join("");
  dislikeBox.innerHTML = state.dislikedIds.map(id => tag(id, "dislike")).join("");
}

document.addEventListener("click", e => {
  const btn = e.target.closest(".tag button");
  if (!btn) return;
  const { id, kind } = btn.dataset;
  const arr = kind === "like" ? state.likedIds : state.dislikedIds;
  const i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1);
  renderTags();
});

/* ------------------------------ budget -------------------------------- */

function setupBudget() {
  const slider = document.getElementById("budget");
  const out = document.getElementById("budget-val");
  function show() {
    state.budgetMax = +slider.value;
    out.textContent = state.budgetMax >= 500 ? "$500+" : "$" + state.budgetMax;
  }
  slider.addEventListener("input", show);
  show();
}

/* ------------------------------ results ------------------------------- */

const PRICE_TIER_LABEL = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

function buyLinks(p) {
  const q = encodeURIComponent(p.searchQuery);
  return [
    { label: "Amazon", url: `https://www.amazon.com/s?k=${q}` },
    { label: "FragranceX", url: `https://www.fragrancex.com/search/search_results?stext=${q}` },
    { label: "Sephora", url: `https://www.sephora.com/search?keyword=${q}` },
    { label: "Sample first", url: `https://www.scentsplit.com/search?q=${q}`, sample: true }
  ];
}

function notePills(p) {
  const notes = [...new Set([...(p.topNotes||[]), ...(p.heartNotes||[]), ...(p.baseNotes||[])])];
  return notes.map(n => {
    const tip = GLOSSARY[n] ? ` data-tip="${esc(GLOSSARY[n])}"` : "";
    return `<span class="note-pill"${tip}>${esc(n)}</span>`;
  }).join("");
}

function renderResults(recs) {
  const grid = document.getElementById("results-grid");
  if (!recs.length) {
    grid.innerHTML = `<div class="empty">No matches within that budget/filter.
      Try raising your budget or removing a filter.</div>`;
    return;
  }
  grid.innerHTML = recs.map(r => {
    const p = r.perfume;
    const reasons = r.reasons.length
      ? `<div class="reasons"><span class="reasons-lbl">Why it fits</span>${r.reasons.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>`
      : "";
    return `
    <div class="pcard">
      <div class="top">
        <div>
          <p class="name">${esc(p.name)}</p>
          <p class="brand">${esc(p.brand)} &middot; ${esc(p.gender)} &middot; ${esc(p.year)}</p>
        </div>
        <div class="match"><span class="pct">${r.matchPct}%</span><span class="lbl">Match</span></div>
      </div>

      <div class="smells"><span class="lead">Smells like</span>${esc(p.smellsLike)}</div>
      ${reasons}
      <div class="notes-line"><span class="nl-lbl">Notes</span>${notePills(p)}</div>

      <div class="meta-row">
        <span class="price">$${p.priceRangeUSD[0]}–$${p.priceRangeUSD[1]}</span>
        <span><span class="meta-cap">Conc.</span>${esc(p.concentration || "EDP")}</span>
        <span><span class="meta-cap">Projection</span>${esc(p.strength)}</span>
      </div>

      <div class="buy-row">
        ${buyLinks(p).map(b =>
          `<a class="buy${b.sample ? " sample" : ""}" href="${b.url}" target="_blank" rel="noopener">${b.label}</a>`
        ).join("")}
      </div>
    </div>`;
  }).join("");
}

/* ------------------------ live fragrance lookup ----------------------- */
// "Search the library & the web": instant match against our curated set,
// a live web summary via DuckDuckGo's CORS-open Instant Answer API, and
// one-click deep links to the fragrance databases for full notes.

function lookupLinks(q) {
  const e = encodeURIComponent(q);
  return [
    { label: "Google notes", url: `https://www.google.com/search?q=${e}+fragrance+notes` },
    { label: "Fragrantica", url: `https://www.fragrantica.com/search/?query=${e}` },
    { label: "Parfumo", url: `https://www.google.com/search?q=site:parfumo.com+${e}` },
    { label: "Sephora", url: `https://www.sephora.com/search?keyword=${e}` },
    { label: "FragranceX", url: `https://www.fragrancex.com/search/search_results?stext=${e}` },
    { label: "Sample first", url: `https://www.scentsplit.com/search?q=${e}`, sample: true }
  ];
}

function catalogCard(p) {
  return `
    <div class="pcard">
      <div class="top">
        <div>
          <p class="name">${esc(p.name)}</p>
          <p class="brand">${esc(p.brand)} &middot; ${esc(p.gender)} &middot; ${esc(p.year)}</p>
        </div>
        <div class="match"><span class="lbl">In library</span></div>
      </div>
      <div class="smells"><span class="lead">Smells like</span>${esc(p.smellsLike)}</div>
      <div class="notes-line"><span class="nl-lbl">Notes</span>${notePills(p)}</div>
      <div class="meta-row">
        <span class="price">$${p.priceRangeUSD[0]}–$${p.priceRangeUSD[1]}</span>
        <span><span class="meta-cap">Conc.</span>${esc(p.concentration || "EDP")}</span>
        <span><span class="meta-cap">Projection</span>${esc(p.strength)}</span>
      </div>
      <div class="buy-row">
        ${buyLinks(p).map(b => `<a class="buy${b.sample ? " sample" : ""}" href="${b.url}" target="_blank" rel="noopener">${b.label}</a>`).join("")}
      </div>
    </div>`;
}

async function fetchWebSummary(q) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q + " fragrance")}` +
              `&format=json&no_html=1&skip_disambig=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("lookup failed");
  return res.json();
}

let lookupSeq = 0;
async function doLookup() {
  const q = document.getElementById("lookup-input").value.trim();
  const box = document.getElementById("lookup-results");
  if (!q) { box.innerHTML = ""; return; }
  const seq = ++lookupSeq; // guard against out-of-order async responses

  const ql = q.toLowerCase();
  const local = PERFUMES
    .filter(p => (p.name + " " + p.brand).toLowerCase().includes(ql))
    .slice(0, 4);

  let html = "";
  if (local.length) {
    html += `<span class="lookup-section-lbl">In our library</span>` +
            local.map(catalogCard).join("");
  }
  html += `
    <div class="webcard">
      <div class="webcard-head">
        <span class="lookup-section-lbl" style="margin:0;">Live web result</span>
        <span class="webcard-status" id="web-status">Searching the web…</span>
      </div>
      <div id="web-body"></div>
      <div class="buy-row links">
        ${lookupLinks(q).map(b => `<a class="buy${b.sample ? " sample" : ""}" href="${b.url}" target="_blank" rel="noopener">${b.label}</a>`).join("")}
      </div>
    </div>`;
  box.innerHTML = html;

  try {
    const d = await fetchWebSummary(q);
    if (seq !== lookupSeq) return; // a newer search superseded this one
    const status = document.getElementById("web-status");
    const body = document.getElementById("web-body");
    if (!status || !body) return;
    if (d && d.AbstractText) {
      const img = d.Image
        ? (d.Image.startsWith("http") ? d.Image : "https://duckduckgo.com" + d.Image)
        : "";
      body.innerHTML =
        `${img ? `<img class="web-img" src="${esc(img)}" alt="" referrerpolicy="no-referrer" />` : ""}
         <p class="web-abstract">${esc(d.AbstractText)}</p>
         ${d.AbstractURL ? `<a class="buy" href="${esc(d.AbstractURL)}" target="_blank" rel="noopener">Source: ${esc(d.AbstractSource || "web")}</a>` : ""}`;
      status.textContent = "";
    } else {
      status.textContent = "";
      body.innerHTML = `<p class="web-abstract muted">No quick web summary for this one — open one of the databases below for the full note breakdown.</p>`;
    }
  } catch (e) {
    if (seq !== lookupSeq) return;
    const status = document.getElementById("web-status");
    const body = document.getElementById("web-body");
    if (status) status.textContent = "";
    if (body) body.innerHTML = `<p class="web-abstract muted">Live lookup is unavailable right now — use the database links below.</p>`;
  }
}

function setupLookup() {
  const btn = document.getElementById("lookup-btn");
  const input = document.getElementById("lookup-input");
  if (!btn || !input) return;
  btn.addEventListener("click", doLookup);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); doLookup(); }
  });
}

/* ------------------------------ run ----------------------------------- */

function run() {
  // Require at least a character choice OR a liked perfume, so we have signal.
  if (!state.quiz.character && !state.likedIds.length) {
    alert("Tell me at least your vibe (fresh vs warm) or add one perfume you like, so I have something to go on.");
    return;
  }
  const recs = window.FragranceEngine.recommend(PERFUMES, {
    quiz: state.quiz,
    likedIds: state.likedIds,
    dislikedIds: state.dislikedIds,
    budgetMax: state.budgetMax >= 500 ? null : state.budgetMax,
    genders: state.genders,
    edpOnly: state.refine.includes("edp"),
    beastMode: state.refine.includes("beast"),
    topN: 8
  });
  renderResults(recs);
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ------------------------------ init ---------------------------------- */

async function init() {
  await loadData();
  bindSingleSelect("q-character", "character");
  bindSingleSelect("q-sweetness", "sweetness");
  bindSingleSelect("q-season", "season");
  bindSingleSelect("q-occasion", "occasion");
  bindSingleSelect("q-strength", "strength");
  bindMultiSelect("q-family", state.quiz.family);
  bindMultiSelect("q-gender", state.genders);
  bindMultiSelect("q-refine", state.refine);
  setupAutocomplete("like-input", "like-list", "like");
  setupAutocomplete("dislike-input", "dislike-list", "dislike");
  setupBudget();
  setupLookup();
  document.getElementById("find-btn").addEventListener("click", run);
  document.getElementById("reset-btn").addEventListener("click", () => location.reload());
}

document.addEventListener("DOMContentLoaded", init);
