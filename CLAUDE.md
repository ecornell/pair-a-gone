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

- `index.html` - Main entry point, game UI structure
- `game.js` - Core game logic (~760 lines): cards, matching, scoring, audio
- `style.css` - Styling, animations, responsive design
- `sw.js` - Service worker for offline caching
- `manifest.json` - PWA manifest

## Running the Project

No build process required. Serve files with any static HTTP server:

```bash
npx http-server
# or
python -m http.server 8000
```

## Game Constants (game.js)

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

- Game state managed in global variables in `game.js`
- Sound effects generated procedurally via Web Audio API (no audio files)
- Settings and high scores persist to localStorage
- Mobile-optimized with touch handling and iOS audio context workarounds
