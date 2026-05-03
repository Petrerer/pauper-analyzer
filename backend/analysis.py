"""
Tournament analysis logic ported from pauper_winrates.ipynb
Fixed to provide clear tournament breakdown and best deck recommendations.
"""

def get_matchup_wr(deck: str, opponent: str, winrates: dict) -> float:
    if deck == opponent:
        return 0.5
    return winrates.get(deck, {}).get("vs", {}).get(opponent, {}).get("winrate", 0.5)


def build_meta_share(deck_list: list[str]) -> dict:
    """Buduje udział procentowy talii w turnieju."""
    if not deck_list:
        return {}
    meta_share: dict[str, float] = {}
    for deck in deck_list:
        meta_share[deck] = meta_share.get(deck, 0) + 1
    total = sum(meta_share.values())
    return {d: meta_share[d] / total for d in meta_share}


def get_expected_performance(deck: str, meta_share: dict, winrates: dict) -> float:
    """Oblicza średni winrate konkretnego decku przeciwko całej metagame."""
    return sum(
        get_matchup_wr(deck, opp, winrates) * share 
        for opp, share in meta_share.items()
    )


def calculate_bracket_probs(deck: str, meta_share: dict, winrates: dict, n_rounds: int) -> dict:
    """
    Oblicza prawdopodobieństwa konkretnych wyników (np. 5-0, 4-1) dla wybranego decku.
    Używamy programowania dynamicznego (DP).
    """
    # dp[(runda, wygrane)] = prawdopodobieństwo
    dp = {(0, 0): 1.0}
    
    # Średni winrate w jednej rundzie przeciwko "polu" (field)
    avg_winrate = get_expected_performance(deck, meta_share, winrates)

    for r in range(n_rounds):
        new_dp = {}
        for (round_num, wins), prob in dp.items():
            # Wygrana w tej rundzie
            new_dp[(round_num + 1, wins + 1)] = new_dp.get((round_num + 1, wins + 1), 0) + prob * avg_winrate
            # Przegrana w tej rundzie
            new_dp[(round_num + 1, wins)] = new_dp.get((round_num + 1, wins), 0) + prob * (1 - avg_winrate)
        dp = new_dp

    results = {}
    for (r, w), prob in dp.items():
        losses = n_rounds - w
        results[f"{w}W-{losses}L"] = {
            "probability": round(prob, 6),
            "field_pct": 0.0 # To pole zostanie wypełnione tylko w analizie turnieju
        }
    return results


def run_tournament_analysis(winrates: dict, deck_list: list[str], n_rounds: int = 5) -> dict:
    # 1. Przygotowanie danych
    known_decks = list(winrates.keys())
    #only decks with more than 0.005 meta
    popular_decks = [d for d in winrates.keys() if winrates[d].get("overall", {}).get("matches", 0) > 0 and (winrates[d]["overall"]["matches"] / sum(wr.get("overall", {}).get("matches", 0) for wr in winrates.values())) >= 0.005]
    valid_decks = [d for d in deck_list if d in known_decks]
    meta_share = build_meta_share(valid_decks)
    unique_decks_in_tourney = list(meta_share.keys())

    # 2. Analiza obecnego turnieju (Results)
    rows = []
    for deck in unique_decks_in_tourney:
        exp_wr = get_expected_performance(deck, meta_share, winrates)
        brackets = calculate_bracket_probs(deck, meta_share, winrates, n_rounds)
        p_undefeated = brackets.get(f"{n_rounds}W-0L", {}).get("probability", 0)
        
        # Delta: jak bardzo deck overperformuje względem swojej popularności w kontekście 5-0
        # (W uproszczeniu: szansa na 5-0 / średnia szansa w turnieju)
        delta = p_undefeated / (0.5 ** n_rounds) if (0.5 ** n_rounds) > 0 else 0

        rows.append({
            "deck": deck,
            "meta_share": round(meta_share[deck], 4),
            "winrate_vs_meta": round(exp_wr, 4),
            "expected_winrate": round(exp_wr, 4),
            "delta": round(delta, 2),
            "p_undefeated": round(p_undefeated, 6),
            "bracket_probs": brackets
        })

    # Sortujemy wyniki turnieju od najlepszego expected winrate
    rows = sorted(rows, key=lambda x: x["expected_winrate"], reverse=True)

    # 3. Rekomendacje: Co najlepiej wziąć na ten turniej? (Potential Picks)
    potential_picks_rows = []
    for deck_name in popular_decks:
        # Symulujemy wejście TYM deckiem w podaną metę
        exp_wr = get_expected_performance(deck_name, meta_share, winrates)
        brackets = calculate_bracket_probs(deck_name, meta_share, winrates, n_rounds)
        p_undefeated = brackets.get(f"{n_rounds}W-0L", {}).get("probability", 0)
        
        potential_picks_rows.append({
            "deck": deck_name,
            "expected_winrate": round(exp_wr, 4),
            "p_undefeated": round(p_undefeated, 6),
            "delta": round(p_undefeated / (0.5**n_rounds), 2),
            "bracket_probs": brackets,
            "meta_share": meta_share.get(deck_name, 0) # Informacyjnie: ile tego już jest
        })

    # Sortujemy rekomendacje po szansie na niepokonany wynik (X-0)
    potential_picks_rows = sorted(potential_picks_rows, key=lambda x: x["p_undefeated"], reverse=True)

    return {
        "n_rounds": n_rounds,
        "n_decks": len(deck_list),
        "unique_decks": len(unique_decks_in_tourney),
        "results": rows,
        "potential_picks": potential_picks_rows,
    }