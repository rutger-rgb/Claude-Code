# Hammerhead HQ 🦈

Een hilarische, gelikte iPhone-webapp speciaal voor **Jurriën "Hammerhead" Hamer**.

## Features

1. **🧠 Migraine tracker** — grote rode paniekknop, logt aanvallen, stats per maand/jaar, custom grafiek.
2. **🕺 Funk Emergency Button** — willekeurig funk-nummer + directe Spotify-link, met draaiende vinyl.
3. **📰 Leesvoer van de webmaster** — gecureerde artikelenlijst met push-meldingen (Web Notifications API).
4. **⚡ Ego Oplader** — lovende blurbs en fictieve juryrapporten voor als de twijfel toeslaat.

## Design

- iPhone-first, bottom tab bar, safe-area-aware, blur backdrop, haptic feedback (waar ondersteund).
- Dark mode met rood/paars/cyan accenten.
- Pure HTML/CSS/JS — geen build step, geen dependencies. Open `index.html` en je bent klaar.
- PWA manifest: voeg toe aan beginscherm op iPhone voor fullscreen-ervaring.

## Webmaster modus

Tik 5x snel op het logo bovenin, voer wachtwoord `hammerhead` in → je kunt nu artikelen toevoegen die automatisch een push-melding versturen (mits Jurriën notificaties heeft aangezet).

## Data & Sync (Supabase)

De app werkt direct out-of-the-box puur op `localStorage` (per device).
Om migraine-logs, artikelen en quotes te **synchroniseren tussen devices**
(bv. jouw iPhone en die van Jurriën), koppel een Supabase project:

1. Maak een nieuw (of gebruik een bestaand) Supabase project
2. Open de **SQL editor** en draai het script in `schema.sql`
   (maakt drie tabellen aan met de juiste RLS policies)
3. Ga naar **Project Settings → API**, kopieer de **Project URL** en **anon public key**
4. Open `config.js` en vul ze in:
   ```js
   window.HH_CONFIG = {
     SUPABASE_URL: "https://xxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJ..."
   };
   ```
5. Commit & push — klaar. De subtitle toont "☁️ gesynct" als het werkt.

**Security**: de anon key is public (veilig om in JS te zetten). De RLS policies
staan alleen insert/select/delete toe op de anon rol, dus iedereen met de URL
naar de app kan lezen en schrijven. Geen auth, geen gedoe — prima voor een
persoonlijke app voor twee mensen.

## Hosting

Werkt op elke statische host: GitHub Pages, Netlify, Vercel, of open direct vanaf je iPhone via een lokale share.
