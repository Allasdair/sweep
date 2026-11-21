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
- **Friends' Board:** one shared board a day, identical for every player. Share a link and friends who tap it get your time on their standings, with no server or account. Placements lock at midnight and earn medal flags, metal boards and a Pearl set for top-3, top-2 and 1st finishes.
- **Challenge codes:** send a friend your exact board and race their time, with no server or account.
- **Progression:** levels, achievements and 60+ cosmetic unlocks. Everything is earned by playing; nothing is for sale.
- **Accessibility:** colourblind-safe numbers, left-handed controls, a tap magnifier and reduced motion.

## Install
Open the link above, then:
- **Android:** browser menu (⋮) → **Install app** or **Add to Home screen**.
- **iPhone/iPad (Safari):** **Share** → **Add to Home Screen**.
- **Desktop (Chrome or Edge):** the install icon in the address bar.

Progress is stored only on your device. To move it, use **Settings → Backup & restore**.

## Privacy
The game makes no network requests beyond loading its own files: no analytics, no trackers and no third-party fonts or CDNs. A Content Security Policy blocks connections to any other site. Challenge codes contain only the board, your time and an optional name you choose.

## Build
Everything is plain HTML, CSS and JavaScript, with no frameworks or dependencies.

```sh
python3 build.py            # rebuilds docs/ (the site GitHub Pages serves)
python3 build.py --single   # dist/sweep.html, one self-contained file
```

| Path | What it is |
|---|---|
| `src/app.html` | UI, rendering, sound, progression |
| `src/engine.js` | Board engine: generation, no-guess solver, hints, rule variants, analysis, challenge codes |
| `src/camp.js` | Campaign level recipes |
| `web/` | Web-app shell: manifest, service worker template, bundled fonts, icons (`icons.js` renders them) |
| `docs/` | Built site. Don't edit it by hand; run `build.py` |

## How it was made
Sweep was designed and directed by Alasdair, and the code was written with the help of Claude (Anthropic). It has been playtested and checked with automated tests, including solver and hint bots that clear thousands of boards.

## Licence
- **Code:** MIT. See [LICENSE](LICENSE).
- **Fonts:** Inter, JetBrains Mono and Caveat are under the SIL Open Font License 1.1. Their licences are in `web/fonts/`.
