# WardRobe — PWA 0.9

Questa milestone aggiunge la shell PWA alla Web Baseline 0.8 senza cambiare il layout prodotto.

## Cosa aggiunge
- manifest PWA con `display: standalone` e orientamento portrait;
- icone Android + maskable + Apple touch icon;
- service worker con app shell offline e HTML network-first;
- install banner discreto quando WardRobe viene aperta dal browser;
- flusso Android via `beforeinstallprompt` quando disponibile;
- istruzioni iPhone `Condividi → Aggiungi alla schermata Home`;
- rilevamento modalità standalone e auto-hide del banner.

## Deploy
Carica **il contenuto di questa cartella** nella root del repository GitHub collegato a Vercel.

Dopo il deploy su HTTPS:
1. apri WardRobe dal telefono;
2. installala dalla Home;
3. avviala dall'icona installata;
4. verifica che si apra senza barra URL/controlli browser.

## Nota
La barra browser non può essere rimossa da una normale tab web. La modalità app senza browser chrome entra in funzione quando la PWA viene installata e lanciata dalla Home.
