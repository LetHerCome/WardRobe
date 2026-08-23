# WardRobe — Web Baseline 0.8

Baseline web da usare come QA live su GitHub + Vercel.

## Authority
- `index.html` è la baseline interattiva corrente.
- Home, Wardrobe, Dressing Room e Looks sono il riferimento UX/UI prima dei prossimi miglioramenti funzionali.
- Il fitting dei vestiti nella Dressing Room è ancora placeholder/demo e non va considerato asset finale.

## Deploy
Repository statico: `index.html` deve stare nella root del repository collegato a Vercel.
Non è richiesto un build step.

## Vincoli del prossimo ciclo
- Non reinterpretare il layout senza una review visuale.
- Correggere bug in modo chirurgico, evitando CSS globali che rompano altre schermate.
- Prima migliorare e validare la web app; packaging APK viene dopo una baseline web stabile.
