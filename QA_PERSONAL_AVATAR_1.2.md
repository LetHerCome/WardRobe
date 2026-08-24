# QA Personal Avatar 1.2

## Static/contract checks
- IndexedDB bumped from v1 to v2.
- Existing `garments` store is preserved; no `deleteObjectStore` migration exists.
- New `profile` store uses `keyPath: "key"`.
- Avatar profile APIs: get/save/clear.
- First-run onboarding DOM present.
- Camera + gallery inputs present.
- Portrait crop canvas with drag + zoom + reset.
- Same persisted Blob is applied to Home and Dressing.
- Settings exposes `Cambia` for the character.
- `wardrobe-avatar.js` is cached by the PWA service worker.

## Manual QA on Vercel / installed PWA
1. Clear site data or install fresh.
2. Open WardRobe: `Rendilo tuo` must appear.
3. Choose **Continua con l'avatar demo**; reload: onboarding must not reappear.
4. Settings → **Cambia** → **Usa una mia foto**.
5. Test both camera and gallery on a phone.
6. In the editor: drag the image, change zoom, reset, save.
7. Home and Dressing must show the same selected person.
8. Reload / fully close and reopen PWA: personal photo must persist.
9. Open Looks after choosing the photo: previews must use the same character source.
10. Confirm pre-existing Wardrobe garments are still present after DB v1 → v2 migration.

## Known limitation
Personal Avatar 1.2 does **not** remove the background and does not realign garment layers to arbitrary body geometry. Use a front-facing full-body photo with a simple background. Those problems belong to the later Cutout/Fit milestone.
