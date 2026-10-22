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
- **Sprachkanäle** – in Echtzeit reden, mit Sprech-Anzeige, Stummschalten, Ton aus und Sprachleiste
- **Präsenz** – Online / Abwesend / Nicht stören / Unsichtbar, Tipp-Anzeige
- **Ungelesen-Markierungen** – Badges für Erwähnungen und DMs, Ton bei Erwähnung
- **Befehlspalette** – `Strg`+`K` springt zu jedem Hub, Kanal oder Menschen
- **Profile** – Anzeigename, Bio, Akzentfarbe
- **Responsive** – funktioniert auch auf dem Handy

Neue Nutzer landen automatisch in der **Nexora Lounge** (Code `NEXORA`).

## Offizieller Nexora-Account

Accounts mit dem Benutzernamen `nexora` sind **offiziell**: Sie bekommen ein orangenes ✓-Abzeichen und dürfen die **Nexora Lounge** verwalten (Kanäle anlegen, bearbeiten, löschen, Nachrichten entfernen). Andere Namen mit „Nexora“ (z. B. `NexoraFan`) sind gesperrt, damit sich niemand als offiziell ausgeben kann.

Weitere offizielle Accounts per Umgebungsvariable, kommagetrennt: `NEXORA_OFFICIAL=nexora,dom`

## Sprachkanäle

Die Stimmen laufen per **WebRTC direkt zwischen den Geräten**; der Server vermittelt nur den Verbindungsaufbau. Das belastet den Server kaum, ist aber für kleine Runden gedacht (max. 10 Personen pro Kanal).

- Funktioniert nur über **HTTPS** (auf Render automatisch) oder `localhost`.
- Für den Verbindungsaufbau werden die öffentlichen STUN-Server von Google genutzt. In manchen Netzen (oft Mobilfunk oder strenge Firmen-/Schul-WLANs) reicht das nicht – dann hilft ein **TURN-Server**, z. B. der kostenlose von [Metered](https://www.metered.ca/stun-turn). Zugangsdaten als Umgebungsvariablen eintragen:

| Variable           | Beispiel                                   |
| ------------------ | ------------------------------------------ |
| `TURN_URL`         | `turn:global.relay.metered.ca:80,turns:global.relay.metered.ca:443?transport=tcp` |
| `TURN_USERNAME`    | Benutzername vom TURN-Anbieter             |
| `TURN_CREDENTIAL`  | Passwort vom TURN-Anbieter                 |

## Versionen & Updates

Aktuelle Version: **V0.1.1 Beta**. Alle Änderungen stehen in [`changelog.json`](changelog.json) – der oberste Eintrag ist die laufende Version.

- Nach dem Login (und nach jedem Update) zeigt Nexora einmal das Fenster **„Was ist neu?“**. Über die Versionsanzeige unten in der Hub-Leiste lässt es sich jederzeit wieder öffnen.
- Geht eine neue Version live, während jemand Nexora offen hat, lädt die Seite automatisch neu. Tippt die Person gerade etwas, erscheint stattdessen ein „Jetzt laden“-Hinweis.

Neue Version veröffentlichen: oben in `changelog.json` einen Eintrag mit `version`, `date`, `title` und `changes` ergänzen und deployen.

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
| `NEXORA_OFFICIAL`  | `nexora`  | Offizielle Accounts (Benutzernamen, kommagetrennt) |

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
