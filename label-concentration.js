/* label-concentration.js — adds a `concentration` field to every perfume.
 * Default EDP; a curated override map marks the known EDT/Cologne/Extrait/Parfum.
 * Run:  node label-concentration.js && node build-data.js
 */
const fs = require("fs");

// concentration buckets: "Extrait" | "Parfum" | "EDP" | "EDT" | "Cologne"
// "EDP & stronger" filter keeps Extrait/Parfum/EDP and drops EDT/Cologne.
const OVERRIDE = {
  // Extrait / pure parfum (stronger than EDP)
  "baccarat-rouge-540-extrait": "Extrait",
  "acqua-di-gio-profumo": "Parfum",
  // EDT / lighter
  "acqua-di-gio-original": "EDT",
  "light-blue": "EDT",
  "light-blue-men": "EDT",
  "cool-water": "EDT",
  "ck-one": "EDT",
  "chrome-azzaro": "EDT",
  "versace-pour-homme": "EDT",
  "allure-homme-sport": "EDT",
  "nautica-voyage": "EDT",
  "polo-blue": "EDT",
  "bvlgari-aqva": "EDT",
  "bottled-hugo-boss": "EDT",
  "legend-mont-blanc": "EDT",
  "bright-crystal": "EDT",
  "daisy": "EDT",
  "terre-dhermes": "EDT",
  "vetiver-guerlain": "EDT",
  "k-by-dolce": "EDT",
  // Cologne / EDC (lightest)
  "dior-homme-cologne": "Cologne",
  "wood-sage-sea-salt": "Cologne",
  "english-pear-freesia": "Cologne"
};

// Infer from the name when it states the concentration explicitly.
function fromName(name) {
  const n = name.toLowerCase();
  if (n.includes("extrait")) return "Extrait";
  if (n.includes("elixir")) return "EDP";           // elixirs are EDP-strength+
  if (n.includes("cologne")) return "Cologne";
  if (n.includes("edt")) return "EDT";
  if (n.includes("edp")) return "EDP";
  if (n.includes("parfum") && !n.includes("eau de parfum")) return "Parfum";
  return null;
}

function main() {
  const perfumes = JSON.parse(fs.readFileSync("perfumes.json", "utf8"));
  const counts = {};
  for (const p of perfumes) {
    let c = OVERRIDE[p.id] || fromName(p.name) || "EDP";
    p.concentration = c;
    counts[c] = (counts[c] || 0) + 1;
  }
  fs.writeFileSync("perfumes.json", JSON.stringify(perfumes, null, 0).replace(/},{/g, "},\n{").replace(/^\[/, "[\n").replace(/\]$/, "\n]") + "\n");
  console.log("Labeled", perfumes.length, "perfumes:", JSON.stringify(counts));
}
main();
