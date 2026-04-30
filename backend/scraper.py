#!/usr/bin/env python3
"""
Pauper winrate + image scraper.
Run: python scraper.py
"""
import json
import os
import re
import sys
import time
import requests
from bs4 import BeautifulSoup

URL = "https://mtgdecks.net/Pauper/winrates"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://mtgdecks.net/",
}

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
IMAGES_DIR = os.path.join(DATA_DIR, "images")


def fetch_page(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "lxml")


def parse_cell(raw: str) -> dict | None:
    match_m = re.search(r"([\d,]+)\s*matches", raw)
    if not match_m:
        return None
    matches = int(match_m.group(1).replace(",", ""))
    pct_nums = re.findall(r"(?<![,\d])(\d{1,3}(?:\.\d+)?)(?:\s*[|%\n])", raw)
    if len(pct_nums) < 3:
        return None
    ci_low  = float(pct_nums[0]) / 100
    ci_high = float(pct_nums[1]) / 100
    overall = float(pct_nums[2]) / 100
    return {
        "winrate":  round(overall, 4),
        "ci_low":   round(ci_low, 4),
        "ci_high":  round(ci_high, 4),
        "matches":  matches,
    }


def scrape_winrates(soup: BeautifulSoup) -> tuple[dict, list[str]]:
    table = soup.find("table")
    if not table:
        print("ERROR: No <table> found.", file=sys.stderr)
        return {}, []

    rows = table.find_all("tr")
    header_cells = rows[0].find_all("th")
    col_to_name = {}
    for i, th in enumerate(header_cells):
        name = th.get_text(strip=True)
        if name:
            col_to_name[i] = name

    matrix = {}
    for row in rows[1:]:
        tds = row.find_all("td")
        if not tds:
            continue
        deck_name = tds[0].get_text(strip=True)
        if not deck_name:
            continue
        entry = {"overall": None, "vs": {}}
        for i, td in enumerate(tds[1:], start=1):
            raw = td.get_text(separator="\n", strip=True)
            parsed = parse_cell(raw)
            if parsed is None:
                continue
            col_name = col_to_name.get(i)
            if col_name == "Overall":
                entry["overall"] = parsed
            elif col_name:
                entry["vs"][col_name] = parsed
        matrix[deck_name] = entry

    decks = sorted(matrix.keys())
    return matrix, decks


def scrape_images(decks: list[str]):
    session = requests.Session()
    session.headers.update(HEADERS)

    os.makedirs(IMAGES_DIR, exist_ok=True)

    for deck in decks:
        slug = deck.lower().replace(" ", "-").replace("/", "-")
        url = f"https://mtgdecks.net/Pauper/{slug}"

        # Check if image already downloaded
        safe_name = deck.replace(" ", "_").replace("/", "_")
        existing = [f for f in os.listdir(IMAGES_DIR) if f.startswith(safe_name + "_")]
        if existing:
            print(f"[SKIP] {deck} — image already exists")
            continue

        try:
            print(f"[FETCH] {url}")
            resp = session.get(url, timeout=15)
            if resp.status_code != 200:
                print(f"  -> HTTP {resp.status_code}, skipping")
                continue

            soup = BeautifulSoup(resp.text, "html.parser")
            imgs = soup.find_all("img", class_="lazyload")

            saved = 0
            for i, img in enumerate(imgs):
                img_url = img.get("data-src") or img.get("src")
                if not img_url or not img_url.startswith("http"):
                    continue
                filename = f"{safe_name}_{i}.jpg"
                filepath = os.path.join(IMAGES_DIR, filename)
                img_data = session.get(img_url, timeout=15).content
                with open(filepath, "wb") as f:
                    f.write(img_data)
                saved += 1
                break  # Only first image per deck

            print(f"  -> saved {saved} image(s)")
            time.sleep(2)

        except Exception as e:
            print(f"  -> Error: {e}")


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    print(f"=== Scraping winrates from {URL} ===")
    soup = fetch_page(URL)
    matrix, decks = scrape_winrates(soup)

    if not matrix:
        print("No data parsed.", file=sys.stderr)
        sys.exit(1)

    with open(os.path.join(DATA_DIR, "winrates.json"), "w", encoding="utf-8") as f:
        json.dump(matrix, f, indent=2, ensure_ascii=False)
    with open(os.path.join(DATA_DIR, "decks.json"), "w", encoding="utf-8") as f:
        json.dump(decks, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(matrix)} decks to data/winrates.json")
    print(f"Saved {len(decks)} deck names to data/decks.json")

    print("\n=== Scraping deck images ===")
    scrape_images(decks)

    print("\nDone!")


if __name__ == "__main__":
    main()
