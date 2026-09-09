# Lernansichten und Referenzabgleich

Stand: 9. September 2026. Abgleich mit der erneut bereitgestellten Datei
`AI_Literacy_LHIND (2).html` und der aktuellen lokalen Arbeitsversion.

## Aufteilung der Lernansichten

**Mein Lernen** beantwortet: Welche Ziele gelten für meine Rolle, wo stehe ich,
und welcher Kurs ist als Nächstes sinnvoll? Hier bleiben die fünf Dimensionen,
Acquire / Deepen / Create, aktuelle und empfohlene Stufen, erreichte Etappen,
Kursvorbereitung und Academy-Angebote.

**Mein Fortschritt** beantwortet: Was habe ich tatsächlich gemacht? Die Seite
zeigt begonnene und abgeschlossene Kurse, abgeschlossene Lektionen und
bestätigte praktische Selbstchecks. Prozentwerte beziehen sich auf den
Lesestand des jeweiligen Kurses und verwenden dieselbe Fortschrittsquelle wie
die Kursansicht. Daneben steht ausdrücklich die Zahl abgeschlossener Lektionen.
100 % gelesen bedeutet nicht automatisch, dass ein Kurs abgeschlossen oder
eine Kompetenz nachgewiesen ist.

Die doppelte Dimensionsübersicht, das globale Schwerpunkt-Dropdown und die
pauschale Gesamtprozentzahl entfallen. Die 19 Fähigkeiten mit ihren
Kursbeiträgen bleiben aufklappbar erreichbar. Assessment-Verwaltung, Merkzettel,
gespeicherter Code und der Rückweg zum Lernpfad bleiben verlinkt. Keine
gespeicherten Assessment-, Fortschritts- oder Notizdaten wurden gelöscht.

## Erhaltene Ebenen

| Referenz / Inhalt | Ort und Prüfung |
| --- | --- |
| Fünf Dimensionen | „Mein Lernen“; Namen und Zuordnungen gegen `zielbilder.json` geprüft. |
| Drei Kompetenzstufen | Acquire, Deepen, Create bleiben in Rolle, Assessment, Lernpfad und Fähigkeitsdetails erhalten. Keine Umrechnung ordinaler Stufen in Prozente. |
| Sechs Assessment-Rollen | BSC, TC, AM, PMA, CF, L bleiben auswählbar. |
| Siebtes Referenzprofil PVS | Zielmatrix bleibt erhalten. Gemäß Quelle weiterhin nicht Teil der Assessment-Rollenauswahl. |
| Rollen-Zielmatrix | Alle sieben Matrizen stimmen mit der Referenz überein. PMA × Engineering bleibt ohne Ziel; daraus wird keine Lücke erfunden. |
| Fähigkeitsthemen | Alle 20 Themen der Quelllisten sind repräsentiert. Terminologie und AI Concepts / Tool Overviews sind im bestehenden Katalog zu einer Fähigkeit zusammengefasst; daher 19 Katalogfähigkeiten. |
| Self-Assessment | Offizieller SharePoint-Einstieg und Import bleiben erreichbar; Rollenwechsel und importierte Zielwerte verwenden weiterhin die vorhandenen Datenquellen. |
| Onlinekurse und Vorbereitung | Vorbereitete Kurs-/Lektionszuordnungen, Voraussetzungen und wieder aufklappbare erreichte Etappen bleiben auf „Mein Lernen“. |
| LHIND Academy | Alle neun Referenzpfade AI-01 bis AI-09 sind vorhanden und wieder direkt von „Mein Lernen“ erreichbar. Die bestehenden Erweiterungen AI-10 und AI-12 bleiben zusätzlich verfügbar. Buchungslinks werden nicht erfunden. |
| Externe Empfehlungen | Alle 97 Referenzeinträge bleiben in `kurse.json`; ihre Anbieter-URLs sind in den Lektionsdokumenten vorhanden, verglichen ohne Trackingparameter und Fragmente. Die externen Websites wurden nicht auf aktuelle Verfügbarkeit geprüft. |
| Lektionsunterlagen | Erklärungen, Code, Notebooks, Quiz und wiederverwendbare Outputs bleiben über Kurs und Lektion erreichbar; ihre Dateien wurden bei dieser Umstellung nicht verändert. |
| Praktische Nachweise | Gespeicherte bestandene `appliedEvidence`-Selbstchecks werden getrennt angezeigt. Quizantworten und reine Leseaktivität werden nicht als solche Nachweise ausgegeben. Es wird keine bisher nicht vorhandene Abgabe-/Uploadfunktion behauptet. |
| Persönliche Notizen | Merkzettel und gespeicherter Code bleiben über `notes.html` erreichbar. |
| Grundlagen und Steuerung | UNESCO-Einordnung, Methodik, ursprüngliche Zielbilder, Buchungsstatistik und Datenmodelle bleiben in der archivierten Referenz und ihren JSON-Dateien erhalten. |

## Quellenunterschiede und Grenzen

Die erneut gelieferte HTML-Datei ergänzt gegenüber der archivierten Fassung
eine Lernpfad-Oberfläche. Ihre Datensätze `DIMS`, `ROLES`, `Z`, `COURSES` und
`ACADEMY` sind inhaltlich identisch. Die vorhandene Referenz wurde nicht
überschrieben.

Die Quelle nennt **19 Fähigkeiten**, listet aber **20 Themen**, sowie
**95 Empfehlungen**, enthält jedoch **97 Einträge**. Diese Widersprüche
werden nicht durch Löschen von Inhalten aufgelöst.

PDF-Export der Assessment-Ergebnisse gehört in der Referenz zum offiziellen
SharePoint-Angebot; diese Anwendung behält dessen Einstieg und Ergebnisimport.
Ein eigener PDF-Exporter wurde hier nicht ergänzt. Unternehmensweite
Wirksamkeitsmessung, aggregierte Nutzung und geplante Messpunkte sind
Steuerungsinhalte der Referenz, kein bereits implementiertes persönliches
Fortschritts- oder Tracking-System.

## Verifikation

- Regressionstests schützen die sieben Zielmatrizen, vollständige
  Fähigkeitsthemen und neun Academy-Pfade.
- Verlaufstests prüfen geteilte Lektionen, reine Besuche, 100 % Lesestand ohne
  Abschluss, bestätigte Selbstchecks, leere Verläufe und ältere Nachweise.
- Im Browser geprüft: sieben vorhandene begonnene Kurse, keine doppelten
  Dimensionskarten, ausgeblendeter Gesamtprozentsatz, alle 19 Fähigkeiten über
  „Alle anzeigen“, Assessment- und Notiz-Zugänge sowie elf Academy-Pfadlinks.

Diese Aufteilung ersetzt die frühere Empfehlung, dieselbe Dimensionsauswahl
auch auf der Fortschrittsseite zu verwenden.
