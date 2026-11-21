# Backpack Brawl – Standort und Setup

Stand: 2026-11-21 (nach B3, B4, B5). Abgabe: nächsten Freitag. Diagramm: `docs/diagrams/status.svg` (Quelle `docs/diagrams/status.d2`).
Neu rendern: `d2 --layout=elk docs/diagrams/status.d2 docs/diagrams/status.svg` (ebenso `split.d2`)

## Wo wir stehen

B1–B5 sind umgesetzt und per PR (#1–#5) nach `main` gemergt. Offen: B6, B7 und die Qualitätsziele. Die Spielregeln liegen als reine TypeScript-Module ohne React vor (`run.ts`, `shop.ts`, `game.ts`, `battle.ts`, `items.ts`, `sets.ts`, `rules.ts`), dazu `api.ts` für die API-Anbindung. Frontend: React, Vite, Tailwind, react-router (Port 5174). Server: Express (Port 4200) mit `/api/health` und `/api/opponents`. Tests: 93 Vitest-Unit-Tests (`run`, `battle`, `items`, `sets`, `game`, `api`).

Die zwei Bugs aus dem Starter, die zu B5 gehörten, sind behoben (PR #4):

- `searchFailed` ließ die Phase auf `searching`; nach einem API-Fehler hing die Suche.
- `startBattle` prüfte weder Runde noch Such-ID; eine späte Antwort konnte einen Kampf starten.

## Anforderungen

| Req                            | Gewicht | Wer      | Stand                         | Anknüpfungspunkt                                                                      |
| ------------------------------ | ------: | -------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| B1 Verkaufen / Reroll          |     10% | Matthias | ✓ gemergt (PR #1, `08dbc28`) | `run.ts`, `Shop.tsx`, `Backpack.tsx`, `rules.ts`                                       |
| B2 Backpack verschieben / swap |     15% | Matthias | ✓ gemergt (PR #2, `e0eb3e9`) | `Backpack.tsx`, `run.ts`                                                               |
| B3 Poison / Heal               |     15% | Roman    | ✓ gemergt (PR #3, `e5f29c2`) | `types.ts`, `battle.ts`, `items.ts`, `server/opponents.js`, `BattleView.tsx`, `rules.ts` |
| B4 Sets + Burn                 |     20% | Roman    | ✓ gemergt (PR #5, `30098b0`) | `sets.ts`, `battle.ts`, `items.ts`, `server/opponents.js`, `SetBadge.tsx`, `Backpack.tsx`, `BattleView.tsx`, `rules.ts` |
| B5 Matchmaking                 |     10% | Matthias | ✓ gemergt (PR #4, `498091d`) | `game.ts`, `api.ts`, `ShopPage.tsx`                                                    |
| B6 Save / Resume               |     10% | Matthias | fehlt                         | `GameProvider.tsx`, Validierung des Saves                                              |
| B7 Hall of Fame                |     20% | Roman    | fehlt                         | `server/index.js`, neue Page, `docs/API.md`                                            |
| Qualitätsziele                 |       – | beide    | fehlt                         | Doku, in der Prüfung verteidigen                                                       |

Offen sind B6 (Matthias) und B7 (Roman). B7 ist mit 20 % das größte offene Feature und das einzige mit nennenswertem Backend-Anteil (neue Endpoints, Validierung, `docs/API.md`). B6 muss mit der Laufzeitprüfung aus B5 (Entscheidung 7) zusammenpassen: gespeicherte Daten sind wie API-Antworten eine Grenze nach außen.

## Aufteilung nach Feature

Beschlossen: Die Arbeit wird nach Feature aufgeteilt, nicht nach Schicht (Frontend/Backend). Grund: Das Backend macht nur ca. 20–25 % der Arbeit aus (Schätzung, siehe `docs/diagrams/split.svg`, Quelle `docs/diagrams/split.d2`), eine Schicht-Teilung wäre unausgewogen gewesen. Wer ein Feature übernimmt, macht Frontend und Backend davon selbst.

| Person | Features |
| ------ | -------- |
| Matthias | B1 ✓, B2 ✓, B5 ✓, B6 |
| Roman    | B3 ✓, B4 ✓, B7       |

- B7 liegt in einer Hand (Roman), dann gibt es keine Abstimmung über den API-Vertrag (Endpoints, Felder, Fehlerformat, Ranking-Regel). B3/B4 und die Gegner-Tabelle (`server/opponents.js`) liegen ebenfalls bei Roman, ein Vertrag ist also nicht nötig.
- Konfliktstellen: `types.ts`/`battle.ts`/`items.ts` (B3 und B4, beide Roman, erledigt), `run.ts`/`Backpack.tsx` (B1 und B2, beide Matthias, erledigt), `game.ts`/`ShopPage.tsx`/`GameProvider.tsx` (B5 erledigt, B6 offen, beide Matthias). Einzige echte Überschneidung: `rules.ts` (Regeltexte aller Features), dort nur neue Abschnitte anhängen.
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
