/* add-rayhaan.js — adds Rayhaan (by Rasasi) + Rumz al Rasasi entries.
 * Run:  node add-rayhaan.js && node build-data.js
 */
const fs = require("fs");

const NEW = [
  {"id":"rayhaan-bilqis","name":"Bilqis","brand":"Rayhaan","gender":"women","year":2018,"topNotes":["saffron","raspberry","bergamot"],"heartNotes":["rose","jasmine","orange blossom"],"baseNotes":["oud","amber","vanilla","musk"],"accords":{"fresh":0.1,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.7,"sweet":0.8,"gourmand":0.4,"powdery":0.3,"woody":0.5,"spicy":0.3,"smoky":0.2,"leather":0.1},"smellsLike":"Lush saffron-rose and raspberry over sweet amber, vanilla, and oud. A rich, regal floral-oriental that feels luxurious and opulent for the price.","vibe":["night","date","cold-weather","special"],"strength":"beast","priceTier":2,"priceRangeUSD":[35,65],"searchQuery":"Rayhaan Bilqis Rasasi"},
  {"id":"rayhaan-heelan","name":"Heelan","brand":"Rayhaan","gender":"unisex","year":2017,"topNotes":["bergamot","saffron","pink pepper"],"heartNotes":["rose","oud","patchouli"],"baseNotes":["sandalwood","amber","musk"],"accords":{"fresh":0.1,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.4,"sweet":0.5,"gourmand":0.2,"powdery":0.2,"woody":0.8,"spicy":0.5,"smoky":0.3,"leather":0.2},"smellsLike":"Smooth saffron and rose over woody oud, sandalwood, and amber. A refined, spicy-woody Arabian scent that is dressy and long-lasting.","vibe":["night","date","cold-weather","formal"],"strength":"beast","priceTier":2,"priceRangeUSD":[35,65],"searchQuery":"Rayhaan Heelan Rasasi"},
  {"id":"rayhaan-areej","name":"Areej","brand":"Rayhaan","gender":"women","year":2017,"topNotes":["peach","bergamot","blackcurrant"],"heartNotes":["rose","jasmine","tuberose"],"baseNotes":["musk","amber","sandalwood","vanilla"],"accords":{"fresh":0.2,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.8,"sweet":0.7,"gourmand":0.3,"powdery":0.3,"woody":0.3,"spicy":0.1,"smoky":0.0,"leather":0.0},"smellsLike":"Juicy peach and a big bouquet of rose, jasmine, and tuberose over soft amber-vanilla. A bright, feminine floral that is pretty and easy to wear.","vibe":["date","spring","special","versatile"],"strength":"strong","priceTier":2,"priceRangeUSD":[30,60],"searchQuery":"Rayhaan Areej Rasasi"},
  {"id":"rayhaan-naseem","name":"Naseem","brand":"Rayhaan","gender":"unisex","year":2019,"topNotes":["bergamot","apple","lavender"],"heartNotes":["jasmine","sea notes","geranium"],"baseNotes":["musk","amber","cedar"],"accords":{"fresh":0.7,"citrus":0.4,"aquatic":0.5,"green":0.3,"floral":0.3,"sweet":0.3,"gourmand":0.1,"powdery":0.2,"woody":0.4,"spicy":0.1,"smoky":0.0,"leather":0.0},"smellsLike":"Clean, breezy bergamot and apple with a soft aquatic-floral heart. A fresh, gentle everyday scent that is light and inoffensive. Great value.","vibe":["everyday","office","summer","versatile"],"strength":"moderate","priceTier":2,"priceRangeUSD":[30,55],"searchQuery":"Rayhaan Naseem Rasasi"},
  {"id":"rumz-9325-homme","name":"Rumz al Rasasi 9325 Pour Homme","brand":"Rasasi","gender":"men","year":2016,"topNotes":["pineapple","apple","bergamot"],"heartNotes":["geranium","cinnamon","jasmine"],"baseNotes":["amber","musk","vetiver","patchouli"],"accords":{"fresh":0.4,"citrus":0.3,"aquatic":0.1,"green":0.3,"floral":0.3,"sweet":0.5,"gourmand":0.2,"powdery":0.2,"woody":0.6,"spicy":0.3,"smoky":0.2,"leather":0.1},"smellsLike":"Fruity pineapple and apple over spicy woods and amber. A versatile, slightly smoky fruity-woody scent reminiscent of Aventus on a budget.","vibe":["everyday","date","office","versatile"],"strength":"strong","priceTier":2,"priceRangeUSD":[30,55],"searchQuery":"Rumz al Rasasi 9325 Pour Homme"}
];

const NEW_NOTES = {}; // all notes already covered by the glossary

function main() {
  const perfumes = JSON.parse(fs.readFileSync("perfumes.json", "utf8"));
  const glossary = JSON.parse(fs.readFileSync("notes-glossary.json", "utf8"));
  const byId = new Map(perfumes.map(p => [p.id, p]));

  let added = 0;
  for (const p of NEW) if (!byId.has(p.id)) { perfumes.push(p); byId.set(p.id, p); added++; }

  let notesAdded = 0;
  for (const [k, v] of Object.entries(NEW_NOTES)) if (!glossary[k]) { glossary[k] = v; notesAdded++; }

  const ACC = ["fresh","citrus","aquatic","green","floral","sweet","gourmand","powdery","woody","spicy","smoky","leather"];
  let problems = 0, missing = 0;
  for (const p of perfumes) {
    for (const a of ACC) if (typeof p.accords[a] !== "number") { console.log("BAD accord", a, p.id); problems++; }
    if (!p.smellsLike || !p.searchQuery || !p.priceRangeUSD) { console.log("BAD field", p.id); problems++; }
    for (const n of [...(p.topNotes||[]),...(p.heartNotes||[]),...(p.baseNotes||[])])
      if (!glossary[n]) { console.log("  missing tooltip:", n, p.id); missing++; }
  }

  fs.writeFileSync("perfumes.json", JSON.stringify(perfumes, null, 0).replace(/},{/g, "},\n{").replace(/^\[/, "[\n").replace(/\]$/, "\n]") + "\n");
  fs.writeFileSync("notes-glossary.json", JSON.stringify(glossary, null, 2) + "\n");
  console.log(`Added ${added} (total ${perfumes.length}). Notes +${notesAdded} (total ${Object.keys(glossary).length}). Problems ${problems}. Missing tooltips ${missing}.`);
}
main();
