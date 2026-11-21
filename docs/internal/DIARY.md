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

| Feature                                            | Gewicht | Wer?      |
| -------------------------------------------------- | ------: | ----      |
| B1 Shop-Wirtschaft (verkaufen, reroll)             |     10% | Matthias  |
| B2 Backpack anordnen (verschieben, swap)           |     15% | Matthias  |
| B3 Status-Effekte (Poison, Heal)                   |     15% |           |
| B4 Item-Sets + Burn                                |     20% |           |
| B5 Resilientes Matchmaking                         |     10% |           |
| B6 Speichern und Fortsetzen                        |     10% |           |
| B7 Hall of Fame                                    |     20% |           |
| Qualitätsziele (Auswahl, Begründung, Evaluation) |      – |      |
| UI-Redesign                                        |      – |      |
| Tests, `docs/API.md`                             |      – |      |

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
   - Beleg: _(Commit der Auswahl-UI, nach dem Merge eintragen)_

## AI Usage

- Matthias: Claude (Chat) für Analyse von Codebase und Architektur, Priorisierung der Probleme, Erklärung von Ursache und Lösung.
- Roman: Für den Anfang Claude Code benutzt um Diagramm der Codebase und Requirements generieren zu lassen.

## Laufendes Protokoll (Material fürs Diary)

Kurze Einträge mit Datum, Kurzerklärung, und Commit-Hash.

> **Hinweis zu den Belegen:** Der Hash verweist auf den Commit mit der eigentlichen Arbeit, nicht auf den Diary-Commit, da ein Commit seinen eigenen Hash nicht enthalten kann. Das Diary wird direkt auf `main` in separaten `docs:`-Commits gepflegt. Hashes werden erst nach dem Merge nach `main` eingetragen (Squash/Rebase ändern Hashes) und auf 7 Zeichen gekürzt (`git log --oneline`).

| Datum      | Was / Warum                                                                                                                                                                    | Beleg        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| 2026-11-20 | Anforderungen und Starter analysiert, Status- und Aufteilungsdiagramme erstellt, Aufteilung nach Feature beschlossen (zuerst Schicht erwogen, wegen Ungleichgewicht verworfen) | _(Commit)_ |
| 2026-11-20 | Doku-Regel (`CHANGES.md` + Diary) und Teststrategie (Entscheidung 2) festgelegt | `38488ec`, `23a3a2b` |
| 2026-11-20 | Versehentlicher Commit auf `main` per `git revert` zurückgenommen statt die gemeinsame Historie umzuschreiben | `631d0b4` |
| 2026-11-20 | B1 umgesetzt: Fix voller Rucksack, Verkaufen, Reroll (Entscheidung 3), 12 Unit-Tests. Per PR #1 als Merge-Commit nach `main` | `3c4ab2f`, `7a1cc4c`, `13a4b2a`, `c2a3f0c`, `54303b9`, Merge `08dbc28` |

## Final Reflection und Lessons learned

_(TODO)_
