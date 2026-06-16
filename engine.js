/* engine.js — content-based fragrance recommender (Option A)
 *
 * Approach:
 *  - Each perfume is turned into a numeric feature vector built from its 12
 *    accord weights PLUS TF-IDF-weighted note tokens (rare/distinctive notes
 *    count more than common ones).
 *  - The user's quiz answers become a target preference vector in the same
 *    accord space. Each perfume the user LIKES adds its full vector to the
 *    target; each DISLIKED perfume subtracts its vector.
 *  - Perfumes are ranked by cosine similarity to the target vector.
 *  - Hard filters (budget, gender) are absolute; everything else is soft.
 *
 * No dependencies, no backend — runs entirely in the browser.
 */

const ACCORDS = [
  "fresh","citrus","aquatic","green","floral","sweet",
  "gourmand","powdery","woody","spicy","smoky","leather"
];

/* ----------------------------- vector math ----------------------------- */

function dot(a, b) {
  let s = 0;
  for (const k in a) if (b[k] !== undefined) s += a[k] * b[k];
  return s;
}

function magnitude(a) {
  let s = 0;
  for (const k in a) s += a[k] * a[k];
  return Math.sqrt(s);
}

function cosineSimilarity(a, b) {
  const m = magnitude(a) * magnitude(b);
  return m === 0 ? 0 : dot(a, b) / m;
}

function addInto(target, vec, scale = 1) {
  for (const k in vec) target[k] = (target[k] || 0) + vec[k] * scale;
  return target;
}

/* ------------------------ feature engineering -------------------------- */

// Build inverse-document-frequency weights for every note across the dataset.
// Rare notes get a higher weight (more distinctive => more informative).
function buildNoteIdf(perfumes) {
  const docCount = perfumes.length;
  const df = {};
  for (const p of perfumes) {
    for (const note of allNotes(p)) {
      df[note] = (df[note] || 0) + 1;
    }
  }
  const idf = {};
  for (const note in df) {
    idf[note] = Math.log((1 + docCount) / (1 + df[note])) + 1;
  }
  return idf;
}

function allNotes(p) {
  const set = new Set([
    ...(p.topNotes || []),
    ...(p.heartNotes || []),
    ...(p.baseNotes || [])
  ]);
  return [...set];
}

// Full feature vector: accords (always present) + idf-weighted note tokens.
// Note tokens are namespaced ("note:vanilla") so they never collide with
// accord dimensions.
function perfumeVector(p, idf) {
  const v = {};
  for (const a of ACCORDS) v[a] = p.accords[a] || 0;
  for (const note of allNotes(p)) {
    v["note:" + note] = (idf[note] || 1) * 0.5; // notes weighted a bit below accords
  }
  return v;
}

/* --------------------------- quiz -> vector ---------------------------- */

// Convert the quiz answers object into an accord-space preference vector.
// Each slider/choice nudges one or more accords up.
//
// quiz = {
//   character: "fresh" | "warm" | "balanced",
//   sweetness: "sweet" | "dry" | "balanced",
//   family: ["citrus","woody",...]   (multi-select scent families they like),
//   season: "summer" | "winter" | "spring" | "any",
//   occasion: "office" | "date" | "everyday" | "night",
//   strength: "soft" | "moderate" | "strong"
// }
function quizToVector(quiz) {
  const v = {};
  for (const a of ACCORDS) v[a] = 0;

  if (quiz.character === "fresh") {
    v.fresh += 1.0; v.citrus += 0.6; v.aquatic += 0.5; v.green += 0.4;
  } else if (quiz.character === "warm") {
    v.woody += 1.0; v.spicy += 0.6; v.sweet += 0.5; v.smoky += 0.4; v.leather += 0.3;
  } else {
    v.fresh += 0.4; v.woody += 0.4; v.floral += 0.3;
  }

  if (quiz.sweetness === "sweet") {
    v.sweet += 1.0; v.gourmand += 0.8;
  } else if (quiz.sweetness === "dry") {
    v.woody += 0.6; v.green += 0.4; v.smoky += 0.3;
    v.sweet -= 0.5; v.gourmand -= 0.5;
  }

  // Scent families directly map onto accord dims.
  for (const fam of (quiz.family || [])) {
    if (v[fam] !== undefined) v[fam] += 0.9;
    if (fam === "fresh") { v.citrus += 0.3; v.aquatic += 0.3; }
  }

  if (quiz.season === "summer") { v.fresh += 0.6; v.citrus += 0.4; v.aquatic += 0.4; }
  else if (quiz.season === "winter") { v.sweet += 0.5; v.spicy += 0.4; v.woody += 0.4; v.gourmand += 0.3; }
  else if (quiz.season === "spring") { v.floral += 0.6; v.green += 0.4; v.fresh += 0.3; }

  if (quiz.occasion === "office") { v.fresh += 0.3; v.woody += 0.2; v.powdery += 0.2; }
  else if (quiz.occasion === "date") { v.sweet += 0.3; v.woody += 0.3; v.floral += 0.2; }
  else if (quiz.occasion === "night") { v.sweet += 0.4; v.spicy += 0.3; v.smoky += 0.2; }

  return v;
}

/* ------------------------------ ranking -------------------------------- */

// Map a perfume strength to a coarse numeric level for soft matching.
const STRENGTH_LEVEL = { light: 1, moderate: 2, strong: 3, beast: 4 };
const STRENGTH_PREF = { soft: 1, moderate: 2, strong: 3.5 };

/**
 * Recommend perfumes.
 * @param {Array}  perfumes   the full database
 * @param {Object} prefs      { quiz, likedIds[], dislikedIds[], budgetMax,
 *                              genders[] ("men"/"women"/"unisex"), topN }
 * @returns {Array} ranked results with {perfume, score, matchPct, reasons[]}
 */
function recommend(perfumes, prefs) {
  const idf = buildNoteIdf(perfumes);
  const byId = Object.fromEntries(perfumes.map(p => [p.id, p]));

  // --- build the target preference vector ---
  const target = quizToVector(prefs.quiz || {});

  // Likes pull toward, dislikes push away (in accord space + note space).
  for (const id of (prefs.likedIds || [])) {
    const p = byId[id];
    if (p) addInto(target, perfumeVector(p, idf), 1.2);
  }
  for (const id of (prefs.dislikedIds || [])) {
    const p = byId[id];
    if (p) addInto(target, perfumeVector(p, idf), -1.0);
  }

  const likedSet = new Set(prefs.likedIds || []);
  const dislikedSet = new Set(prefs.dislikedIds || []);

  const results = [];
  for (const p of perfumes) {
    // Don't recommend something they already told us about.
    if (likedSet.has(p.id) || dislikedSet.has(p.id)) continue;

    // --- HARD filters ---
    if (prefs.budgetMax != null && p.priceRangeUSD[0] > prefs.budgetMax) continue;
    // Gender filter: a selected gender narrows results, but unisex scents
    // always pass (they're commonly recommended to everyone).
    if (prefs.genders && prefs.genders.length &&
        p.gender !== "unisex" && !prefs.genders.includes(p.gender)) continue;
    // EDP & stronger only: drop the lighter EDTs and colognes.
    if (prefs.edpOnly && (p.concentration === "EDT" || p.concentration === "Cologne")) continue;
    // Beast mode: only strong / beast projectors that last all day.
    if (prefs.beastMode && !(p.strength === "strong" || p.strength === "beast")) continue;

    // --- SOFT score: cosine similarity in the full feature space ---
    const vec = perfumeVector(p, idf);
    let score = cosineSimilarity(target, vec);

    // Soft strength preference: small penalty for mismatch.
    if (prefs.quiz && prefs.quiz.strength) {
      const want = STRENGTH_PREF[prefs.quiz.strength] || 2;
      const have = STRENGTH_LEVEL[p.strength] || 2;
      score -= Math.abs(want - have) * 0.03;
    }

    results.push({ perfume: p, rawScore: score });
  }

  results.sort((a, b) => b.rawScore - a.rawScore);
  const top = results.slice(0, prefs.topN || 8);

  // Normalize displayed match % against the best score so the top result
  // feels like a strong match, and attach human-readable reasons.
  // Guard against an all-negative scoreboard (heavy dislikes / penalties),
  // which would otherwise collapse every card to the same floor value.
  const best = top.length ? top[0].rawScore : 1;
  return top.map(r => {
    let pct;
    if (best <= 0) {
      pct = 50; // only weak matches exist — show a neutral, honest score
    } else {
      pct = Math.round((Math.max(r.rawScore, 0) / best) * 100);
    }
    return {
      perfume: r.perfume,
      score: r.rawScore,
      matchPct: Math.max(40, Math.min(100, pct)),
      reasons: explain(r.perfume, target)
    };
  });
}

// Produce 1–3 short reasons: the accords this perfume shares most strongly
// with the user's preference vector.
function explain(perfume, target) {
  const shared = [];
  for (const a of ACCORDS) {
    const t = target[a] || 0;
    const v = perfume.accords[a] || 0;
    if (t > 0.15 && v > 0.3) shared.push({ accord: a, strength: t * v });
  }
  shared.sort((x, y) => y.strength - x.strength);
  return shared.slice(0, 3).map(s => s.accord);
}

// Expose for the browser (app.js) and for Node tests.
if (typeof window !== "undefined") {
  window.FragranceEngine = { recommend, ACCORDS, quizToVector, cosineSimilarity };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    recommend, ACCORDS, quizToVector, cosineSimilarity,
    perfumeVector, buildNoteIdf
  };
}
