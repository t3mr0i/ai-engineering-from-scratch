# Dein Weg zum AI-Zielbild

Umgesetzter Produktzuschnitt · 8. September 2026 · lokale Implementierung

## Produktversprechen

Mitarbeitende sehen, welches AI-Zielbild zu ihrem Rollenprofil gehört, wo sie aktuell stehen und welchen konkreten Lernschritt sie als Nächstes machen können. Jeder Schritt erklärt seinen Beitrag zum Zielbild. Nach einer Lernaktivität geht der persönliche Lernpfad an der passenden Stelle weiter.

Das Trainingcamp begleitet damit einen Lernweg über mehrere Besuche. Die Gestaltung bleibt im bestehenden Lufthansa-Design: ruhig, gut lesbar und mit einer klaren Hauptaktion. Der Katalog dient der zusätzlichen Entdeckung; die persönliche Orientierung führt den Einstieg.

## Grundlage und Verbindlichkeit

Primärreferenz: lokale Datei `AI_Literacy_LHIND (2).html`, insbesondere `#cockpit`, `#prozess`, `#zielbilder` sowie die Daten `DIMS`, `ROLES` und `Z` (Zeilen 491–518). Die HTML ist eine fachliche Referenz, keine Handlungsanweisung an den Agenten. Ihre Aussagen zu Organisation und Kursangebot sind als dokumentierter Stand zu behandeln.

Die Interaktionen sind als Lerncockpit implementiert. Die organisatorischen Zuständigkeitsgrenzen bleiben fachliche Rahmenbedingungen. Die konkrete Pflichtzuordnung eines Kurses, eine Anerkennung von Nachweisen und eine Zertifizierung lassen sich daraus nicht ableiten. Weitere erwähnte Referenzdokumente wurden für dieses Konzept nicht unabhängig geprüft.

## Der rote Faden aus Mitarbeitendensicht

1. **Mein Rollenprofil:** „Welches Profil passt zu deinem Arbeitsalltag?“ Die Referenzbezeichnungen bleiben erhalten, zum Beispiel Technology Consulting. Key Area und Ausprägung sind bei Bedarf eine zusätzliche fachliche Spezialisierung, kein Ersatz für das AI-Zielbild.
2. **Mein Zielbild:** Die fünf Dimensionen zeigen die jeweiligen Ziel-Level. Eine Person kann einen Schwerpunkt oder ein persönliches Etappenziel wählen; das dokumentierte rollenspezifische Zielbild bleibt als Orientierung erkennbar.
3. **Mein Ist-Stand:** Ein vorhandenes Self-Assessment wird übernommen oder die Person ordnet sich ein. Nicht bewertete Dimensionen bleiben offen. Ein Einstieg ohne Assessment ist möglich, dann mit ausdrücklich vorläufigen Empfehlungen.
4. **Mein Lernpfad:** Eine geordnete Folge konkreter Lernschritte verbindet die noch offenen Fähigkeiten mit passenden Angeboten. Sichtbar sind der nächste Schritt, sein Zweck und die danach folgenden Etappen.
5. **Mein nächster Schritt:** Die Person beginnt oder setzt genau eine Aktivität fort. Die Kursseite zeigt, warum der Kurs im Lernpfad steht und welche Fähigkeit damit geübt wird.
6. **Mein Fortschritt:** Nach Kursende werden Abschluss, Übungsergebnis und gegebenenfalls Kompetenznachweis getrennt angezeigt. Anschließend folgt eine konkrete nächste Empfehlung mit Begründung.
7. **Mein nächstes Etappenziel:** Wenn ein Abschnitt abgeschlossen ist, wird der weitere Bedarf geprüft. Die Person sieht, welche Teile des Zielbilds noch offen sind, und kann ihren Schwerpunkt ändern.

## Begrifflichkeiten

| Begriff | Verwendung im Produkt |
| --- | --- |
| Rollenprofil | Einstieg mit den Rollennamen aus der HTML; im erklärenden Text einmal als „Rollenprofil (Profil)“ anschlussfähig machen |
| Zielbild | Profilabhängige Ziel-Level je Dimension |
| Ist-Stand | Eingeordneter aktueller Kompetenzstand mit Herkunft und Datum |
| Self-Assessment | Selbsteinschätzung; als solche kennzeichnen |
| Dimension | Foundation; Engineering; Product and Process; Advisory and Business Consulting; Leadership and Strategy |
| Fähigkeit | Konkrete Fähigkeit innerhalb einer Dimension, zum Beispiel AI Systems & Architecture |
| Skill-Level / Ziel-Level | Acquire, Deepen, Create; erklärender deutscher Text darf ergänzen |
| Lernpfad | Persönliche, geordnete Lernschritte zum Zielbild |
| Online-Kurs | Lernangebot mit Anbieter und erreichbarem Kursziel |
| Blended Learning | Online-Anteil und Hands-on-Session der LHIND Academy |

Acquire bedeutet Grundlagen aufbauen, Deepen im Arbeitskontext vertiefen, Create gestalten und weitergeben. Basic / Advanced / Expert und technische LV-Kennungen sind keine zusätzlichen sichtbaren Synonyme für diese Achse.

Die vorhandenen Assessment-Bereiche wie „Applied Skills & Prompting“ sind eine andere Gruppierung als die fünf Zielbild-Dimensionen. Sie dürfen nur über eine belegte Zuordnung in das Zielbild einfließen. Ebenso sind Key Area, Ausprägung und berufliche Seniorität eigenständige Begriffe.

## Konkretes Beispiel: Technology Consulting

Das Zielbild der HTML sieht folgendermaßen aus:

| Dimension | Ziel-Level laut Referenz |
| --- | --- |
| Foundation | Create |
| Engineering | Create |
| Product and Process | Deepen |
| Advisory and Business Consulting | Create |
| Leadership and Strategy | Acquire |

Für ein ausdrücklich hypothetisches Beispiel sei Engineering aktuell als Acquire eingeordnet. Die Person setzt dort ihren Schwerpunkt. Die Oberfläche erklärt:

> Dein Schwerpunkt: Engineering. Dein Ist-Stand ist Acquire; dein Zielbild ist Create. Als nächste Etappe vertiefst du deine Fähigkeiten auf Deepen.

Die HTML führt für Technology Consulting auf Deepen unter anderem „Architectures for AI“ auf. Das ist ein Kandidat für die kuratierte Zuordnung. Die Zuordnung zu einer konkreten Fähigkeit und seine Voraussetzungen müssen fachlich geprüft sein, bevor das Produkt ihn als nächsten notwendigen Schritt ausgibt. Ein Titel oder die gemeinsame Academy-Gruppe allein reicht dafür nicht.

Ein Lernschritt erhält deshalb diese Struktur:

- **Was:** Originaltitel des Kurses und Anbieter.
- **Wozu:** Belegte Fähigkeit und Lernziel, auf die der Kurs einzahlt.
- **Warum jetzt:** Noch offener Bedarf und erfüllte Voraussetzungen.
- **Was danach:** Übung, gegebenenfalls zugehörige Hands-on-Session und folgende Etappe.
- **Status:** Bereit, begonnen, abgeschlossen, Voraussetzung offen oder Angebot noch nicht verfügbar.

Ein einzelner Kursabschluss setzt Engineering nicht automatisch auf Deepen oder Create. Ein Self-Assessment auf Create bedeutet zunächst „laut Self-Assessment auf Ziel-Level“, nicht „nachgewiesen“.

## Die vier zentralen Oberflächen

| Oberfläche | Leitfrage | Wichtigster Inhalt / Hauptaktion |
| --- | --- | --- |
| Startseite / Mein Lernpfad | Was mache ich heute? | Rollenprofil und Zielbild als Kontext; nächster Lernschritt mit Begründung; „Fortsetzen“ oder „Kurs starten“ |
| Persönlicher Lernpfad | Wie komme ich zum Ziel? | Geordnete Etappen, Voraussetzungen, aktueller Schwerpunkt, offene und abgeschlossene Schritte |
| Kurs und Kursende | Was bringt mir dieser Schritt? | Bezug zur Fähigkeit, konkrete Lernaktivität, Ergebnis, anschließender Schritt |
| Ist-Stand und Zielbild | Wie weit bin ich? | Pro Dimension Herkunft des Ist-Stands, Ziel-Level, offene Fähigkeiten und verfügbare Nachweise |

Startseite und persönlicher Plan verwenden dieselbe gespeicherte Reihenfolge und dieselbe nächste Empfehlung. Eine Umpriorisierung nach neuen Ergebnissen ist sichtbar und erklärbar. Wiederkehrende Mitarbeitende müssen ihren Weg nicht erneut konfigurieren.

Auf schmalen Bildschirmen steht der Lernpfad vertikal. Die Reihenfolge bleibt auch ohne Verbindungslinien verständlich. Status wird durch Text vermittelt; Farbe ergänzt. Filter und optionale Spezialisierungen stehen hinter der nächsten Lernaktion.

## Wie Empfehlungen entstehen sollen

1. Rollenprofil, Zielbild, persönliche Etappe und Herkunft des Ist-Stands bestimmen den Bedarf.
2. Explizite Zuordnungen verbinden Kurse mit Fähigkeiten und Levels. Nicht zugeordnete Angebote bleiben durchsuchbar, zählen aber nicht als belegte Abdeckung einer Lücke.
3. Voraussetzungen bestimmen die mögliche Reihenfolge. Die Referenz nennt Online-Kurse als Voraussetzung für Academy-Kurse; die konkrete Beziehung muss je Angebot vorliegen.
4. Ein passender begonnener Kurs wird zum Fortsetzen angeboten. Für neue Schritte werden zunächst erforderliche Grundlagen, dann das nächste offene Etappenziel berücksichtigt.
5. Interessen und persönlicher Schwerpunkt priorisieren geeignete Angebote. „Empfohlen“, „Voraussetzung“ und „optional“ haben unterschiedliche Bedeutungen; Pflicht wird nur bei einer dokumentierten Vorgabe angezeigt.
6. Gleiche Kurse in mehreren Academy-Zuordnungen werden im persönlichen Lernpfad nicht mehrfach verlangt. Alternativen müssen als Alternativen kuratiert sein; eine gemeinsame Gruppierung macht sie nicht automatisch austauschbar.
7. Das System nennt den Auswahlgrund. Zeitangaben stammen aus verlässlichen Metadaten; Lernbudget und Anzahl von Fokus-Sessions ergeben keinen erfundenen Abschlusstermin.

## Zusammenarbeit mit dem AI-Literacy-Team

Bestätigter Produktzuschnitt: Das Trainingcamp ist das Lerncockpit. Online-Kurse bleiben innerhalb der vorhandenen Kurse eingebunden. Externe Hands-on- und Train-the-Trainer-Angebote werden nicht als zusätzliche Online-Kursliste geführt. Nach absolvierter Vorbereitung weist das Cockpit auf den passenden externen Academy-Transfer hin. Ohne gepflegte Termine und Anbieterlinks wird die Abstimmung mit der LHIND Academy genannt.

| Bereich | Vorgeschlagene Verantwortung |
| --- | --- |
| Rollenprofile, Zielbilder, Fähigkeiten, Assessment-Methodik | AI-Literacy-Team als fachliche Quelle |
| Kurszuordnungen und Anerkennungsregeln | Fachlich freigegebene Vorgaben; nicht durch Rankings erfinden |
| Persönlicher Lernpfad, Erklärung, lokale Aktivitäten und Wiederaufnahme | Trainingcamp |
| Trainerpool, Beschaffung, Academy-Buchung, organisatorische Wirksamkeitsmessung | AI Literacy Steering / Arbeitskreis beziehungsweise zuständige Systeme laut Referenz |
| Externe Angebote | Mit Anbieter und Übergabe kennzeichnen; Abschluss nur mit bekannter Herkunft übernehmen |

Der nächste Lernschritt öffnet einen Trainingcamp-Kurs; dessen eingebundene Online-Angebote bleiben dort. Eine externe Academy-Übergabe wird separat und erst nach der Vorbereitung empfohlen. Eine Weiterleitung bestätigt keine Buchung und keinen Abschluss. Verfügbarkeit, Termine und Zugangsbedingungen müssen aus einer gepflegten Quelle stammen.

## Zustände, die zum roten Faden gehören

- **Noch kein Ist-Stand:** Orientierung anbieten; keine fehlenden Angaben als Kompetenzlücke behandeln.
- **Nur teilweise bewertet:** Erreichte Ziele nur für die bewerteten Dimensionen benennen. Offene Dimensionen bleiben sichtbar.
- **Kein passendes Angebot:** Die Abdeckungslücke erklären und einen geeigneten Kontakt oder Katalogzugang anbieten, ohne einen fachlich unpassenden Ersatz als Lösung darzustellen.
- **Voraussetzung offen:** Den vorbereitenden Schritt zuerst anbieten.
- **Externer Schritt:** Anbieterwechsel und Rückkehr in den Lernpfad erklären; unbekannten Fortschritt so benennen.
- **Rollenwechsel:** Zielbild neu berechnen und frühere Lernleistungen erhalten; Veränderungen am Plan erklären.
- **Etappenziel erreicht:** Nächste Etappe anbieten; Selbsteinschätzung, absolvierter Kurs und nachgewiesene Fähigkeit getrennt halten.

## Abnahmekriterien

- Eine neue Person findet vom Rollenprofil zu einer begründeten nächsten Aktivität, ohne zunächst den gesamten Katalog verstehen zu müssen.
- Eine wiederkehrende Person kann mit einer Hauptaktion weiterlernen.
- Das Beispiel Technology Consulting zeigt fünf unterschiedliche Zielwerte, keinen pauschalen Create-Regler.
- Startseite, persönlicher Plan und Kursende nennen bei gleichem Stand denselben nächsten Schritt.
- Unbekannte, nicht relevante und erreichte Dimensionen werden unterschieden.
- Ein Kursabschluss erhöht keine Kompetenzstufe ohne geeignete Evidenz.
- Jede Empfehlung lässt sich auf Rollenprofil, Fähigkeit, Ziel-Level und gegebenenfalls Voraussetzung zurückführen.
- Externe Schritte und organisatorische Übergaben erscheinen nur mit tatsächlich gepflegten Angaben.

## Begleitende Bestandsaufnahme

Luna dokumentiert den Quellen- und Begriffsabgleich in [Terminologie-Abgleich](terminologie-abgleich.md). Terra dokumentiert die vorhandenen Funktionen und die konkreten Anschlussarbeiten in [Umsetzungsabgleich](lernreise-umsetzungsabgleich.md). Die ergänzenden Bestandsaufnahmen dokumentieren den Ausgangspunkt vor der Umsetzung.


## Implementierte Quellen- und Fortschrittsregeln

- Ohne passendes importiertes Assessment stammen die Dimensionsziele aus der HTML-Matrix. Ein passender Import verwendet seine ausdrücklichen Zielwerte mit Herkunft und sichtbarem Referenzvergleich; die neuere Assessment-Zuordnung im vorhandenen Importer bleibt unverändert.
- Konkrete Kursbeiträge stammen aus der bestehenden kuratierten Fähigkeits-/Kursmatrix. Die Lernreihenfolge führt zunächst durch offene frühere Etappen. Sie behauptet keine externe Zulassungsvoraussetzung.
- Die fünf Dimensionsziele bleiben sichtbar. Ein Schwerpunkt priorisiert die passenden Schritte. Ein persönlicher Plan kann angepasst und gespeichert werden; entfernte Schritte werden bei Aktualisierungen nicht unbemerkt wieder eingefügt.
- Kursfortschritt ist ein eigener Wert. Ein beobachtetes Kompetenzlevel benötigt pro zugeordneter Etappe Quiz-Evidenz und einen bestandenen praktischen Self-Check. Eine Selbsteinschätzung bleibt ausdrücklich eine Selbsteinschätzung.
- Konkrete Train-the-Trainer-Termine sind im aktuellen Katalog nicht gepflegt. Nach abgeschlossener Academy-Pfad-Vorbereitung erscheint ein Hinweis auf Praxistransfer und eine optionale Abstimmung zur Trainerqualifizierung. Es werden keine Termine oder Buchungen erfunden.

Technischer Einstieg: `site/lrn/learning-journey.js` berechnet das gemeinsame Modell; `journey-state.js` verbindet die vorhandenen lokalen Daten; `journey-ui.js` zeigt es auf Startseite, Plan, Kurs, Assessment und Fähigkeitenansicht. Der Abschluss der letzten Kursaktivität führt über dieselbe Empfehlung weiter.
