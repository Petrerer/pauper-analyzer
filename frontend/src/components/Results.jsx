import { useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function WinBar({ value, max = 1 }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= 0.55 ? "#4ade80" : value >= 0.5 ? "#facc15" : "#f87171";
  return (
    <div className="win-bar-wrap">
      <div className="win-bar-bg">
        <div className="win-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="win-bar-label">{(value * 100).toFixed(1)}%</span>
    </div>
  );
}

function DeltaBadge({ delta }) {
  const good = delta >= 1.1;
  const bad = delta < 0.9;
  const cls = good ? "delta-good" : bad ? "delta-bad" : "delta-neutral";
  return <span className={`delta-badge ${cls}`}>{delta.toFixed(2)}×</span>;
}

export default function Results({ results, decks, onBack }) {
  const deckMap = useMemo(() => {
    const m = {};
    for (const d of decks) m[d.name] = d;
    return m;
  }, [decks]);

  const maxWR = useMemo(() => {
    return Math.max(...results.results.map((r) => r.expected_winrate));
  }, [results]);

  return (
    <div className="results">
      <div className="results-header">
        <button className="btn-back" onClick={onBack}>← Wróć</button>
        <div className="results-meta">
          <span>{results.n_decks} slotów</span>
          <span>·</span>
          <span>{results.unique_decks} unikalnych decków</span>
          <span>·</span>
          <span>{results.n_rounds} rund</span>
        </div>
      </div>

      <div className="results-explanation">
        <h2>Wyniki analizy turnieju</h2>
        <p>
          <strong>Expected WR</strong> — oczekiwany winrate biorąc pod uwagę skład turnieju i matchupy.
          &nbsp;<strong>Delta</strong> — stosunek Expected WR do meta share (wartość &gt;1 = over-performer).
          &nbsp;<strong>P(5-0)</strong> — prawdopodobieństwo zakończenia turnieju bez porażki.
        </p>
      </div>

      <div className="results-table-wrap">
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Deck</th>
              <th>Meta Share</th>
              <th>WR vs Meta</th>
              <th>Delta</th>
              <th>P({results.n_rounds}-0)</th>
            </tr>
          </thead>
          <tbody>
            {results.results.map((row, i) => {
              const deck = deckMap[row.deck];
              return (
                <tr key={row.deck} className={i === 0 ? "row-first" : ""}>
                  <td className="rank-cell">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="deck-cell">
                    {deck?.image && (
                      <img src={`${API}${deck.image}`} alt={row.deck} className="result-thumb" />
                    )}
                    <span>{row.deck}</span>
                  </td>
                  <td>{(row.meta_share * 100).toFixed(2)}%</td>
                  <td><WinBar value={row.winrate_vs_meta} /></td>
                  <td><DeltaBadge delta={row.delta} /></td>
                  <td className="undefeated-cell">{(row.p_undefeated * 100).toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="results-matchups">
        <h3>Szczegóły matchupów</h3>
        {results.potential_picks.slice(0, 30).map((row) => (
          <MatchupCard key={row.deck} row={row} deckMap={deckMap} nRounds={results.n_rounds} />
        ))}
      </div>
    </div>
  );
}

function MatchupCard({ row, deckMap, nRounds }) {
  const [open, setOpen] = useState(false);
  const deck = deckMap[row.deck];
  const probs = row.bracket_probs || {};

  const records = Object.entries(probs).sort((a, b) => {
    const wA = parseInt(a[0]);
    const wB = parseInt(b[0]);
    return wB - wA;
  });

  const maxProb = Math.max(...records.map(([, d]) => d.probability), 0.001);

  const barColor = (wins) =>
    wins > nRounds / 2 ? "#4ade80" : wins < nRounds / 2 ? "#f87171" : "#facc15";

  const deltaClass =
    row.delta >= 1.1 ? "delta-good" : row.delta < 0.9 ? "delta-bad" : "delta-neutral";

  return (
    <div className={`matchup-card ${open ? "open" : ""}`}>
      <div className="matchup-summary" onClick={() => setOpen((o) => !o)}>
        {deck?.image && (
          <img
            src={`${API}${deck.image}`}
            alt={row.deck}
            className="matchup-thumb"
            onError={(e) => console.error("[img FAIL]", e.currentTarget.src)}
          />
        )}
        <span className="matchup-deck-name">{row.deck}</span>

        <div className="matchup-stat">
          <span className="matchup-stat-label">WR</span>
          <span className="matchup-stat-value wr-value">
            {(row.expected_winrate * 100).toFixed(1)}%
          </span>
        </div>

        <div className="matchup-stat">
          <span className="matchup-stat-label">Delta</span>
          <span className={`matchup-stat-value ${deltaClass}`}>
            {row.delta.toFixed(2)}×
          </span>
        </div>

        <div className="matchup-stat">
          <span className="matchup-stat-label">P({nRounds}-0)</span>
          <span className="matchup-stat-value p-value">
            {(row.p_undefeated * 100).toFixed(1)}%
          </span>
        </div>

        <span className="matchup-chevron">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="matchup-detail">
          <div className="matchup-chart-title">Rozkład wyników</div>
          <div className="matchup-bar-chart">
            {records.map(([record, data]) => {
              const wins = parseInt(record);
              const heightPx = Math.max(4, (data.probability / maxProb) * 72);
              return (
                <div key={record} className="matchup-bar-wrap">
                  <span className="matchup-bar-pct" style={{ color: barColor(wins) }}>
                    {(data.probability * 100).toFixed(1)}%
                  </span>
                  <div
                    className="matchup-bar"
                    style={{ height: `${heightPx}px`, background: barColor(wins) }}
                  />
                  <span className="matchup-bar-record">{record}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}