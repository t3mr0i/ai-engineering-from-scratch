# Offene Modelle: Architektur-Rundgang

> Modellnamen ändern sich schnell; Tensorformen, Attention-Varianten, Positionskodierung und Routing bleiben die verlässlichere Sprache für Architekturvergleiche.

**Typ:** Referenz
**Sprachen:** Python
**Voraussetzungen:** GPT-Modell zusammensetzen, Multi-Head Self-Attention
**Zeit:** ~95 Minuten

## Lernziele

- Eine Modellkonfiguration in Embedding, Blöcke, Attention, Feed-Forward-Netz und Ausgabekopf zerlegen.
- Multi-Query und Grouped-Query Attention über die Anzahl von Query- und Key/Value-Köpfen vergleichen.
- RoPE, RMSNorm, SwiGLU und Mixture-of-Experts als konkrete Rechenbausteine erklären.
- Parameterzahl, aktiven Rechenaufwand, KV-Cache und Speicherbedarf grob abschätzen.
- Checkpoints anhand von Konfiguration und Tensorformen statt Marketingnamen prüfen.

## Ein stabiler Leserahmen

Beginne bei einer Architektur nie mit dem Produktnamen. Lies zuerst die Konfiguration und beantworte:

1. Wie groß sind Vokabular und Modellbreite?
2. Wie viele Blöcke und Attention-Köpfe gibt es?
3. Wie viele Key/Value-Köpfe werden gespeichert?
4. Welche Positionsdarstellung und Normierung werden verwendet?
5. Wie breit ist das Feed-Forward-Netz?
6. Ist jeder Parameter pro Token aktiv oder gibt es Expert-Routing?
7. Sind Eingabe-Embedding und Ausgabekopf geteilt?

Diese Angaben lassen sich gegen die Tensorformen eines Checkpoints prüfen. Ein Gewicht mit Form `vocab_size × hidden_size` gehört typischerweise zum Token-Embedding; Query-, Key- und Value-Projektionen spiegeln Kopfzahl und Kopfdimension wider.

## Decoder-Grundgerüst

Die meisten offenen Sprachmodelle verwenden einen autoregressiven Decoder. Token-IDs werden eingebettet, durch wiederholte Transformerblöcke verarbeitet, normalisiert und auf Logits über das Vokabular projiziert. Moderne Varianten unterscheiden sich häufig weniger im Grundgerüst als in den Details einzelner Blöcke.

**RMSNorm** skaliert Aktivierungen anhand ihres quadratischen Mittels und verzichtet auf die Mittelwertzentrierung von LayerNorm. **SwiGLU** verwendet ein gegatetes Feed-Forward-Netz und verändert dadurch Projektionen und Parameterzählung. **RoPE** kodiert relative Positionsbeziehungen durch rotationsartige Transformationen von Query und Key; Ausgangspunkt ist [RoFormer](https://arxiv.org/abs/2104.09864).

## MHA, MQA und GQA

Bei klassischer Multi-Head Attention besitzt jeder Query-Kopf eigene Key- und Value-Köpfe. Während autoregressiver Inferenz werden frühere Keys und Values im KV-Cache gespeichert. Dieser Cache wächst mit Sequenzlänge, Schichtzahl, Key/Value-Kopfzahl und Kopfdimension.

**Multi-Query Attention (MQA)** teilt einen Key- und Value-Kopf über viele Query-Köpfe. **Grouped-Query Attention (GQA)** verwendet mehrere Key/Value-Gruppen und liegt zwischen MHA und MQA. GQA reduziert Cache und Speicherbandbreite, ohne alle Query-Köpfe auf ein einziges Key/Value-Paar zu zwingen; siehe [GQA: Training Generalized Multi-Query Transformer Models](https://arxiv.org/abs/2305.13245).

Für eine grobe Cache-Abschätzung pro Sequenz gilt:

`2 × Schichten × Tokens × KV-Köpfe × Kopfdimension × Bytes_pro_Wert`

Der Faktor zwei steht für Keys und Values. Batchgröße und parallele Sequenzen multiplizieren den Bedarf zusätzlich.

## Dense und Mixture-of-Experts

In einem dichten Modell wird für jedes Token dasselbe Feed-Forward-Netz ausgewertet. Ein **Mixture-of-Experts (MoE)** besitzt mehrere Experten und einen Router, der pro Token nur eine Teilmenge aktiviert. Gesamtparameter und aktive Parameter sind deshalb verschiedene Größen. Ein großer Checkpoint kann pro Token deutlich weniger Rechenarbeit verwenden, benötigt aber weiterhin Speicher, Kommunikation und eine stabile Routing- sowie Lastverteilung.

Mixtral beschreibt ein offenes Sparse-MoE-Modell in [Mixtral of Experts](https://arxiv.org/abs/2401.04088). DeepSeek-V2 kombiniert unter anderem MoE und eine komprimierte Attention-Variante; die Architektur wird in [DeepSeek-V2](https://arxiv.org/abs/2405.04434) dokumentiert. Solche Vergleiche sollten immer auf das jeweilige technische Papier oder die offizielle Konfiguration zurückgehen.

## Parameter grob zählen

Die wichtigsten Beiträge sind:

- Token-Embedding: `Vokabular × Modellbreite`.
- Attention-Projektionen: Query plus Key, Value und Output; bei GQA sind Key und Value schmaler.
- Feed-Forward-Netz: mehrere Projektionen zwischen Modell- und Zwischenbreite; SwiGLU besitzt typischerweise drei statt zwei lineare Matrizen.
- Normparameter und Bias: im Vergleich kleiner, aber für exakte Checkpoint-Kompatibilität relevant.
- MoE: Expertenparameter als Gesamtmenge plus Router; für FLOP-Schätzungen nur aktive Experten berücksichtigen.

Eine Plausibilitätsrechnung muss nicht exakt sein, um Fehler zu finden. Wenn die berechnete Größenordnung nicht zum veröffentlichten Checkpoint passt, prüfe Gewichtsteilung, Expertenzahl, Vokabular, Key/Value-Köpfe und ausgelassene Projektionen.

## Checkpoint-Walkthrough

1. Lade nur Konfiguration und Tensor-Metadaten, bevor große Gewichte in den Speicher gelangen.
2. Vergleiche Namen und Formen mit der erwarteten Blockstruktur.
3. Prüfe Transpositionen und Sharding-Schema.
4. Verifiziere RoPE-Parameter, Norm-Epsilon, Aktivierungsfunktion und Gewichtsteilung.
5. Lade einen kleinen Ausschnitt oder eine einzelne Schicht und führe einen Formtest aus.
6. Erst danach folgt eine vollständige Inferenz mit einem bekannten Tokenizer.

Ein erfolgreiches Laden ohne Fehlermeldung beweist noch keine semantische Kompatibilität. Ein falscher Tokenizer, abweichende RoPE-Skalierung oder vertauschte Projektionen kann numerisch gültige, aber unbrauchbare Ausgaben erzeugen.

## Build It / Use It

Starte `python3 code/main.py`. Wähle zwei Konfigurationen und protokolliere Modellbreite, Schichten, Query-Köpfe, KV-Köpfe, Zwischenbreite und Expert-Routing. Berechne anschließend Parameter- und KV-Cache-Größenordnung. Verändere genau einen Wert, etwa die KV-Kopfzahl, und erkläre, welche Tensorformen und welcher Laufzeitspeicher sich ändern.

## Übungen

1. Leite für eine gegebene GQA-Konfiguration die Formen von Query-, Key-, Value- und Output-Projektion her.
2. Vergleiche zwei Modelle mit ähnlicher Gesamtparameterzahl, aber unterschiedlicher Zahl aktiver Experten. Trenne Speicher- und Rechenargumente.
3. Entwirf eine Checkpoint-Prüfung, die einen falschen Tokenizer und eine falsche RoPE-Konfiguration vor der vollständigen Inferenz erkennt.

## Referenzlösung

Eine belastbare Analyse beginnt mit der Konfiguration, leitet daraus Tensorformen ab und gleicht diese mit den Checkpoint-Metadaten ab. Sie zählt Gesamt- und aktive Parameter getrennt, berechnet den KV-Cache mit der tatsächlichen Zahl der Key/Value-Köpfe und prüft Tokenizer sowie Positionsparameter explizit. Produktnamen oder eine einzelne Benchmark ersetzen keinen dieser Konsistenztests.

## Weiterführende Quellen

- [RoFormer](https://arxiv.org/abs/2104.09864)
- [GQA](https://arxiv.org/abs/2305.13245)
- [Mixtral of Experts](https://arxiv.org/abs/2401.04088)
- [DeepSeek-V2](https://arxiv.org/abs/2405.04434)
- [Qwen2 Technical Report](https://arxiv.org/abs/2407.10671)
