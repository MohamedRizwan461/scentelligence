/* build-data.js — regenerates data.js (the file:// fallback) from the JSON.
 * Run after editing perfumes.json or notes-glossary.json:  node build-data.js
 */
const fs = require("fs");
const p = fs.readFileSync("perfumes.json", "utf8");
const g = fs.readFileSync("notes-glossary.json", "utf8");
const out =
  "/* Auto-generated fallback so the site works when opened directly from disk (file://).\n" +
  " * Regenerate after editing perfumes.json / notes-glossary.json:  node build-data.js\n */\n" +
  "window.__PERFUMES__ = " + p + ";\n" +
  "window.__GLOSSARY__ = " + g + ";\n";
fs.writeFileSync("data.js", out);
console.log("data.js written (" + (out.length / 1024).toFixed(1) + " KB)");
