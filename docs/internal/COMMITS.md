# Commits pro Anforderung

Übersicht, welche Commits zu welcher Anforderung gehören. Jede Anforderung kam per Pull Request mit Merge-Commit nach `main`. Reihenfolge innerhalb einer Anforderung = Reihenfolge der Entstehung. *(kosmetisch)* markiert reine Formatierungs-Commits.

Ansehen: Hash anklicken, oder im Terminal `git show <hash>`. Begründungen stehen in `CHANGES.md` und im Diary.

## B1 – Shop-Wirtschaft (Matthias)

[PR #1](https://github.com/Roman0-5/backpack-brawl-MaRo/pull/1), Merge [`08dbc28`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/08dbc28)

| Commit | Inhalt |
| ------ | ------ |
| [`3c4ab2f`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/3c4ab2f) | Fix: Kauf bei vollem Rucksack blockieren, mit Test |
| [`f627850`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/f627850) | *(kosmetisch)* Zeilenumbruch |
| [`7a1cc4c`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/7a1cc4c) | Verkaufsregel (halber Preis, abgerundet) mit Tests |
| [`d96e32e`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/d96e32e) | *(kosmetisch)* Leerzeile |
| [`13a4b2a`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/13a4b2a) | Verkaufen-Button im Rucksack, Regeltext |
| [`286ddf6`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/286ddf6) | *(kosmetisch)* Zeilenenden |
| [`c2a3f0c`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/c2a3f0c) | Reroll-Regel (1 Gold, über Seed) mit Tests |
| [`54303b9`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/54303b9) | Reroll-Button im Shop, Regeltext |

## B2 – Rucksack anordnen (Matthias)

[PR #2](https://github.com/Roman0-5/backpack-brawl-MaRo/pull/2), Merge [`e0eb3e9`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/e0eb3e9)

| Commit | Inhalt |
| ------ | ------ |
| [`0152a68`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/0152a68) | Regel zum Verschieben und Tauschen |
| [`eb8c4d0`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/eb8c4d0) | Tests dazu (nachgereicht) |
| [`77293e5`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/77293e5) | Auswahl, mögliche Züge, Abbrechen in der Oberfläche |

## B3 – Poison und Heal (Roman)

[PR #3](https://github.com/Roman0-5/backpack-brawl-MaRo/pull/3), Merge [`e5f29c2`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/e5f29c2)

| Commit | Inhalt |
| ------ | ------ |
| [`53f0296`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/53f0296) | Effekte Poison und Heal in Typen, Labels, Tooltips |
| [`f9e3536`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/f9e3536) | Tests für die bestehenden Kampfregeln |
| [`19f2879`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/19f2879) | Heal-Regel im Kampf mit Tests |
| [`80b04e1`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/80b04e1) | Poison-Stacks mit Tests |
| [`776ecf0`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/776ecf0) | Poison-Schaden pro Tick mit Test |
| [`7b26071`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/7b26071) | drei Heal-Items |
| [`e875b0c`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/e875b0c) | drei Poison-Items |
| [`8be24fe`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/8be24fe) | Test: Katalog hat je mindestens 3 Items |
| [`3db4cd7`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/3db4cd7) | Gegner nutzen Poison und Heal |
| [`b605f68`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/b605f68) | Poison-Zähler im Kampf |
| [`4c9e074`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/4c9e074) | Farben im Kampf-Log |
| [`a561565`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/a561565) | Regeltext |

## B4 – Sets und Burn (Roman)

[PR #5](https://github.com/Roman0-5/backpack-brawl-MaRo/pull/5), Merge [`30098b0`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/30098b0)

| Commit | Inhalt |
| ------ | ------ |
| [`30fa0c5`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/30fa0c5) | Burn und Sets in Typen, Labels, Tooltips |
| [`c9d17a9`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/c9d17a9) | Burn-Logik mit Test |
| [`30feae9`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/30feae9) | Burn-Schaden pro Tick, Block, Abklingen |
| [`551b8b2`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/551b8b2) | Set-Definitionen mit Tests |
| [`4f03050`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/4f03050) | Set-Boni mit Tests |
| [`1fc8ec1`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/1fc8ec1) | Fix: Burn halbiert sich pro Tick, damit er immer ausläuft |
| [`526b0e2`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/526b0e2) | drei Fire-Items |
| [`ebdf158`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/ebdf158) | Iron-Set aus bestehenden Schilden |
| [`e5de0d2`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/e5de0d2) | Test: mindestens 2 Sets inkl. Fire |
| [`3f39598`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/3f39598) | Gegner nutzen Sets und Burn |
| [`94cf4ac`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/94cf4ac) | Set-Abzeichen im Shop und Rucksack |
| [`d6ea04d`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/d6ea04d) | Fix: Burn-Icon und Gleichstand-Text |
| [`0d1d3c5`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/0d1d3c5) | aktive Set-Boni im Shop |
| [`8c8567b`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/8c8567b) | Burn-Zähler, Abzeichen, Boni im Kampf |
| [`86b2cd7`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/86b2cd7) | Burn-Farbe im Kampf-Log |
| [`c8e0295`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/c8e0295) | Regeltext Sets und Burn |
| [`9e8a012`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/9e8a012) | Set-Fortschritt im Kampf |

## B5 – Resilientes Matchmaking (Matthias)

[PR #4](https://github.com/Roman0-5/backpack-brawl-MaRo/pull/4), Merge [`498091d`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/498091d)

| Commit | Inhalt |
| ------ | ------ |
| [`dafdad0`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/dafdad0) | fehlgeschlagene Suche → zurück in den Shop |
| [`aaa33a3`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/aaa33a3) | keine zweite Suche während einer laufenden |
| [`f45f6f6`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/f45f6f6) | Such-ID: Kampf nur für aktuelle Suche und Runde |
| [`652d2d6`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/652d2d6) | verständliche Meldungen, Timeout, Prüfung der Antwort |

## B6 – Speichern und Fortsetzen (Matthias)

[PR #7](https://github.com/Roman0-5/backpack-brawl-MaRo/pull/7), Merge [`5c9959c`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/5c9959c)

| Commit | Inhalt |
| ------ | ------ |
| [`409f275`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/409f275) | Speicherstand erzeugen, prüfen, laden (reine Funktionen) mit Tests |
| [`48a468e`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/48a468e) | localStorage, Meldung und „Continue run“ auf der Startseite, Regeltext |

## B7 – Hall of Fame (Roman)

[PR #8](https://github.com/Roman0-5/backpack-brawl-MaRo/pull/8), Merge [`ec19405`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/ec19405)

| Commit | Inhalt |
| ------ | ------ |
| [`b99348d`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/b99348d) | Run bekommt `runId` und `submitted`, Save-Version 2 |
| [`82758da`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/82758da) | Server auf TypeScript umgestellt |
| [`444a6f2`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/444a6f2) | Hall-of-Fame-Regeln im Server mit Tests |
| [`5bd45b3`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/5bd45b3) | Endpoints `GET` und `POST /api/runs` |
| [`a171164`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/a171164) | Doku der Endpoints in `API.md` |
| [`43106e3`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/43106e3) | Client-Anbindung (Timeout, Meldungen, gemeinsame Typen) |
| [`b150e1e`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/b150e1e) | Name am Run-Ende eintragen, kein doppeltes Absenden |
| [`1f81451`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/1f81451) | Hall-of-Fame-Seite mit Lade-, Leer- und Fehlerzustand |
| [`0dabd02`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/0dabd02) | Regeltext Hall of Fame |

## Sonstiges: Shop-Karten gleich hoch (Matthias)

[PR #6](https://github.com/Roman0-5/backpack-brawl-MaRo/pull/6), Merge [`2b22b43`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/2b22b43)

| Commit | Inhalt |
| ------ | ------ |
| [`4a84058`](https://github.com/Roman0-5/backpack-brawl-MaRo/commit/4a84058) | `h-full` an der Item-Karte |
