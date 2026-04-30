# Pauper Oracle — Meta Analyzer

Aplikacja webowa do analizy meta-gry w formacie Pauper (Magic: The Gathering).

## Struktura

```
pauper-analyzer/
├── backend/
│   ├── main.py          # FastAPI server
│   ├── analysis.py      # Logika turnieju (z notebooków)
│   ├── scraper.py       # Scraper winrates + obrazków
│   ├── requirements.txt
│   └── data/            # Generowane: winrates.json, decks.json, images/
└── frontend/            # React + Vite
```

## Uruchomienie

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Pobierz dane (raz, lub gdy chcesz odświeżyć)
python scraper.py

# Uruchom serwer
uvicorn main:app --reload --port 8000
```

Serwer będzie dostępny pod: http://localhost:8000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikacja będzie dostępna pod: http://localhost:5173

## Jak działa analiza

1. **Scraper** pobiera winraty między deckami z mtgdecks.net oraz obrazki dla każdego decku.

2. **Meta Builder** — gracz wybiera decki, które będą w turnieju (każde kliknięcie = jeden slot, np. 3× Grixis Affinity = 3 sloty).

3. **Analiza probabilistyczna** — dla każdego unikalnego decku w turnieju wyliczany jest:
   - **Meta Share** — jaka część pola to ten deck
   - **WR vs Meta** — ważony winrate przeciwko składowi turnieju
   - **Expected WR** — oczekiwany wynik po całym turnieju
   - **Delta** — czy deck over/underperformuje względem swojego meta share
   - **P(N-0)** — prawdopodobieństwo zakończenia bez porażki

## Odświeżanie danych

Dane są ważne ~30 dni (zakres scrapera: `last30days`). Żeby odświeżyć:

```bash
cd backend
python scraper.py
```

Skrypt pomija obrazki już pobrane, więc nie ściąga ich ponownie.
