# Practical Exam – Development Diary

Team members: Matthias, Roman
Repository: [github.com/Roman0-5/backpack-brawl-MaRo](https://github.com/Roman0-5/backpack-brawl-MaRo)

## Development Overview

**Organisation:** Aufteilung nach Feature. Wer ein Feature übernimmt, baut Frontend und Backend davon selbst. Feature Branching Strategie wie z.B. `git branch b1-shop-economy`. Namen bitte in die Tabelle eintragen. Feature-Branches gehen per Pull Request mit Merge-Commit nach `main` (kein Squash/Rebase), damit die Commit-Hashes als Belege gültig bleiben.

**Dokumentation:** Zwei Ebenen. Jede Änderung wird in `docs/internal/CHANGES.md` als
Problem → Ursache → Lösung → Warum festgehalten (Detail, inkl. Commit-Hash).
Weitreichende Entscheidungen (Architektur, Spielregeln, Trade-offs) kommen zusätzlich
unter „Important Decisions" in dieses Diary. So bleibt das Diary kurz, und jede
Begründung ist trotzdem nachvollziehbar.

**Zuständigkeiten:**

| Feature                                            | Gewicht | Wer?     |
| -------------------------------------------------- | ------: | -------- |
| B1 Shop-Wirtschaft (verkaufen, reroll)             |     10% | Matthias |
| B2 Backpack anordnen (verschieben, swap)           |     15% | Matthias |
| B3 Status-Effekte (Poison, Heal)                   |     15% | Roman    |
| B4 Item-Sets + Burn                                |     20% | Roman    |
| B5 Resilientes Matchmaking                         |     10% | Matthias |
| B6 Speichern und Fortsetzen                        |     10% | Matthias |
| B7 Hall of Fame                                    |     20% | Roman    |
| Qualitätsziele (Auswahl, Begründung, Evaluation) |      – |          |
| UI-Redesign                                        |      – |          |
| Tests, `docs/API.md`                             |      – |          |

**Nicht umgesetzte Requirements:** _(am Ende ausfüllen, sonst "keine")_

## Important Decisions

Mindestens drei. Je Entscheidung: Kontext, Alternativen, Wahl, Begründung, Beleg (Commit).

1. **Aufteilung nach Feature statt nach Schicht.**
   - Kontext: Zwei Personen, B1–B7.
   - Alternative: Aufteilung nach Schicht (Frontend/Backend). Das Backend macht nur ca. 20–25 % der Arbeit aus (Schätzung, siehe `docs/diagrams/split.svg`), die Last wäre sehr ungleich verteilt gewesen.
   - Wahl: nach Feature. Jede Person baut Frontend und Backend ihrer Anforderungen.
   - Trade-off: Konflikte in gemeinsamen Dateien (`battle.ts`, `items.ts`, `run.ts`, `game.ts`), daher verwandte Features zusammenlegen oder nacheinander bauen.
2. **Unit-Tests für die Spielregeln mit Vitest, neben dem Code.**
   - Kontext: Der Starter hat keine Tests, Vitest ist aber konfiguriert. B1 und B5 verlangen Regeln, die man im Browser schwer nachstellen kann (kein Gold-Verlust, „ganz oder gar nicht", kein doppeltes Ergebnis). Beide ändern parallel gemeinsame Regeldateien (`run.ts`, `game.ts`, `battle.ts`).
   - Alternativen: nur manuell im Browser testen; eigener `tests/`-Ordner; zusätzlich UI-Tests (Testing Library, jsdom).
   - Wahl: Vitest-Unit-Tests nur für die reinen Regelmodule, als `*.test.ts` direkt neben dem getesteten Modul. Die UI wird manuell geprüft.
   - Begründung: Die Regeln sind reine Funktionen (Zustand rein, neuer Zustand raus), also ohne Browser und React schnell testbar. Tests belegen das Qualitätsziel Korrektheit und fangen Regressionen bei paralleler Arbeit. Die Ablage neben dem Code folgt der README-Konvention und zeigt sofort, welches Modul getestet ist. UI-Tests bräuchten zusätzliche Tools, der Aufwand lohnt sich in einer Woche nicht.
   - Trade-off: UI-Fehler (z. B. ein nicht gesperrter Button) finden die Tests nicht, die prüfen wir manuell.
   - Beleg: `3c4ab2f` (erster Test samt Fix), weitere Tests in `7a1cc4c`, `c2a3f0c`
3. **Reroll würfelt deterministisch über den Seed im Run-Zustand.**
   - Kontext: B1 verlangt einen Reroll für 1 Gold. Das README legt fest, dass derselbe Seed dieselben Angebote liefert. B6 verlangt, dass ein Neuladen der Seite keinen kostenlosen Reroll bringt.
   - Alternativen: `Math.random()` beim Reroll; ein eigener Zufallsgenerator nur für Rerolls.
   - Wahl: `rerollShop` ruft `rollShop(state.seed)` auf und speichert den neuen Seed im Run-Zustand, genau wie der Shop-Wurf zu Rundenbeginn.
   - Begründung: Das Spiel bleibt reproduzierbar und testbar (der Test prüft die exakt erwarteten Angebote). Weil der Seed Teil des Zustands ist, liefert ein gespeicherter und neu geladener Run denselben Shop, ein Refresh bringt also keinen Gratis-Reroll. Es braucht keinen zusätzlichen Zustand.
   - Trade-off: Wer den Seed kennt, kann künftige Angebote vorhersagen. Für ein lokales Einzelspieler-Spiel ohne Wertung ist das unkritisch; relevant wird es erst, wenn die Hall of Fame (B7) Läufe vergleicht.
   - Beleg: `c2a3f0c` (Regel und Tests), `54303b9` (Button und Regeltext)
4. **Auswahl im Rucksack ist UI-Zustand, nicht Spielzustand.**
   - Kontext: B2 verlangt Auswählen, Anzeigen möglicher Züge und Abbrechen. B6 speichert später den Spielzustand.
   - Alternativen: Auswahl im `GameState` bzw. `RunState` führen; Auswahl in `ShopPage` halten.
   - Wahl: `useState` direkt in `Backpack.tsx`. Die Regel `moveItem(state, from, to)` kennt nur zwei Slot-Indizes.
   - Begründung: Die Auswahl ist keine Spielregel und beeinflusst den Kampf nicht. Im Spielzustand würde sie mitgespeichert (B6) und müsste mitvalidiert werden. Die Regelfunktionen bleiben rein und testbar. Die Auswahl wird aus dem Rucksack abgeleitet, damit kein ungültiger Zustand entsteht (z. B. ausgewähltes, aber schon verkauftes Item).
   - Trade-off: Nach einem Seitenwechsel (z. B. Kampf) ist die Auswahl weg. Das ist gewollt, weil eine halbe Aktion nicht überleben soll.
   - Beleg: `77293e5`
5. **Poison und Heal: feste Reihenfolge im Tick, Gift bleibt, kein Wiederbeleben.**
   - Kontext: B3 lässt Takt und Werte offen, verlangt aber deterministische Regeln, die in der Oberfläche erklärt werden. B4 verlangt später Burn, das sich klar von Poison unterscheiden muss. Im Kampf werden die Items beider Seiten nacheinander aufgelöst (erst Spieler, dann Gegner), sollen aber als gleichzeitig gelten.
   - Alternativen: Gift-Schaden direkt beim Feuern eines Items oder pro Stack mit eigenem Takt; Stacks, die mit der Zeit abklingen; Heilung auch bei 0 HP erlauben.
   - Wahl: Jeder Tick läuft in drei Schritten: Items feuern → Gift trifft beide Seiten gleichzeitig (alle 1 s, 1 HP pro Stack, ohne Block) → K.o.-Prüfung. Stacks bleiben bis Kampfende. Wer bei ≤ 0 HP ist, wird nicht mehr geheilt.
   - Begründung: Der Ausgang hängt nicht davon ab, wer zuerst aufgelöst wird. Ohne die Regel „kein Wiederbeleben" könnte der Gegner als Zweiter ein K.o. im selben Tick wegheilen, der Spieler aber nie. Gift, das nicht abklingt, ist der klare Kontrast zu Burn (stärker, aber abklingend), so lassen sich beide Effekte in einem Satz erklären. Ein gemeinsamer Takt an der Kampfuhr ist einfacher zu erklären und zu testen als ein Takt pro Stack. Alle Werte sind Konstanten, aus denen auch Regeltext und Tooltips entstehen.
   - Trade-off: Gift wird in langen Kämpfen sehr stark, weil sich die Stacks aufaddieren. Das gleichen längere Cooldowns der Gift-Items aus, per Simulation geprüft.
   - Beleg: `19f2879` (Heal), `80b04e1`, `776ecf0` (Poison), `a561565` (Regeltext)
6. **Such-ID pro Klick statt Zähler, Prüfung in den reinen Funktionen.**
   - Kontext: B5 verlangt, dass nur die Antwort der aktuellen Suche für die aktuelle Runde einen Kampf startet; späte oder doppelte Antworten dürfen nichts bewirken.
   - Alternativen: Zähler im Zustand (`searchId + 1`); Prüfung nur in der Komponente (`useRef`); Anfrage per `AbortController` abbrechen.
   - Wahl: Jeder Klick erzeugt eine eigene ID (`crypto.randomUUID()`). `startSearch` übernimmt sie nur, wenn die Suche erlaubt ist. `startBattle` und `searchFailed` wirken nur bei laufender Suche mit derselben ID; danach wird die ID gelöscht.
   - Begründung: Bei einem Doppelklick vor dem Neu-Rendern würden beide Klicks aus dem alten Zustand denselben Zählerstand berechnen; eine ID pro Klick ist immer eindeutig. Die Prüfung läuft im Update auf dem aktuellen Zustand (`update((current) => …)`), also ohne Race Condition durch veraltete Werte, und ist per Unit-Test belegt.
   - Trade-off: Ein Doppelklick schickt trotzdem eine zweite Anfrage; ihre Antwort wird verworfen. Für einen GET-Request unkritisch.
   - Beleg: `f45f6f6`
7. **Daten von außen werden zur Laufzeit geprüft, bevor das Spiel sie nutzt.**
   - Kontext: TypeScript-Typen gelten nur zur Compile-Zeit. Die API-Antwort ist zur Laufzeit `unknown`; ein unbekanntes Item hätte die Kampfsimulation und damit die App abstürzen lassen. B6 bringt mit `localStorage` eine zweite solche Grenze.
   - Alternativen: Antwort per Typ-Cast übernehmen; Schema-Bibliothek (z. B. Zod).
   - Wahl: Eigene Prüffunktion `parseOpponent` (Typen, gültige Runde, nur bekannte Items); bei Fehler eine Meldung für den Spieler statt eines Absturzes.
   - Begründung: Laufzeitgrenze wie im Skript (Kap. 24.4). Prüfung gegen den aktuellen Item-Katalog, damit neue Items aus B3/B4 automatisch gültig sind. Keine neue Abhängigkeit für wenige Felder.
   - Trade-off: Handgeschriebene Prüfung muss bei neuen Feldern mitgepflegt werden.
   - Beleg: `652d2d6`
8. **Sets und Burn: Boni beim Bau des Fighters, verschiedene Items zählen, Burn klingt anteilig ab.**
   - Kontext: B4 verlangt Set-Boni ab 2 Items, die für Spieler und Gegner gleich gelten, und Burn, der sich klar von Poison unterscheidet (stärker, schneller, Block fängt ab, klingt ab).
   - Alternativen: Boni in der Kampfsimulation prüfen; jede Kopie eines Items mitzählen; Burn mit festem Abbau von 1 Stack pro Tick (erster Entwurf) oder mit Obergrenze.
   - Wahl: `buildFighter` rechnet die Boni der aktiven Sets auf die Item-Werte, bevor der Kampf beginnt. Ein Set ist aktiv mit 2 *verschiedenen* Items. Ein Bonus verstärkt nur Effekte, die ein Item schon hat. Burn halbiert sich nach jedem Tick (aufgerundet).
   - Begründung: Spieler und Gegner werden über dieselbe Funktion gebaut, damit gelten die Boni für beide gleich, ohne Sonderfall; die Kampfsimulation bleibt unverändert und muss von Sets nichts wissen. Verschiedene Items passen zu „collecting" und verhindern, dass ein billiges Item doppelt gekauft das Set auslöst. Der feste Abbau war ein Designfehler: Kam pro Tick mehr als 1 Stack nach, wuchs Burn unbegrenzt (709 Schaden in 20 s). Die Unit-Tests prüften die Regel wie festgelegt und waren grün; gefunden hat es eine Balance-Simulation auf der reinen, deterministischen `simulateBattle` aus dem Starter. Anteiliger Abbau bleibt immer begrenzt und braucht keine Zusatzregel.
   - Trade-off: Boni sind im Kampf nicht als eigene Ereignisse sichtbar, sondern stecken in den Item-Werten (z. B. „+4" statt „+3"); deshalb zeigen Shop und Kampf die aktiven Sets mit ihrem Bonus an. Unit-Tests belegen, dass der Code eine Regel richtig umsetzt, nicht, dass die Regel gut ist; dafür braucht es zusätzlich Simulation und manuelles Testen.
   - Beleg: `4f03050` (Boni im Fighter), `ebdf158` (Test: gleiche Boni für Gegner), `1fc8ec1` (Burn-Fix)

## AI Usage

- Matthias: Claude (Chat) für Analyse von Codebase und Architektur, Priorisierung der Probleme, Erklärung von Ursache und Lösung sowie als Code-Vorlage für B1, B2 und B5. Jede Änderung selbst geprüft (Unit-Tests, manueller Test im Browser), Entscheidungen begründet und mit Roman abgestimmt.
- Roman: Für den Anfang Claude Code benutzt um Diagramm der Codebase und Requirements generieren zu lassen. Für B3 Claude Code als Pair-Programmer: Regeln und Werte gemeinsam festgelegt, dann Umsetzung in kleinen Schritten (ein Schritt = ein Commit), jeweils mit Tests. Jeden Schritt selbst geprüft (Diff, Lint, Tests, Build), selbst committet und am Ende manuell im Browser getestet. Die Balance der neuen Items und Gegner per Simulation prüfen lassen. Bei B4 genauso; die Simulation hat dabei den Designfehler im Burn-Abbau aufgedeckt (Entscheidung 8). Beim eigenen Testen im Browser zwei Anzeigefehler gefunden (Burn-Icon, Gleichstand-Text) und eine unklare Set-Anzeige, die daraufhin verbessert wurde.

## Laufendes Protokoll (Material fürs Diary)

Kurze Einträge mit Datum, Kurzerklärung, und Commit-Hash.

> **Hinweis zu den Belegen:** Der Hash verweist auf den Commit mit der eigentlichen Arbeit, nicht auf den Diary-Commit, da ein Commit seinen eigenen Hash nicht enthalten kann. Das Diary wird direkt auf `main` in separaten `docs:`-Commits gepflegt. Hashes werden erst nach dem Merge nach `main` eingetragen (Squash/Rebase ändern Hashes) und auf 7 Zeichen gekürzt (`git log --oneline`).

| Datum      | Was / Warum                                                                                                                                                                                                                             | Beleg                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2026-11-20 | Anforderungen und Starter analysiert, Status- und Aufteilungsdiagramme erstellt, Aufteilung nach Feature beschlossen (zuerst Schicht erwogen, wegen Ungleichgewicht verworfen)                                                          | _(Commit)_                                                                       |
| 2026-11-20 | Doku-Regel (`CHANGES.md` + Diary) und Teststrategie (Entscheidung 2) festgelegt                                                                                                                                                       | `38488ec`, `23a3a2b`                                                           |
| 2026-11-20 | Versehentlicher Commit auf `main` per `git revert` zurückgenommen statt die gemeinsame Historie umzuschreiben                                                                                                                      | `631d0b4`                                                                        |
| 2026-11-20 | B1 umgesetzt: Fix voller Rucksack, Verkaufen, Reroll (Entscheidung 3), 12 Unit-Tests. Per PR #1 als Merge-Commit nach `main`                                                                                                          | `3c4ab2f`, `7a1cc4c`, `13a4b2a`, `c2a3f0c`, `54303b9`, Merge `08dbc28` |
| 2026-11-21 | B2 umgesetzt: Verschieben/Tauschen als eine Operation, Auswahl als UI-Zustand (Entscheidung 4), 7 neue Unit-Tests (19 gesamt). Tests im ersten Commit vergessen und ohne Umschreiben der Historie nachgereicht. Per PR #2 nach `main` | `0152a68`, `eb8c4d0`, `77293e5`, Merge `e0eb3e9`                           |
| 2026-11-21 | B3 umgesetzt: zuerst Tests für die bestehenden Kampfregeln, dann Heal, Poison-Stacks und Poison-Tick (Entscheidung 5), je 3 Items pro Effekt, Gegner ab Runde 3, Poison-Zähler, Log-Farben, Regeltext. 24 neue Unit-Tests (43 gesamt). 12 kleine Commits, per PR #3 nach `main` | `53f0296` … `a561565`, Merge `e5f29c2` |
| 2026-11-21 | B5 umgesetzt: Suche führt nach Fehler zurück in den Shop, keine zweite Suche, Such-ID gegen späte/doppelte Antworten (Entscheidung 6), verständliche Meldungen, Timeout und Laufzeitprüfung der API-Antwort (Entscheidung 7). 23 neue Unit-Tests (66 gesamt). Per PR #4 nach `main` | `dafdad0`, `aaa33a3`, `f45f6f6`, `652d2d6`, Merge `498091d` |
| 2026-11-21 | B4 umgesetzt: Burn (Block zuerst, klingt ab), Sets Fire und Iron mit Boni beim Fighter-Bau für beide Seiten (Entscheidung 8), Gegner mit Sets, Badges, Set-Fortschritt in Shop und Kampf, Burn-Zähler, Regeltexte. Designfehler im Burn-Abbau per Simulation gefunden und als eigener `fix` behoben; zwei Anzeigefehler beim manuellen Testen gefunden. 27 neue Unit-Tests (93 gesamt). Per PR #5 nach `main` | `30fa0c5` … `9e8a012`, Fix `1fc8ec1`, `d6ea04d`, Merge `30098b0` |

## Final Reflection und Lessons learned

_(TODO)_
