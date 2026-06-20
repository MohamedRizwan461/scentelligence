"""build_cheap.py — bulk-add real cheap fragrances via Gemini (Google Search grounded).

Generates per-house batches, salvages all complete JSON objects (even if the model
output was truncated), normalizes them into the site's perfume schema, dedupes
against the existing catalog, and appends. AI-compiled => marked approximate.

Usage:  GEMINI_KEY=xxxx python build_cheap.py
Then:   node build-data.js
"""
import os, re, json, time, urllib.request, urllib.error

KEY = os.environ.get("GEMINI_KEY", "").strip()
if not KEY:
    raise SystemExit("Set GEMINI_KEY env var")

MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
ACC = ["fresh","citrus","aquatic","green","floral","sweet","gourmand","powdery","woody","spicy","smoky","leather"]

HOUSES = [
    ("Lattafa", "the brand LATTAFA and its Lattafa Pride sub-line"),
    ("Armaf", "the brand ARMAF, including the Club de Nuit line"),
    ("Afnan", "the brand AFNAN"),
    ("Maison Alhambra", "the brand MAISON ALHAMBRA"),
    ("Fragrance World", "the brand FRAGRANCE WORLD"),
    ("Paris Corner", "the brands PARIS CORNER and FRENCH AVENUE"),
    ("Rasasi / Swiss Arabian", "the brands RASASI and SWISS ARABIAN"),
    ("Al Haramain / Ajmal", "the brands AL HARAMAIN and AJMAL"),
    ("Ard Al Zaafaran", "the brands ARD AL ZAAFARAN, RAVE, and KHADLAJ"),
    ("Budget designer", "affordable brands like Bharara, Al Wataniah, Zara, Jean Miss, Riiffs, Maison Asrar"),
]

def prompt_for(desc):
    return (
        "Use Google Search. List 25 REAL, currently-sold budget fragrances (typically "
        "under $50 USD) from " + desc + ". Only real products that actually exist. "
        "Return ONLY a JSON array (no prose, no markdown fences). Each element EXACTLY:\n"
        '{"name":"","brand":"","gender":"men|women|unisex","concentration":"EDP|EDT|Parfum",'
        '"priceUSD":[20,40],"strength":"moderate|strong|beast",'
        '"keyNotes":["n1","n2","n3","n4"],'
        '"accords":{"fresh":0,"citrus":0,"aquatic":0,"green":0,"floral":0,"sweet":0,'
        '"gourmand":0,"powdery":0,"woody":0,"spicy":0,"smoky":0,"leather":0},'
        '"smellsLike":"one plain-language sentence an average person can picture"}\n'
        "All accord values between 0.0 and 1.0. priceUSD is [low,high] integer USD. "
        "Use single-line strings only (no line breaks inside any value)."
    )

def call(prompt):
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 20000,
                              "thinkingConfig": {"thinkingBudget": 0}},
    }).encode()
    for attempt in range(3):
        req = urllib.request.Request(URL + "?key=" + KEY, data=body,
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.load(r)
        except urllib.error.HTTPError as e:
            code = e.code; print("   HTTP", code, str(e.read()[:120]))
            if code in (503, 429, 500) and attempt < 2:
                time.sleep(8); continue
            return ""
        except Exception as e:
            print("   error", str(e)[:120])
            if attempt < 2:
                time.sleep(8); continue
            return ""
        cands = d.get("candidates") or []
        if not cands:
            print("   no candidates:", json.dumps(d)[:140])
            if attempt < 2:
                time.sleep(8); continue
            return ""
        return "".join(p.get("text", "") for p in cands[0].get("content", {}).get("parts", []))
    return ""

def extract_objects(text):
    """Salvage every complete top-level {...} object inside the first [...] array."""
    s = text.find("[")
    if s < 0:
        return []
    i = text.find("{", s)
    dec = json.JSONDecoder(strict=False)
    out = []
    while i != -1 and i < len(text):
        while i < len(text) and text[i] in " \t\r\n,":
            i += 1
        if i >= len(text) or text[i] != "{":
            break
        try:
            obj, end = dec.raw_decode(text, i)
        except json.JSONDecodeError:
            break
        out.append(obj); i = end
    return out

def slug(s):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")

def normalize(it):
    name = str(it.get("name", "")).strip()
    brand = str(it.get("brand", "")).strip()
    if brand.isupper():
        brand = brand.title()
    if name.isupper():
        name = name.title()
    if not name or not brand:
        return None
    g = it.get("gender", "unisex")
    g = g if g in ("men", "women", "unisex") else "unisex"
    acc_in = it.get("accords", {}) or {}
    accords = {}
    for a in ACC:
        try:
            accords[a] = max(0.0, min(1.0, float(acc_in.get(a, 0) or 0)))
        except (TypeError, ValueError):
            accords[a] = 0.0
    pr = it.get("priceUSD", [20, 45])
    if not (isinstance(pr, list) and len(pr) == 2):
        pr = [20, 45]
    try:
        pr = [int(pr[0]), int(pr[1])]
    except (TypeError, ValueError):
        pr = [20, 45]
    strength = it.get("strength", "strong")
    strength = strength if strength in ("light", "moderate", "strong", "beast") else "strong"
    conc = it.get("concentration", "EDP")
    conc = conc if conc in ("EDP", "EDT", "Extrait", "Parfum", "Cologne") else "EDP"
    notes = [str(n).strip().lower() for n in (it.get("keyNotes") or []) if str(n).strip()][:6]
    sl = " ".join(str(it.get("smellsLike", "")).split()).strip()
    if not sl:
        sl = f"{name} by {brand} — a budget {'fresh' if accords['fresh'] > 0.5 else 'warm'} fragrance."
    if "approximate" not in sl.lower():
        sl += " (AI-compiled — approximate.)"
    vibe = []
    if accords["aquatic"] >= 0.5 or accords["fresh"] >= 0.6:
        vibe.append("summer")
    if accords["sweet"] >= 0.6 or accords["spicy"] >= 0.5 or accords["gourmand"] >= 0.5:
        vibe.append("cold-weather")
    vibe += ["everyday", "versatile"]
    vibe = list(dict.fromkeys(vibe))[:4]
    return {
        "id": slug(brand + "-" + name), "name": name, "brand": brand, "gender": g,
        "year": 2022, "topNotes": notes, "heartNotes": [], "baseNotes": [],
        "accords": accords, "smellsLike": sl, "vibe": vibe, "strength": strength,
        "priceTier": 1, "priceRangeUSD": pr, "concentration": conc,
        "searchQuery": f"{brand} {name} perfume",
    }

def main():
    perfumes = json.load(open("perfumes.json", encoding="utf-8"))
    have_id = {p["id"] for p in perfumes}
    have_nk = {(p["brand"].lower().strip(), p["name"].lower().strip()) for p in perfumes}
    only = [s.strip().lower() for s in os.environ.get("ONLY_HOUSES", "").split(",") if s.strip()]
    added = 0
    for label, desc in HOUSES:
        if only and not any(o in label.lower() for o in only):
            continue
        print(f"[{label}] querying...")
        txt = call(prompt_for(desc))
        objs = extract_objects(txt)
        n_house = 0
        for o in objs:
            p = normalize(o)
            if not p:
                continue
            nk = (p["brand"].lower().strip(), p["name"].lower().strip())
            if p["id"] in have_id or nk in have_nk:
                continue
            have_id.add(p["id"]); have_nk.add(nk)
            perfumes.append(p); added += 1; n_house += 1
        print(f"   parsed {len(objs)}, added {n_house}")
        time.sleep(2)
    out = json.dumps(perfumes, ensure_ascii=False)
    out = out.replace("},{", "},\n{").replace("[{", "[\n{", 1)
    out = out[:-1] + "\n]\n" if out.endswith("]") else out
    open("perfumes.json", "w", encoding="utf-8").write(out)
    print(f"\nAdded {added} cheap fragrances. Total now {len(perfumes)}.")

if __name__ == "__main__":
    main()
