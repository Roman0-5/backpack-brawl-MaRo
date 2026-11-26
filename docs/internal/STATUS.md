# Backpack Brawl – Standort und Setup

Stand: 2026-11-26 (B1–B7 und Qualitätsziele fertig). Abgabe: Freitag. Diagramm: `docs/diagrams/status.svg` (Quelle `docs/diagrams/status.d2`).
Neu rendern: `d2 --layout=elk docs/diagrams/status.d2 docs/diagrams/status.svg` (ebenso `split.d2`)

## Wo wir stehen

B1–B7 sind umgesetzt und per PR (#1–#5, #7, #8) nach `main` gemergt, dazu der Karten-Fix (PR #6). Offen: nur noch die Final Reflection im Diary.

- **Frontend:** React, Vite, Tailwind, react-router (Port 5174). Spielregeln als reine TypeScript-Module ohne React (`run.ts`, `shop.ts`, `game.ts`, `battle.ts`, `items.ts`, `sets.ts`, `rules.ts`), Ränder nach außen mit Laufzeitprüfung (`api.ts` Gegner, `save.ts` localStorage, `hallOfFame.ts` Hall of Fame). Seiten: Start, Shop, Kampf, Ergebnis, Hall of Fame.
- **Server:** Express in TypeScript (Port 4200), gestartet mit `tsx`, Typcheck über `tsconfig.server.json` im Build. Endpoints `/api/health`, `/api/opponents`, `GET`/`POST /api/runs`. Regeln der Hall of Fame in `server/runs.ts`, Speicher in-memory hinter `server/runStore.ts`. Doku: `docs/API.md`.
- **Tests:** 173 Vitest-Unit-Tests (`run`, `battle`, `items`, `sets`, `game`, `api`, `save`, `hallOfFame`, `server/runs`).
- **Nach dem Pull:** `npm install` (seit B7 neu: `tsx`, `@types/express`, `@types/cors`).

## Anforderungen

| Req                            | Gewicht | Wer      | Stand                         | Anknüpfungspunkt                                                                      |
| ------------------------------ | ------: | -------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| B1 Verkaufen / Reroll          |     10% | Matthias | ✓ gemergt (PR #1, `08dbc28`) | `run.ts`, `Shop.tsx`, `Backpack.tsx`, `rules.ts`                                       |
| B2 Backpack verschieben / swap |     15% | Matthias | ✓ gemergt (PR #2, `e0eb3e9`) | `Backpack.tsx`, `run.ts`                                                               |
| B3 Poison / Heal               |     15% | Roman    | ✓ gemergt (PR #3, `e5f29c2`) | `types.ts`, `battle.ts`, `items.ts`, `server/opponents.ts`, `BattleView.tsx`, `rules.ts` |
| B4 Sets + Burn                 |     20% | Roman    | ✓ gemergt (PR #5, `30098b0`) | `sets.ts`, `battle.ts`, `items.ts`, `server/opponents.ts`, `SetBadge.tsx`, `Backpack.tsx`, `BattleView.tsx`, `rules.ts` |
| B5 Matchmaking                 |     10% | Matthias | ✓ gemergt (PR #4, `498091d`) | `game.ts`, `api.ts`, `ShopPage.tsx`                                                    |
| B6 Save / Resume               |     10% | Matthias | ✓ gemergt (PR #7, `5c9959c`) | `save.ts`, `GameProvider.tsx`, `StartPage.tsx`, `rules.ts`                              |
| B7 Hall of Fame                |     20% | Roman    | ✓ gemergt (PR #8, `ec19405`) | `server/runs.ts`, `server/index.ts`, `hallOfFame.ts`, `HallOfFameForm.tsx`, `HallOfFamePage.tsx`, `docs/API.md` |
| Qualitätsziele                 |       – | beide    | ✓ dokumentiert (`f89a929`)    | `docs/QUALITY.md`                                                                      |

Alle funktionalen und qualitativen Anforderungen sind umgesetzt (Qualitätsziele in `docs/QUALITY.md`, beide verteidigen sie im Abgabegespräch). Offen ist nur noch die Final Reflection im Diary.

## Aufteilung nach Feature

Beschlossen: Die Arbeit wird nach Feature aufgeteilt, nicht nach Schicht (Frontend/Backend). Grund: Das Backend macht nur ca. 20–25 % der Arbeit aus (Schätzung, siehe `docs/diagrams/split.svg`, Quelle `docs/diagrams/split.d2`), eine Schicht-Teilung wäre unausgewogen gewesen. Wer ein Feature übernimmt, macht Frontend und Backend davon selbst.

| Person | Features |
| ------ | -------- |
| Matthias | B1 ✓, B2 ✓, B5 ✓, B6 ✓ |
| Roman    | B3 ✓, B4 ✓, B7 ✓       |

- B7 liegt in einer Hand (Roman), dann gibt es keine Abstimmung über den API-Vertrag (Endpoints, Felder, Fehlerformat, Ranking-Regel). B3/B4 und die Gegner-Tabelle (`server/opponents.ts`) liegen ebenfalls bei Roman, ein Vertrag ist also nicht nötig.
- Konfliktstellen: `types.ts`/`battle.ts`/`items.ts` (B3 und B4, beide Roman, erledigt), `run.ts`/`Backpack.tsx` (B1 und B2, beide Matthias, erledigt), `game.ts`/`ShopPage.tsx`/`GameProvider.tsx` (B5 und B6, beide Matthias, erledigt). B7 hat `save.ts` aus B6 an einer Stelle erweitert (`runId`, `submitted`). Einzige echte Überschneidung: `rules.ts` (Regeltexte aller Features), dort nur neue Abschnitte anhängen.
- UI-Redesign und Barrierefreiheit: als Extras angedacht, keine Anforderung, bewusst weggelassen.
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
- `npm run dev`: Run beenden, Namen eintragen (auch mit Offline + Retry), Hall of Fame öffnen, F5 auf `/hall-of-fame`.
- Pages: Deploy grün, Refresh auf `/shop` bricht nicht.
