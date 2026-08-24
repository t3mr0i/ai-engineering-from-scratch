# Was ist maschinelles Lernen?

> Maschinelles Lernen ersetzt nicht das Denken über ein Problem – es verschiebt die Arbeit vom Formulieren fester Regeln zum Formulieren guter Daten, Ziele und Prüfungen.

**Typ:** Lernen
**Sprachen:** Python
**Voraussetzungen:** Keine
**Zeit:** ~100 Minuten

## Lernziele

- Überwachtes, unüberwachtes und bestärkendes Lernen anhand des verfügbaren Feedbacks unterscheiden.
- Ein Geschäftsproblem als Eingaben, Ziel, Datenquelle und messbares Abnahmekriterium formulieren.
- Training, Validierung und Test als getrennte Rollen erklären.
- Generalisierung, Overfitting und Datenleckage an konkreten Beispielen erkennen.
- Entscheiden, wann eine feste Regel die bessere Lösung als ein lernendes System ist.

## Das Grundmodell

Ein klassisches Programm kombiniert von Menschen geschriebene Regeln mit Daten und erzeugt ein Ergebnis. Ein ML-System kombiniert Daten mit beobachteten Ergebnissen und lernt daraus Parameter für eine Vorhersagefunktion. Diese Funktion ist kein Wissensspeicher mit garantierten Wahrheiten. Sie ist ein statistisches Verfahren, das Muster aus der Trainingsverteilung auf neue Fälle überträgt.

Jedes ML-Vorhaben lässt sich zunächst mit vier Fragen schärfen:

1. **Welche Entscheidung soll unterstützt werden?** „Kundenabwanderung vorhersagen“ ist noch keine Entscheidung. „Welche 200 Kunden erhalten diese Woche ein Rückhalteangebot?“ ist eine.
2. **Welche Informationen liegen zum Entscheidungszeitpunkt vor?** Später entstandene Daten dürfen nicht als Eingabe in das Training gelangen.
3. **Welches beobachtbare Ziel dient als Feedback?** Das Ziel muss konsistent erfasst werden und zur gewünschten Entscheidung passen.
4. **Wie wird Erfolg außerhalb der Trainingsdaten gemessen?** Eine hohe Trainingsgüte ist kein Nachweis für Nutzen im Betrieb.

## Drei Lernarten

Beim **überwachten Lernen** enthält jedes Trainingsbeispiel eine Eingabe und ein Ziel. Klassifikation sagt eine Kategorie voraus, Regression einen numerischen Wert. Spam-Erkennung, Ausfallprognosen und Nachfragevorhersagen gehören typischerweise hierher.

Beim **unüberwachten Lernen** fehlt ein vorgegebenes Ziel. Das System sucht Struktur: Gruppen, ungewöhnliche Fälle oder kompakte Darstellungen. Die gefundenen Cluster sind keine automatisch „wahren“ Kundensegmente; Menschen müssen prüfen, ob die Struktur fachlich sinnvoll und handlungsrelevant ist.

Beim **bestärkenden Lernen** erhält ein Agent Rückmeldung über Folgen von Aktionen. Entscheidend sind zeitverzögertes Feedback, Exploration und die Frage, ob die simulierte oder reale Umgebung das gewünschte Verhalten tatsächlich belohnt.

## Von Daten zur belastbaren Aussage

Der Datensatz wird in drei Rollen getrennt. Mit dem **Trainingssatz** werden Parameter angepasst. Der **Validierungssatz** unterstützt Modell- und Hyperparameterentscheidungen. Der **Testsatz** bleibt bis zur abschließenden Bewertung unangetastet. Wer wiederholt auf dem Testsatz optimiert, verwandelt ihn faktisch in einen weiteren Validierungssatz.

**Overfitting** liegt vor, wenn ein Modell Besonderheiten der Trainingsdaten lernt, die sich nicht übertragen. **Underfitting** liegt vor, wenn Modell, Merkmale oder Training selbst die relevante Struktur nicht erfassen. Die entscheidende Größe ist deshalb die Lücke zwischen Leistung auf bekannten und wirklich neuen Daten.

Eine besonders gefährliche Fehlerklasse ist **Datenleckage**. Beispiele sind ein Stornierungsmerkmal, das erst nach der vorherzusagenden Kündigung entsteht, oder eine zufällige Aufteilung von Zeitreihendaten, durch die Informationen aus der Zukunft im Training landen. Gute Evaluation bildet den späteren Einsatz nach: zeitlich, organisatorisch und hinsichtlich der verfügbaren Eingaben.

## Wann keine ML-Lösung bauen?

Eine feste Regel ist meist besser, wenn die Logik vollständig bekannt, stabil, prüfbar und günstig auszuführen ist. Für eine Altersgrenze oder eine exakt definierte Steuerregel braucht es kein Modell. ML lohnt sich, wenn Regeln nur schwer vollständig formulierbar sind, genügend repräsentative Beispiele vorliegen und Fehler anhand eines geeigneten Maßes bewertet werden können.

Auch ein mögliches Modell ist noch kein sinnvolles Produkt. Berücksichtige Kosten falscher Entscheidungen, Erklärbarkeit, Drift, Wartung, Datenschutz und einen sicheren Rückfallpfad. Der Vergleichspunkt ist nicht „kein System“, sondern die beste einfache Baseline: vorhandene Regel, Mittelwert, häufigste Klasse oder eine kleine lineare Methode.

## Build It / Use It

Die Lektion baut zuerst eine kleine Lernschleife aus Rohoperationen: Vorhersage, Fehler, Parameteränderung und erneute Messung. Dadurch wird sichtbar, dass „Lernen“ eine wiederholte Optimierung ist. Danach kann dieselbe Aufgabe mit einer Produktionsbibliothek umgesetzt werden. Die Bibliothek spart Code, aber sie entscheidet nicht über Zielvariable, Split, Baseline oder Akzeptanzgrenze.

Führe die kanonische Demo mit `python3 code/main.py` aus. Notiere Eingabeform, Ziel, Baseline und die Kennzahl auf den zurückgehaltenen Daten. Ändere anschließend genau eine Annahme und beobachte, ob sich nur die Trainingsgüte oder auch die Generalisierung verbessert.

## Übungen

1. Formuliere eine reale Entscheidung aus deinem Umfeld als Eingaben, Zielvariable, Zeitpunkt der Vorhersage und Abnahmekriterium. Markiere zwei mögliche Leckagequellen.
2. Vergleiche für dasselbe Problem eine feste Regel, eine einfache Baseline und ein lernendes Modell. Begründe, welche Lösung du zuerst ausrollen würdest.
3. Entwirf einen Split für Daten mit Zeitbezug oder mehreren Kundenorganisationen. Erkläre, welche zu optimistische Evaluation ein zufälliger Split erzeugen könnte.

## Referenzlösung

Eine belastbare Antwort benennt zuerst die konkrete Entscheidung und trennt Informationen vor und nach diesem Zeitpunkt. Sie definiert eine einfache Baseline, ein fachlich passendes Fehlermaß und einen Testsplit, der den späteren Betrieb nachbildet. Die Lösung entscheidet sich nur dann für ML, wenn sie einen nachweisbaren Vorteil gegenüber der festen Regel zeigt und zugleich Kosten, Drift sowie einen Rückfallpfad berücksichtigt.

## Weiterführende Quellen

- [Google Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course)
- [An Introduction to Statistical Learning](https://www.statlearning.com/)
- [scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html)
