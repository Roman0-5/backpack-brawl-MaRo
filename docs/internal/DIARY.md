# Practical Exam – Development Diary

Team members: Matthias, Roman
Repository: [github.com/Roman0-5/backpack-brawl-MaRo](https://github.com/Roman0-5/backpack-brawl-MaRo)

## Development Overview

**Organisation:** Aufteilung nach Feature. Wer ein Feature übernimmt, baut Frontend und Backend davon selbst. Feature Branching Strategie wie z.B. `git branch b1-shop-economy`. Namen bitte in die Tabelle eintragen.

**Dokumentation:** Zwei Ebenen. Jede Änderung wird in `docs/internal/CHANGES.md` als
Problem → Ursache → Lösung → Warum festgehalten (Detail, inkl. Commit-Hash).
Weitreichende Entscheidungen (Architektur, Spielregeln, Trade-offs) kommen zusätzlich
unter „Important Decisions" in dieses Diary. So bleibt das Diary kurz, und jede
Begründung ist trotzdem nachvollziehbar.

**Zuständigkeiten:**

| Feature                                            | Gewicht | Wer?      |
| -------------------------------------------------- | ------: | ----      |
| B1 Shop-Wirtschaft (verkaufen, reroll)             |     10% | Matthias  |
| B2 Backpack anordnen (verschieben, swap)           |     15% |           |
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
   - Beleg: _(Commit des ersten Tests, nach dem Merge eintragen)_
3. _(TODO)_

## AI Usage

- Matthias: Claude für Analyse von Codebase und Architektur
- Roman: Für den Anfang Claude Code benutzt um Diagramm der Codebase und Requirements generieren zu lassen.

## Laufendes Protokoll (Material fürs Diary)

Kurze Einträge mit Datum, Kurzerklärung, und Commit-Hash.

> **Hinweis zu den Belegen:** Der Hash verweist auf den Commit mit der eigentlichen Arbeit, nicht auf den Diary-Commit, da ein Commit seinen eigenen Hash nicht enthalten kann. Das Diary wird direkt auf `main` in separaten `docs:`-Commits gepflegt. Hashes werden erst nach dem Merge nach `main` eingetragen (Squash/Rebase ändern Hashes) und auf 7 Zeichen gekürzt (`git log --oneline`).

| Datum      | Was / Warum                                                                                                                                                                    | Beleg        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| 2026-11-20 | Anforderungen und Starter analysiert, Status- und Aufteilungsdiagramme erstellt, Aufteilung nach Feature beschlossen (zuerst Schicht erwogen, wegen Ungleichgewicht verworfen) | _(Commit)_ |

## Final Reflection und Lessons learned

_(TODO)_
