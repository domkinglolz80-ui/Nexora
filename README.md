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
| `MONGODB_URI`      | –         | Wenn gesetzt: Daten in MongoDB statt in `db.json` |
| `MONGODB_DB`       | `nexora`  | Name der MongoDB-Datenbank        |

## Online stellen (Render.com, kostenlos)

Geht komplett vom Handy aus:

1. <https://render.com> öffnen → **Get Started** → mit **GitHub** anmelden.
2. **New +** → **Web Service** → Repository **Nexora** auswählen (falls es fehlt: „Configure account“ und Zugriff auf das Repo erlauben).
3. Einstellungen:
   - **Branch:** `nexora-app`
   - **Runtime / Language:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. **Deploy Web Service** tippen und 2–3 Minuten warten.
5. Oben steht dann ein Link wie `https://nexora-xxxx.onrender.com` – den im Handy-Browser öffnen und an Freunde schicken.

Alternativ: **New +** → **Blueprint** → Repo auswählen; die Einstellungen kommen dann aus `render.yaml`.

Der Gratis-Server schläft nach ~15 Minuten ohne Besucher ein; der erste Aufruf danach dauert ca. 1 Minute.

### Daten dauerhaft speichern (MongoDB Atlas, kostenlos)

Ohne Datenbank sind auf Render nach jedem Neustart alle Accounts und Nachrichten weg. So bleiben sie erhalten:

1. Auf <https://www.mongodb.com/atlas> einen kostenlosen **M0**-Cluster anlegen und einen Datenbank-User mit Passwort erstellen.
2. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
3. **Connect** → **Drivers** → Node.js → Connection String kopieren und `<db_password>` durch das Passwort ersetzen.
4. Bei Render im Web Service → **Environment** → **Add Environment Variable**:
   - Key: `MONGODB_URI`
   - Value: der Connection String
5. Speichern – Render startet neu, im Log steht dann „Daten werden in MongoDB gespeichert“.

Kann der Server die Datenbank nicht erreichen, startet er absichtlich nicht (statt mit leeren Daten weiterzumachen). Dann im Render-Log nachsehen – meist fehlt Schritt 2 oder das Passwort stimmt nicht.

**Tipp:** Im Handy-Browser „Zum Startbildschirm hinzufügen“ – dann liegt Nexora wie eine App auf dem Homescreen.

## Aufbau

```
server.js          Express + Socket.IO Server, Daten in MongoDB oder data/db.json
public/index.html  Oberfläche
public/app.css     Design (Ember-Theme)
public/app.js      Client-Logik
```

Alle Daten werden im Arbeitsspeicher gehalten und gebündelt gespeichert – ideal für kleine bis mittlere Gruppen.
