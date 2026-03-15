/**
 * Blackjack Pro - Core Game Logic & Card System
 */

// Constants
const SUITS = [
    { name: 'Hearts', symbol: '♥', color: 'red' },
    { name: 'Diamonds', symbol: '♦', color: 'red' },
    { name: 'Clubs', symbol: '♣', color: 'black' },
    { name: 'Spades', symbol: '♠', color: 'black' }
];

const VALUES = [
    { label: 'A', value: 11 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
    { label: '6', value: 6 },
    { label: '7', value: 7 },
    { label: '8', value: 8 },
    { label: '9', value: 9 },
    { label: '10', value: 10 },
    { label: 'J', value: 10 },
    { label: 'Q', value: 10 },
    { label: 'K', value: 10 }
];

// Game State
const state = {
    p1: { score: 0, wins: 0, cards: [], el: null, cardContainer: null },
    p2: { score: 0, wins: 0, cards: [], el: null, cardContainer: null },
    deck: [],
    timer: 30,
    npcActive: false,
    gameOver: false
};

// DOM Cache
const dom = {
    timer: document.getElementById('timer'),
    p1Score: document.getElementById('idDoElemento'),
    p2Score: document.getElementById('idDoElemento2'),
    p1Wins: document.getElementById('winnerP1'),
    p2Wins: document.getElementById('winnerP2'),
    p1Cards: document.getElementById('cardsP1'),
    p2Cards: document.getElementById('cardsP2'),
    history: document.getElementById('historico'),
    npcBtn: document.getElementById('TrocarNPC'),
    p2Btn: document.getElementById('cartaP2'),
    modal: document.getElementById('winnerModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalP1Score: document.getElementById('modalP1Score'),
    modalP2Score: document.getElementById('modalP2Score'),
    modalReason: document.getElementById('modalReason'),
    modalP2Label: document.getElementById('modalP2Label')
};

// Initialization
function init() {
    state.p1.el = dom.p1Score;
    state.p1.cardContainer = dom.p1Cards;
    state.p2.el = dom.p2Score;
    state.p2.cardContainer = dom.p2Cards;
    
    createDeck();
    updateDisplay();
    startTimerCycle();
}

// Deck Logic
function createDeck() {
    state.deck = [];
    for (const suit of SUITS) {
        for (const val of VALUES) {
            state.deck.push({ ...val, ...suit });
        }
    }
    shuffleDeck();
}

function shuffleDeck() {
    for (let i = state.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
}

// Timer Logic
let timerInterval;
function startTimerCycle() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (state.gameOver) return;

        state.timer--;
        dom.timer.textContent = state.timer;

        if (state.npcActive && state.timer > 0) {
            handleNPCTurn();
        }

        if (state.timer <= 0) {
            endRound();
        }
    }, 1000);
}

// NPC Intelligence
function handleNPCTurn() {
    if (state.gameOver || !state.npcActive) return;

    const p1 = state.p1.score;
    const p2 = state.p2.score;

    let shouldHit = false;

    if (p1 > 21) {
        shouldHit = false;
    } else if (p2 < p1) {
        shouldHit = true;
    } else if (p2 === p1 && p2 < 17) {
        shouldHit = true;
    }
    
    if (shouldHit && p2 < 21) {
        drawCard('p2');
    }
}

// Game Actions
function drawCard(player) {
    if (state.gameOver) return;
    if (state.deck.length === 0) createDeck();

    const card = state.deck.pop();
    state[player].cards.push(card);
    
    recalculateScore(player);
    renderCard(player, card);
    updateDisplay();

    if (state[player].score === 21) {
        endRound(player);
    } else if (state[player].score > 21) {
        endRound(player === 'p1' ? 'p2' : 'p1');
    }

    // Reaction for NPC
    if (player === 'p1' && state.npcActive) {
        setTimeout(handleNPCTurn, 600);
    }
}

function recalculateScore(player) {
    let total = 0;
    let aces = 0;

    state[player].cards.forEach(card => {
        if (card.label === 'A') aces++;
        total += card.value;
    });

    // Ace logic: 11 down to 1 if bust
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    state[player].score = total;
}

function renderCard(player, card) {
    const container = state[player].cardContainer;
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.color}`;
    
    // Random rotation for natural look
    const rot = (Math.random() * 6 - 3).toFixed(2);
    cardEl.style.setProperty('--rotation', `${rot}deg`);

    cardEl.innerHTML = `
        <div class="card-top">
            <div class="card-value">${card.label}</div>
            <div class="card-suit">${card.symbol}</div>
        </div>
        <div class="card-center">${card.symbol}</div>
        <div class="card-bottom">
            <div class="card-value">${card.label}</div>
            <div class="card-suit">${card.symbol}</div>
        </div>
    `;

    container.appendChild(cardEl);
}

function endRound(manualWinner) {
    if (state.gameOver) return;
    state.gameOver = true;
    
    let winner = manualWinner;
    let reason = "";

    const p1 = state.p1.score;
    const p2 = state.p2.score;

    if (!winner) {
        if (p1 > 21 && p2 > 21) {
            winner = 'tie';
            reason = "Both busted!";
        } else if (p1 > 21) {
            winner = 'p2';
            reason = "Player 1 busted!";
        } else if (p2 > 21) {
            winner = 'p1';
            reason = (state.npcActive ? "NPC" : "Player 2") + " busted!";
        } else if (p1 === p2) {
            winner = 'tie';
            reason = "Equal scores!";
        } else if (p1 > p2) {
            winner = 'p1';
            reason = "P1 is closer to 21!";
        } else {
            winner = 'p2';
            reason = (state.npcActive ? "NPC" : "P2") + " is closer to 21!";
        }
    } else {
        if (p1 === 21 && p2 === 21) reason = "Double Blackjack!";
        else if (p1 === 21 && winner === 'p1') reason = "P1 hit 21!";
        else if (p2 === 21 && winner === 'p2') reason = (state.npcActive ? "NPC" : "P2") + " hit 21!";
        else if (p1 > 21) reason = "P1 busted!";
        else if (p2 > 21) reason = (state.npcActive ? "NPC" : "P2") + " busted!";
        else reason = (winner === 'p1' ? "P1" : (state.npcActive ? "NPC" : "P2")) + " won the round!";
    }

    if (winner === 'p1') state.p1.wins++;
    else if (winner === 'p2') state.p2.wins++;

    showModal(winner, reason);
}

function showModal(winner, reason) {
    const p1 = state.p1.score;
    const p2 = state.p2.score;

    dom.modalP1Score.textContent = p1;
    dom.modalP2Score.textContent = p2;
    dom.modalP2Label.textContent = state.npcActive ? "NPC" : "P2";
    dom.modalReason.textContent = reason;

    dom.modalP1Score.className = winner === 'p1' ? 'winning-score' : (winner === 'p2' ? 'losing-score' : '');
    dom.modalP2Score.className = winner === 'p2' ? 'winning-score' : (winner === 'p1' ? 'losing-score' : '');

    if (winner === 'tie') {
        dom.modalTitle.textContent = "It's a Tie!";
    } else {
        dom.modalTitle.textContent = winner === 'p1' ? "P1 Wins!" : (state.npcActive ? "NPC Wins!" : "P2 Wins!");
    }

    const winnerDisplay = winner === 'p1' ? 'P1' : (winner === 'p2' ? (state.npcActive ? 'NPC' : 'P2') : 'None');
    dom.history.textContent = `Last Round: P1 scored ${p1}, P2 scored ${p2}. ${winner === 'tie' ? "It was a Tie!" : winnerDisplay + " Won!"}`;

    dom.modal.classList.add('show');
}

function resetRound() {
    state.p1.score = 0;
    state.p2.score = 0;
    state.p1.cards = [];
    state.p2.cards = [];
    state.timer = 30;
    state.gameOver = false;
    
    dom.p1Cards.innerHTML = '';
    dom.p2Cards.innerHTML = '';
    dom.modal.classList.remove('show');
    
    if (state.deck.length < 10) createDeck(); // Refresh deck if low
    updateDisplay();
}

function reload() {
    state.p1.wins = 0;
    state.p2.wins = 0;
    resetRound();
    dom.history.textContent = "Game Restarted.";
}

function updateDisplay() {
    state.p1.el.textContent = formatScore(state.p1);
    state.p2.el.textContent = formatScore(state.p2);
    dom.p1Wins.textContent = `Wins: ${state.p1.wins}`;
    dom.p2Wins.textContent = `Wins: ${state.p2.wins}`;
    dom.timer.textContent = state.timer;
}

function formatScore(playerData) {
    const total = playerData.score;
    const cards = playerData.cards;
    
    if (cards.length === 0) return 0;
    
    // Check if the current score is "Soft" (includes an Ace counted as 11)
    let totalWithoutAces = 0;
    let acesCount = 0;
    cards.forEach(c => {
        if (c.label === 'A') acesCount++;
        else totalWithoutAces += c.value;
    });

    // If we have at least one Ace and the total is 11, it's a first-card Ace
    if (cards.length === 1 && cards[0].label === 'A') {
        return "1/11";
    }

    return total;
}

// UI Controllers
window.puxarCartaP1 = () => drawCard('p1');
window.puxarCartaP2 = () => drawCard('p2');

window.NPC = () => {
    state.npcActive = !state.npcActive;
    dom.npcBtn.textContent = `NPC: ${state.npcActive ? 'ON' : 'OFF'}`;
    dom.p2Btn.style.display = state.npcActive ? 'none' : 'flex';
    resetRound();
};

window.reload = reload;

// Hotkeys
document.addEventListener('keydown', (e) => {
    if (e.key === '1') window.puxarCartaP1();
    if (e.key === '2' && !state.npcActive) window.puxarCartaP2();
    if (e.key.toLowerCase() === 'r') window.reload();
});

// Run Init
init();
