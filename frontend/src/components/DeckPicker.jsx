import { useState, useMemo } from "react";

const API = "http://localhost:8000";

export default function DeckPicker({ decks, onAdd, meta }) {
  const [search, setSearch] = useState("");

  const metaCounts = useMemo(() => {
    const c = {};
    for (const d of meta) c[d] = (c[d] || 0) + 1;
    return c;
  }, [meta]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return decks.filter((d) => d.name.toLowerCase().includes(q));
  }, [decks, search]);

  return (
    <div className="deck-picker">
      <input
        className="search-input"
        type="text"
        placeholder="Szukaj decku…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {/* Usunięto overflow inline, teraz grid dostosuje się do zawartości */}
      <div className="deck-grid">
        {filtered.map((deck) => {
          const count = metaCounts[deck.name] || 0;
          return (
            <button
              key={deck.name}
              className={`deck-card ${count > 0 ? "in-meta" : ""}`}
              onClick={() => onAdd(deck.name)}
              title={`WR: ${(deck.winrate * 100).toFixed(1)}% | ${deck.matches} matches`}
            >
              <div className="deck-img-wrap">
                {deck.image ? (
                  <img
                    src={`${API}${deck.image}`}
                    alt={deck.name}
                    className="deck-img"
                    onError={(e) => { 
                      e.target.style.display = "none"; 
                      if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; 
                    }}
                  />
                ) : null}
                <div className="deck-img-placeholder" style={{ display: deck.image ? "none" : "flex" }}>
                  <span>🃏</span>
                </div>
                {count > 0 && <div className="deck-count-badge">{count}</div>}
              </div>
              <div className="deck-info">
                <div className="deck-name">{deck.name}</div>
                <div className="deck-meta"> 
                  {deck.meta_share ? `${(deck.meta_share * 100).toFixed(1)}% meta` : "Brak danych"}
                </div>
                <div className="deck-wr">
                  <span
                    className="wr-dot"
                    style={{ background: wrColor(deck.winrate) }}
                  />
                  {(deck.winrate * 100).toFixed(1)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function wrColor(wr) {
  if (wr >= 0.55) return "#4ade80";
  if (wr >= 0.5) return "#facc15";
  return "#f87171";
}