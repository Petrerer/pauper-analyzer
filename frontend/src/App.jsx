import { useState, useEffect } from "react";
import DeckPicker from "./components/DeckPicker";
import MetaBuilder from "./components/MetaBuilder";
import Results from "./components/Results";
import "./App.css";

const API = "http://localhost:8000";

export default function App() {
  const [decks, setDecks] = useState([]);
  const [meta, setMeta] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasData, setHasData] = useState(null);
  const [nRounds, setNRounds] = useState(5);
  const [view, setView] = useState("builder");

  useEffect(() => {
    fetch(`${API}/api/status`)
      .then((r) => r.json())
      .then((d) => setHasData(d.has_data))
      .catch(() => setHasData(false));
  }, []);

  useEffect(() => {
    if (!hasData) return;
    fetch(`${API}/api/decks`)
      .then((r) => r.json())
      .then(setDecks)
      .catch(console.error);
  }, [hasData]);

  const addDeck = (name) => setMeta((m) => [...m, name]);
  const removeDeckAt = (idx) => setMeta((m) => m.filter((_, i) => i !== idx));
  const clearMeta = () => setMeta([]);

  const analyze = async () => {
    if (meta.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decks: meta, n_rounds: nRounds }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }
      const data = await res.json();
      setResults(data);
      setView("results");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-glyph">⚔</span>
            <div>
              <div className="logo-title">PAUPER ORACLE</div>
              <div className="logo-sub">Meta Analyzer</div>
            </div>
          </div>
          <nav className="nav">
            <button className={`nav-btn ${view === "builder" ? "active" : ""}`} onClick={() => setView("builder")}>
              Meta Builder
            </button>
            {results && (
              <button className={`nav-btn ${view === "results" ? "active" : ""}`} onClick={() => setView("results")}>
                Results
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        {hasData === false && (
          <div className="notice">
            <span>⚠</span>
            <div>
              <strong>Brak danych.</strong> Uruchom scraper: <code>cd backend && python scraper.py</code>
            </div>
          </div>
        )}

        {view === "builder" && (
          <div className="builder-layout">
            <section className="panel">
              <div className="panel-header">
                <h2>Wszystkie decki</h2>
                <span className="badge">{decks.length}</span>
              </div>
              <DeckPicker decks={decks} onAdd={addDeck} meta={meta} />
            </section>

            <section className="panel">
              <div className="panel-header">
                <h2>Turniej</h2>
                <span className="badge">{meta.length} slotów</span>
              </div>
              <MetaBuilder
                meta={meta}
                decks={decks}
                onRemove={removeDeckAt}
                onClear={clearMeta}
                nRounds={nRounds}
                onRoundsChange={setNRounds}
                onAnalyze={analyze}
                loading={loading}
              />
              {error && <div className="error-msg">{error}</div>}
            </section>
          </div>
        )}

        {view === "results" && results && (
          <Results results={results} decks={decks} onBack={() => setView("builder")} />
        )}
      </main>
    </div>
  );
}
