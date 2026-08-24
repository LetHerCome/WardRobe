# WardRobe — Personal Avatar 1.2

WardRobe 1.2 builds on the 1.1 visual baseline, PWA 0.9 and Add Item 1.0.

## New in 1.2
- first-open `Rendilo tuo` onboarding;
- keep the demo avatar or choose a personal full-body photo;
- camera and gallery input;
- 3:5 portrait editor with drag, zoom and reset;
- personal avatar stored locally in IndexedDB;
- the same identity is used by Home and Dressing (and therefore Looks previews on render);
- Settings → `Personaggio` → `Cambia` reopens the flow;
- IndexedDB migration v1 → v2 preserves the existing `garments` store.

## Storage
`wardrobe-local-v1`, database version 2:
- `garments` — unchanged from Add Item 1.0;
- `profile` — persistent local avatar profile.

No photo is uploaded to a backend in this milestone.

## Known limitation
There is no person/background removal yet. A personal image should be front-facing, full-body and shot against a simple background. Garment fitting is still the existing prototype layer system.

## Deploy
Upload the contents of the GitHub Deploy ZIP to the repository root. Vercel can continue to serve the project as a static PWA without a build step.
