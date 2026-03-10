# Webory

Webory is a local-first writing workspace for planning novels on whiteboards, drafting chapters, and managing multiple books on your device.

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

Open the local URL from Vite, then start with the default empty workspace:

- use the left sidebar to add boards, chapters, or folders
- use the storyboard to map scenes and connect ideas with pins
- switch to chapters to draft prose; changes autosave in the browser
- use `Ctrl/Cmd + K` for search, `?` for shortcuts, and `Ctrl/Cmd + E` to export JSON

## Production build

```sh
npm install
npm run build
npm run preview
```

The app is a static frontend build. Any static host can serve the output from `dist/`.

## Android build

Webory now includes a Capacitor Android shell for Google Play packaging.

```sh
npm install
npm run android:sync
npm run android:debug
```

For release packaging and Play upload notes, see:

- `docs/android-release.md`
- `docs/play-store-listing.md`

## Release notes

Web launch:

- set your production domain
- verify the support email in `public/privacy.html`
- generate production screenshots and listing copy
- verify install behavior in Chrome, Edge, Safari, and mobile browsers

Desktop web downloads:

- the app now exposes a manifest and service worker so supported browsers can install it as a standalone desktop web app
- browser-installed desktop builds still use browser storage unless you wrap the app in Electron or Tauri

App stores:

- this repo is now in reasonable shape for a PWA-style web launch
- Google Play packaging is wired through Capacitor in `/android`
- release AAB generation still depends on Java, Android SDK, and release signing material on the machine performing the build

## Before launch

- Add a real empty-state test for first-run behavior; the current suite is still a placeholder.
- Verify localStorage quota behavior with large novels and keep backup/export reminders visible.
- Test keyboard and drag behavior on touch devices and Safari before release.

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
