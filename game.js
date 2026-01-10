// Card type definitions
const CARD_TYPES = [
    { name: 'Mario', emoji: '🧢' },
    { name: 'Mushroom', emoji: '🍄' },
    { name: 'Fire Flower', emoji: '🌸' },
    { name: 'Star', emoji: '⭐' },
    { name: 'Cloud', emoji: '☁️' },
    { name: 'Luigi', emoji: '💚' },
    { name: 'Goomba', emoji: '🟤' },
    { name: 'Bowser', emoji: '🐢' },
    { name: 'Boo', emoji: '👻' },
    { name: 'Yoshi', emoji: '🦖' }
];

// Game constants
const GRID_COLS = 5;
const GRID_ROWS = 4;
const TOTAL_SLOTS = GRID_COLS * GRID_ROWS; // 20 slots
const POINTS_PER_MATCH = 10;

// Game state
let grid = []; // Array of card objects or null for empty slots
let selectedIndex = null;
let score = 0;
let matches = 0;
let highScore = 0;
let isProcessing = false;

// DOM elements
const cardGrid = document.getElementById('card-grid');
const scoreDisplay = document.getElementById('score');
const matchesDisplay = document.getElementById('matches');
const highScoreDisplay = document.getElementById('high-score');
const notification = document.getElementById('notification');
const gameOverOverlay = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const newHighScoreMsg = document.getElementById('new-high-score');
const restartBtn = document.getElementById('restart-btn');

// Audio context for sound effects
let audioContext = null;

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Sound effects using Web Audio API
function playSound(type) {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;

    switch (type) {
        case 'select':
            oscillator.frequency.setValueAtTime(600, now);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;

        case 'match':
            oscillator.frequency.setValueAtTime(523, now);
            oscillator.frequency.setValueAtTime(659, now + 0.1);
            oscillator.frequency.setValueAtTime(784, now + 0.2);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
            break;

        case 'invalid':
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.setValueAtTime(150, now + 0.1);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
            break;

        case 'slide':
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.setValueAtTime(500, now + 0.05);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;

        case 'deal':
            // Play a quick shuffle sound
            const notes = [300, 400, 350, 450];
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.setValueAtTime(freq, now + i * 0.05);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.08, now + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
                osc.start(now + i * 0.05);
                osc.stop(now + i * 0.05 + 0.1);
            });
            return;

        case 'gameover':
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            oscillator.start(now);
            oscillator.stop(now + 0.5);
            break;

        case 'highscore':
            // Special fanfare for new high score
            const fanfare = [784, 988, 1175, 1568];
            fanfare.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.setValueAtTime(freq, now + i * 0.15);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, now + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.3);
            });
            return;
    }
}

// Get available card types based on number of matches made
function getAvailableTypes() {
    // Start with 5 types, add more as game progresses
    // Every 5 matches, add a new type (up to 10 total)
    const typeCount = Math.min(5 + Math.floor(matches / 5), 10);
    return CARD_TYPES.slice(0, typeCount);
}

// Fisher-Yates shuffle
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Generate cards for initial deal or refill
function generateCards(count) {
    const availableTypes = getAvailableTypes();
    const cardList = [];

    // Create pairs of cards
    const pairsNeeded = Math.ceil(count / 2);

    for (let i = 0; i < pairsNeeded; i++) {
        const typeIndex = i % availableTypes.length;
        cardList.push({ ...availableTypes[typeIndex] });
        cardList.push({ ...availableTypes[typeIndex] });
    }

    // Trim to exact count needed (in case of odd number)
    return shuffleArray(cardList).slice(0, count);
}

// Render the grid
function renderGrid() {
    cardGrid.innerHTML = '';

    for (let i = 0; i < TOTAL_SLOTS; i++) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = i;

        if (grid[i]) {
            cardElement.textContent = grid[i].emoji;
            cardElement.addEventListener('click', () => handleCardClick(i));

            if (i === selectedIndex) {
                cardElement.classList.add('selected');
            }
        } else {
            cardElement.classList.add('empty');
        }

        cardGrid.appendChild(cardElement);
    }
}

// Get row and column from index
function getRowCol(index) {
    return {
        row: Math.floor(index / GRID_COLS),
        col: index % GRID_COLS
    };
}

// Check if two indices are adjacent
function areAdjacent(index1, index2) {
    const pos1 = getRowCol(index1);
    const pos2 = getRowCol(index2);

    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);

    // Adjacent means within 1 cell in both directions (including diagonals)
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
}

// Handle card click
function handleCardClick(index) {
    if (isProcessing) return;
    if (!grid[index]) return; // Empty slot

    initAudio();

    if (selectedIndex === null) {
        // First card selection
        selectedIndex = index;
        playSound('select');
        renderGrid();
    } else if (selectedIndex === index) {
        // Clicking same card - deselect
        selectedIndex = null;
        renderGrid();
    } else {
        // Second card selection
        const card1 = grid[selectedIndex];
        const card2 = grid[index];

        if (card1.name === card2.name && areAdjacent(selectedIndex, index)) {
            // Valid match!
            isProcessing = true;
            playSound('match');

            // Mark cards for removal animation
            const elements = cardGrid.children;
            elements[selectedIndex].classList.add('matched');
            elements[index].classList.add('matched');

            const idx1 = selectedIndex;
            const idx2 = index;
            selectedIndex = null;

            // After animation, remove cards and slide
            setTimeout(() => {
                removeCardsAndSlide(idx1, idx2);
            }, 400);
        } else {
            // Invalid match
            playSound('invalid');

            const elements = cardGrid.children;
            elements[selectedIndex].classList.add('invalid');
            elements[index].classList.add('invalid');

            setTimeout(() => {
                elements[selectedIndex].classList.remove('invalid');
                elements[index].classList.remove('invalid');
                selectedIndex = null;
                renderGrid();
            }, 300);
        }
    }
}

// Remove matched cards and slide remaining cards
function removeCardsAndSlide(idx1, idx2) {
    // Remove the matched cards
    grid[idx1] = null;
    grid[idx2] = null;

    // Update score
    score += POINTS_PER_MATCH;
    matches++;
    updateScore();

    // Slide cards to fill gaps
    slideCards();

    playSound('slide');

    setTimeout(() => {
        // Fill empty spaces with new random tiles
        fillEmptySpaces();

        playSound('deal');
        renderGrid();

        // Check if there are valid moves
        setTimeout(() => {
            if (!hasValidMoves()) {
                // No valid moves - game over
                endGame();
            } else {
                isProcessing = false;
            }
        }, 100);
    }, 100);
}

// Get all adjacent indices for a given index
function getAdjacentIndices(index) {
    const { row, col } = getRowCol(index);
    const adjacent = [];

    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue;
            if (r === row && c === col) continue;
            adjacent.push(r * GRID_COLS + c);
        }
    }
    return adjacent;
}

// Fill empty spaces with new random tiles (biased to avoid creating matches)
function fillEmptySpaces() {
    const availableTypes = getAvailableTypes();

    // Fill each empty slot with a card type that avoids adjacent matches
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        if (grid[i] === null) {
            // Get types of adjacent cards
            const adjacentIndices = getAdjacentIndices(i);
            const adjacentTypes = new Set();

            for (const adjIdx of adjacentIndices) {
                if (grid[adjIdx] !== null) {
                    adjacentTypes.add(grid[adjIdx].name);
                }
            }

            // Filter out types that would create an immediate match
            const safeTypes = availableTypes.filter(type => !adjacentTypes.has(type.name));

            // Pick from safe types if available, otherwise fall back to random
            const typePool = safeTypes.length > 0 ? safeTypes : availableTypes;
            const chosenType = typePool[Math.floor(Math.random() * typePool.length)];
            grid[i] = { ...chosenType };
        }
    }
}

// Slide cards to fill empty gaps
// Cards slide LEFT within rows, then rows shift UP
function slideCards() {
    // Step 1: Within each row, slide cards LEFT to fill gaps
    for (let row = 0; row < GRID_ROWS; row++) {
        const rowStart = row * GRID_COLS;
        const rowCards = [];

        // Collect non-null cards in this row
        for (let col = 0; col < GRID_COLS; col++) {
            const idx = rowStart + col;
            if (grid[idx] !== null) {
                rowCards.push(grid[idx]);
            }
        }

        // Place cards starting from left, fill rest with null
        for (let col = 0; col < GRID_COLS; col++) {
            const idx = rowStart + col;
            grid[idx] = col < rowCards.length ? rowCards[col] : null;
        }
    }

    // Step 2: Shift cards from lower rows to upper rows to fill gaps
    // Collect all cards in a linear array (reading left-to-right, top-to-bottom)
    const allCards = grid.filter(c => c !== null);

    // Place them back starting from top-left
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        grid[i] = i < allCards.length ? allCards[i] : null;
    }
}

// Check if there are any valid moves remaining
function hasValidMoves() {
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        if (!grid[i]) continue;

        for (let j = i + 1; j < TOTAL_SLOTS; j++) {
            if (!grid[j]) continue;

            if (grid[i].name === grid[j].name && areAdjacent(i, j)) {
                return true;
            }
        }
    }
    return false;
}

// Update score display
function updateScore() {
    scoreDisplay.textContent = score;
    matchesDisplay.textContent = matches;

    // Update high score if needed
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        saveHighScore();
    }
}

// Show notification
function showNotification(message) {
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// End the game
function endGame() {
    isProcessing = false;
    playSound('gameover');

    finalScoreDisplay.textContent = score;

    // Check if it's a new high score
    if (score >= highScore && score > 0) {
        newHighScoreMsg.classList.remove('hidden');
        setTimeout(() => playSound('highscore'), 500);
    } else {
        newHighScoreMsg.classList.add('hidden');
    }

    gameOverOverlay.classList.add('show');
}

// Save high score to localStorage
function saveHighScore() {
    try {
        localStorage.setItem('pairAGoneHighScore', highScore.toString());
    } catch (e) {
        // localStorage not available
    }
}

// Load high score from localStorage
function loadHighScore() {
    try {
        const saved = localStorage.getItem('pairAGoneHighScore');
        if (saved) {
            highScore = parseInt(saved, 10) || 0;
            highScoreDisplay.textContent = highScore;
        }
    } catch (e) {
        // localStorage not available
    }
}

// Initialize/reset game
function initGame() {
    score = 0;
    matches = 0;
    selectedIndex = null;
    isProcessing = false;
    grid = [];

    scoreDisplay.textContent = score;
    matchesDisplay.textContent = matches;

    gameOverOverlay.classList.remove('show');

    // Generate initial cards
    const initialCards = generateCards(TOTAL_SLOTS);
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        grid[i] = initialCards[i] || null;
    }

    renderGrid();

    // Ensure there's at least one valid move
    if (!hasValidMoves()) {
        initGame(); // Retry
    }
}

// Event listeners
restartBtn.addEventListener('click', () => {
    initAudio();
    initGame();
});

// Start the game
loadHighScore();
initGame();
