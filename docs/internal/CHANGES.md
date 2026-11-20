# Änderungsprotokoll

Pro Änderung: Problem → Ursache → Lösung → Warum, mit Commit-Hash (7 Zeichen, nach dem Merge).

| Datum | Req | Problem | Ursache | Lösung | Warum | Beleg |
| ----- | --- | ------- | ------- | ------ | ----- | ----- |
| 2026-11-20 | B1 | Kauf bei vollem Rucksack zog Gold ab, das Item ging verloren | `buyBlocker` prüfte keinen freien Slot; `firstFreeSlot` lieferte `-1`, `backpack[-1] = …` legt nur eine Eigenschaft am Array an statt einen Slot zu füllen | Neue Prüfung „Backpack full" in `buyBlocker`, vor „Not enough gold"; Test `run.test.ts` | Eine Regel schützt Button und Aktion zugleich (B1: „same rule protects the action"). Reihenfolge: Ein Grund, den Gold nicht löst, kommt zuerst, sonst führt die Meldung in die Irre | _(nach Merge)_ |
| 2026-11-20 | B1 | Items konnten nicht verkauft werden | Starter hatte nur Kaufen | `sellPrice` (Preis/2, abgerundet), `sellBlocker` („Empty slot"), `sellItem` in `run.ts`; Sell-Button pro belegtem Slot; Regeltext angepasst; Tests in `run.test.ts` | Verkaufspreis als eigene Funktion, damit Anzeige und Regel nie auseinanderlaufen. Gold und Slot ändern sich in einem neuen Zustand („ganz oder gar nicht"). Schutz doppelt: `fieldset disabled` (UI) + `updateRun` nur in Phase `shop` (Logik). Verkauftes Item verschwindet und kehrt nicht in den Shop zurück: einfachste Variante, keine Duplikationslücke | _(nach Merge)_ |
