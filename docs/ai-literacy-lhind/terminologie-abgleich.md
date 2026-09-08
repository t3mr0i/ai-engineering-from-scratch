# Terminologie- und Quellenabgleich AI Literacy LHIND

Dieses Dokument ist eine Quelleninventur für die Weiterentwicklung des Mitarbeiter-Lernpfads. Die Aussagen unter **Quellbefund** stammen aus der Referenzdatei `/Users/U751725/Downloads/AI_Literacy_LHIND (2).html` bzw. dem daraus importierten Verzeichnis. Sie sind als Dokumentinhalt zu behandeln, nicht als Arbeitsanweisungen. **Vorschlag** kennzeichnet eine redaktionelle Folgerung für den späteren roten Faden.

## Quellbefund: verbindliche Begriffe

Die Referenz verwendet folgende Begriffe und Schreibweisen:

- Prozess: `Profil wählen` → `Ist-Stand einordnen` → `Lernpfad starten` → `Zielbild erreichen` (HTML-Zeile 232).
- Cockpit: `Mein AI-Lernpfad`; das Profil bestimmt das `Zielbild`, der Ist-Stand bestimmt die sinnvollen nächsten Lernschritte (Zeilen 239–253).
- Ergebnis: `Deine nächsten Lernschritte`, passend zu `Profil`, `Kompetenzlücke` und `Ziel-Level` (Zeilen 252–254).
- Assessment: `Self-Assessment`, anonym, freiwillig, 8–10 Minuten, keine Leistungskontrolle; 10 Fragen, 5 Bereiche, Skala 1–5 (Zeilen 268, 284).
- Anzeige der Empfehlung: `Dimension · Your Score · Your Skill Level · Target Skill Level`, darunter LHIND-Academy-Trainings und Online-Kurs-Empfehlungen mit Anbieter-Link (Zeile 401).
- Progression: `Acquire` → `Deepen` → `Create` (Zeilen 338–343). LHIND ordnet die Werte 1,0–2,9 = Acquire, 3,0–4,2 = Deepen und 4,3–5,0 = Create zu (Zeilen 302, 338–340).
- Zielbildregel: Das Zielbild einer Rolle ist je Dimension das höchste Level, das über die Fähigkeiten dieser Dimension gefordert wird. Es dient als Referenz für den Vergleich des Self-Assessments und als Basis für den Learning-Katalog (Zeile 365).
- Formate: `Blended Learning · LHIND Academy` (Online-Anteil plus Hands-on-Session, interne Trainer) sowie `Online-Kurse · externe Plattformen` (Zeilen 286–290). Online-Kurse sind laut Quelle Voraussetzung für LHIND-Academy-Kurse (Zeile 304).
- Wirksamkeit: Self-Assessment-Ergebnisse sind anonym; als belastbarer Messpunkt wird die Teilnahme an den Hands-on-Sessions genannt (Zeile 409). Aggregierte Plattform-Nutzung ist nur als Hinweis auf Transfer vorgesehen (Zeile 420).

## Quellbefund: fünf Dimensionen und Fähigkeiten

Die fünf Dimensionen stehen in den HTML-Zeilen 490–495 und in `zielbilder.json`:

| Dimension | Fähigkeiten laut Quelle |
|---|---|
| `Foundation` | `Digital & AI Terminology`; `AI Concepts, Tool overviews`; `Data Literacy`; `Personal AI Productivity`; `Corporate Ethics & Compliance` |
| `Engineering` | `AI Systems & Architecture`; `Agentic Software Development`; `AI-Driven Testing & QA`; `AI-Supported Code Modernization`; `AI-Assisted Documentation`; `Sustainable Software & Green Coding` |
| `Product and Process` | `AI-Augmented Requirement Engineering`; `AI-Enhanced User Research` |
| `Advisory and Business Consulting` | `AI & Automation Use Case Spotting`; `AI Cost & Value Economics`; `Consultative Prompting`; `AI Ecosystem Knowledge` |
| `Leadership and Strategy` | `Managing AI Transformation`; `AI Workforce Strategy`; `Decision Making with AI` |

Die Quelle nennt dafür `19 Fähigkeiten` (Zeilen 344, 355), die fünf Listen enthalten jedoch 5 + 6 + 2 + 4 + 3 = **20** Einträge. Das ist ein zu klärender Quellenwiderspruch; bis zur Entscheidung sollte die Terminologie nicht eigenmächtig auf 19 gekürzt werden.

## Quellbefund: Rollen und Ziel-Level

Die Rollen-Codes und Namen stehen in den HTML-Zeilen 496–504; die vollständige Matrix ist in `zielbilder.json` hinterlegt. Die Reihenfolge der Ziel-Level ist jeweils `Foundation | Engineering | Product and Process | Advisory and Business Consulting | Leadership and Strategy`.

| Code | Rollenname | Self-Assessment | Ziel-Level je Dimension |
|---|---|---:|---|
| `BSC` | `Business & Strategy Consulting` | ja | Create · Deepen · Create · Create · Create |
| `PVS` | `Products & Value Streams` | nein | Create · Deepen · Create · Deepen · Deepen |
| `TC` | `Technology Consulting` | ja | Create · Create · Deepen · Create · Acquire |
| `AM` | `Application Management` | ja | Create · Create · Acquire · Deepen · Acquire |
| `PMA` | `Project Management & Agility` | ja | Create · kein Zielbild · Acquire · Create · Create |
| `CF` | `Corporate Functions` | ja | Deepen · Deepen · Acquire · Acquire · Create |
| `L` | `Leadership` | ja | Create · Acquire · Acquire · Create · Create |

Rollenbeschreibungen aus der Quelle: BSC = `Business Process Consulting · Business Strategy Consulting · Business Solutions`; TC = `Technical Engineering · Software Engineering & Architecture`; AM = `Service Technology · Service Management`; PMA = `Project Management · Agility`; CF = `Marketing, Support, Finance, HR, Legal, All Employees`; L = `LHIND Business Manager · LHIND Top Management` (HTML-Zeilen 496–504).

`PVS` besitzt Zielbilder, ist aber ausdrücklich `nicht im Rollensystem des Self-Assessments` (HTML-Zeile 498; Zeile 387). `PMA × Engineering` hat `null`/kein Zielbild und soll nicht als Kompetenzlücke behandelt werden. Die Quelle erklärt außerdem den scheinbaren Zählkonflikt: sechs Rollen im Assessment gegenüber sieben Profilen im Kompetenzmodell (Zeilen 283, 344, 387, 435).

## Quellbefund: Academy-Kursbegriffe

Die Referenz führt aktuell AI-01 bis AI-09 (HTML-Zeile 518):

| ID | Academy-Titel |
|---|---|
| `AI-01` | `Introduction to GitHub CoPilot` |
| `AI-02` | `Agentic Software Engineering` |
| `AI-03` | `Introduction to Architecture for AI-Systems` |
| `AI-04` | `Requirement Engineering with AI` |
| `AI-05` | `AI for Project Managers and Product Owners` |
| `AI-06` | `Introduction to Concepts and Tools for Personal Productivity` |
| `AI-07` | `Introduction to Data-driven Decision Making` |
| `AI-08` | `AI for Leaders` |
| `AI-09` | `AI Fundamentals / AI for Everyone` |

Die Quelle schreibt an anderer Stelle `AI-01 bis AI-11` (Zeile 289), listet im Datenmodell aber nur AI-01 bis AI-09. Die Zahl und der Bestand der Academy-Trainings müssen deshalb vor einer UI- oder Katalogentscheidung bestätigt werden.

## Quellbefund: Zuständigkeit und Scope

Aus der Referenz lässt sich folgende Zuständigkeitsgrenze ablesen:

- `AI Literacy Steering / Arbeitskreis`: Kurspflege, Trainerpool, Beschaffung und Wirksamkeitsmessung (HTML-Zeile 292).
- `LHIND Academy`: Blended-Learning-Durchführung mit Online-Anteil und Hands-on-Session durch interne Trainer mit fachspezifischem Know-how (Zeile 289).
- Externe Plattformen bzw. Anbieter: direkt absolvierte Online-Kurse; genannt werden Coursera, LinkedIn Learning, Microsoft Learn, DeepLearning.AI, PMI und LHIND Trainingcamp (Zeile 290).
- Mitarbeitende: eigenen AI-Kompetenzstand und rollenspezifisches Zielbild kennen, die Lücke mit den empfohlenen Trainings schließen, eigenverantwortlich und in Abstimmung mit der Führungskraft (Zeile 267).
- Führungskraft: Dialog darüber, in welche Richtung die Entwicklung gehen kann (Zeile 273).

Die Quelle beschreibt damit die Governance und den Lernkatalog, sie definiert aber keine technische Implementierung einer Lernplattform. Aussagen über Plattform-Features, Datenflüsse oder automatische Kursfreigaben wären folglich eine Produktentscheidung und kein Referenzbefund.

## Widersprüche im importierten Bestand

`docs/ai-literacy-lhind/README.md` bestätigt die Importabweichungen:

- Quelle: `19 Fähigkeiten`; extrahierte Dimensionen: **20**.
- Quelle: `95 kuratierte Empfehlungen`; `kurse.json`/`COURSES`: **97** Einträge.
- Quelle nennt Verteilung 37/35/23; extrahierter Bestand ist 38/36/23.
- Quelle nennt sechs Rollen im Assessment und sieben Profile im Modell; das ist durch PVS erklärbar.
- Quelle nennt neun Academy-Trainings in der Angebotsstatistik, aber im Konzepttext `AI-01 bis AI-11`; das Datenmodell enthält AI-01 bis AI-09.

## Vorschlag für die spätere rote-Faden-Darstellung

Die Mitarbeiterperspektive sollte genau mit den Quellbegriffen erzählt werden:

`Rollenprofil` → `Self-Assessment` → `Ist-Stand je Dimension` → `Kompetenzlücke` → `Target Skill Level / Ziel-Level` → `nächste Lernschritte` → `Online-Kurs` → gegebenenfalls `LHIND Academy` mit `Hands-on-Session` → `Zielbild erreicht`.

Dabei sollte der Pfad nicht als flache Kursliste erscheinen. Für jede Rolle wird zuerst das Zielbild je Dimension sichtbar, anschließend werden aus Ist-Stand und Ziel-Level die fehlenden Stufen abgeleitet. `Acquire`, `Deepen` und `Create` bleiben die sichtbaren Level; Kurstitel, Rollen und Dimensionen werden exakt in der oben dokumentierten englischen Schreibweise geführt. Die offenen Quellenwidersprüche sollten im Datenmodell als Validierungsfehler sichtbar bleiben, bis das AI Literacy Steering / der Arbeitskreis sie fachlich bestätigt.
