# Warum Transformer?

> Transformer ersetzten Rekurrenz nicht durch „mehr Intelligenz“, sondern durch einen besser parallelisierbaren Weg, Abhängigkeiten in Sequenzen zu berechnen.

**Typ:** Lernen
**Sprachen:** Julia, Python
**Voraussetzungen:** Sequenzmodelle, Matrixoperationen
**Zeit:** ~45 Minuten

## Lernziele

- Den seriellen Berechnungspfad eines RNN dem parallelen Pfad von Self-Attention gegenüberstellen.
- Erklären, warum lange Abhängigkeiten für Rekurrenz einen langen Informationsweg erzeugen.
- Die quadratischen Speicher- und Rechenkosten voller Attention benennen.
- Transformer als Architekturkompromiss statt als universell beste Sequenzmethode bewerten.

## Das Problem der seriellen Rekurrenz

Ein rekurrentes Netz aktualisiert für jedes Token einen verborgenen Zustand. Der Zustand an Position `t` hängt vom Zustand an Position `t-1` ab. Selbst wenn viele Recheneinheiten verfügbar sind, bleibt dieser Teil seriell. Informationen zwischen weit entfernten Positionen müssen außerdem viele Aktualisierungsschritte durchlaufen. LSTM-Gates verbessern den Gradientenfluss, beseitigen aber nicht die serielle Abhängigkeit.

Attention wurde zunächst genutzt, damit Decoder gezielt auf relevante Encoderzustände zugreifen können; ein früher Ausgangspunkt ist [Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473). Der Transformer aus [Attention Is All You Need](https://arxiv.org/abs/1706.03762) machte Attention zum zentralen Sequenzbaustein und entfernte die Rekurrenz aus dem Hauptpfad.

## Self-Attention als paralleler Zugriff

Für jedes Token entstehen Query-, Key- und Value-Vektoren. Query-Key-Ähnlichkeiten bestimmen Gewichte; die gewichtete Summe der Values erzeugt eine kontextabhängige Darstellung. Alle Positionen einer Schicht können mit Matrixoperationen gleichzeitig verarbeitet werden. Zwischen zwei Positionen liegt innerhalb einer Attention-Schicht ein kurzer Informationsweg.

Da Attention selbst keine Reihenfolge kennt, braucht das Modell Positionsinformation. Mehrere Köpfe erlauben verschiedene Projektionsräume, garantieren aber nicht automatisch klar interpretierbare „Rollen“.

## Der Preis

Volle Self-Attention bildet eine Matrix über alle Positionspaare. Rechen- und Speicherbedarf wachsen deshalb quadratisch mit der Sequenzlänge. Für lange Kontexte entstehen Alternativen wie lokale, blockweise, linearisierte oder zustandsraumbasierte Verfahren. Mamba ist ein Beispiel für einen modernen Zustandsraumansatz: [Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752).

Die richtige Frage lautet nicht „Transformer oder RNN?“, sondern: Welche Abhängigkeiten, Latenz, Streaming-Eigenschaften und Kontextlängen verlangt der Einsatz? Rekurrente oder zustandsraumbasierte Verfahren können bei strikt schrittweiser Verarbeitung sinnvoll sein; Transformer dominieren, wenn paralleles Training und flexible Kontextinteraktion wichtiger sind.

## Build It / Use It

Führe `python3 code/main.py` oder `julia code/main.jl` aus. Die Demo vergleicht serielle und parallele Reduktion und prüft, ob beide denselben Prefix-Scan liefern. Vergrößere die Sequenzlänge und unterscheide theoretische Berechnungstiefe von tatsächlich gemessener Laufzeit.

## Übungen

1. Zeichne den längsten Informationspfad zwischen erstem und letztem Token für RNN und Self-Attention.
2. Erkläre, warum parallele Ausführung nicht bedeutet, dass Attention für beliebig lange Sequenzen kostenlos ist.
3. Wähle für einen Streaming-Sensor und für ein Dokumentenmodell jeweils eine Architekturstrategie und begründe sie mit Latenz, Speicher und Abhängigkeiten.

## Referenzlösung

Eine gute Antwort trennt Parallelisierbarkeit, Informationspfad und asymptotische Kosten. Sie erklärt, dass Self-Attention Positionen innerhalb einer Schicht direkt koppeln kann, während die vollständige Paarmatrix quadratisch wächst. Die Architekturwahl berücksichtigt deshalb Sequenzlänge, Streaming-Bedarf und Hardware statt den Transformer pauschal als Sieger zu behandeln.

## Weiterführende Quellen

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf)
- [Mamba](https://arxiv.org/abs/2312.00752)
