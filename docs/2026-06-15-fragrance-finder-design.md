# Fragrance Finder — Design Spec
Date: 2026-06-15

## Problem
Picking a perfume from "notes" alone is hard — you can't imagine the smell, and online perfumes are non-returnable. Need a tool that takes taste + budget and recommends safe bets, while translating notes into plain language you can actually picture.

## Form factor
Static, hostable website (HTML/CSS/JS + JSON DB). Runs fully client-side — no backend, no API keys. Hostable on Netlify/GitHub Pages; also works opening index.html locally.

## Files
- `index.html` — structure
- `styles.css` — boutique-style, mobile-friendly UI
- `app.js` — quiz flow, UI rendering, autocomplete, results
- `engine.js` — ML recommender
- `perfumes.json` — curated fragrance database (~60 popular designer/niche)
- `notes-glossary.json` — plain-language meaning of each note

## Data model (per perfume)
id, name, brand, gender (men/women/unisex), year, topNotes[], heartNotes[],
baseNotes[], accords{12 dims 0–1}, smellsLike (plain English), vibe[],
strength (light/moderate/strong/beast), priceTier (1–4), priceRangeUSD[min,max],
searchQuery (for buy-links).

Accord dimensions: fresh, citrus, aquatic, green, floral, sweet, gourmand,
powdery, woody, spicy, smoky, leather.

## Notes → smell layer
1. Per-perfume `smellsLike` one-liner ("like fresh laundry and cucumber").
2. Notes glossary: tap any note for its plain-language smell.

## ML engine (content-based, Option A)
- Each perfume → weighted accord+note vector (TF-IDF weighting on notes).
- Quiz answers → target preference vector; liked perfumes add their vector,
  disliked perfumes subtract.
- Rank by cosine similarity. Hard filters: budget, gender. Soft: everything else.
- Show top ~8 with % match + "why matched" (top shared accords).

## User flow
Landing → vibe quiz (~6 cards) → optional like/dislike (autocomplete) →
budget slider → ranked result cards (name, brand, % match, smellsLike,
hoverable notes, price range, buy + sample/decant links).

## RuFlo usage
Built with ruflo-core agents; ruflo-core:reviewer reviews engine + code.

## Output
C:\Users\rizwa\Desktop\rizz\fragrance-finder\
