# CLAUDE.md

## Project Overview

**Pair-a-Gone and On** is a browser-based puzzle/matching card game. Players match adjacent cards (including diagonals) of the same type to score points, with a combo multiplier system rewarding consecutive matches.

## Tech Stack

- Vanilla JavaScript (no frameworks)
- HTML5 / CSS3
- Web Audio API (procedural sound generation)
- Service Worker (PWA/offline support)
- LocalStorage (persistence)

## Key Files

- `docs/index.html` - Main entry point, game UI structure
- `docs/game.js` - Core game logic (~660 lines): cards, matching, scoring, audio
- `docs/style.css` - Styling, animations, responsive design
- `docs/sw.js` - Service worker for offline caching
- `docs/manifest.json` - PWA manifest
- `docs/favicon.svg` - App favicon
- `docs/CNAME` - Custom domain configuration for GitHub Pages

## Hosting

Hosted via GitHub Pages from the `docs/` directory at `pair-a-gone.pages.8bitmage.com`.

## Running Locally

No build process required. Serve the `docs` directory with any static HTTP server:

```bash
npx http-server docs
# or
cd docs && python -m http.server 8000
```

## Game Constants (docs/game.js)

```javascript
GRID_COLS = 5, GRID_ROWS = 4  // 20 card grid
POINTS_PER_MATCH = 10
MULTIPLIER_MAX = 5.0
MULTIPLIER_INCREMENT = 0.5
MULTIPLIER_DECAY_RATE = 0.075
```

## Card Types

10 types with emoji representations: Mario, Mushroom, Fire Flower, Star, Cloud, Luigi, Goomba, Bowser, Boo, Yoshi. Types unlock progressively (start with 5, add 1 every 5 matches).

## Architecture Notes

- Game state managed in global variables in `docs/game.js`
- Sound effects generated procedurally via Web Audio API (no audio files)
- Settings and high scores persist to localStorage
- Mobile-optimized with touch handling and iOS audio context workarounds
