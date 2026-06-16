# Scentelligence — Perfume Selector

A browser-based fragrance recommender. You give it your vibe (fresh vs warm,
sweet vs dry, season, occasion, strength), optionally the perfumes you love and
dislike, and your budget — and it ranks perfumes that fit, **translating the
notes into plain language you can actually picture** and giving you buy / sample
links. Solves the "I can't tell how it smells from a list of notes, and online
perfume is non-returnable" problem.

Everything runs **client-side** — no backend, no API keys, no data leaves the page.

## How the ML works (content-based recommender)

1. Each perfume becomes a numeric vector: its 12 **accords** (fresh, citrus,
   aquatic, green, floral, sweet, gourmand, powdery, woody, spicy, smoky,
   leather) plus **TF-IDF-weighted note tokens** so rare, distinctive notes
   count more than common ones.
2. Your quiz answers become a **target preference vector**. Every perfume you
   **like** adds its vector to the target; every perfume you **dislike**
   subtracts its vector.
3. All perfumes are ranked by **cosine similarity** to your target.
4. **Hard filters** (budget, gender) are absolute; everything else is soft
   ranking. Each result shows a match % and *why* it fit (top shared accords).

See `engine.js`. There are no external dependencies.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure / quiz UI |
| `styles.css` | Styling |
| `app.js` | Quiz state, autocomplete, results rendering |
| `engine.js` | The recommendation engine (the ML) |
| `perfumes.json` | Curated fragrance database (~62 popular designer + niche) |
| `notes-glossary.json` | Plain-language meaning of each note (the hover tips) |
| `data.js` | Auto-generated copy of the JSON so it works when opened directly |
| `build-data.js` | Regenerates `data.js` after you edit the JSON |

## Run it locally

**Easiest:** just double-click `index.html`. (It uses the embedded `data.js`,
so it works even without a server.)

**Via a local server** (closest to hosted behavior):
```bash
cd fragrance-finder
python -m http.server 8000
# then open http://localhost:8000
```

## Host it (free, gives you a public URL)

Because it's a static site, hosting is drag-and-drop:

- **Netlify Drop** — go to https://app.netlify.com/drop and drag the
  `fragrance-finder` folder onto the page. You get a live URL in seconds.
- **GitHub Pages** — push this folder to a repo, then Settings → Pages →
  deploy from branch (root). 
- **Vercel / Cloudflare Pages** — point it at the folder, no build command.

## Editing the database

Edit `perfumes.json` (add/adjust perfumes) or `notes-glossary.json` (note
descriptions), then regenerate the offline fallback:
```bash
node build-data.js
```

### Perfume entry shape
```json
{
  "id": "unique-slug",
  "name": "Sauvage EDP", "brand": "Dior", "gender": "men|women|unisex",
  "year": 2018,
  "topNotes": [], "heartNotes": [], "baseNotes": [],
  "accords": { "fresh":0.7, "citrus":0.5, "aquatic":0.3, "green":0.1,
               "floral":0.1, "sweet":0.5, "gourmand":0.3, "powdery":0.1,
               "woody":0.6, "spicy":0.5, "smoky":0.2, "leather":0.1 },
  "smellsLike": "Plain-English description you can picture",
  "vibe": ["everyday","date"],
  "strength": "light|moderate|strong|beast",
  "priceTier": 1,
  "priceRangeUSD": [95, 140],
  "searchQuery": "Dior Sauvage Eau de Parfum"
}
```
All 12 accords must be present (0–1). `searchQuery` builds the buy-links.

## Note

Prices are typical ranges, not live stock. The buy buttons open a live **search**
for that exact perfume on each retailer (so links never go stale), plus a
**"Try a sample first"** link to a decant site — the cheapest way to smell-test
something non-returnable before committing.
