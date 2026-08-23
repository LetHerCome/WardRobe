# QA Baseline 0.8

Verifiche eseguite su viewport:
- 360 × 800
- 390 × 844
- 430 × 932

Gate corrente:
- una sola root screen visibile alla volta;
- Home resta dentro `100svh` e avatar non supera la scala approvata;
- Wardrobe allineato all'asse della Home e senza overflow orizzontale;
- Dressing Room resta isolata quando inattiva;
- bottom navigation su un unico asse ottico;
- nessuno scroll del `body`.

Known limitation:
- i layer/fit dei vestiti della Dressing Room sono demo grafica, non il motore finale.
