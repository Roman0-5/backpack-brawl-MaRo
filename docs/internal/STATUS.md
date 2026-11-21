# Backpack Brawl – Standort und Setup

Stand: 2026-11-21 (nach B3). Abgabe: nächsten Freitag. Diagramm: `docs/diagrams/status.svg` (Quelle `docs/diagrams/status.d2`).
Neu rendern: `d2 --layout=elk docs/diagrams/status.d2 docs/diagrams/status.svg` (ebenso `split.d2`)

## Wo wir stehen

B1, B2 und B3 sind umgesetzt und per PR (#1–#3) nach `main` gemergt. Offen: B4–B7 und die Qualitätsziele. Die Spielregeln liegen als reine TypeScript-Module ohne React vor (`run.ts`, `shop.ts`, `game.ts`, `battle.ts`, `items.ts`, `rules.ts`). Frontend: React, Vite, Tailwind, react-router (Port 5174). Server: Express (Port 4200) mit `/api/health` und `/api/opponents`. Tests: 43 Vitest-Unit-Tests für die Regelmodule (`run.test.ts`, `battle.test.ts`, `items.test.ts`).

Zwei Bugs gehören direkt zu B5 (noch offen):

- `searchFailed` (`src/game.ts:33`) lässt die Phase auf `searching`. Nach einem API-Fehler hängt die Suche.
- `startBattle` (`src/game.ts:38`) prüft weder Runde noch Such-ID. Eine späte Antwort kann einen Kampf starten.

## Anforderungen

| Req                            | Gewicht | Wer      | Stand                         | Anknüpfungspunkt                                                                      |
| ------------------------------ | ------: | -------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| B1 Verkaufen / Reroll          |     10% | Matthias | ✓ gemergt (PR #1, `08dbc28`) | `run.ts`, `Shop.tsx`, `Backpack.tsx`, `rules.ts`                                       |
| B2 Backpack verschieben / swap |     15% | Matthias | ✓ gemergt (PR #2, `e0eb3e9`) | `Backpack.tsx`, `run.ts`                                                               |
| B3 Poison / Heal               |     15% | Roman    | ✓ gemergt (PR #3, `e5f29c2`) | `types.ts`, `battle.ts`, `items.ts`, `server/opponents.js`, `BattleView.tsx`, `rules.ts` |
| B4 Sets + Burn                 |     20% | Roman    | fehlt                         | `items.ts`, `battle.ts`, `ItemCard.tsx`, `RulesPanel.tsx`                              |
| B5 Matchmaking                 |     10% | Matthias | Bugs (s. o.)                  | `ShopPage.tsx:20-30`, `game.ts`                                                        |
| B6 Save / Resume               |     10% | Matthias | fehlt                         | `GameProvider.tsx`, Validierung des Saves                                              |
| B7 Hall of Fame                |     20% | Roman    | fehlt                         | `server/index.js`, neue Page, `docs/API.md`                                            |
| Qualitätsziele                 |       – | beide    | fehlt                         | Doku, in der Prüfung verteidigen                                                       |

B5 ist ein günstiger Bugfix und sollte früh erledigt werden. B4 baut auf B3 auf: Status-Effekte haben bereits einen eigenen Schritt im Tick (`battle.ts`, Entscheidung 5), Burn kommt dort als zweiter Effekt dazu und muss sich klar von Poison unterscheiden (stärker, schneller, von Block absorbiert, klingt ab).

## Aufteilung nach Feature

Beschlossen: Die Arbeit wird nach Feature aufgeteilt, nicht nach Schicht (Frontend/Backend). Grund: Das Backend macht nur ca. 20–25 % der Arbeit aus (Schätzung, siehe `docs/diagrams/split.svg`, Quelle `docs/diagrams/split.d2`), eine Schicht-Teilung wäre unausgewogen gewesen. Wer ein Feature übernimmt, macht Frontend und Backend davon selbst.

| Person | Features |
| ------ | -------- |
| Matthias | B1 ✓, B2 ✓, B5, B6 |
| Roman    | B3 ✓, B4, B7       |

- B7 liegt in einer Hand (Roman), dann gibt es keine Abstimmung über den API-Vertrag (Endpoints, Felder, Fehlerformat, Ranking-Regel). B3/B4 und die Gegner-Tabelle (`server/opponents.js`) liegen ebenfalls bei Roman, ein Vertrag ist also nicht nötig.
- Konfliktstellen: `types.ts`/`battle.ts`/`items.ts` (B3 und B4, beide Roman, nacheinander), `run.ts`/`Backpack.tsx` (B1 und B2, beide Matthias, erledigt), `game.ts`/`ShopPage.tsx`/`GameProvider.tsx` (B5 und B6, beide Matthias). Einzige echte Überschneidung: `rules.ts` (Regeltexte aller Features), dort nur neue Abschnitte anhängen.
- UI-Redesign berührt fast alle Komponenten: erst nach den Features oder klar einer Person zuordnen.
- Gemeinsam bleiben: Qualitätsziele, `docs/API.md`, Diary.

## Diary und Bewertung (aus `diary_guidelines-1.pdf`)

- Entwicklungs-Tagebuch, einmal pro Team über Moodle, vor der mündlichen Prüfung. Format frei, kurz halten.
- Inhalt: Überblick (Organisation, Verantwortlichkeiten, nicht umgesetzte Requirements), mindestens drei wichtige Entscheidungen, AI-Nutzung (wie und warum), Reflexion.
- Git-Commits oder andere Belege referenzieren.
- Zählt zusammen mit der Git-Nutzung als Kriterium "Development Process" (10 Punkte). Sinnvolle, nachvollziehbare Commits sind also Teil der Note.
- Die Prüfung ist mündlich: Qualitätsziele und Entscheidungen müssen erklärt und verteidigt werden.

## UI

Die UI darf frei umgebaut werden, solange die Pflicht-UI aus B1–B7 erhalten bleibt (Fehlergründe, Auswahl, Status-Anzeigen, Set-Badges, Suchzustand, Hall-of-Fame-Seite mit Lade-/Leer-/Fehlerzustand). Routen `/`, `/shop`, `/battle`, `/result` vorsichtshalber beibehalten.

## Verifikation

- `npm run lint && npm test && npm run build` grün.
- `npm run dev`: Start, Shop, Fight, Result durchspielen.
- Pages: Deploy grün, Refresh auf `/shop` bricht nicht.
