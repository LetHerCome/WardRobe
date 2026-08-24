# QA PWA 0.9

## Gate statici eseguiti
- `index.html` collega `manifest.webmanifest`;
- Apple touch icon presente;
- install banner presente;
- handler `beforeinstallprompt` presente;
- service worker registrato da `index.html`;
- manifest valido JSON con `display: standalone`, `start_url: /`, `scope: /`, `orientation: portrait`;
- icone 192×192, 512×512, maskable 512×512 e Apple 180×180 presenti;
- `sw.js` supera `node --check`;
- tutti gli script inline di `index.html` superano `node --check`;
- endpoint locali `index.html`, `manifest.webmanifest` e `sw.js` rispondono HTTP 200.

## QA da eseguire su Vercel/telefono
### Android
- aprire in Chrome;
- verificare banner installazione;
- premere Installa;
- avviare dall'icona;
- confermare assenza della barra URL;
- verificare Home/Wardrobe/Dressing/Looks e meteo.

### iPhone
- aprire in Safari;
- verificare istruzione installazione;
- Condividi → Aggiungi alla schermata Home;
- avviare dall'icona;
- confermare apertura standalone;
- verificare safe areas e navigazione.

### Offline shell
- aprire almeno una volta online;
- chiudere e riaprire con rete disattivata;
- verificare che la shell WardRobe si apra.
