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

/* --------------------- AI web-search recommendations ------------------ */
// Optional mode: Google Gemini (free key, brought by the user and stored only
// in this browser) searches the live web and returns ranked fragrance picks
// with a match score. The offline engine above remains the default.

const GEMINI_MODEL = "gemini-2.0-flash";

function getKey() { try { return localStorage.getItem("gemini_key") || ""; } catch (_) { return ""; } }
function setKey(k) { try { k ? localStorage.setItem("gemini_key", k) : localStorage.removeItem("gemini_key"); } catch (_) {} }

function buildAiPrompt() {
  const q = state.quiz;
  const byId = Object.fromEntries(PERFUMES.map(p => [p.id, p]));
  const nameOf = id => (byId[id] ? `${byId[id].brand} ${byId[id].name}` : id);
  const L = [];
  L.push("You are an expert fragrance consultant. Use Google Search to find REAL, currently-available fragrances that best fit the person described, then score how well each fits.");
  L.push("");
  L.push("Preferences:");
  if (q.character) L.push(`- Overall feel: ${q.character === "fresh" ? "fresh & clean" : q.character === "warm" ? "warm & cozy" : "a mix of fresh and warm"}`);
  if (q.sweetness) L.push(`- Sweetness: ${q.sweetness}`);
  if (q.family && q.family.length) L.push(`- Favoured scent families: ${q.family.join(", ")}`);
  if (q.season && q.season !== "any") L.push(`- Season: ${q.season}`);
  if (q.occasion) L.push(`- Occasion: ${q.occasion}`);
  if (q.strength) L.push(`- Desired projection: ${q.strength}`);
  if (state.genders.length) L.push(`- Marketed for: ${state.genders.join(", ")} (unisex is also fine)`);
  if (state.likedIds.length) L.push(`- Loves these perfumes: ${state.likedIds.map(nameOf).join(", ")}`);
  if (state.dislikedIds.length) L.push(`- Dislikes these perfumes: ${state.dislikedIds.map(nameOf).join(", ")}`);
  L.push(`- Budget: ${state.budgetMax >= 500 ? "no strict limit" : "$" + state.budgetMax + " USD or less per bottle"}`);
  if (state.refine.includes("edp")) L.push("- Only EDP or stronger concentrations (no light EDTs/colognes).");
  if (state.refine.includes("beast")) L.push("- Only strong, long-lasting 'beast mode' performers.");
  L.push("");
  L.push("Recommend 6 to 8 fragrances, ordered best-first. Respect the budget strictly. Give an honest matchPct (0-100) for THIS person.");
  L.push("Output ONLY a JSON array — no prose, no markdown. Each element:");
  L.push('{"name":"","brand":"","gender":"men|women|unisex","matchPct":0,"concentration":"EDP|EDT|Extrait|Parfum|Cologne","priceUSD":"approx $X-$Y","smellsLike":"plain-language description an average person can picture","keyNotes":["note","note","note"],"why":"one short sentence on why it fits"}');
  return L.join("\n");
}

async function geminiRequest(key, prompt, useSearch) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } };
  if (useSearch) body.tools = [{ google_search: {} }];
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    let msg = "request failed (" + res.status + ")";
    try { const e = await res.json(); if (e.error && e.error.message) msg = e.error.message; } catch (_) {}
    const err = new Error(msg); err.status = res.status; throw err;
  }
  const data = await res.json();
  const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  return parts.map(p => p.text || "").join("");
}

async function callGemini(key, prompt) {
  try {
    return await geminiRequest(key, prompt, true);
  } catch (e) {
    // If web-search grounding isn't available on this key/region, retry without it.
    if (/search|grounding|tool/i.test(e.message || "")) return geminiRequest(key, prompt, false);
    throw e;
  }
}

function parseAiJson(text) {
  let t = (text || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1];
  const s = t.indexOf("["), e = t.lastIndexOf("]");
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

function aiCard(it) {
  const q = `${it.brand || ""} ${it.name || ""}`.trim();
  const pct = Math.max(0, Math.min(100, parseInt(it.matchPct, 10) || 0));
  const notes = Array.isArray(it.keyNotes) ? it.keyNotes : [];
  const notesHtml = notes.map(n => {
    const tip = GLOSSARY[n] ? ` data-tip="${esc(GLOSSARY[n])}"` : "";
    return `<span class="note-pill"${tip}>${esc(n)}</span>`;
  }).join("");
  const links = lookupLinks(q);
  return `
    <div class="pcard">
      <div class="top">
        <div>
          <p class="name">${esc(it.name || "")}</p>
          <p class="brand">${esc(it.brand || "")}${it.gender ? " &middot; " + esc(it.gender) : ""}</p>
        </div>
        <div class="match"><span class="pct">${pct}%</span><span class="lbl">Match</span></div>
      </div>
      ${it.smellsLike ? `<div class="smells"><span class="lead">Smells like</span>${esc(it.smellsLike)}</div>` : ""}
      ${it.why ? `<div class="reasons"><span class="reasons-lbl">Why it fits</span>${esc(it.why)}</div>` : ""}
      ${notesHtml ? `<div class="notes-line"><span class="nl-lbl">Notes</span>${notesHtml}</div>` : ""}
      <div class="meta-row">
        ${it.priceUSD ? `<span class="price">${esc(it.priceUSD)}</span>` : ""}
        ${it.concentration ? `<span><span class="meta-cap">Conc.</span>${esc(it.concentration)}</span>` : ""}
      </div>
      <div class="buy-row">
        ${links.map(b => `<a class="buy${b.sample ? " sample" : ""}" href="${b.url}" target="_blank" rel="noopener">${b.label}</a>`).join("")}
      </div>
    </div>`;
}

async function runAi() {
  const key = getKey();
  if (!key) {
    const panel = document.getElementById("key-panel");
    if (panel) panel.classList.remove("hidden");
    setKeyStatus("Add your free Gemini key to use AI web-search recommendations.");
    return;
  }
  if (!state.quiz.character && !state.likedIds.length && !(state.quiz.family || []).length) {
    alert("Tell me a little about your taste first — a vibe, a scent family, or a perfume you like.");
    return;
  }
  const results = document.getElementById("results");
  const grid = document.getElementById("results-grid");
  const mode = document.getElementById("results-mode");
  if (mode) mode.textContent = "AI · web-searched with Gemini";
  results.classList.remove("hidden");
  grid.innerHTML = `<div class="empty">Searching the web for your matches&hellip;</div>`;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    const text = await callGemini(key, buildAiPrompt());
    const list = parseAiJson(text);
    if (!Array.isArray(list) || !list.length) throw new Error("no results parsed");
    grid.innerHTML = list.map(aiCard).join("");
  } catch (e) {
    grid.innerHTML = `<div class="empty">Couldn't get AI recommendations &mdash; ${esc(e.message || "error")}.<br>
      <span style="font-size:14px">Check your Gemini key, or use the offline matches above.</span></div>`;
  }
}

function setKeyStatus(msg) { const s = document.getElementById("key-status"); if (s) s.textContent = msg; }
function refreshKeyUi() {
  const has = !!getKey();
  const toggle = document.getElementById("key-toggle");
  if (toggle) toggle.textContent = has ? "Gemini: connected" : "Connect Gemini (free)";
}
function setupAi() {
  const input = document.getElementById("key-input");
  if (input) input.value = getKey();
  const toggle = document.getElementById("key-toggle");
  const panel = document.getElementById("key-panel");
  if (toggle && panel) toggle.addEventListener("click", () => panel.classList.toggle("hidden"));
  const save = document.getElementById("key-save");
  if (save) save.addEventListener("click", () => { setKey(input.value.trim()); refreshKeyUi(); setKeyStatus("Saved — stored only in this browser."); });
  const clear = document.getElementById("key-clear");
  if (clear) clear.addEventListener("click", () => { setKey(""); if (input) input.value = ""; refreshKeyUi(); setKeyStatus("Key removed."); });
  const aiBtn = document.getElementById("ai-find-btn");
  if (aiBtn) aiBtn.addEventListener("click", runAi);
  refreshKeyUi();
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
  const mode = document.getElementById("results-mode");
  if (mode) mode.textContent = "Curated · matched in your browser";
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
  setupAi();
  document.getElementById("find-btn").addEventListener("click", run);
  document.getElementById("reset-btn").addEventListener("click", () => location.reload());
}

document.addEventListener("DOMContentLoaded", init);
