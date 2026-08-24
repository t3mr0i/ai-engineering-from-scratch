# Generative Modelle: Taxonomie und Entwicklung

> Generative KI ist keine einzelne Architektur, sondern eine Familie verschiedener Wege, eine Datenverteilung zu modellieren und daraus neue Beispiele zu erzeugen.

**Typ:** Lernen
**Sprachen:** Python
**Voraussetzungen:** Was ist maschinelles Lernen?, Wahrscheinlichkeitsverteilungen
**Zeit:** ~55 Minuten

## Lernziele

- Diskriminative und generative Modellierung anhand ihrer Zielsetzung unterscheiden.
- Autoregressive Modelle, Variational Autoencoder, GANs, Diffusionsmodelle und Flow-Modelle einordnen.
- Sampling, latente Räume und Konditionierung als gemeinsame Bausteine erklären.
- Architekturentscheidungen mit Qualität, Steuerbarkeit, Geschwindigkeit und Auswertbarkeit verbinden.

## Zwei unterschiedliche Fragen

Ein diskriminatives Modell lernt typischerweise eine Grenze oder eine bedingte Zuordnung: Welche Klasse gehört zu dieser Eingabe? Ein generatives Modell versucht dagegen, die Struktur der Daten selbst oder die Verteilung möglicher Ausgaben unter einer Bedingung zu erfassen. Es kann deshalb neue Texte, Bilder, Audiosignale oder andere Daten erzeugen.

„Neu“ bedeutet dabei nicht automatisch originell, korrekt oder rechtlich unbedenklich. Ein Sample ist eine Ausgabe aus der gelernten Verteilung. Seine Qualität hängt von Trainingsdaten, Ziel, Modellkapazität, Sampling-Verfahren und Konditionierung ab.

## Die wichtigsten Familien

**Autoregressive Modelle** zerlegen die Wahrscheinlichkeit einer Sequenz in aufeinanderfolgende Vorhersagen. Sprachmodelle sagen das nächste Token unter Berücksichtigung des bisherigen Kontexts voraus. Die Formulierung ist einfach und die Likelihood direkt trainierbar; die Erzeugung bleibt jedoch schrittweise.

**Variational Autoencoder (VAE)** lernen einen kontinuierlichen latenten Raum. Ein Encoder bildet Daten auf eine Verteilung im latenten Raum ab, ein Decoder rekonstruiert daraus Beispiele. Der Regularisierungsterm macht den Raum glatt und samplbar, kann aber zu weicheren Ausgaben führen. Die Grundidee wurde im VAE-Papier formalisiert: [Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114).

**Generative Adversarial Networks (GANs)** trainieren Generator und Diskriminator gegeneinander. Der Generator versucht realistische Beispiele zu erzeugen; der Diskriminator versucht echte und erzeugte Daten zu unterscheiden. GANs können scharfe Ergebnisse liefern, sind aber empfindlich gegenüber instabilem Training und fehlender Vielfalt. Ausgangspunkt ist [Generative Adversarial Nets](https://arxiv.org/abs/1406.2661).

**Diffusionsmodelle** zerstören Daten schrittweise mit Rauschen und lernen den umgekehrten Prozess. Sampling beginnt bei Rauschen und entfernt es iterativ. Die Methode ist gut steuerbar, erfordert aber mehrere Auswertungsschritte; siehe [Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) und [Score-Based Generative Modeling](https://arxiv.org/abs/2011.13456).

**Normalizing Flows** verwenden invertierbare Transformationen. Sie erlauben exakte Dichteauswertung und direktes Sampling, schränken die Architektur aber durch die geforderte Invertierbarkeit ein.

## Gemeinsame Bausteine

Ein **latenter Raum** ist eine kompakte interne Darstellung relevanter Variation. **Konditionierung** lenkt die Erzeugung mit Text, Klassen, Bildern oder anderen Signalen. **Sampling** entscheidet, welche der möglichen Ausgaben tatsächlich gezogen wird. Mehr Zufall erhöht Vielfalt, kann aber Konsistenz senken; restriktiveres Sampling stabilisiert Ausgaben, kann sie jedoch monoton machen.

Die Architektur allein beantwortet keine Produktfrage. Für die Auswahl zählen mindestens Modalität, benötigte Latenz, Steuerbarkeit, messbare Qualität, Sicherheitsanforderungen und verfügbare Daten. Ein schneller autoregressiver Decoder kann für Text passend sein, während ein latentes Diffusionsmodell für Bildgenerierung andere Vorteile bietet.

## Build It / Use It

Die Demo stellt eine kleine generative Verteilung und den Sampling-Schritt explizit dar. Führe `python3 code/main.py` aus, beobachte die erzeugten Beispiele und variiere genau einen Sampling-Parameter. Trenne dabei die gelernte Verteilung von der Regel, mit der du aus ihr auswählst.

## Übungen

1. Ordne drei Produkte einer Modellfamilie zu und begründe die Zuordnung über Trainingsziel und Sampling-Ablauf statt über Markennamen.
2. Wähle für eine neue Anwendung zwei plausible Modellfamilien. Vergleiche Qualität, Latenz, Steuerbarkeit und Evaluierbarkeit.
3. Beschreibe einen Fehlerfall, in dem bessere Sample-Ästhetik die fachliche Qualität verschleiert. Definiere eine passende Gegenprüfung.

## Referenzlösung

Eine gute Lösung benennt nicht nur eine Architektur, sondern verbindet sie mit der Wahrscheinlichkeitszerlegung, dem Trainingssignal und dem Sampling-Prozess. Sie trennt Modellgüte von Auswahlstrategie und formuliert mindestens ein beobachtbares Abnahmekriterium. Die Entscheidung bleibt revidierbar, falls Latenz, Datenlage oder Sicherheitsanforderungen die ursprünglichen Annahmen verändern.

## Weiterführende Quellen

- [Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598)
- [Latent Diffusion Models](https://arxiv.org/abs/2112.10752)
- [Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)
