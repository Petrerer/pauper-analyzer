import { useMemo } from "react";

const API = "http://localhost:8000";

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
              <th>Expected WR</th>
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
                  <td>
                    <WinBar value={row.meta_share} />
                  </td>
                  <td>
                    <WinBar value={row.winrate_vs_meta} />
                  </td>
                  <td>
                    <WinBar value={row.expected_winrate} max={maxWR * 1.05} />
                  </td>
                  <td>
                    <DeltaBadge delta={row.delta} />
                  </td>
                  <td className="undefeated-cell">
                    {(row.p_undefeated * 100).toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="results-matchups">
        <h3>Szczegóły matchupów</h3>
        {results.potential_picks.slice(0, 30).map((row) => (
          <MatchupCard key={row.deck} row={row} decks={decks} deckMap={deckMap} nRounds={results.n_rounds} />
        ))}
      </div>
    </div>
  );
}

function MatchupCard({ row, deckMap, nRounds }) {
  const deck = deckMap[row.deck];
  const probs = row.bracket_probs || {};
  const records = Object.entries(probs).sort((a, b) => {
    const [aw] = a[0].split("W");
    const [bw] = b[0].split("W");
    return parseInt(bw) - parseInt(aw);
  });

  return (
    <div className="matchup-card">
      <div className="matchup-card-header">
        {deck?.image && <img src={API + `${deck.image}`} alt={row.deck} className="matchup-thumb" />}
        <div>
          <div className="matchup-deck-name">{row.deck}</div>
          <div className="matchup-sub">
            Expected WR: <strong>{(row.expected_winrate * 100).toFixed(1)}%</strong>
            &nbsp;|&nbsp; Delta: <strong>{row.delta.toFixed(2)}×</strong>
          </div>
        </div>
      </div>
      <div className="bracket-grid">
        {records.map(([record, data]) => {
          const [wStr] = record.split("W");
          const w = parseInt(wStr);
          const isGood = w > nRounds / 2;
          const isBad = w < nRounds / 2;
          return (
            <div key={record} className={`bracket-cell ${isGood ? "good" : isBad ? "bad" : ""}`}>
              <div className="bracket-record">{record}</div>
              <div className="bracket-prob">{(data.probability * 100).toFixed(2)}%</div>
              <div className="bracket-field">{(data.field_pct * 100).toFixed(1)}% of field</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
