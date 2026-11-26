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

**Qualitätsziele:** Korrektheit, Zuverlässigkeit, Verständlichkeit und Wartbarkeit, jeweils mit Begründung, Maßnahmen, Trade-offs und Prüfung in `docs/QUALITY.md`. Barrierefreiheit (als fünftes Ziel) und ein UI-Redesign waren als Extras angedacht. Beides ist keine Anforderung; wir haben es bewusst weggelassen und die Zeit in Doku und Vorbereitung auf das Abgabegespräch gesteckt.

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
| Qualitätsziele (Auswahl, Begründung, Evaluation) |      – | beide    |
| Tests                                              |      – | je Feature |
| `docs/API.md`                                      |      – | Roman    |

**Nicht umgesetzte Requirements:** keine. Alle funktionalen Anforderungen (B1–B7) und die qualitativen Anforderungen (`docs/QUALITY.md`) sind umgesetzt.

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
9. **Speichern und Fortsetzen: nur das Nötige speichern, Kampf zählt beim Refresh sofort.**
   - Kontext: B6 überlässt dem Team, welcher Zustand gespeichert wird und was bei einem Refresh während Suche oder Kampf passiert. Ein Refresh darf keinen Gratis-Reroll, anderen Gegner, zweites Ergebnis oder vermiedene Niederlage bringen. Kaputte Saves dürfen das Spiel nicht kaputt machen.
   - Alternativen: den ganzen `GameState` inklusive Kampf-Frames speichern; Refresh im Kampf setzt das Replay an derselben Stelle fort; Refresh während der Suche startet die Suche automatisch neu.
   - Wahl: Gespeichert werden Version, Phase, Run und während eines Kampfs der Gegner, in `localStorage`. Kampf-Frames, Such-ID und Auswahl werden nicht gespeichert. Ein laufendes Replay wird gespeichert, als wäre es übersprungen: Nach dem Refresh zählt der Kampf, und man sieht sein Ende. Ein Refresh während der Suche führt in den Shop mit Meldung. Kaputte, inkompatible oder unmögliche Saves werden verworfen, Startseite mit Meldung. Die Policy steht für Spieler im Regelpanel („💾 Saving").
   - Begründung: Das Ergebnis steht schon beim Kampfstart fest (deterministische Simulation), also kann ein Refresh es weder verhindern noch doppelt anwenden. Frames lassen sich aus Rucksack und Gegner identisch neu berechnen; der Save bleibt klein und unabhängig vom Frame-Format aus B3/B4. Bei der Suche gab es noch keinen Gegner, und der Gegner pro Runde ist fest, also bringt der Abbruch keinen Vorteil. Seed und Shop sind gespeichert, also kein Gratis-Reroll (Entscheidung 3).
   - Trade-off: Wer während des Kampfs neu lädt, sieht den Rest des Replays nicht. Ein Spieler kann den Save in den DevTools gültig verändern (z. B. Gold von 3 auf 4); ohne Server lässt sich das nicht verhindern, es betrifft aber nur das eigene Einzelspieler-Spiel.
   - Beleg: `409f275` (Speichern, Prüfen, Laden mit Tests), `48a468e` (localStorage, Startseite, Regeltext)

10. **Hall of Fame: Plausibilität statt Nachspielen, idempotent über eine Run-ID, Ranking nach Siegen und Leben.**
   - Kontext: B7 verlangt, dass die API jeden Run prüft und unplausible Daten ablehnt, dass kein Run doppelt eingetragen wird, Retry ohne neu tippen und eine Reihenfolge, die das Team festlegt und anzeigt.
   - Alternativen: Prüfung: Server spielt die Kämpfe nach (bräuchte Rucksack und Gegner jeder Runde) oder nimmt Daten ungeprüft an. Duplikate: nur den Button sperren; Duplikate am Inhalt erkennen (Name + Zahlen); ID nur im React-State. Ranking: Sieg, dann Siege, dann Runden (README-Beispiel).
   - Wahl: Der Server prüft Plausibilität: Typen, Wertebereiche, Run beendet (5 Siege oder 0 Leben, nicht beides), Runden = Siege + verlorene Leben, Name 1–20 Zeichen. Jeder Run hat eine `runId`; `submitted` steht im Save; der Server antwortet auf dieselbe ID mit dem bestehenden Eintrag (200 statt 201), auf dieselbe ID mit anderen Daten mit 409. Ranking: mehr Siege, dann mehr Leben, dann wer zuerst eintrug.
   - Begründung: Nachspielen würde die ganze Run-Historie im Save und im Request verlangen; der Aufwand steht in keinem Verhältnis zu einem lokalen Spiel. Doppeltes Absenden ist in drei Schichten ausgeschlossen: UI (gesperrter Button, `useRef` gegen Doppelklick), Save (`submitted` überlebt den Reload), Server (Idempotenz, falls die Antwort verloren geht und der Client erneut sendet). Ein Inhaltsvergleich würde zwei echte, gleiche Runs zusammenlegen. Das README-Ranking vereinfacht sich: Ein Sieg hat immer 5 Siege, und bei gleichen Siegen heißt weniger Runden dasselbe wie mehr Leben (Runden = Siege + verlorene Leben). Die Regel steht auf der Seite und im Regelpanel, aus derselben Konstante. Die Oberfläche folgt der Architektur aus dem Starter (Functional Core, einseitiger Datenfluss): reine Regeln in `game.ts` und `server/runs.ts`, Lade- und Sendezustand in Custom Hooks (`useHallOfFame`, `useRunSubmission`) als „ViewModel“, nicht im `GameState`.
   - Trade-off: Ein Spieler kann einen erfundenen, aber in sich stimmigen Run schicken (z. B. 5 Siege ohne verlorenes Leben). Ohne Nachspielen lässt sich das nicht verhindern; geprüft wird, dass ein Run so enden *kann*, nicht dass er so gespielt wurde. Die Liste ist nach einem Server-Neustart leer (In-Memory, laut Anforderung ausreichend); der Speicher liegt hinter einem Interface (`RunStore`), eine Datenbank würde die Regeln nicht berühren.
   - Beleg: `b99348d` (Run-ID, Save), `444a6f2` (Regeln, Tests), `5bd45b3` (Endpoints), `b150e1e` (Absenden), `1f81451` (Seite)
11. **Server von JavaScript auf TypeScript umgestellt, gestartet mit `tsx`.**
   - Kontext: Der Starter-Server war plain JavaScript (`node server/index.js`), TypeScript war nur für `src/` eingerichtet. B7 bringt erstmals nennenswerte Server-Logik und einen Vertrag zwischen Client und Server (Felder eines Eintrags). Ein erster Test, der die JS-Datei aus TypeScript importierte, scheiterte am Typcheck (TS7016).
   - Alternativen: bei JavaScript bleiben und Client/Server nur per Test abgleichen; JavaScript mit Typprüfung über JSDoc (`checkJs`); Node `.ts` direkt ausführen lassen (Type Stripping).
   - Wahl: `server/*.ts`, Start mit `tsx` (Dev-Dependency), Typcheck über `tsconfig.server.json` im normalen `npm run build`, ESLint auch für `server/`. Die Typen des Vertrags (`RunSubmission`, `HallOfFameEntry`) stehen einmal in `server/runs.ts`; der Client importiert sie mit `import type`.
   - Begründung: Fehler wie falsche Feldnamen oder vergessene `null`-Fälle fallen vor dem Start auf, und Client und Server teilen eine Definition der Daten. Node kann `.ts` erst ab 22.18 selbst ausführen, das README sagt 20.19+ zu; mit `tsx` bleibt diese Zusage gültig. JSDoc-Typen wären ohne Umbau gegangen, sind aber schwerer zu lesen. Die Migration kam als eigener `refactor`-Commit vor dem Feature, das Verhalten wurde per curl verglichen.
   - Trade-off: Eine zusätzliche Abhängigkeit, und nach dem Pull ist `npm install` nötig. Typen gelten nur zur Compile-Zeit: Der eingehende Request bleibt `unknown` und muss weiter zur Laufzeit geprüft werden (Entscheidung 7). Konstanten wie Leben und Siege stehen doppelt (Node kann die `src`-Module ohne Dateiendung nicht laden), ein Test hält sie gleich.
   - Beleg: `82758da` (Migration), `43106e3` (geteilte Typen, Abgleich-Test)

## AI Usage

- Matthias: Claude (Chat) für Analyse von Codebase und Architektur, Priorisierung der Probleme, Erklärung von Ursache und Lösung sowie als Code-Vorlage für B1, B2, B5 und B6. Jede Änderung selbst geprüft (Unit-Tests, manueller Test im Browser), Entscheidungen begründet und mit Roman abgestimmt.
- Roman: Für den Anfang Claude Code benutzt um Diagramm der Codebase und Requirements generieren zu lassen. Für B3 Claude Code als Pair-Programmer: Regeln und Werte gemeinsam festgelegt, dann Umsetzung in kleinen Schritten (ein Schritt = ein Commit), jeweils mit Tests. Jeden Schritt selbst geprüft (Diff, Lint, Tests, Build), selbst committet und am Ende manuell im Browser getestet. Die Balance der neuen Items und Gegner per Simulation prüfen lassen. Bei B4 genauso; die Simulation hat dabei den Designfehler im Burn-Abbau aufgedeckt (Entscheidung 8). Beim eigenen Testen im Browser zwei Anzeigefehler gefunden (Burn-Icon, Gleichstand-Text) und eine unklare Set-Anzeige, die daraufhin verbessert wurde. Bei B7 ebenfalls Claude Code als Pair-Programmer; dabei die Frage JavaScript oder TypeScript für den Server mit Vor- und Nachteilen durchgesprochen und selbst für TS entschieden (Entscheidung 11). Einmal hat Claude mehrere Schritte vorausgebaut, die ich nicht einzeln prüfen konnte; das habe ich gestoppt, danach wieder Schritt für Schritt mit eigenem Commit gearbeitet. Beim manuellen Test einen 404 gefunden, Ursache war ein alter Server-Prozess.

## Laufendes Protokoll (Material fürs Diary)

Kurze Einträge mit Datum, Kurzerklärung, und Commit-Hash.

> **Hinweis zu den Belegen:** Der Hash verweist auf den Commit mit der eigentlichen Arbeit, nicht auf den Diary-Commit, da ein Commit seinen eigenen Hash nicht enthalten kann. Das Diary wird direkt auf `main` in separaten `docs:`-Commits gepflegt. Hashes werden erst nach dem Merge nach `main` eingetragen (Squash/Rebase ändern Hashes) und auf 7 Zeichen gekürzt (`git log --oneline`).

| Datum      | Was / Warum                                                                                                                                                                                                                             | Beleg                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2026-11-20 | Anforderungen und Starter analysiert, Status- und Aufteilungsdiagramme erstellt, Aufteilung nach Feature beschlossen (zuerst Schicht erwogen, wegen Ungleichgewicht verworfen)                                                          | `6ac1933` |
| 2026-11-20 | Doku-Regel (`CHANGES.md` + Diary) und Teststrategie (Entscheidung 2) festgelegt                                                                                                                                                       | `38488ec`, `23a3a2b`                                                           |
| 2026-11-20 | Versehentlicher Commit auf `main` per `git revert` zurückgenommen statt die gemeinsame Historie umzuschreiben                                                                                                                      | `631d0b4`                                                                        |
| 2026-11-20 | B1 umgesetzt: Fix voller Rucksack, Verkaufen, Reroll (Entscheidung 3), 12 Unit-Tests. Per PR #1 als Merge-Commit nach `main`                                                                                                          | `3c4ab2f`, `7a1cc4c`, `13a4b2a`, `c2a3f0c`, `54303b9`, Merge `08dbc28` |
| 2026-11-21 | B2 umgesetzt: Verschieben/Tauschen als eine Operation, Auswahl als UI-Zustand (Entscheidung 4), 7 neue Unit-Tests (19 gesamt). Tests im ersten Commit vergessen und ohne Umschreiben der Historie nachgereicht. Per PR #2 nach `main` | `0152a68`, `eb8c4d0`, `77293e5`, Merge `e0eb3e9`                           |
| 2026-11-21 | B3 umgesetzt: zuerst Tests für die bestehenden Kampfregeln, dann Heal, Poison-Stacks und Poison-Tick (Entscheidung 5), je 3 Items pro Effekt, Gegner ab Runde 3, Poison-Zähler, Log-Farben, Regeltext. 24 neue Unit-Tests (43 gesamt). 12 kleine Commits, per PR #3 nach `main` | `53f0296` … `a561565`, Merge `e5f29c2` |
| 2026-11-21 | B5 umgesetzt: Suche führt nach Fehler zurück in den Shop, keine zweite Suche, Such-ID gegen späte/doppelte Antworten (Entscheidung 6), verständliche Meldungen, Timeout und Laufzeitprüfung der API-Antwort (Entscheidung 7). 23 neue Unit-Tests (66 gesamt). Per PR #4 nach `main` | `dafdad0`, `aaa33a3`, `f45f6f6`, `652d2d6`, Merge `498091d` |
| 2026-11-21 | B4 umgesetzt: Burn (Block zuerst, klingt ab), Sets Fire und Iron mit Boni beim Fighter-Bau für beide Seiten (Entscheidung 8), Gegner mit Sets, Badges, Set-Fortschritt in Shop und Kampf, Burn-Zähler, Regeltexte. Designfehler im Burn-Abbau per Simulation gefunden und als eigener `fix` behoben; zwei Anzeigefehler beim manuellen Testen gefunden. 27 neue Unit-Tests (93 gesamt). Per PR #5 nach `main` | `30fa0c5` … `9e8a012`, Fix `1fc8ec1`, `d6ea04d`, Merge `30098b0` |
| 2026-11-21 | Shop-Karten einer Zeile gleich hoch gemacht; eigener PR, weil es nicht zu B6 gehört | `4a84058`, Merge `2b22b43` |
| 2026-11-21 | B6 umgesetzt: Run überlebt Neuladen, Policy für Suche (abbrechen) und Kampf (zählt sofort), Prüfung kaputter/unmöglicher Saves, „Continue run", Regelpanel (Entscheidung 9). 19 neue Unit-Tests (112 gesamt), manuell im Browser geprüft. Per PR #7 nach `main` | `409f275`, `48a468e`, Merge `5c9959c` |
| 2026-11-22 | B7 umgesetzt: Run-ID im Save, Server auf TypeScript umgestellt (Entscheidung 11), Validierung und Ranking im Server, Endpoints, Client-API mit geteilten Typen, Eintragen am Run-Ende ohne Doppel-Submit, Hall-of-Fame-Seite, Regeltext (Entscheidung 10). 61 neue Unit-Tests (173 gesamt), Endpoints per curl und UI manuell im Browser geprüft. 10 Commits, per PR #8 nach `main` | `b99348d` … `0dabd02`, Merge `ec19405` |
| 2026-11-22 | Qualitätsziele festgelegt: Korrektheit, Zuverlässigkeit, Verständlichkeit, Wartbarkeit, je mit Begründung, Maßnahmen, Trade-offs und Prüfung in `docs/QUALITY.md`; Performance und Security bewusst nicht gewählt | `f89a929` |
| 2026-11-23 | Übersicht aller Commits pro Anforderung mit Links angelegt (`docs/internal/COMMITS.md`), damit sich jede Anforderung schnell im Code nachverfolgen lässt | `54b6c1b` |

## Final Reflection und Lessons learned

### Matthias

Rückwirkend muss ich sagen, dass ich das erste Mal den Sinn von vielen und regelmäßigen Commits verstanden habe (ja ich meine das ernst im 5. Semester).
In früheren Projekten hätte ich bestimmt pro Feature (bspw. B1) committet. Diesmal habe ich es pro kleinem Schritt gemacht und habe verstanden, wie sinnvoll es zwecks der Nachvollziehbarkeit ist, jeden kleinen Schritt direkt zu committen. Vor allem durch den Prüfungscharakter musste ich jede Änderung verstehen und konnte dies anhand der kleinen Commits sehr gut nachvollziehen. 

Die Zusammenarbeit mit Roman lief sehr gut. Wir entschieden uns die Zuständigkeiten nicht nach Front- und Backend zu trennen sondern nach Features. Das funktionierte auch top, da Zuständigkeiten klar getrennt waren und Graubereiche vermieden wurden. Durch das Arbeiten auf verschiedenen Feature-Branches, sowie den anschließenden Pull Requests und den daraus resultierenden Merges kam es auch hierbei zu keinen Komplikationen. 

KI wurde sinnvoll eingesetzt - durch das Verwenden desselben LLM-Modells (Claude) durch Roman und mich wurde sichergestellt, dass wir mit der selben Wissensbasis aus Trainingsdaten arbeiten. Prompts wurden klar und ausführlich formuliert, wie wir damals in der LV Mobile App Development bereits gelernt hatten. Wir haben uns auch auf das Arbeiten mit Unit-Tests geeinigt, wodurch wir vor allem einen Beitrag zur Erfüllung der vier Qualitätsziele leisten wollten, vor allem im Hinblick auf das Ziel Korrektheit. 

Was nicht gut lief: Bei mir fehlte die Leerzeile am Dateiende, wodurch Diffs nicht sauber angezeigt wurden. Mit der VS-Code-Einstellung "files.insertFinalNewline" habe ich das dann behoben. Ich hatte außerdem einmal den Fehler eines doppelten "Try again" Textes weil ich es in save.ts und FightBar hatte. Dieser Fehler konnte nur durch händisches Testen im Browser gefunden werden und wurde nicht durch die Unit-Tests entdeckt. Dies trat auf wenn man während der Gegner-Suche die Seite neu lädt.

### Roman
Grundsätzlich stimme ich mit Matthias überein. Regelmäßig zu committen bzw. Git generell richtig anzuwenden, hat mir sehr geholfen, den Überblick nicht zu verlieren.
Ich persönlich konnte mich nicht so intensiv mit dem Projekt auseinandersetzen wie erwünscht, wodurch ich mich stark auf KI-Agenten, wie bereits erwähnt Claude Code, stützen musste.
Was mir geholfen hat, war, mich so früh wie möglich mit der Struktur und Architektur auseinanderzusetzen und zumindest einen konzeptionellen Überblick zu haben, wo was verwendet wird.
Zusätzlich habe ich gemerkt, dass UnitTests Gold wert sind, aber allein nicht reichen. Den Burn-Bug in B4 zum Beispiel haben die Tests nicht gefunden, weil sie genau die fehlerhafte Regel geprüft haben.
Aufgedeckt hat ihn erst eine Balance-Simulation, und beim manuellen Testen im Browser habe ich noch zwei Anzeigefehler gefunden.

Hätte ich nicht Stress mit anderen Fächern gehabt, hätte ich wahrscheinlich viel mehr implementiert als gefordert.

Was ich auf jeden Fall gelernt habe, ist, dass Tools wie Claude Code sehr hilfreich sind, aber dadurch die mentale Last sich verschiebt in Richtung System verstehen.
Und je besser man die Grundlagen und Konzepte versteht, desto besser kann man den Code reviewen und die Tools einsetzen.

### Beide / Gemeinsam
