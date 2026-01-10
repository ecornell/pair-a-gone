# Pair-a-Gone and On

A browser-based puzzle/matching card game. Match adjacent cards of the same type to score points, with a combo multiplier system rewarding consecutive matches.

## Play

**[Play Online](https://pair-a-gone.pages.8bitmage.com/)**

Or serve locally with any static HTTP server:

```bash
npx http-server src
# or
cd src && python -m http.server 8000
```

Then open `http://localhost:8080` (or `8000` for Python) in your browser.

## Features

- Match adjacent cards (including diagonals) to score points
- Combo multiplier system rewards consecutive matches (up to 5x)
- 10 unlockable card types with Mario-themed characters
- Progressive difficulty - new card types unlock as you play
- Procedurally generated sound effects
- PWA support for offline play
- Mobile-friendly with touch controls
- High score tracking with local storage

## Tech Stack

- Vanilla JavaScript
- HTML5 / CSS3
- Web Audio API
- Service Worker (PWA)

## License

[MIT](LICENSE)
