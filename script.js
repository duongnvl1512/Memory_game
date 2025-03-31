let matchedPairs = 0;
const totalPairs = 6; // Fixed at 6 pairs
const values = ['A', 'B', 'C', 'D', 'E', 'F', 'A', 'B', 'C', 'D', 'E', 'F'];
let firstCard = null, secondCard = null;
let isProcessing = false;
let timer = null;
let seconds = 0;
let score = 0;
let isPaused = false;
let timeLimit = 20;
let gameTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    values.sort(() => 0.5 - Math.random());
    createCards();
});

function createCards() {
    const gameBoard = document.getElementById("gameBoard");
    gameBoard.innerHTML = "";
    values.forEach(value => {
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.value = value;
        card.textContent = "?";
        card.addEventListener("click", flipCard);
        gameBoard.appendChild(card);
    });
}

function showSettings() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("settingsScreen").style.display = "block";
}

function saveSettings() {
    timeLimit = parseInt(document.getElementById("timeLimit").value);
    document.getElementById("settingsScreen").style.display = "none";
    document.getElementById("startScreen").style.display = "block";
}

function startGame() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    
    matchedPairs = 0;
    seconds = 0;
    score = 0;
    document.getElementById("time").textContent = "00";
    
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
    
    if (timeLimit > 0) {
        clearTimeout(gameTimer);
        gameTimer = setTimeout(() => {
            clearInterval(timer);
            alert(`Time's up! Your score: ${score}`);
            restartGame();
        }, timeLimit * 1000);
    }
}

function updateTimer() {
    if (!isPaused) {
        seconds++;
        document.getElementById("time").textContent = seconds.toString().padStart(2, '0');
    }
}

function flipCard() {
    if (this.classList.contains("flipped") || isProcessing || isPaused) return;
    
    this.classList.add("flipped");
    this.textContent = this.dataset.value;
    
    if (!firstCard) {
        firstCard = this;
    } else {
        secondCard = this;
        isProcessing = true;
        checkMatch();
    }
}

function checkMatch() {
    setTimeout(() => {
        if (firstCard.dataset.value === secondCard.dataset.value) {
            matchedPairs++;
            score += 10;
            firstCard = secondCard = null;
            if (matchedPairs === totalPairs) {
                endGame();
            }
        } else {
            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");
            firstCard.textContent = secondCard.textContent = "?";
            firstCard = secondCard = null;
            score = Math.max(0, score - 2);
        }
        isProcessing = false;
    }, 500);
}

function endGame() {
    clearInterval(timer);
    clearTimeout(gameTimer);
    document.getElementById("gameContainer").style.display = "none";
    document.getElementById("congratsScreen").style.display = "block";
    document.getElementById("finalTime").textContent = seconds;
    document.getElementById("finalScore").textContent = score;
}

function togglePause() {
    isPaused = !isPaused;
    document.querySelector(".btn-pause").textContent = isPaused ? "Resume" : "Pause";
}

function exitGame() {
    if (confirm("Are you sure you want to exit?")) {
        restartGame();
    }
}

function restartGame() {
    location.reload();
}