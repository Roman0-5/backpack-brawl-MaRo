# Backpack Brawl – Standort und Setup

Stand: 2026-11-20. Abgabe: nächsten Freitag. Diagramm: `docs/diagrams/status.svg` (Quelle `docs/diagrams/status.d2`).
Neu rendern: `d2 --layout=elk docs/diagrams/status.d2 docs/diagrams/status.svg`

## Wo wir stehen

Das Repo ist ein Starter: spielbar, aber von B1–B7 ist nichts umgesetzt. Die Spielregeln liegen als reine TypeScript-Module ohne React vor (`run.ts`, `shop.ts`, `game.ts`, `battle.ts`, `items.ts`, `rules.ts`). Frontend: React, Vite, Tailwind, react-router (Port 5174). Server: Express (Port 4200) mit `/api/health` und `/api/opponents`. Tests: keine.

Zwei Bugs gehören direkt zu B5:

- `searchFailed` (`src/game.ts:33`) lässt die Phase auf `searching`. Nach einem API-Fehler hängt die Suche.
- `startBattle` (`src/game.ts:38`) prüft weder Runde noch Such-ID. Eine späte Antwort kann einen Kampf starten.

## Anforderungen

| Req                            | Gewicht | Stand        | Anknüpfungspunkt                                                                      |
| ------------------------------ | ------: | ------------ | -------------------------------------------------------------------------------------- |
| B1 Verkaufen / Reroll          |     10% | nur Kaufen   | `run.ts`, `Shop.tsx`, `Backpack.tsx`, `rules.ts`                               |
| B2 Backpack verschieben / swap |     15% | fehlt        | `Backpack.tsx`, neue Regel in `run.ts`                                             |
| B3 Poison / Heal               |     15% | fehlt        | `types.ts`, `battle.ts`, `items.ts`, `server/opponents.js`, `BattleView.tsx` |
| B4 Sets + Burn                 |     20% | fehlt        | `items.ts`, `battle.ts`, `ItemCard.tsx`, `RulesPanel.tsx`                      |
| B5 Matchmaking                 |     10% | Bugs (s. o.) | `ShopPage.tsx:20-30`, `game.ts`                                                    |
| B6 Save / Resume               |     10% | fehlt        | `GameProvider.tsx`, Validierung des Saves                                            |
| B7 Hall of Fame                |     20% | fehlt        | `server/index.js`, neue Page, `docs/API.md`                                        |
| Qualitätsziele                |      – | fehlt        | Doku, in der Prüfung verteidigen                                                      |

B5 ist ein günstiger Bugfix und sollte früh erledigt werden. B3 und B4 sind unabhängig voneinander, ändern aber beide `battle.ts` und `items.ts` (Merge-Konflikte bei paralleler Arbeit).

## Aufteilung nach Feature

Beschlossen: Die Arbeit wird nach Feature aufgeteilt, nicht nach Schicht (Frontend/Backend). Grund: Das Backend macht nur ca. 20–25 % der Arbeit aus (Schätzung, siehe `docs/diagrams/split.svg`, Quelle `docs/diagrams/split.d2`), eine Schicht-Teilung wäre unausgewogen gewesen. Wer ein Feature übernimmt, macht Frontend und Backend davon selbst.

| Person | Features |
| ------ | -------- |
| _(Name)_ | _(TODO)_ |
| _(Name)_ | _(TODO)_ |

- B7 liegt in einer Hand, dann gibt es keine Abstimmung über den API-Vertrag (Endpoints, Felder, Fehlerformat, Ranking-Regel). Ein Vertrag zwischen den beiden Personen ist nur nötig, wenn B3/B4 und die Gegner-Tabelle (`server/opponents.js`) getrennt vergeben werden.
- Konfliktstellen zwischen Personen: `types.ts`/`battle.ts`/`items.ts` (B3 und B4), `run.ts`/`Backpack.tsx` (B1 und B2), `game.ts`/`ShopPage.tsx`/`GameProvider.tsx` (B5 und B6). Features, die dieselben Dateien ändern, möglichst an dieselbe Person geben oder nacheinander bauen.
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
