# Nexora

Hi, im the only dev of Nexora, Nexora is like discord but different

Nexora ist eine Echtzeit-Chat-Plattform mit eigenem Look: dunkles Glas-Design mit Orange-Glow, Hub-Leiste, Befehlspalette und Live-Updates.

## Features

- **Accounts** – Registrieren und Einloggen (Passwörter werden mit scrypt gehasht)
- **Hubs** – eigene Hubs erstellen, per Einladungscode oder -link beitreten, verlassen, umbenennen, löschen
- **Kanäle** – Textkanäle mit Thema erstellen, bearbeiten, löschen (Besitzer)
- **Nachrichten in Echtzeit** – Antworten, Bearbeiten (auch mit ↑), Löschen, Emoji-Reaktionen
- **Formatierung** – `**fett**`, `*kursiv*`, `~~durch~~`, `` `code` ``, Codeblöcke, `> Zitat`, `||Spoiler||`, Links, `@erwähnungen`
- **Direktnachrichten** – privat mit jedem Mitglied schreiben
- **Präsenz** – Online / Abwesend / Nicht stören / Unsichtbar, Tipp-Anzeige
- **Ungelesen-Markierungen** – Badges für Erwähnungen und DMs, Ton bei Erwähnung
- **Befehlspalette** – `Strg`+`K` springt zu jedem Hub, Kanal oder Menschen
- **Profile** – Anzeigename, Bio, Akzentfarbe
- **Responsive** – funktioniert auch auf dem Handy

Neue Nutzer landen automatisch in der **Nexora Lounge** (Code `NEXORA`).

## Starten

Voraussetzung: [Node.js](https://nodejs.org) 18 oder neuer.

```bash
npm install
npm start
```

Dann <http://localhost:3000> öffnen. Zum Testen mit mehreren Leuten einfach ein zweites Browserfenster (z. B. privates Fenster) öffnen und einen zweiten Account anlegen.

### Einstellungen

| Variable           | Standard  | Bedeutung                         |
| ------------------ | --------- | --------------------------------- |
| `PORT`             | `3000`    | Port des Servers                  |
| `NEXORA_DATA_DIR`  | `./data`  | Ordner, in dem `db.json` liegt    |

## Aufbau

```
server.js          Express + Socket.IO Server, Datenhaltung in data/db.json
public/index.html  Oberfläche
public/app.css     Design (Ember-Theme)
public/app.js      Client-Logik
```

Die Daten liegen in einer JSON-Datei – ideal für kleine Gruppen. Für viele Nutzer wäre später eine echte Datenbank (z. B. SQLite oder Postgres) der nächste Schritt.
