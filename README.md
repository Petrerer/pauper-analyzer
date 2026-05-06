# Pauper Oracle — Meta Analyzer

Aplikacja webowa do analizy meta-gry w formacie Pauper (Magic: The Gathering).

## URL

https://pauper-analyzer.vercel.app/

1. **Scraper** pobiera winraty między deckami z mtgdecks.net oraz obrazki dla każdego decku.

2. **Meta Builder** — gracz wybiera decki, które będą w turnieju (każde kliknięcie = jeden slot, np. 3× Grixis Affinity = 3 sloty).

3. **Analiza probabilistyczna** — dla każdego unikalnego decku w turnieju wyliczany jest:
   - **Meta Share** — jaka część pola to ten deck
   - **WR vs Meta** — ważony winrate przeciwko składowi turnieju
   - **Expected WR** — oczekiwany wynik po całym turnieju
   - **Delta** — czy deck over/underperformuje względem swojego meta share
   - **P(N-0)** — prawdopodobieństwo zakończenia bez porażki

## Odświeżanie danych

Dane są pobierane manualnie
