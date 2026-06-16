/* add-middle-east.js — adds Middle Eastern / Arabian houses and fills missing
 * glossary notes. Run:  node add-middle-east.js && node build-data.js
 */
const fs = require("fs");

const NEW = [
  // ---------------- Rasasi (incl. Rayhaan line) ----------------
  {"id":"hawas-ice","name":"Hawas Ice","brand":"Rasasi","gender":"men","year":2021,"topNotes":["bergamot","apple","mint"],"heartNotes":["sea notes","lavender","cardamom"],"baseNotes":["ambergris","musk","amberwood"],"accords":{"fresh":0.8,"citrus":0.4,"aquatic":0.7,"green":0.3,"floral":0.2,"sweet":0.4,"gourmand":0.1,"powdery":0.1,"woody":0.4,"spicy":0.2,"smoky":0.1,"leather":0.0},"smellsLike":"An icy, minty-aquatic twist on Hawas — fresh apple and cool sea air over light musk. Crisp, sporty, and great for heat. Big value.","vibe":["summer","everyday","sport","versatile"],"strength":"strong","priceTier":2,"priceRangeUSD":[35,60],"searchQuery":"Rasasi Hawas Ice"},
  {"id":"hawas-for-her","name":"Hawas for Her","brand":"Rasasi","gender":"women","year":2018,"topNotes":["apple","green notes","peach"],"heartNotes":["jasmine","rose","sea notes"],"baseNotes":["musk","ambergris","sandalwood"],"accords":{"fresh":0.6,"citrus":0.3,"aquatic":0.5,"green":0.2,"floral":0.5,"sweet":0.5,"gourmand":0.2,"powdery":0.2,"woody":0.3,"spicy":0.1,"smoky":0.0,"leather":0.0},"smellsLike":"Juicy fruit and soft florals over clean musky freshness — bright, flirty, and easy. The female counterpart to Hawas. Great value.","vibe":["everyday","date","summer","versatile"],"strength":"strong","priceTier":2,"priceRangeUSD":[35,60],"searchQuery":"Rasasi Hawas for Her"},
  {"id":"daarej","name":"Daarej","brand":"Rasasi","gender":"men","year":2009,"topNotes":["bergamot","saffron","cinnamon"],"heartNotes":["rose","jasmine","patchouli"],"baseNotes":["amber","sandalwood","musk","vanilla"],"accords":{"fresh":0.2,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.4,"sweet":0.6,"gourmand":0.3,"powdery":0.2,"woody":0.5,"spicy":0.5,"smoky":0.2,"leather":0.1},"smellsLike":"Spicy saffron and rose over warm amber and woods — a budget tribute to YSL La Nuit / Armani Code with a richer, spicier feel.","vibe":["date","night","cold-weather","versatile"],"strength":"strong","priceTier":1,"priceRangeUSD":[20,40],"searchQuery":"Rasasi Daarej men"},
  {"id":"rayhaan-sheen","name":"Junoon Leather","brand":"Rasasi","gender":"men","year":2017,"topNotes":["bergamot","pink pepper","cardamom"],"heartNotes":["leather","saffron","rose"],"baseNotes":["oud","amber","sandalwood"],"accords":{"fresh":0.1,"citrus":0.1,"aquatic":0.0,"green":0.1,"floral":0.3,"sweet":0.4,"gourmand":0.2,"powdery":0.2,"woody":0.6,"spicy":0.5,"smoky":0.3,"leather":0.7},"smellsLike":"Smooth saffron-leather and rose over woody oud — refined, spicy, and dressy. An affordable luxe-leather scent for cool evenings.","vibe":["night","date","cold-weather","formal"],"strength":"strong","priceTier":2,"priceRangeUSD":[35,65],"searchQuery":"Rasasi Junoon Leather"},

  // ---------------- Afnan ----------------
  {"id":"afnan-9pm","name":"9PM","brand":"Afnan","gender":"men","year":2020,"topNotes":["apple","cinnamon","lavender","bergamot"],"heartNotes":["lily of the valley","orange blossom"],"baseNotes":["vanilla","tonka bean","amber","cedar"],"accords":{"fresh":0.3,"citrus":0.3,"aquatic":0.1,"green":0.2,"floral":0.3,"sweet":0.8,"gourmand":0.6,"powdery":0.2,"woody":0.4,"spicy":0.3,"smoky":0.1,"leather":0.0},"smellsLike":"Sweet apple and cinnamon over creamy vanilla and tonka — warm, cozy, and crowd-pleasing. A famous budget take on Stronger With You.","vibe":["night","date","cold-weather","versatile"],"strength":"strong","priceTier":1,"priceRangeUSD":[25,45],"searchQuery":"Afnan 9PM men"},
  {"id":"afnan-9pm-rebel","name":"9PM Rebel","brand":"Afnan","gender":"men","year":2023,"topNotes":["pineapple","bergamot","green apple"],"heartNotes":["lavender","violet leaf"],"baseNotes":["amberwood","vanilla","musk"],"accords":{"fresh":0.4,"citrus":0.3,"aquatic":0.1,"green":0.3,"floral":0.2,"sweet":0.7,"gourmand":0.4,"powdery":0.1,"woody":0.5,"spicy":0.2,"smoky":0.1,"leather":0.0},"smellsLike":"Sweet pineapple and apple over amber woods — fruity, fresh-sweet, and versatile. A budget nod to fruity designer scents.","vibe":["everyday","night","date","versatile"],"strength":"strong","priceTier":1,"priceRangeUSD":[25,45],"searchQuery":"Afnan 9PM Rebel"},
  {"id":"supremacy-not-only-intense","name":"Supremacy Not Only Intense","brand":"Afnan","gender":"men","year":2021,"topNotes":["apple","cinnamon","saffron"],"heartNotes":["rose","tobacco","amber"],"baseNotes":["vanilla","oud","musk"],"accords":{"fresh":0.2,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.3,"sweet":0.8,"gourmand":0.5,"powdery":0.2,"woody":0.5,"spicy":0.5,"smoky":0.2,"leather":0.1},"smellsLike":"Sweet spicy apple, rose, and amber with a woody base — rich, warm, and bold. A budget take on MFK Grand Soir / sweet ambers.","vibe":["night","cold-weather","date","special"],"strength":"beast","priceTier":1,"priceRangeUSD":[25,45],"searchQuery":"Afnan Supremacy Not Only Intense"},
  {"id":"turathi-brown","name":"Turathi Brown","brand":"Afnan","gender":"unisex","year":2022,"topNotes":["pineapple","plum","saffron"],"heartNotes":["rose","oud","patchouli"],"baseNotes":["amber","vanilla","musk","praline"],"accords":{"fresh":0.2,"citrus":0.1,"aquatic":0.0,"green":0.1,"floral":0.4,"sweet":0.8,"gourmand":0.5,"powdery":0.2,"woody":0.6,"spicy":0.4,"smoky":0.3,"leather":0.1},"smellsLike":"Sweet fruity rose and oud with a glowing amber base — a budget tribute to Baccarat-meets-oud. Rich, exotic, and long-lasting.","vibe":["night","date","cold-weather","special"],"strength":"beast","priceTier":1,"priceRangeUSD":[30,50],"searchQuery":"Afnan Turathi Brown"},

  // ---------------- Swiss Arabian ----------------
  {"id":"shaghaf-oud","name":"Shaghaf Oud","brand":"Swiss Arabian","gender":"unisex","year":2017,"topNotes":["raspberry","saffron"],"heartNotes":["rose","oud"],"baseNotes":["vanilla","amber","sugar"],"accords":{"fresh":0.1,"citrus":0.1,"aquatic":0.0,"green":0.1,"floral":0.5,"sweet":0.9,"gourmand":0.5,"powdery":0.2,"woody":0.6,"spicy":0.3,"smoky":0.2,"leather":0.1},"smellsLike":"Sweet raspberry-rose and oud over sugary vanilla amber — a famous budget tribute to Baccarat Rouge with a woody-oud twist. Rich and exotic.","vibe":["night","date","cold-weather","special"],"strength":"beast","priceTier":1,"priceRangeUSD":[25,45],"searchQuery":"Swiss Arabian Shaghaf Oud"},
  {"id":"casablanca-swiss-arabian","name":"Casablanca","brand":"Swiss Arabian","gender":"unisex","year":2007,"topNotes":["bergamot","orange blossom","spices"],"heartNotes":["rose","jasmine","cinnamon"],"baseNotes":["oud","amber","musk","vanilla"],"accords":{"fresh":0.1,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.5,"sweet":0.6,"gourmand":0.3,"powdery":0.2,"woody":0.6,"spicy":0.5,"smoky":0.3,"leather":0.1},"smellsLike":"Spicy florals, oud, and warm amber — a classic rich Arabian blend. Exotic, opulent, and long-lasting for the price.","vibe":["night","cold-weather","special","formal"],"strength":"beast","priceTier":1,"priceRangeUSD":[20,40],"searchQuery":"Swiss Arabian Casablanca"},

  // ---------------- Ajmal ----------------
  {"id":"ajmal-amber-wood","name":"Amber Wood","brand":"Ajmal","gender":"unisex","year":2014,"topNotes":["pineapple","saffron"],"heartNotes":["amber","jasmine"],"baseNotes":["sandalwood","musk","cedar"],"accords":{"fresh":0.2,"citrus":0.1,"aquatic":0.0,"green":0.1,"floral":0.2,"sweet":0.6,"gourmand":0.3,"powdery":0.2,"woody":0.8,"spicy":0.3,"smoky":0.2,"leather":0.1},"smellsLike":"Warm amber and creamy sandalwood with a hint of fruit and saffron — smooth, woody, and cozy. An elegant, easy Arabian woody.","vibe":["everyday","date","cold-weather","versatile"],"strength":"strong","priceTier":2,"priceRangeUSD":[35,65],"searchQuery":"Ajmal Amber Wood"},
  {"id":"ajmal-aurum","name":"Aurum","brand":"Ajmal","gender":"women","year":2013,"topNotes":["peach","passionfruit","apricot"],"heartNotes":["jasmine","freesia","ylang-ylang"],"baseNotes":["vanilla","musk","amber"],"accords":{"fresh":0.2,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.6,"sweet":0.8,"gourmand":0.4,"powdery":0.2,"woody":0.2,"spicy":0.0,"smoky":0.0,"leather":0.0},"smellsLike":"Juicy peach and apricot over sweet florals and vanilla — bright, fruity, and feminine. A cheerful, sweet crowd-pleaser. Great value.","vibe":["everyday","date","spring","versatile"],"strength":"strong","priceTier":2,"priceRangeUSD":[30,55],"searchQuery":"Ajmal Aurum women"},

  // ---------------- Al Haramain ----------------
  {"id":"laventure-al-haramain","name":"L'Aventure","brand":"Al Haramain","gender":"men","year":2014,"topNotes":["bergamot","apple","cardamom"],"heartNotes":["cinnamon","lavender","amber"],"baseNotes":["sandalwood","vetiver","oakmoss","tonka bean"],"accords":{"fresh":0.4,"citrus":0.3,"aquatic":0.1,"green":0.2,"floral":0.2,"sweet":0.6,"gourmand":0.3,"powdery":0.2,"woody":0.6,"spicy":0.4,"smoky":0.2,"leather":0.1},"smellsLike":"Spicy-sweet apple and cardamom over warm woods and amber — a budget tribute to Creed Aventus's drydown. Bold and versatile.","vibe":["everyday","date","night","versatile"],"strength":"beast","priceTier":2,"priceRangeUSD":[30,55],"searchQuery":"Al Haramain L'Aventure"},
  {"id":"amber-oud-rouge","name":"Amber Oud Rouge Edition","brand":"Al Haramain","gender":"unisex","year":2018,"topNotes":["fruity notes","saffron"],"heartNotes":["amber","oud","rose"],"baseNotes":["musk","vanilla","woody notes"],"accords":{"fresh":0.1,"citrus":0.1,"aquatic":0.0,"green":0.0,"floral":0.4,"sweet":0.9,"gourmand":0.5,"powdery":0.2,"woody":0.6,"spicy":0.3,"smoky":0.2,"leather":0.1},"smellsLike":"Sweet fruity amber and oud with a rosy glow — a budget Baccarat-style scent that's rich, warm, and very long-lasting.","vibe":["night","date","cold-weather","special"],"strength":"beast","priceTier":2,"priceRangeUSD":[30,55],"searchQuery":"Al Haramain Amber Oud Rouge Edition"},

  // ---------------- Arabian Oud / Lattafa more ----------------
  {"id":"kalemat-arabian-oud","name":"Kalemat","brand":"Arabian Oud","gender":"unisex","year":2009,"topNotes":["honey","pineapple","bergamot"],"heartNotes":["amber","cedar","praline"],"baseNotes":["oud","vanilla","musk"],"accords":{"fresh":0.2,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.2,"sweet":0.9,"gourmand":0.7,"powdery":0.2,"woody":0.5,"spicy":0.2,"smoky":0.2,"leather":0.1},"smellsLike":"Sweet honey and pineapple over praline, amber, and oud — rich, golden, and dessert-like with a woody depth. A beloved Arabian gem.","vibe":["night","date","cold-weather","special"],"strength":"beast","priceTier":2,"priceRangeUSD":[40,70],"searchQuery":"Arabian Oud Kalemat"},
  {"id":"raghba","name":"Raghba","brand":"Lattafa","gender":"unisex","year":2017,"topNotes":["vanilla","sugar"],"heartNotes":["agarwood","amber"],"baseNotes":["musk","incense","woody notes"],"accords":{"fresh":0.0,"citrus":0.0,"aquatic":0.0,"green":0.0,"floral":0.1,"sweet":0.9,"gourmand":0.8,"powdery":0.2,"woody":0.5,"spicy":0.2,"smoky":0.3,"leather":0.1},"smellsLike":"Sweet sugary vanilla over smoky oud and amber — like vanilla incense. Warm, sweet, and long-lasting. A budget cozy favorite.","vibe":["night","cold-weather","date","versatile"],"strength":"beast","priceTier":1,"priceRangeUSD":[18,35],"searchQuery":"Lattafa Raghba"},
  {"id":"ana-abiyedh-rouge","name":"Ana Abiyedh Rouge","brand":"Lattafa","gender":"unisex","year":2019,"topNotes":["saffron","cypriol","lemon"],"heartNotes":["rose","jasmine"],"baseNotes":["sandalwood","cedar","patchouli"],"accords":{"fresh":0.2,"citrus":0.2,"aquatic":0.0,"green":0.2,"floral":0.4,"sweet":0.3,"gourmand":0.1,"powdery":0.2,"woody":0.7,"spicy":0.6,"smoky":0.4,"leather":0.2},"smellsLike":"Dry saffron and smoky woods with a hint of rose — a budget tribute to MFK Oud Silk Mood / saffron-leather scents. Refined and woody.","vibe":["office","date","cold-weather","versatile"],"strength":"strong","priceTier":1,"priceRangeUSD":[18,35],"searchQuery":"Lattafa Ana Abiyedh Rouge"},
  {"id":"mayar","name":"Mayar","brand":"Lattafa","gender":"women","year":2022,"topNotes":["raspberry","bergamot","saffron"],"heartNotes":["rose","jasmine","magnolia"],"baseNotes":["vanilla","musk","sandalwood"],"accords":{"fresh":0.2,"citrus":0.2,"aquatic":0.0,"green":0.1,"floral":0.7,"sweet":0.8,"gourmand":0.4,"powdery":0.2,"woody":0.3,"spicy":0.2,"smoky":0.0,"leather":0.0},"smellsLike":"Sweet raspberry and rose over creamy vanilla — soft, fruity-floral, and feminine. A budget take on rosy-fruity designer scents.","vibe":["date","everyday","spring","versatile"],"strength":"strong","priceTier":1,"priceRangeUSD":[18,35],"searchQuery":"Lattafa Mayar"},
  {"id":"maahir","name":"Maahir","brand":"Lattafa","gender":"unisex","year":2020,"topNotes":["bergamot","mandarin","apple"],"heartNotes":["rose","leather","oud"],"baseNotes":["musk","amber","sandalwood"],"accords":{"fresh":0.3,"citrus":0.3,"aquatic":0.0,"green":0.1,"floral":0.4,"sweet":0.5,"gourmand":0.2,"powdery":0.2,"woody":0.6,"spicy":0.3,"smoky":0.2,"leather":0.4},"smellsLike":"Fruity-rosy opening over leather, oud, and amber — a budget tribute to Aventus-meets-leather. Versatile, classy, and rich.","vibe":["office","date","everyday","versatile"],"strength":"strong","priceTier":1,"priceRangeUSD":[18,35],"searchQuery":"Lattafa Maahir"},
  {"id":"velvet-oud","name":"Velvet Oud","brand":"Lattafa","gender":"unisex","year":2021,"topNotes":["spicy notes","apple"],"heartNotes":["oud","rose","saffron"],"baseNotes":["amber","vanilla","musk"],"accords":{"fresh":0.1,"citrus":0.1,"aquatic":0.0,"green":0.1,"floral":0.4,"sweet":0.7,"gourmand":0.4,"powdery":0.2,"woody":0.7,"spicy":0.4,"smoky":0.3,"leather":0.1},"smellsLike":"Smooth oud and rose over sweet amber and vanilla — rich, warm, and velvety. A cozy, exotic woody-sweet at a great price.","vibe":["night","date","cold-weather","special"],"strength":"strong","priceTier":1,"priceRangeUSD":[18,35],"searchQuery":"Lattafa Velvet Oud"},
  {"id":"khamrah-qahwa","name":"Khamrah Qahwa","brand":"Lattafa","gender":"unisex","year":2023,"topNotes":["coffee","cinnamon","nutmeg"],"heartNotes":["dates","praline","tuberose"],"baseNotes":["vanilla","tonka bean","myrrh"],"accords":{"fresh":0.1,"citrus":0.0,"aquatic":0.0,"green":0.0,"floral":0.2,"sweet":0.9,"gourmand":0.9,"powdery":0.2,"woody":0.3,"spicy":0.6,"smoky":0.1,"leather":0.0},"smellsLike":"Spiced coffee, sweet dates, and creamy vanilla — like a cardamom-coffee date cake. A cozy gourmand twist on Khamrah. Huge value.","vibe":["cold-weather","night","date","versatile"],"strength":"beast","priceTier":1,"priceRangeUSD":[25,45],"searchQuery":"Lattafa Khamrah Qahwa"},
  {"id":"oud-mood-elixir","name":"Oud Mood Elixir","brand":"Lattafa","gender":"unisex","year":2022,"topNotes":["spices","saffron"],"heartNotes":["oud","rose","patchouli"],"baseNotes":["amber","musk","sandalwood"],"accords":{"fresh":0.0,"citrus":0.0,"aquatic":0.0,"green":0.1,"floral":0.4,"sweet":0.5,"gourmand":0.2,"powdery":0.2,"woody":0.8,"spicy":0.5,"smoky":0.4,"leather":0.2},"smellsLike":"Deep smoky oud, spice, and rose with amber warmth — a classic rich Arabian oud profile. Bold, exotic, and long-lasting.","vibe":["night","cold-weather","special","formal"],"strength":"beast","priceTier":1,"priceRangeUSD":[22,40],"searchQuery":"Lattafa Oud Mood Elixir"},

  // ---------------- Armaf extra ----------------
  {"id":"armaf-ventana","name":"Ventana","brand":"Armaf","gender":"men","year":2020,"topNotes":["apple","pineapple","bergamot"],"heartNotes":["cinnamon","jasmine","violet"],"baseNotes":["amber","vanilla","tonka bean","cedar"],"accords":{"fresh":0.3,"citrus":0.3,"aquatic":0.1,"green":0.2,"floral":0.2,"sweet":0.8,"gourmand":0.5,"powdery":0.2,"woody":0.4,"spicy":0.3,"smoky":0.1,"leather":0.0},"smellsLike":"Sweet fruity apple and cinnamon over vanilla amber — a budget take on sweet fruity-spicy designers. Warm and crowd-pleasing.","vibe":["night","date","cold-weather","versatile"],"strength":"strong","priceTier":1,"priceRangeUSD":[20,40],"searchQuery":"Armaf Ventana"},
  {"id":"armaf-tres-nuit","name":"Tres Nuit","brand":"Armaf","gender":"men","year":2015,"topNotes":["grapefruit","bergamot","green notes"],"heartNotes":["coriander","apple","cardamom"],"baseNotes":["cedar","vetiver","musk"],"accords":{"fresh":0.7,"citrus":0.5,"aquatic":0.2,"green":0.4,"floral":0.1,"sweet":0.3,"gourmand":0.1,"powdery":0.1,"woody":0.6,"spicy":0.2,"smoky":0.2,"leather":0.0},"smellsLike":"Fresh grapefruit and green woods — clean, smoky-woody, and refined. A budget tribute to Bleu de Chanel. Office-friendly and versatile.","vibe":["office","everyday","date","versatile"],"strength":"moderate","priceTier":1,"priceRangeUSD":[18,35],"searchQuery":"Armaf Tres Nuit"}
];

// Fill in glossary notes flagged as missing + any new ones above.
const NEW_NOTES = {
  "orange flower": "Soft, sweet, slightly honeyed white blossom.",
  "sicilian lemon": "Bright, sweet-tart premium lemon.",
  "oak": "Dry, woody, slightly tannic barrel-wood note.",
  "citrus": "Bright, zesty mixed-citrus freshness.",
  "mysore sandalwood": "Rich, creamy, premium sandalwood.",
  "woods": "General smooth, dry wood smell.",
  "jasmine bud": "Green, fresh, slightly sharp young jasmine.",
  "african orange flower": "Rich, honeyed, slightly green orange blossom.",
  "pineapple leaf": "Green, tart, slightly tropical leaf note.",
  "rosemary": "Aromatic, herbal, slightly piney-camphorous herb.",
  "turkish rose": "Rich, deep, slightly jammy true rose.",
  "peppermint": "Cool, sharp, tingly mint.",
  "sicilian orange": "Sweet, juicy, bright orange.",
  "sweet notes": "General sugary-sweet accord.",
  "bulgarian rose": "Deep, rich, classic rose.",
  "chocolate": "Sweet, rich cocoa.",
  "green mandarin": "Tart, zesty, slightly green orange.",
  "bitter orange": "Sharp, zesty, slightly bitter orange.",
  "dry woods": "Dry, smooth, slightly smoky woods.",
  "cucumber": "Cool, fresh, watery-green note.",
  "spicy notes": "A warm hit of mixed spices.",
  "passionfruit": "Tangy, juicy, exotic tropical fruit.",
  "cypriol": "Dry, smoky, earthy woody root (nagarmotha).",
  "myrrh": "Warm, resinous, slightly medicinal-sweet incense.",
  "agarwood": "Same as oud — rich, smoky, resinous wood.",
  "sugar": "Pure sweet sugary note.",
  "passion fruit": "Tangy, juicy, exotic tropical fruit."
};

function main() {
  const perfumes = JSON.parse(fs.readFileSync("perfumes.json", "utf8"));
  const glossary = JSON.parse(fs.readFileSync("notes-glossary.json", "utf8"));
  const byId = new Map(perfumes.map(p => [p.id, p]));

  let added = 0;
  for (const p of NEW) { if (!byId.has(p.id)) { perfumes.push(p); byId.set(p.id, p); added++; } }

  let notesAdded = 0;
  for (const [k, v] of Object.entries(NEW_NOTES)) if (!glossary[k]) { glossary[k] = v; notesAdded++; }

  const ACC = ["fresh","citrus","aquatic","green","floral","sweet","gourmand","powdery","woody","spicy","smoky","leather"];
  let problems = 0, missingTips = 0;
  for (const p of perfumes) {
    for (const a of ACC) if (typeof p.accords[a] !== "number") { console.log("BAD accord", a, "in", p.id); problems++; }
    if (!p.smellsLike || !p.searchQuery || !p.priceRangeUSD) { console.log("BAD field in", p.id); problems++; }
    for (const n of [...(p.topNotes||[]),...(p.heartNotes||[]),...(p.baseNotes||[])])
      if (!glossary[n]) { console.log("  note missing glossary:", n, "in", p.id); missingTips++; }
  }

  fs.writeFileSync("perfumes.json", JSON.stringify(perfumes, null, 0).replace(/},{/g, "},\n{").replace(/^\[/, "[\n").replace(/\]$/, "\n]") + "\n");
  fs.writeFileSync("notes-glossary.json", JSON.stringify(glossary, null, 2) + "\n");

  console.log(`Added ${added} perfumes (total ${perfumes.length}). Added ${notesAdded} glossary notes (total ${Object.keys(glossary).length}). Field problems: ${problems}. Remaining missing tooltips: ${missingTips}.`);
}

main();
