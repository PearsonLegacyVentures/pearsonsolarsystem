# Pearson Solar System

Amar Pearson's personal visual map of ventures, project work, attention, and the next useful move.

## Run

Use Node 22.12 or newer.

```bash
npm ci
npm run dev
```

```bash
npm test
npm run build
```

The production output is `dist/`. On Cloudflare Pages, connect this repository, choose `main`, set the build command to `npm run build` and the output directory to `dist`. No backend, credentials, or environment variables are required. `npm run preview` serves the production build locally.

## What is included

- Real Three.js scene with shaded, textured worlds, atmospheric glow, project moons, orbital navigation, and restrained motion.
- Four lenses: priority, life impact, estimated attention, and open task count.
- Priority view with explanations and next moves; Today’s Gravity with a capacity-limited plan.
- Add, edit, complete, reopen, delegate, and park missions; edit the next move and bottleneck.
- Editable venture ratings and Focus / Maintain / Delegate / Park directions.
- Local browser saving and validated JSON export/import for backups and device transfer.
- Keyboard-accessible controls, native dialogs, mobile layouts, reduced-motion support, and a working list fallback if WebGL cannot start.

## Read the map

Size represents the selected lens. Distance represents the ranking for that lens; parked worlds remain at the outside. Glow represents estimated mental load. Task rings widen with the number of open missions. Selected project moons reveal the venture’s subprojects. Planet rotation subtly reflects urgency. This is a strategy visualization, not an astronomical simulation.

Priority is **35% life impact + 30% current importance + 20% urgency + 15% strategic fit**. Ratings run from 1 to 10; the resulting score runs from 10 to 100. Attention and workload do not raise strategic priority. Task counts are derived from the saved task inventory.

Today’s Gravity considers open tasks in Focus and Maintain worlds, uses impact and venture priority, boosts real due dates, and tries one task per venture first. It fills at most three main slots, then selects a <=20-minute quick win only if it fits the remaining capacity. Task estimates determine the time budget. Completed, delegated, and parked tasks are excluded. Dates and overdue calculations use America/Nassau. This plan is a suggestion, not a schedule or automatic personal assistant.

## Data and privacy

The initial seven ventures and 27 missions are drawn from shared September–October 2026 context. **Ratings, time estimates, and open status are initial judgments, not measured or verified current facts.** The two seeded due dates refer to the known October 8 Club 1600 meeting and October 22 Doctors Hospital delivery. Review whether these items are still outstanding. Tranquilitas growth projects are grouped under Tranquilitas to avoid double counting.

No live integrations, automatic chat synchronization, account authentication, or cloud database are included. Changes stay in the current browser profile; clearing browser storage removes them. Export a backup periodically and before switching devices. Invalid imports are rejected before changing state. A corrupt saved file is not overwritten on initial load. Anyone with access to the browser profile can see saved data. The default seed is in this repository and in a deployed site bundle; do not put confidential information in seed files. `noindex` discourages search indexing but is not access control. For private hosting, protect the whole site using your hosting provider’s access controls before adding confidential content.

## Source map

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Navigation, inspection, daily plan, mission editing, calibration, backup dialogs |
| `src/components/SolarScene.jsx` | 3D scene, shaders, motion, labels, selection, WebGL fallback |
| `src/data/seed.js` | Editable starting ventures and mission inventory |
| `src/lib/model.js` | Ranking, day planning, date handling, import validation |
| `src/lib/storage.js` | Local persistence and downloadable backups |
| `src/styles.css` | Visual system, desktop/mobile layout, focus states |
| `src/main.jsx` | React entry point |
| `index.html` | Metadata and application mount |
| `public/favicon.svg` | Orbit identity |
| `vite.config.js` | Separate 3D and UI bundles |
| `tests/model.test.js` | Ranking, capacity, task exclusion, import integrity, Nassau dates |
| `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore` | Reproducible dependencies and runtime setup |

No pre-existing routes or working features were removed; the repository was empty before this build.
