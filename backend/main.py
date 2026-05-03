from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import os
from typing import Optional
from analysis import run_tournament_analysis

app = FastAPI(title="Pauper Meta Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pauper-analyzer-e257sr484-petrerers-projects.vercel.app","https://pauper-analyzer.vercel.app","http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
IMAGES_DIR = os.path.join(DATA_DIR, "images")

if os.path.exists(IMAGES_DIR):
    app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")


def load_winrates() -> dict:
    path = os.path.join(DATA_DIR, "winrates.json")
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_decks() -> list[str]:
    path = os.path.join(DATA_DIR, "decks.json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/api/status")
def status():
    winrates = load_winrates()
    decks = load_decks()
    images_dir = IMAGES_DIR
    images = {}
    if os.path.exists(images_dir):
        for fname in os.listdir(images_dir):
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                # Extract deck name from filename: "Deck_Name_0.jpg"
                parts = fname.rsplit("_", 1)
                deck_name = parts[0].replace("_", " ") if len(parts) > 1 else fname
                if deck_name not in images:
                    images[deck_name] = f"/images/{fname}"
    return {
        "has_data": len(winrates) > 0,
        "deck_count": len(decks),
        "images": images,
    }


@app.get("/api/decks")
def get_decks():
    winrates = load_winrates()
    decks = load_decks()
    images_dir = IMAGES_DIR
    images = {}
    if os.path.exists(images_dir):
        for fname in os.listdir(images_dir):
            if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                parts = fname.rsplit("_", 1)
                deck_name = parts[0].replace("_", " ") if len(parts) > 1 else fname
                if deck_name not in images:
                    images[deck_name] = f"/images/{fname}"

    result = []
    for deck in decks:
        wr_data = winrates.get(deck, {})
        overall = wr_data.get("overall") or {}
        result.append({
            "name": deck,
            "winrate": overall.get("winrate", 0.5),
            "matches": overall.get("matches", 0),
            "image": images.get(deck),
            "meta_share": overall.get("matches", 0) / sum(wr.get("overall", {}).get("matches", 0) for wr in winrates.values()) if overall.get("matches", 0) > 0 else 0
        })
    result.sort(key=lambda x: x["matches"], reverse=True)

    temp_cutoff = 0.005
    result = [d for d in result if d["meta_share"] >= temp_cutoff]
    return result


@app.get("/api/winrates")
def get_winrates():
    return load_winrates()


class TournamentRequest(BaseModel):
    decks: list[str]
    n_rounds: int = 5


@app.post("/api/analyze")
def analyze(req: TournamentRequest):
    winrates = load_winrates()
    if not winrates:
        raise HTTPException(status_code=400, detail="No winrate data loaded. Run scraper first.")
    if len(req.decks) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 decks.")

    result = run_tournament_analysis(winrates, req.decks, req.n_rounds)
    return result
