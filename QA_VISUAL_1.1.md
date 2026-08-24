# QA Visual 1.1

Verifiche eseguite:
- visual contract 1.1: verde;
- manifest palette PWA: verde;
- service worker cache `wardrobe-shell-v1.1`: verde;
- avatar condiviso Home/Dressing: verde;
- avatar PNG con matte esterno trasparente: verde;
- `wardrobe-db.js`, `wardrobe-add-item.js`, `sw.js`: `node --check` verde;
- 3 script inline: `node --check` verde;
- manifest JSON valido;
- browser smoke: 360×800, 390×844, 430×932;
- Home, Wardrobe, Dressing, Looks: una sola root screen attiva;
- nessun overflow orizzontale o verticale del documento;
- nessun page error nel browser smoke.

Scope volutamente escluso:
- onboarding avatar personale;
- nuovo crop/rotate Add Item;
- riconoscimento categoria;
- modifiche alla persistenza.
