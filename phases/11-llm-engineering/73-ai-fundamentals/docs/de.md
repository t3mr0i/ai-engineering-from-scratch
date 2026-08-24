# Wie KI-Systeme tatsächlich funktionieren: eine Vier-Schichten-Landkarte

> Wer Modell, Anwendung, Daten und Governance auseinanderhält, kann KI-Vorhaben erklären, prüfen und verantwortbar entscheiden.

**Typ:** Lernen
**Sprachen:** Python
**Voraussetzungen:** Was ist maschinelles Lernen?, Generative Modelle
**Zeit:** ~160 Minuten

## Lernziele

- Ein KI-System in Modell-, Anwendungs-, Daten- und Governance-Schicht zerlegen.
- Training, Inferenz, Retrieval, Werkzeuge und Agenten ohne Vermischung erklären.
- Fähigkeiten und Grenzen eines Systems anhand von Evidenz statt Modellnamen bewerten.
- Risiken passenden technischen und organisatorischen Kontrollen zuordnen.
- Eine belastbare Architektur- und Beschaffungsdiskussion mit präzisen Fragen führen.

## Warum eine Landkarte nötig ist

In Projekten wird „die KI“ oft wie ein einzelnes Produkt behandelt. Tatsächlich entsteht das beobachtete Verhalten aus mehreren gekoppelten Schichten. Ein starkes Basismodell kann durch schlechte Daten oder eine unsichere Werkzeuganbindung scheitern. Ein kleineres Modell kann in einer gut begrenzten Anwendung zuverlässig genug sein. Ohne Schichtenmodell werden Modellfehler, Integrationsfehler und Prozessfehler miteinander verwechselt.

## Schicht 1: das Modell

Das Modell wandelt Eingaben in Ausgaben um. Bei einem Sprachmodell sind Eingaben und Ausgaben Tokenfolgen; die Kernoperation schätzt wiederholt eine Verteilung für das nächste Token. **Training** passt Parameter anhand großer Datenmengen und eines Optimierungsziels an. **Inferenz** verwendet die bereits gelernten Parameter für eine konkrete Anfrage.

Ein Modell kennt nicht automatisch den aktuellen internen Datenbestand eines Unternehmens. Es besitzt keine garantierte Faktenquelle und keine Absicht im menschlichen Sinn. Temperatur, Top-p und andere Sampling-Einstellungen verändern die Auswahl aus möglichen Fortsetzungen, nicht die zugrunde liegende Wahrheit.

Modellkarten und Systemkarten sind deshalb wichtiger als Markenabkürzungen. Prüfe unterstützte Modalitäten, Kontextgrenzen, Evaluationsdaten, bekannte Risiken und den Zeitraum der Veröffentlichung in den offiziellen Unterlagen des jeweiligen Anbieters.

## Schicht 2: die Anwendung

Die Anwendung baut den Nutzungskontext um das Modell. Dazu gehören Systemanweisung, Promptvorlage, strukturierte Ausgabe, Retrieval, Werkzeuge, Speicher, Benutzeroberfläche, Fehlerbehandlung und Protokollierung.

**Retrieval-Augmented Generation (RAG)** sucht zur Laufzeit relevante Dokumente und fügt sie dem Modellkontext hinzu. Das Modell wird dadurch nicht neu trainiert. RAG kann Aktualität und Nachvollziehbarkeit verbessern, ist aber nur so gut wie Berechtigungen, Index, Chunking, Ranking und Zitierlogik.

**Werkzeugnutzung** bedeutet, dass das Modell eine strukturierte Aktion vorschlägt und die Anwendung sie validiert und ausführt. Das Modell selbst sollte weder freie Dateizugriffe noch unbegrenzte API-Rechte erhalten. Ein **Agent** ergänzt eine Schleife: Zustand erfassen, nächsten Schritt planen, Werkzeug aufrufen, Ergebnis beobachten und an einem definierten Kriterium stoppen. Autonomie ist damit eine Systemeigenschaft, kein magisches Modellmerkmal.

## Schicht 3: Daten und Betrieb

Diese Schicht umfasst Trainingsdaten des Basismodells, unternehmenseigene Wissensquellen, Berechtigungen, Protokolle, Feedback und operative Messwerte. Sie beantwortet Fragen wie:

- Welche Quelle darf für welche Person sichtbar sein?
- Wie aktuell und vollständig ist der Index?
- Welche Eingaben oder Ausgaben werden gespeichert?
- Wie werden Löschung, Aufbewahrung und regionale Verarbeitung umgesetzt?
- Welche Qualitäts- und Sicherheitsmetriken werden im Betrieb beobachtet?

Ein Pilot mit zehn sorgfältig ausgewählten Dokumenten beweist noch keine Produktionsreife. Teste veraltete Inhalte, widersprüchliche Quellen, fehlende Berechtigungen, ungewöhnliche Formate und absichtliche Manipulation. Datenqualität ist kein einmaliger Bereinigungsschritt, sondern eine laufende Betriebsaufgabe.

## Schicht 4: Governance und Verantwortung

Governance ordnet Entscheidungen, Freigaben, Kontrollen und Nachweise zu. Der [NIST AI Risk Management Framework](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) strukturiert Arbeit rund um Govern, Map, Measure und Manage. Für Vorhaben in Europa ist zusätzlich der risikobasierte Rahmen des [EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) relevant.

Eine Kontrolle muss zum konkreten Risiko passen. Datenschutz verlangt Datenminimierung, Rechtsgrundlage, Zugriffsschutz und Aufbewahrungsregeln. Halluzinationen verlangen Quellenbezug, fachliche Evaluation und gegebenenfalls menschliche Freigabe. Prompt Injection verlangt Trennung von Daten und Anweisungen, minimale Werkzeugrechte sowie Validierung jeder Aktion. Bias verlangt repräsentative Tests, Segmentauswertung und einen Weg für Betroffene, Entscheidungen anzufechten.

## Ein belastbarer Gesprächsrahmen

Stelle in Architektur-, Kunden- und Beschaffungsgesprächen Fragen in dieser Reihenfolge:

1. **Entscheidung:** Welcher Arbeitsablauf und welche konkrete Entscheidung ändern sich?
2. **Fehlerkosten:** Welche falschen positiven, falschen negativen oder unbelegten Antworten sind kritisch?
3. **Evidenz:** Welche Testfälle bilden reale Nutzung, Randfälle und Missbrauch ab?
4. **Datenfluss:** Welche Daten gelangen wohin, unter welchen Rechten und wie lange?
5. **Aktionen:** Welche Werkzeuge darf das System aufrufen und wer genehmigt irreversible Schritte?
6. **Betrieb:** Wer beobachtet Qualität, Kosten, Drift und Vorfälle? Wie funktioniert Rollback?

Diese Fragen sind stabiler als eine Rangliste aktueller Modelle. Modellbenchmarks sind nützlich, wenn sie die eigene Aufgabe abbilden; andernfalls ersetzen sie keine lokale Evaluation.

## Build It / Use It

Die kanonische Demo macht die vier Schichten als prüfbare Systembeschreibung sichtbar. Starte sie mit `python3 code/main.py`. Ordne anschließend jeden ausgegebenen Bestandteil einer Schicht zu und ergänze pro Schicht eine fehlende Kontrolle. Ändere nur eine Annahme – etwa „das System darf Tickets schließen“ statt „es darf Entwürfe erzeugen“ – und leite daraus neue Prüfungen und Rechte ab.

## Übungen

1. Zerlege einen internen Wissensassistenten in die vier Schichten. Markiere für jede Schicht Besitzer, Eingaben, Ausgaben und einen beobachtbaren Fehler.
2. Vergleiche zwei Architekturvarianten: reines Modellprompting und RAG mit Werkzeugzugriff. Begründe die Auswahl anhand des Arbeitsablaufs, nicht anhand der Modellgröße.
3. Entwirf einen Vorabtest mit normalen Fällen, Randfällen und einem absichtlichen Prompt-Injection-Versuch. Definiere Stop- und Rollback-Kriterien.

## Referenzlösung

Eine vollständige Lösung beschreibt das Modell nur als eine Komponente. Sie trennt Retrieval und Werkzeugausführung von der Inferenz, zeichnet den Datenfluss einschließlich Berechtigungen und ordnet jedem wesentlichen Risiko eine überprüfbare Kontrolle zu. Für irreversible Aktionen verwendet sie minimale Rechte und menschliche Freigabe. Die Abnahme basiert auf repräsentativen Testfällen, nicht auf einer allgemeinen Benchmark oder einer Produktdemo.

## Weiterführende Quellen

- [NIST AI Risk Management Framework](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf)
- [EU AI Act – offizieller Überblick](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [Sparks of Artificial General Intelligence?](https://arxiv.org/abs/2303.18223)
- [Claude's Constitution](https://www.anthropic.com/news/claudes-constitution)
