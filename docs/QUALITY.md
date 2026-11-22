# Qualitätsziele

Backpack Brawl ist ein lokales Einzelspieler-Spiel im Browser mit einer kleinen lokalen API. Die Ziele sind danach ausgewählt, was für diese Anwendung und ihre Nutzung tatsächlich zählt: Regeln, auf die sich Spieler verlassen können, ein Spiel, das bei Fehlern von außen weiterläuft, verständliche Rückmeldungen und Code, den zwei Personen parallel weiterentwickeln können.

| Prio | Ziel | Kurz geprüft durch |
| ---: | ---- | ------------------ |
| 1 | Korrektheit der Spielregeln | 173 Unit-Tests, Invarianten direkt getestet |
| 2 | Zuverlässigkeit bei Fehlern von außen | Tests mit Fetch-Attrappe und manipulierten Saves, manuelle Fehlertests |
| 3 | Verständlichkeit für Spieler | Checkliste gesperrter Aktionen, Meldungen per Test festgeschrieben |
| 4 | Wartbarkeit | React-freie Regelmodule, Änderungsszenario, Lint/Typen/Build |

## 1. Korrektheit der Spielregeln

- **Warum:** Das Spiel besteht aus Regeln, und die Anforderungen formulieren Invarianten: Gold nie negativ, kein Item verloren oder verdoppelt, jede Aktion ganz oder gar nicht, ein Kampfergebnis genau einmal, ein Run nur einmal in der Hall of Fame. Verletzungen fallen beim Spielen oft nicht sofort auf, sind aber für Spieler frustrierend (Beispiel: Im Starter ging bei vollem Rucksack ein bezahltes Item verloren).
- **Szenario:** Jede Spieleraktion führt zu einem gültigen neuen Zustand oder ändert nichts. Gleicher Seed und gleiche Aktionen ergeben dasselbe Spiel.
- **Maßnahmen:** Regeln als reine Funktionen (Zustand rein, neuer Zustand raus) ohne React. Pro Aktion eine Blocker-Funktion, die Button und Aktion zugleich schützt (B1, B2, B5). Deterministische Kampfsimulation und Seed im Run-Zustand (Entscheidungen 3, 5). Such-ID gegen späte und doppelte Antworten (Entscheidung 6). Run-ID gegen doppelte Hall-of-Fame-Einträge (B7).
- **Trade-off:** Pro Feature mehr Funktionen (Blocker + Aktion). Die Oberfläche selbst ist nicht automatisch getestet (Entscheidung 2).
- **Prüfung:** 173 Vitest-Unit-Tests über alle Regelmodule (`run`, `game`, `battle`, `items`, `sets`, `api`, `save`, `hallOfFame`) und die Server-Regeln (`server/runs`). Invarianten sind direkt getestet, z. B. „never loses or duplicates an item", abgelehnte Aktionen geben denselben Zustand zurück (`toBe`), „counts the battle exactly once", „the same run twice is listed once". Gefundene Fehler bekamen zuerst einen fehlschlagenden Test (z. B. `3c4ab2f`). **Ergebnis:** alle Tests grün.

## 2. Zuverlässigkeit bei Fehlern von außen

- **Warum:** Das Spiel hängt an zwei Grenzen, die es nicht kontrolliert: der lokalen API (kann fehlen, langsam sein oder Unsinn liefern) und `localStorage` (kann kaputt, veraltet, manipuliert oder blockiert sein). Im Starter blieb das Spiel nach einem API-Fehler dauerhaft hängen.
- **Szenarien:**
  - API nicht erreichbar oder hängt: Spätestens nach 8 s ist der Shop wieder bedienbar, mit Meldung und erneutem Versuch.
  - Späte oder doppelte API-Antwort: ändert nichts.
  - Absenden in die Hall of Fame scheitert: Meldung, erneuter Versuch ohne neu tippen, der Run wird nie doppelt eingetragen.
  - Kaputter, alter oder unmöglicher Speicherstand: Startseite mit Meldung statt Absturz.
  - Blockierter oder voller Speicher: Das Spiel läuft weiter, nur ohne Speichern.
- **Maßnahmen:** Such-ID (Entscheidung 6). Laufzeitprüfung aller Daten von außen, im Client (`parseOpponent`, `fromSave` wirft nie) und am Server für eingereichte Runs (Entscheidung 7, B7). Timeouts per `AbortSignal.timeout`. `try/catch` um jeden `localStorage`-Zugriff. Policy für Refresh während Suche und Kampf (Entscheidung 9). Run-ID und `submitted` im gespeicherten Run (B7).
- **Trade-off:** Handgeschriebene Prüfungen müssen bei neuen Feldern mitgepflegt werden. Eine Manipulation, die gültig aussieht (z. B. etwas mehr Gold), wird nicht erkannt; das ginge nur mit einem Server, der den Spielstand verwaltet.
- **Prüfung:** Tests mit Fetch-Attrappe für Netzfehler, Timeout, Serverfehler und ungültige Antwort (`api.test.ts`, `hallOfFame.test.ts`); kaputte und manipulierte Speicherstände (`save.test.ts`). Manuell: Web-App ohne API gestartet (`npx vite`), Speicherstand in den DevTools manipuliert, Neuladen während Suche und Kampf. **Ergebnis:** Jeder Fall endet in einem spielbaren Zustand mit Meldung.

## 3. Verständlichkeit für Spieler

- **Warum:** Viele Regeln sind nicht offensichtlich (Cooldown, Block, Poison und Burn, Sets, Speichern). B1 verlangt, dass die Oberfläche *vor* dem Versuch sagt, warum etwas nicht geht; B3 und B4 verlangen, dass die Regeln erklärt werden.
- **Szenario:** Eine Person, die das Spiel nicht kennt, sieht bei jeder gesperrten Aktion den Grund und versteht jede Fehlermeldung ohne technisches Wissen.
- **Maßnahmen:** Gesperrte Buttons zeigen den Grund statt des Preises („Already sold", „Backpack full", „Not enough gold", „Search already running"). Regelpanel und Tooltips werden aus den Spielkonstanten erzeugt (`rules.ts`), dadurch stimmt der Text immer mit der Regel überein. Fehlermeldungen in Spielersprache statt Statuscodes, im Client und vom Server (B5, B7). Hinweistext und markierte Ziele beim Verschieben (B2). Speicher-Policy im Regelpanel (B6).
- **Trade-off:** Erklärungen sind knappe Texte, kein interaktives Tutorial.
- **Prüfung:** Checkliste beim Durchklicken: Jede gesperrte Aktion zeigt einen Grund. Fehlermeldungen sind per Test festgeschrieben (`api.test.ts`, `save.test.ts`, `hallOfFame.test.ts`, `server/runs.test.ts`). In den Regeltexten ist kein Spielwert fest eingetippt, alle kommen aus Konstanten. **Ergebnis:** erfüllt. Ein Test mit einer Person, die das Spiel nicht kennt, wäre der nächste Schritt.

## 4. Wartbarkeit

- **Warum:** Zwei Personen haben in einer Woche parallel an Features gearbeitet, die gemeinsame Dateien betreffen. Spielwerte werden beim Balancing laufend geändert. Code und Entscheidungen müssen im Prüfungsgespräch nachvollziehbar sein.
- **Szenario:** Ein Spielwert (z. B. Reroll-Preis, Gift-Schaden) wird an genau einer Stelle geändert, Oberfläche, Regeltext und Tests passen sich an. Zwei Features lassen sich parallel entwickeln, ohne sich gegenseitig zu blockieren.
- **Maßnahmen:** Spielregeln in React-freien Modulen (`run`, `shop`, `game`, `battle`, `items`, `sets`, `save`, `api`, `hallOfFame`); Komponenten zeigen nur an und reichen Aktionen weiter. Server-Regeln für die Hall of Fame getrennt von Express in `server/runs.ts`. Konstanten als einzige Quelle für Werte. Aufteilung nach Feature mit Branch und Pull Request pro Feature (Entscheidung 1). Tests neben dem Code (Entscheidung 2). Jede Änderung mit Begründung in `docs/internal/CHANGES.md`.
- **Trade-off:** Doku-Aufwand pro Änderung. Merge-Commits machen die Historie länger als Squash, dafür bleiben die Hashes als Belege gültig.
- **Prüfung:** Kein Regelmodul importiert React (per Suche geprüft). Lint, Typprüfung und Build fehlerfrei. Änderungsszenario durchgespielt: `REROLL_COST` von 1 auf 2 gesetzt → Button und Regeltext folgen, alle Tests bleiben grün, kein weiterer Code betroffen. B3/B4, B5/B6 und B7 wurden parallel entwickelt; Probe-Merges zeigten keine Konflikte. **Ergebnis:** erfüllt.

## Bewusst nicht gewählt

- **Performance:** kleines lokales Spiel ohne große Datenmengen oder Netzlast; hier gibt es kein relevantes Risiko.
- **Security als eigenes Ziel:** Einzelspieler im eigenen Browser, eine Manipulation des Spielstands trifft nur den Spieler selbst. Für die Hall of Fame prüft die API jeden eingereichten Run (Typen, Wertebereiche, Plausibilität wie „nur beendete Runs" oder „nicht gewonnen und verloren zugleich") und lehnt ungültige mit klarer Meldung ab; das ist Teil von Ziel 2. Ohne Accounts kann niemand verhindern, dass ein Spieler einen plausiblen, aber erfundenen Run einreicht. Für eine lokale Bestenliste nehmen wir das in Kauf.
