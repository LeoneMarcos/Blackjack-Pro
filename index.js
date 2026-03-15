/**
 * Blackjack Pro - Core Game Logic
 */

// Game State
const state = {
    p1: { score: 0, wins: 0, el: null, winEl: null },
    p2: { score: 0, wins: 0, el: null, winEl: null },
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
    state.p1.winEl = dom.p1Wins;
    state.p2.el = dom.p2Score;
    state.p2.winEl = dom.p2Wins;
    
    updateDisplay();
    startTimerCycle();
}

// Timer Logic
let timerInterval;
function startTimerCycle() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (state.gameOver) return;

        state.timer--;
        dom.timer.textContent = state.timer;

        // NPC Turn Automation: Check every second for responsiveness
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

    // Strategic AI: 
    // 1. If P1 busted, NPC stops immediately (it already won).
    // 2. If NPC is already ahead of P1, it stops to avoid risking a bust.
    // 3. NPC only hits if it's behind or needs a basic minimum (like 15) to be competitive.
    
    let shouldHit = false;

    if (p1 > 21) {
        // P1 already bust, NPC doesn't need to do anything.
        shouldHit = false;
    } else if (p2 < p1) {
        // NPC is losing, must hit.
        shouldHit = true;
    } else if (p2 === p1 && p2 < 17) {
        // NPC is tied and score is low, risk a hit to win.
        shouldHit = true;
    }
    
    // Safety check: Never hit if already at 21 or if it would be a reckless risk when ahead.
    if (shouldHit && p2 < 21) {
        drawCard('p2');
    }
}

// Game Actions
function drawCard(player) {
    if (state.gameOver) return;

    const cardValue = Math.floor(Math.random() * 10) + 1;
    state[player].score += cardValue;
    
    // Add animation class
    state[player].el.classList.remove('score-update');
    void state[player].el.offsetWidth; // Trigger reflow
    state[player].el.classList.add('score-update');
    
    updateDisplay();

    if (state[player].score === 21) {
        endRound(player === 'p1' ? 'p1' : 'p2');
        return;
    } else if (state[player].score > 21) {
        endRound(player === 'p1' ? 'p2' : 'p1');
        return;
    }

    // If P1 drew a card and NPC is active, NPC should reconsider immediately
    if (player === 'p1' && state.npcActive) {
        setTimeout(handleNPCTurn, 400); // Slight delay for visual flow
    }
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
            reason = "Player 2 busted!";
        } else if (p1 === p2) {
            winner = 'tie';
            reason = "Equal scores!";
        } else if (p1 > p2) {
            winner = 'p1';
            reason = "P1 is closer to 21!";
        } else {
            winner = 'p2';
            reason = "P2 is closer to 21!";
        }
    } else {
        // Check actual scores to provide the correct reason
        if (p1 === 21 && p2 === 21) reason = "Double Blackjack!";
        else if (p1 === 21 && winner === 'p1') reason = "P1 hit 21!";
        else if (p2 === 21 && winner === 'p2') reason = "P2 hit 21!";
        else if (p1 > 21) reason = "P1 busted!";
        else if (p2 > 21) reason = (state.npcActive ? "NPC" : "P2") + " busted!";
        else reason = (winner === 'p1' ? "P1" : "P2") + " won the round!";
    }

    if (winner === 'p1') {
        state.p1.wins++;
    } else if (winner === 'p2') {
        state.p2.wins++;
    }

    showModal(winner, reason);
}

function showModal(winner, reason) {
    const p1 = state.p1.score;
    const p2 = state.p2.score;

    dom.modalP1Score.textContent = p1;
    dom.modalP2Score.textContent = p2;
    dom.modalP2Label.textContent = state.npcActive ? "NPC" : "P2";
    dom.modalReason.textContent = reason;

    // Highlights
    dom.modalP1Score.className = winner === 'p1' ? 'winning-score' : (winner === 'p2' ? 'losing-score' : '');
    dom.modalP2Score.className = winner === 'p2' ? 'winning-score' : (winner === 'p1' ? 'losing-score' : '');

    if (winner === 'tie') {
        dom.modalTitle.textContent = "It's a Tie!";
    } else {
        dom.modalTitle.textContent = winner === 'p1' ? "P1 Wins!" : (state.npcActive ? "NPC Wins!" : "P2 Wins!");
    }

    // Restore Last Round History update
    const winnerDisplay = winner === 'p1' ? 'P1' : (winner === 'p2' ? (state.npcActive ? 'NPC' : 'P2') : 'None');
    dom.history.textContent = `Last Round: P1 scored ${p1}, P2 scored ${p2}. ${winner === 'tie' ? "It was a Tie!" : winnerDisplay + " Won!"}`;

    dom.modal.classList.add('show');
}

function resetRound() {
    state.p1.score = 0;
    state.p2.score = 0;
    state.timer = 30;
    state.gameOver = false;
    dom.modal.classList.remove('show');
    updateDisplay();
}

function reload() {
    state.p1.wins = 0;
    state.p2.wins = 0;
    resetRound();
    dom.history.textContent = "Game Restarted.";
}

function updateDisplay() {
    dom.p1Score.textContent = state.p1.score;
    dom.p2Score.textContent = state.p2.score;
    dom.p1Wins.textContent = `Wins: ${state.p1.wins}`;
    dom.p2Wins.textContent = `Wins: ${state.p2.wins}`;
    dom.timer.textContent = state.timer;
}

// UI Controllers (Linked to HTML)
window.puxarCartaP1 = () => drawCard('p1');
window.puxarCartaP2 = () => drawCard('p2');

window.NPC = () => {
    state.npcActive = !state.npcActive;
    dom.npcBtn.textContent = `NPC: ${state.npcActive ? 'ON' : 'OFF'}`;
    dom.p2Btn.style.display = state.npcActive ? 'none' : 'flex';
    resetRound();
};

window.mudarNivel = null; // Removed

window.reload = reload;

// Hotkeys
document.addEventListener('keydown', (e) => {
    if (e.key === '1') window.puxarCartaP1();
    if (e.key === '2' && !state.npcActive) window.puxarCartaP2();
    if (e.key.toLowerCase() === 'r') window.reload();
});

// Run Init
init();
