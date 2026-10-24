# Nexora

Hi, im the only dev of Nexora, Nexora is like discord but different

Nexora ist eine Echtzeit-Chat-Plattform mit eigenem Look: dunkles Glas-Design mit Orange-Glow, Hub-Leiste, Befehlspalette und Live-Updates.

## Features

- **Accounts** – Registrieren und Einloggen (Passwörter werden mit scrypt gehasht); bis zu 10 Accounts pro Gerät, Wechsel per Klick ohne Passwort
- **Hubs** – eigene Hubs erstellen, per Einladungscode oder -link beitreten, verlassen, umbenennen, löschen
- **Kanäle** – Textkanäle mit Thema erstellen, bearbeiten, löschen; 🐢 **Langsam-Modus** pro Kanal (5 Sekunden bis 10 Minuten)
- **Rollen & Rechte** – eigene Rollen pro Hub mit Farbe, Rangfolge und Rechten (Admin, Hub verwalten, Kanäle, Rollen, Nachrichten, Rauswerfen, Sperren); Rollen können in der Mitgliederliste eine eigene Gruppe bekommen. Man kann nur Rollen und Mitglieder unter der eigenen höchsten Rolle bearbeiten
- **Hub-Moderation** – auf der Profilkarte im Hub: Rollen geben, Auszeit, Rauswerfen, Sperren (mit Liste der Gesperrten in den Hub-Einstellungen)
- **Angepinnte Nachrichten** – bis zu 50 pro Kanal, Liste über das 📌 oben im Chat
- **Threads** – Antworten zu einer Nachricht in einem eigenen Strang; die Nachricht zeigt, wie viele Antworten es gibt
- **Suche** – Nachrichten im ganzen Hub oder in einer DM finden, mit Filtern `von:@name`, `in:#kanal`, `hat:bild|datei|link|umfrage` und `angepinnt` (englisch: `from:`, `has:`, `pinned`)
- **Freunde** – Freundschaftsanfragen per Name oder Profil, Freunde-Seite mit Online / Alle / Anfragen / Hinzufügen
- **Nachrichten in Echtzeit** – Antworten, Bearbeiten (auch mit ↑), Löschen, Emoji-Reaktionen
- **Dateien & Bilder** – per Büroklammer, Drag & Drop oder Einfügen teilen; Bilder mit Vorschau und Großansicht
- **Umfragen** – bis zu 10 Antworten, Einfach- oder Mehrfachauswahl, Ergebnisse live, beendbar
- **Formatierung** – `**fett**`, `*kursiv*`, `~~durch~~`, `` `code` ``, Codeblöcke, `> Zitat`, `||Spoiler||`, Links, `@erwähnungen`
- **Direktnachrichten** – privat mit jedem Mitglied schreiben und per **Telefon-Symbol anrufen**
- **Sprachkanäle** – in Echtzeit reden, mit Sprech-Anzeige, Stummschalten, Ton aus und Sprachleiste
- **Präsenz** – Online / Abwesend / Nicht stören / Unsichtbar mit animierten Status-Punkten (pulsierend, schaukelnder Mond, atmend), Tipp-Anzeige
- **Ungelesen-Markierungen** – Badges für Erwähnungen und DMs, Ton bei Erwähnung (stumm bei „Nicht stören“), optional Desktop-Benachrichtigungen
- **Komfort** – Entwürfe pro Kanal, „Zum Neuesten“-Knopf, Text kopieren, Zeichenzähler
- **Bots & Slash-Befehle** – eigene Bots mit Befehlen wie `/wuerfel`, als Textantwort oder als JavaScript-Skript
- **Admin-Panel** – für offizielle Accounts: Statistiken, Ankündigungen, Nutzer, Hubs und Bots verwalten
- **Befehlspalette** – `Strg`+`K` springt zu jedem Hub, Kanal oder Menschen
- **Profile** – Anzeigename, Bio, Akzentfarbe
- **Deutsch & Englisch** – Sprache beim Login oder in den Profil-Einstellungen wählen, beim ersten Besuch wird sie automatisch erkannt
- **Desktop-App** – Nexora als eigenes Programm für Windows, macOS und Linux, Download über das Symbol unten in der Hub-Leiste
- **Handy-freundlich** – eigenes Layout fürs Handy: Wischen öffnet Kanal- und Mitgliederliste, die Zurück-Taste schließt Menüs und Fenster, Nachrichten-Aktionen per Antippen, kein Hineinzoomen beim Tippen, die Tastatur verdeckt das Eingabefeld nicht
- **iPhone-App** – Nexora als App auf dem Home-Bildschirm, ohne App Store (siehe [Nexora als iPhone-App](#nexora-als-iphone-app-))
- **Halloween Edition 2026** – gruseliger Look, animierte Profil-Accessoires, Geisterjagd und der **Geister-Laden**

Neue Nutzer landen automatisch in der **Nexora Lounge** (Code `NEXORA`).

## Halloween Edition 2026 🎃

Ab **V0.1.5 Beta** trägt Nexora Halloween: Vollmond, Nebel, Spinnennetz und Fledermäuse im Hintergrund, ein lachender Kürbis auf Ladebildschirm und Login, ein Countdown bis zum 31. Oktober und der Kanal `#halloween` in der Lounge.

**Accessoires** – in den Profil-Einstellungen unter „Accessoire“ (für Bots im Bot-Editor unter „Profil“). Alle sind animiert und für alle sichtbar. Diese gibt es für alle, das ganze Jahr:

| Accessoire          | Was passiert                                          |
| ------------------- | ----------------------------------------------------- |
| 😎 Sonnenbrille     | sitzt auf den Augen, ab und zu gleitet ein Glanz drüber |
| 🎧 Kopfhörer        | nicken im Takt, Noten schweben hoch                   |
| 🥳 Partyhut         | sitzt schief und wippt, Konfetti rieselt              |
| 😇 Heiligenschein   | goldener Ring schwebt über dem Kopf, Glitzer funkelt  |
| 🌸 Blumenkranz      | wiegt sich sanft hin und her                          |
| 💕 Verliebt         | kleine Herzen steigen um den Avatar auf               |

Und diese zur Halloween Edition:

| Accessoire          | Was passiert                                          |
| ------------------- | ----------------------------------------------------- |
| 🎃 Lachender Kürbis | hüpft auf der Ecke des Avatars und lacht „HA HA“      |
| 🧙 Hexenhut         | sitzt schief auf dem Kopf und wackelt                 |
| 👻 Kleiner Geist    | kreist um den Avatar                                  |
| 🦇 Fledermaus       | flattert über dem Avatar                              |
| 😈 Teufelshörner    | glühen wie Glut                                       |
| 🕷️ Spinne           | baumelt an ihrem Faden                                |
| 🐈‍⬛ Katzenohren      | zucken ab und zu                                      |

**Exklusive Accessoires** – kann niemand sonst auswählen, der Server lehnt sie für alle anderen ab:

| Accessoire              | Wer                                  | Was passiert                                                                 |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| 👑 Kürbiskönig          | nur `@nexora`                        | Feuerring, goldene Krone mit Kürbis-Juwel, Funken; Profilkarte mit Kürbis-Hügel bei Vollmond, Name in Feuerfarben |
| 🏮 Irrlicht-Wächter     | nur der Nexora Helper                | grüner Geisterring, schwingende Laterne, Irrlichter; Profilkarte mit Friedhof im grünen Nebel, Name in Geistergrün |

**Offizielles Accessoire** – gehört dem Nexora Helper, er trägt es fest:

| Accessoire              | Wer                                  | Was passiert                                                                 |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| ⚙️ Schaltkreis-Kern     | nur der Nexora Helper                | Platinen-Avatar mit Leiterbahnen, rotierender Datenring, Scan-Linie, drei herabhängende Kabel mit Datenimpulsen, Antenne mit Funkwellen, Chip mit blinkenden LEDs; Profilkarte mit Serverraum, Prozessor und Datenpaketen, Name in Cyan |

**Gründer-Accessoire** – nur für den Gründer von Nexora:

| Accessoire              | Wer                                  | Was passiert                                                                 |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| 💠 Nexus-Krone          | nur `@nexora`                        | Weltall im Profilbild, schillernder Ring, drehendes Nexora-Sechseck, drei kreisende Kristalle, funkelnde Sterne, schwebende Kristallkrone; Profilkarte mit Sternenportal, Nebel und Kometen |

`@nexora` bekommt die Nexus-Krone einmal automatisch angelegt und kann jederzeit zum Kürbiskönig oder einem anderen Accessoire wechseln.

**Brutal-Rare-Accessoire** – die seltenste Stufe von allen, nur für `@nexora`:

| Accessoire              | Wer                                  | Was passiert                                                                 |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| 🔥 Fire Jason           | nur `@nexora`                        | verkohltes Profilbild hinter einer gesprungenen, blutigen Hockeymaske mit glühenden Augen, die ab und zu zuckt; blutige Machete, die zuschlägt; doppelter Höllenfeuer-Ring, Flammen, Rauch, herablaufendes Blut, Glut und ein Herzschlag-Leuchten; brennender Name, flackerndes Abzeichen **🔥 Fire Jason · Brutal Rare**; Profilkarte mit brennender Hütte, Blutmond, Kiefern und der maskierten Gestalt am See |

`@nexora` bekommt Fire Jason (ab V0.6.0 Beta) einmal automatisch angelegt und kann danach frei wechseln.

**Legendäre Accessoires** – gibt es genau einmal, für einen einzigen Account:

| Accessoire              | Wer                                  | Was passiert                                                                 |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| 😈 Höllenfürst          | nur `@Zorvecx`                       | Lava im Profilbild, doppelter Höllenfeuer-Rahmen, glühende Hörner, wedelnder Schwanz, Flammen und Funken; Profilkarte mit Höllenlandschaft (Lavastrom, rote Sonnenfinsternis, Blitze), brennender Name |

`@Zorvecx` bekommt den Höllenfürsten genauso einmal automatisch (beim Serverstart oder bei der Registrierung). `@nexora` bekommt den Kürbiskönig beim ersten Serverstart einmal automatisch angelegt und kann danach frei wechseln. Auch weitere offizielle Accounts aus `NEXORA_OFFICIAL` können ihn nicht tragen.

**Geisterjagd** – alle 40–90 Sekunden (in der Halloween-Nacht alle 15–35 Sekunden) schwebt ein Geist über den Bildschirm. Wer ihn anklickt, fängt ihn, und es platzen Süßigkeiten heraus. Jeder achte ist ein **goldener Geist**, der dreifach zählt – während der **Goldenen Geisternacht** sogar jeder zweite. Der Zähler gehört zum Account (Zähler älterer Versionen vom Gerät werden einmal übernommen) und bringt Ränge, die im Profil stehen:

| Geister | Rang               |
| ------- | ------------------ |
| 1       | Geisterlehrling    |
| 5       | Spukjäger:in       |
| 13      | Geisterjäger:in    |
| 31      | Kürbismeister:in   |
| 66      | Legende der Nacht  |

Der Rang zählt **alle jemals gefangenen Geister** – auch die, die du im Laden ausgegeben hast. Am Handy vibriert es beim Fangen kurz, bei goldenen Geistern länger.

**Halloween-Finale** (ab V0.9.0 Beta) – am **31. Oktober 2026** ist den ganzen Tag jeder zweite Geist golden (`GOLDEN_EVENT`). Um Mitternacht (`HALLOWEEN_END`, 1. November 00:00 deutsche Zeit) friert der Server die Bestenliste ein, gibt den ersten drei einen **Pokal** fürs Profil (🥇🥈🥉 „Platz 1 der Geisterjagd 2026“), setzt eine Ankündigung mit den Gewinnern, der Helper postet den Endstand in `#halloween` – und alle Geräte laden in den **normalen Look** ohne Halloween-Dekoration. Gefangene Geister zählen danach nicht mehr; gekaufte Dekoration bleibt für immer. `@nexora` kann den Look mit `/saison` jederzeit selbst wählen.

**Geister-Bestenliste** (ab V0.8.0 Beta) – unten im Geister-Laden stehen die 10 besten Geisterjäger:innen (gezählt werden alle jemals gefangenen Geister), der eigene Eintrag ist hervorgehoben; wer nicht in den Top 10 ist, sieht seinen Platz. `@nexora` bekommt sie auch mit `/bestenliste`.

**Goldene Geisternacht** (ab V0.7.0 Beta) – ein Event, bei dem **jeder zweite Geist golden** ist statt jeder achte. Solange es läuft, steht oben im Chat ein goldenes Banner mit der Restzeit (ausblendbar). Das erste Event läuft am **23. Oktober 2026 bis Mitternacht** (deutsche Zeit, `GOLDEN_EVENT` in `server.js`). `@nexora` kann es jederzeit mit dem Helper steuern: `/event an [stunden]` startet oder verlängert es, `/event aus` beendet es, `/event` zeigt den Stand. Das Banner erscheint und verschwindet bei allen sofort.

**Geister-Laden** (ab V0.4.0 Beta) – gefangene Geister sind jetzt Geld: Über das Geist-Symbol in der Hub-Leiste, „Geister-Laden“ in den Profil-Einstellungen oder die Schnellsuche öffnet sich der Laden mit **Halloween-Dekoration** für den Avatar. Jedes Stück zeigt eine Live-Vorschau mit deinem eigenen Avatar. Beim Kauf (zweiter Klick bestätigt) werden die Geister abgezogen und sind weg – die Dekoration gehört dir **für immer**, wird sofort angelegt und steht danach in der Accessoire-Auswahl. Je teurer, desto spektakulärer:

| Dekoration              | Preis  | Stufe    | Was passiert                                                                 |
| ----------------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| 🕸️ Spinnennetz          | 👻 25  | Gruselig | schimmerndes Netz in der Ecke, eine Spinne krabbelt hinein und hinaus        |
| 🩹 Mumienbinden         | 👻 50  | Gruselig | zwei Binden um den Avatar, das lose Ende flattert                             |
| 🧪 Hexenkessel          | 👻 99  | Schaurig | brodelnder Kessel über kleinem Feuer, giftgrüne Blasen steigen auf            |
| 🧛 Vampirgraf           | 👻 150 | Schaurig | hoher Umhangkragen mit Rubin-Spange, Vampirzähne mit Blutstropfen, zwei Fledermäuse kreisen |
| 💀 Sensenmann           | 👻 250 | Albtraum | Kapuze mit glühenden roten Augen, schwingende Sense mit Glanz, Totennebel     |
| 👻 Geisterschwarm       | 👻 400 | Mythisch | drei Geister kreisen im geisterhaften Ring; leuchtender Name, Abzeichen und Profilkarte mit Geisterfriedhof |
| 🌕 Blutmond-Herrscher   | 👻 666 | Mythisch | Blutmond über dem Kopf, kreisende Runen, blutroter Ring, Glut und Fledermäuse; blutroter Name, Abzeichen und Profilkarte mit Schloss unter dem Blutmond |

**Rabatt:** `SHOP_DISCOUNT` in `server.js` senkt alle Preise (aufgerundet): `0.5` = 50 %, `0` = normale Preise aus der Tabelle. Gerade steht er auf `1` – **alles ist gratis** (ab V0.6.1 Beta): ein Klick auf „Gratis holen“, keine Geister werden abgezogen, die Dekoration gehört trotzdem für immer.

Der Server prüft jeden Kauf (Preis, Kontostand, schon gekauft) und lässt gekaufte Dekoration nur von ihrem Besitzer tragen. Bots können nichts kaufen.

**Süßigkeitenregen** – wer „Süßes oder Saures“, „Trick or treat“ oder „Happy Halloween“ in den Chat schreibt, lässt bei allen, die den Kanal offen haben, Süßigkeiten regnen.

Die Effekte lassen sich pro Gerät in den Profil-Einstellungen abschalten, bei „Bewegung reduzieren“ im System sind alle Animationen aus. Das saisonale Design steckt in `public/halloween.css` und `public/halloween.js` (plus Mond, Fledermäuse und Login-Texte in `public/index.html`). Ab V0.9.0 nimmt der Server sie nach Halloween von selbst heraus (die Seite wird ohne Mond, Fledermäuse, Kürbisse und Halloween-Texte ausgeliefert) – die Accessoires sind fester Teil der Profile und bleiben erhalten.

## Sprachen

Nexora gibt es auf **Deutsch** und **Englisch**. Beim ersten Besuch richtet sich die Sprache nach dem Browser; ändern lässt sie sich oben auf der Login-Seite oder in den Profil-Einstellungen unter „Sprache · Language“ (gespeichert pro Gerät).

Deutsch ist die Ausgangssprache: Alle Texte stehen im Code auf Deutsch und laufen durch `t()`, das in `public/i18n.js` die englische Fassung nachschlägt. Fehlt eine Übersetzung, erscheint einfach der deutsche Text. Meldungen vom Server (z. B. Fehler) übersetzt der Client mit `tServer()`. Neue Hubs bekommen ihre Startkanäle (`#welcome`, `#general` …) und neue Bots ihren ersten Befehl (`/hello`) in der gewählten Sprache. Inhalte, die alle teilen – Nachrichten, die Kanäle der Nexora Lounge und die Antworten des Nexora Helpers – bleiben wie sie sind.

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

**Gesperrte Accounts verschwinden komplett** (ab V0.3.0 Beta): Profil, Profilbild, Nachrichten, Reaktionen und DMs sind für alle sofort weg – auch für das Team. Nur `@nexora` sieht sie noch, markiert mit 🔨 GESPERRT, und nur `@nexora` kann sie entsperren. Gelöscht wird dabei nichts: Nach dem Entsperren ist alles wieder da.

## Owner-Zentrale (@nexora)

Der Account `@nexora` ist der **Owner** (Gründer) von Nexora. Er trägt das 👑 **GRÜNDER**-Abzeichen, sein Admin-Panel heißt **Owner-Zentrale** und hat drei zusätzliche Bereiche. Der Server prüft jede Owner-Aktion selbst, andere offizielle Accounts bekommen sie nicht.

- **Team** – Accounts per Benutzername zu offiziellen Accounts ernennen oder wieder entfernen (✓-Abzeichen, Admin-Panel). Accounts aus `NEXORA_OFFICIAL` sind fest und lassen sich hier nicht entfernen.
- **Kontrolle** – **Wartungsmodus**: meldet alle außer dem Team sofort ab, sperrt Login und Registrierung und zeigt den Hinweistext beim Login; **Live-Durchsage**: ein Pop-up bei allen, die gerade online sind.
- **Protokoll** – die letzten 500 Ereignisse: Registrierungen, Sperren, Kicks, Verwarnungen, Abmeldungen, Passwort-Resets, gelöschte Hubs und Bots, Ankündigungen, Team-Änderungen, Wartung, Durchsagen und Hub-Übertragungen – auch über den Nexora Helper, inklusive Stummschaltungen, Umbenennungen und **Versuchen anderer, den Helper zu benutzen**.
- **Hubs** – zusätzlich **Besitzer übertragen** an jeden Account (auch an sich selbst); die Person tritt dabei automatisch bei.

Außerdem verwaltet der Owner **jeden Hub** wie dessen Besitzer und hat **doppelte Limits**: 4000 Zeichen pro Nachricht, 10 Anhänge mit je 16 MB, 20 Antworten pro Umfrage, 10 eigene Bots und doppeltes Sende-Tempo.

Private Direktnachrichten anderer kann auch der Owner nicht lesen.

## Alte Nachrichten aufräumen

Damit die Datenbank nicht immer weiter wächst, räumt Nexora selbst auf – beim Start und danach jede Stunde:

- Nachrichten, die älter als **90 Tage** sind, werden gelöscht, mitsamt ihren Dateien (Bilder, Anhänge).
- Jeder Kanal und jede DM behält höchstens die neuesten **2.000 Nachrichten**.

`@nexora` stellt beides in der Owner-Zentrale unter **Kontrolle → Alte Nachrichten aufräumen** ein: löschen nach 7, 14, 30, 60, 90, 180 oder 365 Tagen oder nie, und 500 bis 5.000 Nachrichten pro Kanal. Beim Speichern wird sofort aufgeräumt. Der Startwert für die Tage lässt sich auch über die Umgebungsvariable `NEXORA_MESSAGE_DAYS` setzen (`0` = nie löschen).

## Nexora Helper

Der **Nexora Helper** (`@NexoraHelper`) ist der offizielle Bot von Nexora, mit ✓- und BOT-Abzeichen und dem offiziellen Accessoire ⚙️ **Schaltkreis-Kern**. Er ist fest eingebaut: Man muss ihn nicht einladen, er kann nicht bearbeitet oder gelöscht werden, und **nur @nexora** kann seine Befehle benutzen – in jedem Hub und in Direktnachrichten. Alle anderen, auch das Nexora-Team, sehen nur seine Nachrichten.

**Sicherheit**

- Der Server prüft bei jedem Befehl selbst, ob er von `@nexora` kommt. Die Befehlsliste bekommt auch nur `@nexora` – für alle anderen ist sie leer, auch im Slash-Menü und auf der Profilkarte.
- Versucht jemand anderes trotzdem, den Helper anzusprechen (z. B. mit einem veränderten Client), wird das abgelehnt und als „hat versucht, den Nexora Helper zu benutzen“ ins Protokoll geschrieben (höchstens alle 10 Minuten pro Account).
- Befehle mit 🔒 lassen sich nicht einfach rückgängig machen (`/ban`, `/abmelden`, `/loeschen`, `/wartung`): Sie werden erst mit `/ja` innerhalb von 60 Sekunden ausgeführt, `/abbrechen` verwirft sie. Falsche Eingaben werden vorher abgelehnt.
- Höchstens **15 Helper-Befehle pro Minute**. Offizielle Accounts und Bots können nicht moderiert werden.

`/einladen` holt den Helper als sichtbares Mitglied in einen Hub: Er erscheint dann für alle in der Mitgliederliste unter „Bots“ und begrüßt den Hub im ersten Textkanal. Ohne Code gilt der Befehl für den aktuellen Hub, mit Einladungscode für jeden anderen Hub (auch aus einer DM heraus).

| Befehl                                | Wirkung                                                              |
| ------------------------------------- | -------------------------------------------------------------------- |
| **Moderation**                        |                                                                      |
| `/ban <nutzer> [grund]` 🔒            | sperrt den Account auf ganz Nexora, die Person fliegt sofort raus    |
| `/unban <nutzer>`                     | hebt die Sperre auf                                                  |
| `/stumm <nutzer> <dauer> [grund]`     | schaltet die Person auf ganz Nexora stumm: keine Nachrichten, Umfragen oder Bot-Befehle. Dauer: `30`, `30m`, `2h`, `1d` (max. 7 Tage) |
| `/entstummen <nutzer>`                | hebt die Stummschaltung auf                                          |
| `/kick <nutzer> [grund]`              | wirft die Person aus dem aktuellen Hub (nicht den Besitzer)          |
| `/verwarnen <nutzer> <grund>`         | öffentliche Verwarnung mit Erwähnung; die Verwarnungen werden gezählt (`/info`) |
| `/umbenennen <nutzer> <name>`         | ändert den Anzeigenamen, z. B. bei unpassenden Namen                 |
| `/abmelden <nutzer>` 🔒               | meldet die Person auf allen Geräten ab                               |
| **Hub** (im Hub, in dem du tippst)    |                                                                      |
| `/hubinfo`                            | alles über den Hub: Besitzer, Mitglieder, Kanäle, Nachrichten, Pins, Rollen, Sperren |
| `/rollen`                             | die Rollen des Hubs mit Rechten und Mitgliederzahl                   |
| `/rolle <geben\|nehmen> <nutzer> <rolle>` | gibt jemandem eine Rolle oder nimmt sie weg                      |
| `/auszeit <nutzer> <dauer\|aus> [grund]` | die Person kann im Hub nicht schreiben (max. 7 Tage); `aus` beendet es |
| `/hubsperre <nutzer> [grund]` 🔒      | wirft die Person raus und sperrt den Wiedereintritt                  |
| `/hubentsperren <nutzer>`             | hebt die Hub-Sperre auf                                              |
| `/einladung`                          | zeigt den Einladungslink des Hubs                                    |
| **Kanal**                             |                                                                      |
| `/sagen <text>`                       | der Helper schreibt deinen Text in den Kanal                         |
| `/loeschen <anzahl>` 🔒               | löscht die letzten 1–100 Nachrichten im Kanal (samt ihren Threads)   |
| `/slowmode <sekunden\|aus>`           | Langsam-Modus: 5, 10, 30, 60, 120, 300 oder 600 Sekunden             |
| `/thema [text]`                       | setzt das Thema des Kanals, ohne Text wird es entfernt               |
| `/pins`                               | die angepinnten Nachrichten des Kanals                               |
| **Nexora**                            |                                                                      |
| `/ankuendigung [text]`                | setzt das Banner für alle, ohne Text wird es entfernt                |
| `/wartung [text]` 🔒                  | Wartungsmodus an (alle außer dem Team werden abgemeldet); `/wartung aus` beendet ihn |
| `/info <nutzer>`                      | Account-Infos: dabei seit, Geräte, Hubs, Nachrichten, Sperre, Stummschaltung, Geister und Accessoire |
| `/suche <name>`                       | findet Accounts nach Benutzer- oder Anzeigename                      |
| `/online`                             | wer gerade online ist                                                |
| `/hubs`                               | die 10 größten Hubs mit Einladungscode                               |
| `/stats`                              | Nexora in Zahlen                                                     |
| `/system`                             | Technik-Check: Laufzeit, Speicher, Datenbank, Verbindungen, Sessions |
| `/protokoll [anzahl]`                 | die letzten 1–25 Einträge aus dem Protokoll                          |
| `/rundruf <text>` 🔒                   | ein Fenster, das sofort bei allen aufgeht, die online sind           |
| `/team [nutzer] [an\|aus]`             | zeigt das Nexora-Team, nimmt jemanden auf oder raus                  |
| `/saison [halloween\|normal\|auto]`    | zeigt oder wechselt den Look; `auto` = Halloween bis zum Finale, danach normal |
| **Werkzeuge**                         |                                                                      |
| `/erinnern <wann> <text>`             | der Helper erinnert dich: `10m`, `2h`, `1d` oder eine Uhrzeit wie `18:30` (max. 30 Tage). Bist du offline, kommt die Erinnerung beim nächsten Besuch |
| `/erinnerungen [nummer]`              | deine Erinnerungen – mit Nummer wird eine gelöscht                   |
| **Spaß** (für alle im Kanal sichtbar) |                                                                      |
| `/wuerfel [wurf]`                     | würfelt: `20` für einen W20, `2d6` für zwei Würfel                   |
| `/muenze`                             | Kopf oder Zahl                                                       |
| `/wahl <optionen>`                    | der Helper entscheidet zwischen `Pizza \| Burger \| Sushi`           |
| `/orakel <frage>`                     | Ja-Nein-Orakel                                                       |
| `/umfrage <frage \| antwort \| …>`     | startet sofort eine Umfrage                                          |
| **Halloween**                         |                                                                      |
| `/event [an\|aus] [stunden]`          | Goldene Geisternacht: ohne Angabe der Stand, `an 3` startet oder verlängert sie für 3 Stunden ab jetzt (1–72), `aus` beendet sie |
| `/bestenliste`                        | die 10 besten Geisterjäger:innen                                     |
| `/geister <nutzer> <anzahl>`          | schenkt 1–1000 Geister für den Geister-Laden, sichtbar im Kanal; die Person bekommt einen Hinweis |
| **Helper**                            |                                                                      |
| `/hilfe [befehl]`                     | alle Befehle nach Gruppen – mit Befehl alles dazu (Optionen, 🔒); bei Tippfehlern schlägt er den passenden Befehl vor |
| `/ja` · `/abbrechen`                  | bestätigt oder verwirft den wartenden 🔒-Befehl                       |
| `/einladen [code]` · `/ausladen [code]` | holt den Helper sichtbar in einen Hub oder wieder heraus           |
| `/status <status>`                    | `online`, `abwesend`, `nichtstoeren` oder `unsichtbar` (englisch geht auch: `idle`, `dnd`, `invisible`) |

`<nutzer>` ist der Benutzername, mit oder ohne `@`. Sperren, Stummschaltungen, Verwarnungen, Kicks, Auszeiten, Hub-Sperren, Geister-Geschenke, Spaß-Befehle und `/sagen` schreibt der Helper sichtbar in den Kanal, alles andere sieht nur `@nexora`.

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

### Anrufe

In jeder Direktnachricht sitzt oben das **Telefon-Symbol**. Ein Klick startet den Anruf, bei der anderen Person klingelt es auf allen Geräten (mit Ton und Benachrichtigung, in der Desktop-App blinkt die Taskleiste). Annehmen oder Ablehnen geht im Anruf-Fenster oder im Chat; nach 45 Sekunden ohne Antwort hört es auf zu klingeln. Anrufe nutzen dieselbe Technik wie die Sprachkanäle (WebRTC, ggf. TURN-Server).

## Dateien

- Max. **8 MB** pro Datei und **5 Dateien** pro Nachricht. PNG, JPEG, GIF und WebP werden als Bild angezeigt, alles andere als Download.
- Gespeichert wird in MongoDB (Collection `files`), sonst im Ordner `data/uploads`. Ohne MongoDB sind Dateien auf Render – wie alle anderen Daten – nach einem Neustart weg.
- Der kostenlose Atlas-Cluster (M0) hat **512 MB** Platz für alles zusammen. Wird es eng, alte Kanäle mit vielen Dateien löschen – deren Dateien werden mitgelöscht.
- Dateien sind über ihren zufälligen, nicht erratbaren Link erreichbar (wie bei Discord). Wer den Link hat, kann die Datei öffnen.
- Hochgeladene, aber nie gesendete Dateien werden nach einer Stunde bzw. beim nächsten Start automatisch entfernt.

## Desktop-App 💻

Ab **V0.2.0 Beta** gibt es Nexora als eigenes Programm. Das **Download-Symbol** (⬇) unten in der Hub-Leiste öffnet die Downloads – das passende System steht oben:

| System  | Datei              | Hinweis                                   |
| ------- | ------------------ | ----------------------------------------- |
| Windows | `Nexora-Setup.exe` | Windows 10 & 11, 64 Bit                   |
| macOS   | `Nexora.dmg`       | Intel und Apple Silicon                   |
| Linux   | `Nexora.AppImage`  | 64 Bit, vor dem Start ausführbar machen   |

- Die App ist ein schlankes Fenster um Nexora (Electron). Die Oberfläche kommt weiter vom Server – **jedes Nexora-Update ist sofort auch in der App**.
- **Die App aktualisiert sich selbst** (ab Desktop-App 0.5.0, Windows und Linux): Beim Start, alle 10 Minuten und sobald der Server eine neuere Desktop-App meldet, schaut sie auf GitHub nach. Gibt es eine neue Version, schließt sich Nexora, das Update-Fenster lädt und installiert sie, und Nexora öffnet sich von selbst wieder. Klappt das Update nicht, lässt es sich wiederholen oder Nexora erst einmal in der alten Version öffnen. Im Menü gibt es „Nach Updates suchen“. Auf macOS geht das ohne Apple-Signatur nicht – dort leuchtet weiter das Download-Symbol. Ältere Apps (bis 0.4.0) müssen einmal von Hand auf 0.5.0 gebracht werden.
- Benachrichtigungen, sobald das Fenster im Hintergrund ist, Zähler am App-Symbol (macOS/Linux) bzw. blinkende Taskleiste (Windows), Mikrofon für Sprachkanäle, Fenstergröße wird gemerkt, fremde Links öffnen im Browser.
- Schläft der Render-Server, zeigt die App „Nexora startet…“ und wartet bis zu 90 Sekunden. Ohne Verbindung gibt es „Erneut versuchen“ und „Adresse ändern“. Im Menü (`Alt` drücken) steht „Server-Adresse ändern…“.
- Die Installer sind nicht signiert: Windows zeigt beim ersten Start „Der Computer wurde durch Windows geschützt“ → „Weitere Informationen“ → „Trotzdem ausführen“; auf dem Mac per Rechtsklick → „Öffnen“ (meldet macOS „beschädigt“: `xattr -cr /Applications/Nexora.app`).
- In Chrome und Edge geht es auch ohne Download: im Download-Fenster „Als App installieren“.

**So entstehen die Downloads:** Der Workflow [`.github/workflows/desktop.yml`](.github/workflows/desktop.yml) baut bei jedem Push auf `nexora-app`, der `desktop/` ändert, die drei Installer auf GitHub (Windows, macOS, Linux) und veröffentlicht sie als Release `desktop-v<Version>`. Der Server leitet `/download/windows`, `/download/mac` und `/download/linux` auf das neueste Release weiter. Für eine neue Desktop-App die `version` in `desktop/package.json` erhöhen. Neben den Installern landen `latest.yml` (Windows) und `latest-linux.yml` im Release – daran erkennen die installierten Apps das Update.

**Server-Adresse:** Die App verbindet sich von selbst mit `https://nexora-yxvx.onrender.com` (`DEFAULT_SERVER` in `desktop/main.js`). Für einen anderen Server auf GitHub unter *Settings → Secrets and variables → Actions → Variables* eine Variable `NEXORA_URL` anlegen und den Workflow neu laufen lassen; einzelne Nutzer können die Adresse im Menü unter „Server-Adresse ändern…“ wechseln.

Selbst bauen: `cd desktop && npm install && npm start` (Testen) bzw. `npm run dist` (Installer für das eigene System in `desktop/dist`).

## Nexora als iPhone-App 📱

Nexora lässt sich ohne App Store als App auf das iPhone (und iPad) legen: In **Safari** auf **Teilen** tippen (je nach iOS-Version unten in der Leiste oder im Menü `⋯`) → **„Zum Home-Bildschirm“** → **„Hinzufügen“**. Auf neueren iPhones geht das auch aus Chrome und anderen Browsern. Unter Android bietet der Browser „App installieren“ an.

- Am Handy öffnet das **Download-Symbol** in der Hub-Leiste diese Anleitung (unter Android mit „Jetzt installieren“). Auf dem iPhone zeigt Nexora einmal einen Hinweis oben im Chat, bis die App installiert oder der Hinweis geschlossen ist. In der installierten App ist das Symbol ausgeblendet.
- Die App läuft im Vollbild ohne Browserleiste, mit eigenem Symbol und **Startbildschirm** (`public/icons/splash/`, je ein Bild pro iPhone-Größe – sonst blitzt beim Start ein weißer Bildschirm auf).
- **Ungelesene Erwähnungen und DMs** stehen als Zahl am App-Symbol (iOS ab 16.4, Android).
- **Ohne Internet** zeigt die App die Seite `public/offline.html` und macht weiter, sobald die Verbindung zurück ist. Dafür sorgt der Service Worker `public/sw.js` – er greift nur, wenn das Netz fehlt; Updates kommen wie gewohnt sofort.
- Updates braucht die App nicht extra: Sie lädt immer die aktuelle Nexora-Version vom Server.

Eine Version für den **App Store** wäre zusätzlich möglich (natives iOS-Projekt, z. B. mit Capacitor), braucht aber einen Apple-Developer-Account (99 €/Jahr), einen Mac bzw. Mac-Build auf GitHub und Apples App-Prüfung.

## Versionen & Updates

Aktuelle Version: **V0.10.0 Beta** (Desktop-App 0.8.0). Alle Änderungen stehen in [`changelog.json`](changelog.json) – der oberste Eintrag ist die laufende Version.

- Nach dem Login (und nach jedem Update) zeigt Nexora einmal das Fenster **„Was ist neu?“**. Über die Versionsanzeige unten in der Hub-Leiste lässt es sich jederzeit wieder öffnen.
- Geht eine neue Version live, während jemand Nexora offen hat, lädt die Seite automatisch neu. Tippt die Person gerade etwas, erscheint stattdessen ein „Jetzt laden“-Hinweis.

Neue Version veröffentlichen: oben in `changelog.json` einen Eintrag mit `version`, `date`, `title` und `changes` ergänzen und deployen. Soll beim Release einmalig der Wartungsmodus enden und eine Ankündigung erscheinen, `RELEASE` in `server.js` auf die neue Version setzen – der Server führt das beim ersten Start dieser Version genau einmal aus (`db.release` merkt es sich). Die englische Fassung steht daneben in `titleEn` und `textEn` (fehlt sie, wird der deutsche Text gezeigt).

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
| `DESKTOP_DOWNLOAD_BASE` | GitHub-Releases | Wohin `/download/…` weiterleitet (Ordner mit den Installern) |

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
public/i18n.js     Übersetzungen (Deutsch → Englisch), auch für Server-Meldungen
public/app.css     Design (Ember-Theme)
public/app.js      Client-Logik
public/social.js   Rollen, Moderation, Pins, Threads, Suche und Freunde (ab V0.9.0)
public/bots.js     Bots verwalten, Befehle und Skripte bearbeiten
public/admin.js    Admin-Panel
desktop/           Desktop-App (Electron): Fenster, Verbindungsseite, Installer-Einstellungen
```

Alle Daten werden im Arbeitsspeicher gehalten und gebündelt gespeichert – ideal für kleine bis mittlere Gruppen.
