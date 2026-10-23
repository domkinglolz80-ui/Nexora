# Nexora

Hi, im the only dev of Nexora, Nexora is like discord but different

Nexora ist eine Echtzeit-Chat-Plattform mit eigenem Look: dunkles Glas-Design mit Orange-Glow, Hub-Leiste, Befehlspalette und Live-Updates.

## Features

- **Accounts** – Registrieren und Einloggen (Passwörter werden mit scrypt gehasht)
- **Hubs** – eigene Hubs erstellen, per Einladungscode oder -link beitreten, verlassen, umbenennen, löschen
- **Kanäle** – Textkanäle mit Thema erstellen, bearbeiten, löschen (Besitzer)
- **Nachrichten in Echtzeit** – Antworten, Bearbeiten (auch mit ↑), Löschen, Emoji-Reaktionen
- **Dateien & Bilder** – per Büroklammer, Drag & Drop oder Einfügen teilen; Bilder mit Vorschau und Großansicht
- **Umfragen** – bis zu 10 Antworten, Einfach- oder Mehrfachauswahl, Ergebnisse live, beendbar
- **Formatierung** – `**fett**`, `*kursiv*`, `~~durch~~`, `` `code` ``, Codeblöcke, `> Zitat`, `||Spoiler||`, Links, `@erwähnungen`
- **Direktnachrichten** – privat mit jedem Mitglied schreiben
- **Sprachkanäle** – in Echtzeit reden, mit Sprech-Anzeige, Stummschalten, Ton aus und Sprachleiste
- **Präsenz** – Online / Abwesend / Nicht stören / Unsichtbar, Tipp-Anzeige
- **Ungelesen-Markierungen** – Badges für Erwähnungen und DMs, Ton bei Erwähnung (stumm bei „Nicht stören“), optional Desktop-Benachrichtigungen
- **Komfort** – Entwürfe pro Kanal, „Zum Neuesten“-Knopf, Text kopieren, Zeichenzähler
- **Bots & Slash-Befehle** – eigene Bots mit Befehlen wie `/wuerfel`, als Textantwort oder als JavaScript-Skript
- **Admin-Panel** – für offizielle Accounts: Statistiken, Ankündigungen, Nutzer, Hubs und Bots verwalten
- **Befehlspalette** – `Strg`+`K` springt zu jedem Hub, Kanal oder Menschen
- **Profile** – Anzeigename, Bio, Akzentfarbe
- **Responsive** – funktioniert auch auf dem Handy

Neue Nutzer landen automatisch in der **Nexora Lounge** (Code `NEXORA`).

## Offizieller Nexora-Account

Accounts mit dem Benutzernamen `nexora` sind **offiziell**: Sie bekommen ein orangenes ✓-Abzeichen und dürfen die **Nexora Lounge** verwalten (Kanäle anlegen, bearbeiten, löschen, Nachrichten entfernen). Andere Namen mit „Nexora“ (z. B. `NexoraFan`) sind gesperrt, damit sich niemand als offiziell ausgeben kann.

Weitere offizielle Accounts per Umgebungsvariable, kommagetrennt: `NEXORA_OFFICIAL=nexora,dom`

## Admin-Panel

Offizielle Accounts sehen in der Hub-Leiste links ein Schild-Symbol (auch über `Strg`+`K` → „Admin-Panel“). Dort gibt es:

- **Übersicht** – Nutzer, Online, Nachrichten (gesamt und 24 Std.), Hubs, Bots, Sprachkanäle, Speicher, RAM, Version
- **Ankündigung** – ein Hinweis oben im Chat für alle (z. B. Wartung); jede Person kann ihn wegblenden
- **Nutzer** – suchen, **sperren** (mit Grund, den die Person beim Login sieht), entsperren, überall **abmelden**, **Passwort zurücksetzen** (das neue Passwort wird einmal angezeigt)
- **Hubs** – alle Hubs mit Besitzer, Mitgliedern und Nachrichten; beitreten oder löschen (die Lounge ist geschützt)
- **Bots** – alle Bots mit Besitzer und Befehlen; sperren, entsperren oder löschen

Offizielle Accounts können selbst nicht gesperrt werden. Jede Aktion prüft der Server noch einmal – das Panel ist nur die Oberfläche.

## Nexora Helper

Der **Nexora Helper** (`@NexoraHelper`) ist der offizielle Bot von Nexora, mit ✓- und BOT-Abzeichen. Er ist fest eingebaut: Man muss ihn nicht einladen, er kann nicht bearbeitet oder gelöscht werden, und **nur offizielle Accounts** können seine Befehle benutzen – in jedem Hub und in Direktnachrichten. Alle anderen sehen nur seine Nachrichten.

| Befehl                         | Wirkung                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `/hilfe`                       | alle Befehle (nur für dich sichtbar)                                 |
| `/ban <nutzer> [grund]`        | sperrt den Account auf ganz Nexora, die Person fliegt sofort raus    |
| `/unban <nutzer>`              | hebt die Sperre auf                                                  |
| `/kick <nutzer> [grund]`       | wirft die Person aus dem aktuellen Hub (nicht den Besitzer)          |
| `/verwarnen <nutzer> <grund>`  | öffentliche Verwarnung mit Erwähnung                                 |
| `/abmelden <nutzer>`           | meldet die Person auf allen Geräten ab                               |
| `/info <nutzer>`               | Account-Infos: dabei seit, Hubs, Nachrichten, Sperre                 |
| `/stats`                       | Nexora in Zahlen                                                     |
| `/ankuendigung [text]`         | setzt das Banner für alle, ohne Text wird es entfernt                |
| `/loeschen <anzahl>`           | löscht die letzten 1–100 Nachrichten im Kanal                        |

`<nutzer>` ist der Benutzername, mit oder ohne `@`. Offizielle Accounts und Bots können nicht moderiert werden. Sperren, Verwarnungen und Kicks schreibt der Helper sichtbar in den Kanal, alles andere sieht nur die Person, die den Befehl nutzt.

## Bots & Slash-Befehle

Über den Roboter-Knopf unten links (**Meine Bots**) kann jede Person bis zu **5 Bots** anlegen. Ein Bot ist ein eigener Account mit `BOT`-Abzeichen, der sich nicht einloggen kann und nur auf Slash-Befehle antwortet.

1. Bot erstellen – er bekommt gleich einen `/hallo`-Befehl.
2. Unter **Hubs** in einen Hub holen, den du verwaltest (oder in den Hub-Einstellungen unter „Bots“).
3. Im Chat `/` tippen – Nexora schlägt alle Befehle der Bots im Hub vor.

**Befehle** (bis zu 25 pro Bot) haben einen Namen, eine Beschreibung und bis zu 5 **Optionen**. Optionen werden der Reihe nach gefüllt, die letzte bekommt den Rest: `/wetter Berlin morgen früh` → `stadt = Berlin`, `wann = morgen früh`. Eine Antwort kann sein:

- **Text** mit Platzhaltern: `{user}`, `{mention}`, `{args}`, `{1}`, `{2}`, `{optionsname}`, `{random:1-6}`, `{choose:Ja|Nein}`, `{channel}`, `{hub}`
- **Skript** in JavaScript:

```js
// /punkte – jede Person sammelt Punkte, sie bleiben gespeichert
const punkte = store.get('punkte', {});
punkte[ctx.user.id] = (punkte[ctx.user.id] || 0) + 1;
store.set('punkte', punkte);
return `${ctx.user.mention} hat jetzt **${punkte[ctx.user.id]}** Punkte ⭐`;
```

| Im Skript                         | Bedeutung                                                     |
| --------------------------------- | ------------------------------------------------------------- |
| `ctx.user`                        | wer den Befehl nutzt (`id`, `username`, `displayName`, `mention`) |
| `ctx.text`, `ctx.args`, `ctx.options` | Eingabe als Text, als Wörter, als Optionen                |
| `ctx.channel`, `ctx.hub`, `ctx.bot` | wo der Befehl genutzt wurde und welcher Bot antwortet       |
| `reply(text)` / `return text`     | Nachricht in den Kanal (bis zu 3 pro Aufruf)                  |
| `whisper(text)`                   | Antwort, die nur die aufrufende Person sieht                  |
| `random(min, max)`, `pick(liste)` | Zufall                                                        |
| `store.get/set/delete/keys`       | dauerhafter Speicher des Bots (max. 32 KB)                    |
| `console.log()`                   | erscheint beim Testen im Editor                               |

Skripte laufen in **QuickJS** (WebAssembly), einer abgeschotteten JavaScript-Engine: kein Zugriff auf Server, Dateien, Internet oder Umgebungsvariablen, max. **250 ms** und 16 MB pro Aufruf, max. 10 Skript-Aufrufe pro Person in 10 Sekunden. Im Befehls-Editor lässt sich jeder Befehl testen, ohne etwas zu posten oder zu speichern.

**Öffentliche Bots** (Profil → „Öffentlich“) dürfen auch andere Hub-Besitzer über den Bot-Namen hinzufügen. Hub-Besitzer können Bots jederzeit wieder entfernen.

## Sprachkanäle

Die Stimmen laufen per **WebRTC direkt zwischen den Geräten**; der Server vermittelt nur den Verbindungsaufbau. Das belastet den Server kaum, ist aber für kleine Runden gedacht (max. 10 Personen pro Kanal).

- Funktioniert nur über **HTTPS** (auf Render automatisch) oder `localhost`.
- Für den Verbindungsaufbau werden die öffentlichen STUN-Server von Google genutzt. In manchen Netzen (oft Mobilfunk oder strenge Firmen-/Schul-WLANs) reicht das nicht – dann hilft ein **TURN-Server**, z. B. der kostenlose von [Metered](https://www.metered.ca/stun-turn). Zugangsdaten als Umgebungsvariablen eintragen:

| Variable           | Beispiel                                   |
| ------------------ | ------------------------------------------ |
| `TURN_URL`         | `turn:global.relay.metered.ca:80,turns:global.relay.metered.ca:443?transport=tcp` |
| `TURN_USERNAME`    | Benutzername vom TURN-Anbieter             |
| `TURN_CREDENTIAL`  | Passwort vom TURN-Anbieter                 |

## Dateien

- Max. **8 MB** pro Datei und **5 Dateien** pro Nachricht. PNG, JPEG, GIF und WebP werden als Bild angezeigt, alles andere als Download.
- Gespeichert wird in MongoDB (Collection `files`), sonst im Ordner `data/uploads`. Ohne MongoDB sind Dateien auf Render – wie alle anderen Daten – nach einem Neustart weg.
- Der kostenlose Atlas-Cluster (M0) hat **512 MB** Platz für alles zusammen. Wird es eng, alte Kanäle mit vielen Dateien löschen – deren Dateien werden mitgelöscht.
- Dateien sind über ihren zufälligen, nicht erratbaren Link erreichbar (wie bei Discord). Wer den Link hat, kann die Datei öffnen.
- Hochgeladene, aber nie gesendete Dateien werden nach einer Stunde bzw. beim nächsten Start automatisch entfernt.

## Versionen & Updates

Aktuelle Version: **V0.1.4 Beta**. Alle Änderungen stehen in [`changelog.json`](changelog.json) – der oberste Eintrag ist die laufende Version.

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
bots.js            Bot-Befehle: Text-Platzhalter und Skript-Sandbox (QuickJS)
public/index.html  Oberfläche
public/app.css     Design (Ember-Theme)
public/app.js      Client-Logik
public/bots.js     Bots verwalten, Befehle und Skripte bearbeiten
public/admin.js    Admin-Panel
```

Alle Daten werden im Arbeitsspeicher gehalten und gebündelt gespeichert – ideal für kleine bis mittlere Gruppen.
