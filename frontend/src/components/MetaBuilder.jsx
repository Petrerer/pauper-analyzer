import { useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;

export default function MetaBuilder({ meta, decks, onRemove, onClear, nRounds, onRoundsChange, onAnalyze, loading }) {
  const deckMap = useMemo(() => {
    const m = {};
    for (const d of decks) m[d.name] = d;
    return m;
  }, [decks]);

  const counts = useMemo(() => {
    const c = {};
    for (const d of meta) c[d] = (c[d] || 0) + 1;
    return c;
  }, [meta]);

  const uniqueSlots = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (let i = 0; i < meta.length; i++) {
      const name = meta[i];
      if (!seen.has(name)) {
        seen.add(name);
        result.push({ name, index: i });
      }
    }
    return result;
  }, [meta]);

  if (meta.length === 0) {
    return (
      <div className="meta-empty">
        <div className="meta-empty-icon">🎯</div>
        <p>Kliknij decki po lewej stronie, żeby dodać je do turnieju.</p>
        <p className="meta-empty-sub">Możesz dodać ten sam deck wielokrotnie — każde kliknięcie = jeden slot.</p>
      </div>
    );
  }

  return (
    <div className="meta-builder">
      <div className="meta-list">
        {uniqueSlots.map(({ name }) => {
          const deck = deckMap[name];
          const count = counts[name] || 0;
          return (
            <div key={name} className="meta-row">
              <div className="meta-row-img">
                {deck?.image ? (
                  <img src={`${API}${deck.image}`} alt={name} className="meta-thumb" />
                ) : (
                  <div className="meta-thumb-placeholder">🃏</div>
                )}
              </div>
              <div className="meta-row-name">{name}</div>
              <div className="meta-row-count">×{count}</div>
              <div className="meta-row-bar">
                <div
                  className="meta-row-fill"
                  style={{ width: `${(count / meta.length) * 100}%` }}
                />
              </div>
              <div className="meta-row-pct">
                {((count / meta.length) * 100).toFixed(0)}%
              </div>
              <button
                className="meta-remove-btn"
                onClick={() => {
                  // Find last occurrence of this deck in meta and remove it
                  const idx = [...meta].map((d, i) => [d, i]).filter(([d]) => d === name).at(-1)?.[1];
                  if (idx !== undefined) onRemove(idx);
                }}
                title="Usuń jeden slot"
              >
                −
              </button>
            </div>
          );
        })}
      </div>

      <div className="meta-controls">
        <div className="rounds-control">
          <label>Ilość rund</label>
          <div className="rounds-btns">
            {[3, 4, 5, 6, 7, 8, 14].map((r) => (
              <button
                key={r}
                className={`round-btn ${nRounds === r ? "active" : ""}`}
                onClick={() => onRoundsChange(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="meta-actions">
          <button className="btn-clear" onClick={onClear}>
            Wyczyść
          </button>
          <button
            className="btn-analyze"
            onClick={onAnalyze}
            disabled={meta.length < 2 || loading}
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              "Analizuj turniej →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
