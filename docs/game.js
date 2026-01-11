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

// Multiplier constants
const MULTIPLIER_START = 1.0;
const MULTIPLIER_MAX = 5.0;
const MULTIPLIER_INCREMENT = 0.5;
const MULTIPLIER_DECAY_RATE = 0.075;
const MULTIPLIER_DECAY_INTERVAL = 100;

// Game state
let grid = []; // Array of card objects or null for empty slots
let selectedIndex = null;
let score = 0;
let matches = 0;
let highScore = 0;
let isProcessing = false;

// Multiplier state
let multiplier = MULTIPLIER_START;
let multiplierDecayTimer = null;
let comboCount = 0;
let lastMatchTime = null;

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

// Multiplier DOM elements
const multiplierDisplay = document.getElementById('multiplier');
const multiplierFill = document.getElementById('multiplier-fill');
const comboDisplay = document.getElementById('combo');
const multiplierPop = document.getElementById('multiplier-pop');

// Audio context for sound effects
let audioContext = null;
let audioUnlocked = false;
let soundEnabled = true;

// Settings DOM elements
const configBtn = document.getElementById('config-btn');
const settingsOverlay = document.getElementById('settings-overlay');
const soundToggle = document.getElementById('sound-toggle');
const closeSettingsBtn = document.getElementById('close-settings');
const resetHighScoreBtn = document.getElementById('reset-highscore');

// Initialize and unlock audio context for mobile browsers (especially iOS Safari)
function initAudio() {
    return new Promise((resolve) => {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume audio context if suspended (required for mobile browsers)
        if (audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                unlockWithOscillator();
                resolve();
            });
        } else {
            unlockWithOscillator();
            resolve();
        }
    });
}

// Play a brief oscillator to unlock audio on iOS
function unlockWithOscillator() {
    if (audioUnlocked) return;

    try {
        // iOS needs an actual oscillator played, not just a silent buffer
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.001, audioContext.currentTime); // Nearly silent
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(0);
        osc.stop(audioContext.currentTime + 0.001);
        audioUnlocked = true;
        console.log('Audio unlocked, context state:', audioContext.state);
    } catch (e) {
        console.log('Audio unlock failed:', e);
    }
}

// Unlock audio on first touch/click anywhere on the page
function setupAudioUnlock() {
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];

    const unlockAudio = () => {
        initAudio();
        events.forEach(e => document.removeEventListener(e, unlockAudio, true));
    };

    events.forEach(e => document.addEventListener(e, unlockAudio, { once: true, capture: true }));
}

setupAudioUnlock();

// Sound effects using Web Audio API
function playSound(type) {
    if (!audioContext || !soundEnabled) return;

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

        case 'combo':
            // Rising pitch for combo increase
            const baseFreq = 600 + (comboCount * 50);
            oscillator.frequency.setValueAtTime(baseFreq, now);
            oscillator.frequency.setValueAtTime(baseFreq + 100, now + 0.1);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.12, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;

        case 'comboLost':
            // Descending tone for combo lost
            oscillator.frequency.setValueAtTime(300, now);
            oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.3);
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.08, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
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

// Delegated event handler for card grid
function handleGridClick(event) {
    const cardElement = event.target.closest('.card');
    if (!cardElement) return;
    const index = parseInt(cardElement.dataset.index, 10);
    handleCardClick(index);
}

// Update selection state of a single card
function updateCardSelection(index, selected) {
    const cardElement = cardGrid.children[index];
    if (!cardElement) return;

    if (selected) {
        cardElement.classList.add('selected');
    } else {
        cardElement.classList.remove('selected');
    }
}

// Update content and state of a single card
function updateCardContent(index) {
    const cardElement = cardGrid.children[index];
    if (!cardElement) return;

    // Clear any animation classes
    cardElement.classList.remove('matched', 'invalid', 'selected');

    if (grid[index]) {
        cardElement.textContent = grid[index].emoji;
        cardElement.classList.remove('empty');
    } else {
        cardElement.textContent = '';
        cardElement.classList.add('empty');
    }
}

// Initialize grid with one-time DOM creation and event delegation
function initializeGrid() {
    cardGrid.innerHTML = '';

    // Create all 20 card elements
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = i;
        cardGrid.appendChild(cardElement);
    }

    // Attach single delegated listener
    cardGrid.addEventListener('click', handleGridClick);

    // Populate with initial content
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        updateCardContent(i);
    }
}

// Render the grid (refactored to use selective updates)
function renderGrid() {
    // Update all card contents
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        updateCardContent(i);
    }

    // Update selection state
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        updateCardSelection(i, i === selectedIndex);
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
        updateCardSelection(index, true);
    } else if (selectedIndex === index) {
        // Clicking same card - deselect
        updateCardSelection(selectedIndex, false);
        selectedIndex = null;
    } else {
        // Second card selection
        const card1 = grid[selectedIndex];
        const card2 = grid[index];

        if (card1.name === card2.name && areAdjacent(selectedIndex, index)) {
            // Valid match!
            isProcessing = true;
            playSound('match');
            onMatchSuccess();

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
            onMatchFailure();

            const elements = cardGrid.children;
            elements[selectedIndex].classList.add('invalid');
            elements[index].classList.add('invalid');

            setTimeout(() => {
                elements[selectedIndex].classList.remove('invalid');
                elements[index].classList.remove('invalid');
                selectedIndex = null;
            }, 300);
        }
    }
}

// Remove matched cards and slide remaining cards
function removeCardsAndSlide(idx1, idx2) {
    // Remove the matched cards
    grid[idx1] = null;
    grid[idx2] = null;

    // Update score with multiplier
    const earnedPoints = calculateScore(POINTS_PER_MATCH);
    score += earnedPoints;
    matches++;
    updateScore();

    // Slide cards to fill gaps
    slideCards();

    playSound('slide');

    // After sliding, update all cards since positions changed
    renderGrid();

    setTimeout(() => {
        // Track which slots are empty before filling
        const slotsToUpdate = [];
        for (let i = 0; i < TOTAL_SLOTS; i++) {
            if (grid[i] === null) {
                slotsToUpdate.push(i);
            }
        }

        // Fill empty spaces with new random tiles
        fillEmptySpaces();

        // Update only the slots that were filled
        for (const index of slotsToUpdate) {
            updateCardContent(index);
        }

        playSound('deal');

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

// Multiplier functions
function startMultiplierDecay() {
    if (multiplierDecayTimer) return;

    lastMatchTime = Date.now();
    multiplierDecayTimer = setInterval(() => {
        if (multiplier > MULTIPLIER_START) {
            // Decay rate increases with combo: baseRate * (1 + combo * 0.1)
            const decayMultiplier = 1 + (comboCount * 0.1);
            const decay = MULTIPLIER_DECAY_RATE * decayMultiplier * (MULTIPLIER_DECAY_INTERVAL / 1000);
            multiplier = Math.max(MULTIPLIER_START, multiplier - decay);
            updateMultiplierDisplay();
        }
    }, MULTIPLIER_DECAY_INTERVAL);
}

function stopMultiplierDecay() {
    if (multiplierDecayTimer) {
        clearInterval(multiplierDecayTimer);
        multiplierDecayTimer = null;
    }
}

function onMatchSuccess() {
    comboCount++;
    multiplier = Math.min(MULTIPLIER_MAX, multiplier + MULTIPLIER_INCREMENT);
    lastMatchTime = Date.now();

    // Visual and audio feedback for multiplier increase
    if (comboCount > 1) {
        showMultiplierPop('+' + MULTIPLIER_INCREMENT.toFixed(1) + 'x');
        playSound('combo');
    }
    updateMultiplierDisplay();

    // Start decay if not already running
    startMultiplierDecay();
}

function onMatchFailure() {
    // Reset multiplier on failed match
    if (multiplier > MULTIPLIER_START || comboCount > 0) {
        showMultiplierPop('Combo Lost!', 'negative');
        playSound('comboLost');
    }
    multiplier = MULTIPLIER_START;
    comboCount = 0;
    updateMultiplierDisplay();
}

function calculateScore(basePoints) {
    return Math.round(basePoints * multiplier);
}

function updateMultiplierDisplay() {
    multiplierDisplay.textContent = multiplier.toFixed(1) + 'x';
    comboDisplay.textContent = comboCount;

    // Update progress bar (0% at 1.0x, 100% at max)
    const progress = ((multiplier - MULTIPLIER_START) / (MULTIPLIER_MAX - MULTIPLIER_START)) * 100;
    multiplierFill.style.width = progress + '%';

    // Color coding based on multiplier level
    multiplierDisplay.classList.remove('multiplier-good', 'multiplier-epic', 'multiplier-legendary');
    if (multiplier >= 4.0) {
        multiplierDisplay.classList.add('multiplier-legendary');
    } else if (multiplier >= 3.0) {
        multiplierDisplay.classList.add('multiplier-epic');
    } else if (multiplier >= 2.0) {
        multiplierDisplay.classList.add('multiplier-good');
    }
}

function showMultiplierPop(text, type = 'positive') {
    multiplierPop.textContent = text;
    multiplierPop.className = 'multiplier-pop show ' + type;

    setTimeout(() => {
        multiplierPop.classList.remove('show');
    }, 800);
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
    stopMultiplierDecay();
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

// Reset high score
function resetHighScore() {
    highScore = 0;
    highScoreDisplay.textContent = highScore;
    try {
        localStorage.removeItem('pairAGoneHighScore');
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

    // Reset multiplier state
    multiplier = MULTIPLIER_START;
    comboCount = 0;
    lastMatchTime = null;
    stopMultiplierDecay();
    updateMultiplierDisplay();

    scoreDisplay.textContent = score;
    matchesDisplay.textContent = matches;

    gameOverOverlay.classList.remove('show');

    // Generate initial cards
    const initialCards = generateCards(TOTAL_SLOTS);
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        grid[i] = initialCards[i] || null;
    }

    initializeGrid();

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

// Settings functions
function openSettings() {
    settingsOverlay.classList.add('show');
}

function closeSettings() {
    settingsOverlay.classList.remove('show');
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    soundToggle.classList.toggle('active', soundEnabled);
    saveSoundSetting();
}

function saveSoundSetting() {
    try {
        localStorage.setItem('pairAGoneSoundEnabled', soundEnabled.toString());
    } catch (e) {
        // localStorage not available
    }
}

function loadSoundSetting() {
    try {
        const saved = localStorage.getItem('pairAGoneSoundEnabled');
        if (saved !== null) {
            soundEnabled = saved === 'true';
        }
        soundToggle.classList.toggle('active', soundEnabled);
    } catch (e) {
        // localStorage not available
    }
}

// Settings event listeners
configBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
soundToggle.addEventListener('click', toggleSound);
resetHighScoreBtn.addEventListener('click', resetHighScore);
settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
        closeSettings();
    }
});

// Share functionality
const shareLink = document.getElementById('share-link');
const shareOverlay = document.getElementById('share-overlay');
const closeShareBtn = document.getElementById('close-share');

function openShare(e) {
    e.preventDefault();
    shareOverlay.classList.add('show');
}

function closeShare() {
    shareOverlay.classList.remove('show');
}

shareLink.addEventListener('click', openShare);
closeShareBtn.addEventListener('click', closeShare);
shareOverlay.addEventListener('click', (e) => {
    if (e.target === shareOverlay) {
        closeShare();
    }
});

// Start the game
loadHighScore();
loadSoundSetting();
initGame();
