# Anonyme Firmenweite Fortschritts-Erhebung (LRN-Cockpit)

Status: design, not yet implemented.

## Problem

Es gibt aktuell keine Möglichkeit zu sehen, wie weit die Firma insgesamt in
der Lernreise steht: welche Profile/Rollen (`R01-BSC` etc.), welche externen
Level (`LV1`-`LV5`) und welche Kurse (`LRN-NN`) sind wie stark vertreten und
abgeschlossen. Der gesamte Lernfortschritt lebt heute rein clientseitig in
`localStorage` (`site/progress.js`, `site/lrn/lrn.js`) und verlässt nie den
Browser — es gibt weder eine Server-seitige Speicherung noch irgendeine Form
von Nutzeridentität (der Gate-Cookie `ase_gate`, siehe `server/gate-core.js`,
ist ein geteiltes Site-Passwort ohne Personenbezug). Ohne eine neue
Erhebungs- und Aggregationsschicht lässt sich der unternehmensweite
Reifegrad nicht messen.

**Datenschutz-/Mitbestimmungshinweis (nicht Teil dieser technischen Spec):**
Auch pseudonyme Erhebung von individuellem Lernfortschritt kann in einem
deutschen Unternehmen der Mitbestimmung des Betriebsrats unterliegen
(§87 BetrVG). Diese Spec beschreibt eine technisch datensparsame Umsetzung
(keine Klarnamen, kein Verlauf über Zeit, keine IP-Speicherung im Payload),
ersetzt aber nicht die organisatorische Freigabe vor einem Rollout.

## Ziel

Ein Admin-Dashboard, das zeigt: wie viele (pseudonyme) Lernende befinden
sich in welchem Profil/Level, und wie hoch ist die Abschlussquote pro Kurs
— als aktueller Zustand, nicht als Zeitreihe.

## Ansatz

**Zustands-Snapshot statt Event-Log.** Der Client sendet bei Änderung des
lokalen Zustands (Profilwahl, Levelwahl, neuer Kursabschluss) den
*gesamten aktuellen Stand* an den Server, der den letzten bekannten
Snapshot pro anonymer ID einfach überschreibt.

Verworfene Alternative — Event-Log (jedes Ereignis einzeln mit Zeitstempel
anhängen): liefert Zeitreihen, die hier nicht gefordert sind, erfordert aber
Dedup-Logik gegen doppelt gesendete Ereignisse und wächst unbegrenzt.
Snapshot ist einfacher, hat kein Wachstumsproblem und beantwortet die
gestellte Frage ("wer steht aktuell wo") direkt.

## Komponenten

### 1. Anonyme ID (Client)

Neuer `localStorage`-Key `aifs:anon-id:v1`, einmalig mit `crypto.randomUUID()`
erzeugt beim ersten Aufruf des LRN-Cockpits. Kein Cookie, keine
Server-Zuordnung zu einer Person. Verlust beim Storage-Löschen/Browserwechsel
ist gewollt (= anonymer Neustart).

### 2. Sync (Client)

Neues Modul `site/lrn/report-sync.js`. Wird von `site/lrn/lrn.js` (bei
Profil-/Level-Wechsel) und `site/progress.js` (bei Kursabschluss) aufgerufen.
Sendet bei jeder relevanten Änderung:

```json
POST /api/lrn/report
{
  "anonId": "…uuid…",
  "profileId": "tc",
  "externalLevel": 3,
  "completedCourses": ["LRN-01", "LRN-07"]
}
```

Kein Freitext, keine sonstigen Felder. Debounce, damit nicht bei jedem
Klick ein Request rausgeht (z.B. 2s nach letzter Änderung).

### 3. Server-Endpoint & Speicherung

Neue Route `POST /api/lrn/report` in `server/server.js`. Neues Modul
`server/lrn-report-store.js`, analog zum bestehenden Muster in
`server/admin-store.js`: eine JSON-Datei pro `anonId` unter
`.lrn-data/reports/<anonId>.json`, bei jedem Sync überschrieben.

Serverseitige Validierung vor dem Schreiben:
- `anonId` muss ein UUID-Format haben.
- `profileId` muss einer der bekannten IDs aus `catalog.json`s `profiles`
  sein.
- `externalLevel` muss `0`-`3` (bzw. dem Wertebereich aus `catalog.json`s
  `levels`) entsprechen.
- `completedCourses` muss eine Liste bekannter Kurs-IDs aus `catalog.json`s
  `courses` sein (unbekannte Werte werden verworfen, nicht der ganze
  Request).

Kein Logging von IP-Adressen im Payload/Store; normales Server-Zugriffslog
bleibt unverändert (das ist Infrastruktur, kein Teil dieses Features).

### 4. Aggregation & Dashboard

Neue geschützte Route `GET /api/admin/lrn-stats`, geschützt über den
bestehenden `server/admin-auth.js`-Pfad (gleiches Schema wie
`/api/admin/*`). Liest alle Dateien unter `.lrn-data/reports/`, aggregiert:

- Anzahl Lernende pro `profileId`
- Anzahl Lernende pro `externalLevel` (gesamt und pro Profil)
- Abschlussquote pro Kurs (`completedCourses`-Zähler / Gesamtzahl bekannter
  Lernender)

Einfache HTML-Tabellen-Ansicht im Admin-Bereich (kein Chart-Framework für
den Start). Keine Einzel-`anonId` im UI sichtbar — nur aggregierte Zahlen.

## Out of scope

- Zeitreihen/Verlaufsauswertung (bewusst verworfen, siehe Ansatz).
- Cross-Device-Zusammenführung einer Person (würde echte Identität
  erfordern, die es nicht gibt).
- Retention-/Löschfristen für `.lrn-data/reports/*.json` — offene
  organisatorische Entscheidung, kein technisches Blocker; Empfehlung:
  vor Rollout mit Betriebsrat/Datenschutz klären, dann als Cron/Skript
  nachrüsten.
- Diagramme/Visualisierung über einfache Tabellen hinaus.
- Änderungen am Gate-Mechanismus (`ase_gate`) — bleibt wie es ist.

## Offene Fragen (vor Implementierungsplanung zu klären)

1. Soll der Sync bei jedem `lrn.js`/`progress.js`-Update sofort feuern, oder
   reicht ein Sync beim Laden der LRN-Seite (einmal pro Sitzung)? Ersteres
   ist aktueller, Letzteres erzeugt weniger Traffic.
2. Soll es einen Weg geben, den anonymen Report für ein einzelnes Gerät zu
   löschen (z.B. Opt-out-Button), oder ist "Storage im Browser löschen"
   ausreichend (der Server-Eintrag bliebe dann als verwaister Snapshot
   stehen, bis eine Retention-Policy existiert)?
