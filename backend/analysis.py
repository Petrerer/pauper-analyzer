"""
Tournament analysis logic ported from pauper_winrates.ipynb
"""


def get_matchup_wr(deck: str, opponent: str, winrates: dict) -> float:
    if deck == opponent:
        return 0.5
    return winrates.get(deck, {}).get("vs", {}).get(opponent, {}).get("winrate", 0.5)


def build_meta_share(deck_list: list[str]) -> dict:
    """Build meta share from a list of decks (each occurrence = 1 copy in tournament)."""
    meta_share: dict[str, float] = {}
    for deck in deck_list:
        meta_share[deck] = meta_share.get(deck, 0) + 1
    total = sum(meta_share.values())
    return {d: meta_share[d] / total for d in meta_share}


def get_general_winrates(decks: list[str], meta_share: dict, winrates: dict) -> dict:
    return {
        d: sum(
            get_matchup_wr(d, opp, winrates) * meta_share.get(opp, 0)
            for opp in decks
        )
        for d in decks
    }


def probabilistic_tournament(decks: list[str], meta_share: dict, winrates: dict, n_rounds: int = 5) -> dict:
    decks_performance = {(0, 0): {d: meta_share.get(d, 0) for d in decks}}

    for _ in range(n_rounds):
        new_decks_performance: dict = {}

        for result, dist in decks_performance.items():
            wins, losses = result
            win_key = (wins + 1, losses)
            loss_key = (wins, losses + 1)

            if win_key not in new_decks_performance:
                new_decks_performance[win_key] = {d: 0.0 for d in decks}
            if loss_key not in new_decks_performance:
                new_decks_performance[loss_key] = {d: 0.0 for d in decks}

            total = sum(dist.values())
            field = {d: dist[d] / total for d in decks} if total > 0 else {d: 0.0 for d in decks}

            for deck in decks:
                for opp in decks:
                    matchup_wr = get_matchup_wr(deck, opp, winrates)
                    weight = dist[deck] * field[opp]
                    new_decks_performance[win_key][deck] += weight * matchup_wr
                    new_decks_performance[loss_key][deck] += weight * (1 - matchup_wr)

        decks_performance = new_decks_performance

    return decks_performance


def run_tournament_analysis(winrates: dict, deck_list: list[str], n_rounds: int = 5) -> dict:
    # Get unique decks that exist in winrates
    known_decks = list(winrates.keys())
    valid_decks = [d for d in deck_list if d in known_decks]

    meta_share = build_meta_share(valid_decks)
    unique_decks = list(meta_share.keys())

    general_wr = get_general_winrates(unique_decks, meta_share, winrates)
    outcomes = probabilistic_tournament(unique_decks, meta_share, winrates, n_rounds)

    # Compute E[wins] for each deck
    def expected_wr(deck: str) -> float:
        total_mass = 0.0
        weighted_wins = 0.0
        for (wins, losses), dist in outcomes.items():
            mass = dist.get(deck, 0)
            weighted_wins += wins * mass
            total_mass += mass
        if total_mass == 0:
            return 0.5
        return (weighted_wins / total_mass) / n_rounds

    # Build top-N probability (probability of going X-0 or similar good records)
    def bracket_probs(deck: str) -> dict:
        result = {}
        for (wins, losses), dist in outcomes.items():
            total = sum(dist.values())
            prob = dist.get(deck, 0)
            field_pct = prob / total if total > 0 else 0
            result[f"{wins}W-{losses}L"] = {
                "probability": round(prob, 6),
                "field_pct": round(field_pct, 6),
            }
        return result

    rows = []
    for deck in unique_decks:
        share = meta_share.get(deck, 0)
        exp_wr = expected_wr(deck)
        gen_wr = general_wr.get(deck, 0.5)
        delta = exp_wr / share if share > 0 else 0

        # P(5-0) specifically for the "best" outcome
        best_outcome = outcomes.get((n_rounds, 0), {})
        p_undefeated = best_outcome.get(deck, 0)
        total_mass = sum(best_outcome.values())
        field_undefeated = p_undefeated / total_mass if total_mass > 0 else 0

        rows.append({
            "deck": deck,
            "meta_share": round(share, 4),
            "winrate_vs_meta": round(gen_wr, 4),
            "expected_winrate": round(exp_wr, 4),
            "delta": round(delta, 4),
            "p_undefeated": round(p_undefeated, 6),
            "field_pct_undefeated": round(field_undefeated, 6),
            "bracket_probs": bracket_probs(deck),
        })

    rows.sort(key=lambda x: x["expected_winrate"], reverse=True)

    return {
        "n_rounds": n_rounds,
        "n_decks": len(deck_list),
        "unique_decks": len(unique_decks),
        "results": rows,
    }
