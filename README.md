# Plot-On

Plot-On is a local-first writing workspace for planning novels on whiteboards, drafting chapters, and managing multiple books in the browser.

## Launch readiness changes

This repo has been cleaned up for release use:

- real app metadata in `index.html`
- installable web app manifest in `public/site.webmanifest`
- basic offline/service-worker support in `public/sw.js`
- privacy policy page in `public/privacy.html`
- fixed JSON import behavior so imported novels are actually added to the library
- removed duplicate toast mounting
- replaced remaining scaffold branding and broken placeholder text

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui primitives
- localStorage for persistence

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm install
npm run build
npm run preview
```

The app is a static frontend build. Any static host can serve the output from `dist/`.

## Release notes

Web launch:

- set your production domain
- replace `public/privacy.html` contact details
- generate production screenshots and listing copy
- verify install behavior in Chrome, Edge, Safari, and mobile browsers

Desktop web downloads:

- the app now exposes a manifest and service worker so supported browsers can install it as a standalone desktop web app
- browser-installed desktop builds still use browser storage unless you wrap the app in Electron or Tauri

App stores:

- this repo is now in reasonable shape for a PWA-style web launch
- direct Apple App Store and Google Play submission still requires a native wrapper and signing pipeline outside this repo
- if you want true store binaries, the next step is adding Capacitor, Tauri, or Electron packaging rather than changing core product behavior

## Data model

- A `Library` contains many `Book` items and the `activeBookId`
- A `Book` contains `whiteboards`, `chapters`, and `folders`
- A `WhiteboardSheet` contains `pins`
- A `Chapter` contains multiple `drafts`

## Testing

Scripts available:

- `npm run lint`
- `npm run test`
- `npm run build`

The current environment used for this pass did not have `node`, `npm`, or `bun` available, so command verification could not be executed here.
