export default function About() {
  return (
    <div className="about">
      <div className="about-hero">
        <span className="about-hero-glyph">⚔</span>
        <h1 className="about-hero-title">PAUPER ORACLE</h1>
        <p className="about-hero-sub">Meta Analyzer — jak to działa?</p>
      </div>

      <div className="about-body">

        <section className="about-section about-section--highlight">
          <h2>O stronie</h2>
          <p>
            Pauper Oracle to narzędzie do analizy składu turnieju formatu Pauper.
            Pozwala zbudować fikcyjne pole startowe — wrzucasz decki które spodziewasz
            się zobaczyć, a program liczy który deck miałby najwyższy oczekiwany
            winrate w tym środowisku.
          </p>
          <br />
          <p>
            Dane pochodzą z <a href="https://mtgdecks.net" target="_blank" rel="noreferrer">mtgdecks.net</a> —
            agregatu wyników z turniejów MTGO za ostatnie 180 dni. Są to suche
            dane z matchupów, bez żadnej korekty na sideboard, pilota, nowych techów czy percepcję
            matchupu. Na próbce 180 dni widać jednak wyraźnie trendy
            — da się ocenić czy deck jest po prostu słaby na jakiś archetype, czy
            tylko ma lekko niekorzystny matchup który można wyrównać sideboardem.
          </p>
          <br />
          <p>
            W bazie uwzględniane są tylko decki z udziałem powyżej <strong>0.5% mety</strong>.
            Mniejsze archetypy mają zbyt mało danych żeby wyniki były wiarygodne.
          </p>
        </section>

        <section className="about-section">
          <h2>Jak interpretować wyniki?</h2>
          <div className="about-steps">

            <div className="about-step">
              <div className="about-step-num">△</div>
              <div>
                <h3>Delta — mnożnik szans na perfect run</h3>
                <p>
                  Kolumna <strong>Delta</strong> to stosunek Expected WR do meta share decku
                  w turnieju. Wartość powyżej 1× znaczy, że deck radzi sobie lepiej
                  niż sugeruje jego reprezentacja w polu — jest over-performerem.
                  Technicznie "delta" to niepoprawne określenie bo delta oznacza zmianę,
                  a nie mnożnik — ale nazwa przyjęła się i zostawiamy ją.
                </p>
                <br />
                <p>
                  Ważniejszy jest jednak związek Delty z kolumną <strong>P(N-0)</strong>.
                  To właśnie tu widać prawdziwy sens analizy: delta bezpośrednio przekłada
                  się na twoje szanse na perfect run. Deck z deltą 1.15× nie tylko wygrywa
                  częściej — on nieproporcjonalnie częściej kończy turniej bez porażki.
                  Jeśli twoim celem jest wygranie całego eventu, a nie tylko "dobry wynik",
                  powinieneś patrzeć właśnie na tę kolumnę.
                </p>
              </div>
            </div>

            <div className="about-step">
              <div className="about-step-num">⏳</div>
              <div>
                <h3>Długość turnieju faworyzuje decki dobre na dobre decki</h3>
                <p>
                  Im dłuższy turniej, tym ważniejsze są matchupy przeciwko najlepszym
                  deckom w polu. W pierwszych rundach Swiss spotykasz losowe pole —
                  dobre i słabe decki po równo. Ale w późniejszych rundach przeciwnicy
                  to gracze z dobrym wynikiem, czyli statystycznie piloci silniejszych
                  archetypów. Pole naturalnie "oczyszcza się" ze słabszych decków.
                </p>
                <br />
                <p>
                  Oznacza to, że deck który ma 55% na lidera mety i 45% na tier-3
                  junk jest znacznie cenniejszy w 7-rundowym turnieju niż w trzyrundowym
                  FNM. Symulacja probabilistyczna w tym narzędziu uwzględnia ten efekt
                  — dlatego Expected WR w późnych rundach różni się od prostego
                  ważonego winrate vs meta.
                </p>
              </div>
            </div>

            <div className="about-step">
              <div className="about-step-num">🏠</div>
              <div>
                <h3>Atakowanie lokalnej mety</h3>
                <p>
                  Jeśli używasz tego narzędzia do analizy lokalnego LGS zamiast
                  ogólnej mety MTGO, masz dodatkową informację której dane z
                  mtgdecks nie mają: wiesz kto przychodzi i co gra. W tym przypadku
                  bardziej wartościowe może być skupienie się na <em>graczach którzy
                  regularnie kończą wysoko</em> i pickowanie decków pod ich listy —
                  to oni będą twoimi przeciwnikami w decydujących rundach.
                </p>
                <br />
                <p>
                  Lokalny metagame często ma też dużo mniejszy spread archetypów niż
                  MTGO, co sprawia że analiza jest trafniejsza — mniej szumu z
                  rzadkich matchupów których nigdy nie spotkasz.
                </p>
              </div>
            </div>

            <div className="about-step">
              <div className="about-step-num">🎯</div>
              <div>
                <h3>2 punkty procentowe na papierze ≠ 2 p.p. w praktyce</h3>
                <p>
                  Nawet jeśli dane mówią że deck A ma 52% WR a deck B 50%, nie
                  znaczy to automatycznie że powinieneś grać deckiem A. Dane winrate
                  agregują wszystkich pilotów danego archetypów — od nowicjuszy po
                  graczy którzy grają listę od lat. Trudniejszy deck w rękach
                  niedoświadczonego pilota bardzo szybko spada poniżej swojego
                  "papierowego" winrate.
                </p>
                <br />
                <p>
                  Przy atakowaniu mety w sposób opisany przez to narzędzie —
                  szukając decku który over-performuje w danym polu — aggro i liniowe decki będą znacznie bardziej efektywne
                  niż sugerują surowe liczby. Gracz który nie popełnia błędów z Madnessem
                  czy Stompy zrealizuje swój winrate o wiele łatwiej niż ktoś
                  próbujący opanować skomplikowane linie famsów.
                  Execution rate jest częścią równania której dane nie pokazują.
                </p>
              </div>
            </div>

          </div>
        </section>

        <section className="about-section">
          <h2>Jak działa symulacja?</h2>
          <div className="about-steps">

            <div className="about-step">
              <div className="about-step-num">1</div>
              <div>
                <h3>Pobieranie danych</h3>
                <p>
                  Winraty między deckami scrapowane są z{" "}
                  <a href="https://mtgdecks.net/Pauper/winrates/range:last30days" target="_blank" rel="noreferrer">
                    mtgdecks.net
                  </a>. Dla każdej pary decków zapisywany jest winrate oraz liczba
                  rozegranych meczy. Matchupy z zerową próbką domyślnie przyjmują 50% WR.
                </p>
              </div>
            </div>

            <div className="about-step">
              <div className="about-step-num">2</div>
              <div>
                <h3>Budowanie pola</h3>
                <p>
                  Każde kliknięcie decku to jeden slot w turnieju. Możesz dodać
                  ten sam deck wielokrotnie — stosunek slotów przekłada się
                  bezpośrednio na meta share w symulacji.
                </p>
              </div>
            </div>

            <div className="about-step">
              <div className="about-step-num">3</div>
              <div>
                <h3>Symulacja Swiss</h3>
                <p>
                  Dla każdej rundy każdy deck "spotyka" każdy inny deck proporcjonalnie
                  do jego udziału w aktualnym koszyku wynikowym (np. wszyscy 3-0 grają
                  z 3-0). Stan turnieju to rozkład prawdopodobieństwa po parach
                  (wygrane, przegrane). Wynik każdego starcia jest ważony winratem
                  z bazy danych.
                </p>
              </div>
            </div>

            <div className="about-step">
              <div className="about-step-num">4</div>
              <div>
                <h3>Symulacja globalna</h3>
                <p>
                  Zakładka results liczy jak każdy deck z bazy decków powyżej 0.5% meta share poradziłby sobie w tym polu, gdyby był dodany jako slot do turnieju. To pozwala ocenić potencjalne "niespodzianki" — archetypy które nie są obecne w polu, ale miałyby dobre szanse na atakowanie go.
                </p>
              </div>
            </div>

          </div>
        </section>

        <section className="about-section">
          <h2>Słowniczek</h2>
          <div className="about-glossary">
            <div className="glossary-row">
              <span className="glossary-term">Meta Share</span>
              <span className="glossary-def">Odsetek slotów w turnieju zajętych przez dany deck.</span>
            </div>
            <div className="glossary-row">
              <span className="glossary-term">WR vs Meta</span>
              <span className="glossary-def">Ważony winrate przeciwko składowi pola — bez uwzględnienia dynamiki rund.</span>
            </div>
            <div className="glossary-row">
              <span className="glossary-term">Delta</span>
              <span className="glossary-def">Expected WR ÷ Meta Share. Mnożnik over/under-performance. Powyżej 1× = deck radzi sobie lepiej niż jego reprezentacja sugeruje. (Chociaż w teorii to błędna nazwa — delta to zmiana, nie mnożnik)</span>
            </div>
            <div className="glossary-row">
              <span className="glossary-term">P(N-0)</span>
              <span className="glossary-def">Prawdopodobieństwo zakończenia turnieju bez żadnej porażki. Jako że w większości na turniejach zależy nam na wynikach X-0 lub X-1, a X-3 już mniej nas obchodzi, to to dobra metryka na duże turnieje. </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}