# QA — Add Item 1.0

## Contract
- selezione camera/galleria apre l'editor reale;
- crop 4:5, pan e zoom;
- salvataggio usa IndexedDB, store `garments`;
- immagine salvata come Blob;
- item aggiunto alla categoria selezionata e ai Recenti;
- conteggi baseline + user items;
- reload: hydration da IndexedDB;
- delete disponibile per user items;
- PWA 0.9 resta attiva.

## QA telefono dopo deploy HTTPS
1. Apri WardRobe installata come PWA.
2. Wardrobe → Add item.
3. Prova Fotocamera e Galleria.
4. Trascina la foto e prova lo zoom.
5. Imposta nome e categoria, salva.
6. Conferma che il capo appaia subito nella categoria.
7. Chiudi completamente WardRobe e riaprila.
8. Conferma che il capo sia ancora presente.
9. Apri il dettaglio e prova Elimina.
10. Conferma che Home, Dressing e Looks non abbiano regressioni di layout.
