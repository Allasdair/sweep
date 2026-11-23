# Sweep

An ad-free, no-guess minesweeper. Every board can be cleared with logic alone. There are no lives, paywalls, ads, trackers or accounts.

**Play:** https://allasdair.github.io/sweep/ (installable on Android, iPhone and desktop, and works offline)

## Features
- **Classic:** Beginner, Intermediate and Expert, with optional board shapes and rule variants (Hex, Wraparound, Knight's move, Double mines).
- **Campaigns:** three campaigns of 15 levels each, with 3-star clears.
- **Daily boards:** three a day, unique to each player.
- **Weekly challenge:** a rotating rule each week, with a badge for clearing it.
- **Endless:** an ever-expanding map with milestones and expeditions.
- **Post-game analysis:** 3BV, efficiency, where you hesitated and any guesses.
- **League:** a monthly season that starts automatically on the 1st (League 0 was November 2026). Every day is a round: one shared board, one attempt, up to three stars (reach 75%, clear it, clear it with no hints under 2:30). Season tables add up stars, and players share one link that carries their whole month. There's no server or account. Rewards include medal flags, metal boards, the Pearl set and a Season Champion crown.
- **Challenge codes:** send a friend your exact board and race their time, with no server or account.
- **Progression:** levels, achievements and 60+ cosmetic unlocks. Everything is earned by playing; nothing is for sale.
- **Accessibility:** colourblind-safe numbers, left-handed controls, a tap magnifier and reduced motion.
- **Languages:** English, Español, Français, Deutsch and Português (Brasil). Sweep follows your device language, or pick one in Settings → Language. Translations are machine-assisted, and corrections from native speakers are welcome.
- **Backups:** save your progress as a small text file (the size is shown before you save) or copy a backup code, and restore it on any device.

## Install
Open the link above, then:
- **Android:** browser menu (⋮) → **Install app** or **Add to Home screen**.
- **iPhone/iPad (Safari):** **Share** → **Add to Home Screen**.
- **Desktop (Chrome or Edge):** the install icon in the address bar.

Progress is stored only on your device. To move it, use **Settings → Backup & restore**.

## Privacy
Full policy: [allasdair.github.io/sweep/privacy.html](https://allasdair.github.io/sweep/privacy.html)

The game makes no network requests beyond loading its own files: no analytics, no trackers and no third-party fonts or CDNs. A Content Security Policy blocks connections to any other site. Challenge codes contain only the board, your time and an optional name you choose.

## Build
Everything is plain HTML, CSS and JavaScript, with no frameworks or dependencies.

```sh
python3 build.py            # rebuilds docs/ (the site GitHub Pages serves)
python3 build.py --single   # dist/sweep.html, one self-contained file
```

Run the tests (Node 18+; the first needs no installs):

```sh
node tests/run.js           # generation, no-guess solving, variants, all 45 campaign levels, league boards, codes
python3 build.py && node tests/offline.js   # needs Playwright: opens instantly offline / on a dead connection, safe updates
```

The league tests pin "golden" board fingerprints. If one fails, the shared daily board changed, so players on different versions would get different boards. Only change them together with a deliberate generator version bump.

| Path | What it is |
|---|---|
| `src/app.html` | UI, rendering, sound, progression |
| `src/engine.js` | Board engine: generation, no-guess solver, hints, rule variants, analysis, challenge codes |
| `src/camp.js` | Campaign level recipes |
| `src/i18n_*.js` | Translation tables: one row per English string, `[en, es, fr, de, pt]`. To fix a translation, edit the row; to add a language, add a column |
| `web/` | Web-app shell: manifest, service worker template, bundled fonts, icons (`icons.js` renders them) |
| `tests/` | Dependency-free Node tests (`node tests/run.js`), plus a browser offline test (`tests/offline.js`, needs Playwright) |
| `docs/` | Built site. Don't edit it by hand; run `build.py` |

## How it was made
Sweep was designed and directed by Alasdair, and the code was written with the help of Claude (Anthropic). It has been playtested and checked with automated tests, including solver and hint bots that clear thousands of boards.

## Licence
- **Code:** MIT. See [LICENSE](LICENSE).
- **Fonts:** Inter, JetBrains Mono and Caveat are under the SIL Open Font License 1.1. Their licences are in `web/fonts/`.
