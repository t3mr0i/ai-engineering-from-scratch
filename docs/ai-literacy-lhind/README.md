# AI Literacy LHIND – HTML-Fassung (Import)

Quelle: `INTERN_AI_Literacy_LHIND` (Deck, 19 Seiten), Stand 08/2026.
Importiert am 2026-09-07 aus `/Users/U751725/Downloads/AI_Literacy_LHIND (2).html`.
Erstellt 04.09.2026 laut Footer der Datei. Interner Stand: März–August 2026 je Sektion.

> Hinweis: Datei ist als „Intern" gekennzeichnet, Sektion 07 zusätzlich als
> „Confidential". Vor Push/PR prüfen, ob dieses Verzeichnis in ein
> öffentliches Repo gehört.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Vollständige 1:1-Kopie der Quelle (alle Sektionen, inkl. Zielbilder) |
| `zielbilder.json` | Zielbild-Matrix je Rolle × Dimension (Target A/D/C/null, Katalog, Coverage) |
| `kurse.json` | Alle Kurs-Empfehlungen aus dem Anhang (97 Einträge) |
| `academy.json` | AI-01 … AI-09 Academy-Titel |
| `stats.json` | Bookings, Provider-Verteilung, Level-Totals |
| `empfehlungen-mapping.json` | Welche Kurse in welchen Lessons unter `### Recommended trainings (LHIND AI Literacy)` stehen (60 Lessons, 140 Bullets) + URL-Aliase; per Skript aus den Lessons regeneriert |

## Struktur der Quelle

01 Ziel · 02 Big Picture · 03 Prozesslogik (Skill-Level 1,0–2,9 / 3,0–4,2 / 4,3–5,0;
IST-vs-Ziel-Regel) · 04 UNESCO-Framework · 04 Capabilities (5 Dimensionen) ·
06 Zielbilder je Rolle + Matrix · 06 Self-Assessment (10 Fragen, Skala 1–5) ·
07 Wirksamkeitsmessung · 05 Online-Kurse · Anhang Empfehlungsliste · Datenmodell
(`window.AILIT`: `zielbilder.json` + `kurse.json`; Level-Codes A/D/C/null).

## Zielbilder (Folie 7)

Regel: Zielbild je Dimension = höchstes Level über die Fähigkeiten dieser
Dimension. Coverage „gedeckt" = alle Stufen bis inkl. Ziel-Level im Katalog.

- Dimensionen (5): Foundation · Engineering · Product and Process ·
  Advisory and Business Consulting · Leadership and Strategy
- Rollen (7 Codes, 6 im Assessment): BSC, PVS (nicht im Rollensystem),
  TC, AM, PMA, CF, L
- Sonderfälle aus der Quelle: PVS überall „nicht im Rollensystem";
  PMA × Engineering ohne Zielbild („Ziel –", kein GAP-Hinweis).

## Abweichungen Quelle vs. extrahierte Daten

- Fähigkeiten: Deck schreibt „19", `DIMS` enthält 5+6+2+4+3 = **20**.
- Empfehlungen: Deck schreibt „95", `COURSES` enthält **97**
  (Levels 38/36/23 statt 37/35/23; Stunden-Summe 298,69 statt 296).
- Distinct Kursnamen: 66 (passt zur Deck-Angabe), 9 Anbieter.
- Rollen: „6 Rollen" (Assessment) vs. „7 Profile" (Kompetenzmodell) –
  beide Zahlen stehen so im Deck.

## Empfehlungen in den Lessons (Pflege)

- Regel: Passende Kurse aus `kurse.json` stehen in den Lessons unter
  `### Recommended trainings (LHIND AI Literacy)` am Ende der
  Further-Reading-Sektion – nur wo es thematisch passende Kurse gibt.
  Format: `- [Titel](url) — Provider · Level · X h · Rollen: … (Academy AI-XX)`.
- Merge-Regel (ein Bullet pro Kurs-Seite): kanonische URL ohne
  Fragment/Tracking-Parameter; Rollen/Level/Academies kombiniert in
  Erstnennung-Reihenfolge aus `kurse.json`; Zweit-Titel als
  „auch gelistet als …"; Stunden deutsch mit Komma. Gleichnamige Kurse
  verschiedener Provider bleiben separate Bullets. Details in
  `empfehlungen-mapping.json` (`aliases`).
- Diese Datei (`empfehlungen-mapping.json`) nicht von Hand pflegen, sondern
  per Skript aus den Lessons regenerieren (Bullets unter der
  `### Recommended trainings`-Überschrift parsen).
- Zwillings-Lessons (Original + AI-X-Variante, z. B. 26/88, 48/99, 35/93)
  tragen jeweils denselben Empfehlungssatz.
