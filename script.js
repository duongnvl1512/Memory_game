// Game constants
const CARD_WIDTH = 120;
const CARD_HEIGHT = 160;
const CARD_PADDING = 10;
const TOTAL_PAIRS = 6;
const IMAGE_PATHS = [
    'images/landmark1.jpg', 'images/landmark2.jpg', 'images/landmark3.jpg',
    'images/landmark4.jpg', 'images/landmark5.jpg', 'images/landmark6.jpg'
];

// Game state
let canvas, ctx;
let cards = [];
let firstCard = null, secondCard = null;
let matchedPairs = 0;
let isProcessing = false;
let isPaused = false;
let timer = null;
let gameTimer = null;
let timeLimit = 10;
let seconds = timeLimit;
let images = {};

// Initialize game
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    
    // Add click event listener
    canvas.addEventListener('click', handleCanvasClick);
    
    // Load images
    loadImages().then(() => {
        console.log("All images loaded, ready to play");
    }).catch(error => {
        console.error("Error loading images:", error);
    });
});

async function loadImages() {
    const loadPromises = IMAGE_PATHS.map((path) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                console.log(`Loaded: ${path}`);
                images[path] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`Error loading: ${path}`);
                images[path] = createErrorImage();
                resolve();
            };
        });
    });
    
    await Promise.all(loadPromises);
}

function createErrorImage() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = CARD_WIDTH;
    tempCanvas.height = CARD_HEIGHT;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.fillStyle = '#ffcccc';
    tempCtx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    tempCtx.fillStyle = '#333';
    tempCtx.font = '16px Arial';
    tempCtx.textAlign = 'center';
    tempCtx.fillText('Image Missing', CARD_WIDTH/2, CARD_HEIGHT/2);
    
    const img = new Image();
    img.src = tempCanvas.toDataURL();
    return img;
}

function handleCanvasClick(e) {
    if (isProcessing || isPaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const clickedCard = cards.find(card => 
        !card.isMatched && 
        x >= card.x && x <= card.x + card.width &&
        y >= card.y && y <= card.y + card.height
    );
    
    if (clickedCard && !clickedCard.isFlipped) {
        flipCard(clickedCard);
    }
}

function createCards() {
    cards = [];
    const allPaths = [...IMAGE_PATHS, ...IMAGE_PATHS];
    allPaths.sort(() => Math.random() - 0.5);
    
    const cols = 4;
    const rows = 3;
    canvas.width = cols * (CARD_WIDTH + CARD_PADDING) + CARD_PADDING;
    canvas.height = rows * (CARD_HEIGHT + CARD_PADDING) + CARD_PADDING;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const index = row * cols + col;
            if (index < allPaths.length) {
                cards.push({
                    x: col * (CARD_WIDTH + CARD_PADDING) + CARD_PADDING,
                    y: row * (CARD_HEIGHT + CARD_PADDING) + CARD_PADDING,
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                    imagePath: allPaths[index],
                    isFlipped: false,
                    isMatched: false
                });
            }
        }
    }
    
    drawAllCards();
}

function drawAllCards() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    cards.forEach(card => {
        if (card.isMatched) {
            drawMatchedCard(card);
        } else if (card.isFlipped) {
            drawFlippedCard(card);
        } else {
            drawCardBack(card);
        }
    });
}

function drawCardBack(card) {
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(card.x, card.y, card.width, card.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(card.x, card.y, card.width, card.height);
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', card.x + card.width/2, card.y + card.height/2);
}

function drawFlippedCard(card) {
    ctx.clearRect(card.x, card.y, card.width, card.height);
    
    const img = images[card.imagePath];
    if (img && img.complete) {
        try {
            ctx.drawImage(img, card.x, card.y, card.width, card.height);
        } catch (e) {
            console.error("Error drawing image:", e);
            drawErrorCard(card);
        }
    } else {
        drawErrorCard(card);
    }
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(card.x, card.y, card.width, card.height);
}

function drawErrorCard(card) {
    ctx.fillStyle = '#ffcccc';
    ctx.fillRect(card.x, card.y, card.width, card.height);
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Image Error', card.x + card.width/2, card.y + card.height/2);
}

function drawMatchedCard(card) {
    const img = images[card.imagePath];
    if (img && img.complete) {
        ctx.drawImage(img, card.x, card.y, card.width, card.height);
    } else {
        drawErrorCard(card);
    }
    
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(card.x, card.y, card.width, card.height);
}

function flipCard(card) {
    card.isFlipped = true;
    drawAllCards();
    
    if (!firstCard) {
        firstCard = card;
    } else {
        secondCard = card;
        isProcessing = true;
        setTimeout(checkMatch, 500);
    }
}

function checkMatch() {
    if (firstCard.imagePath === secondCard.imagePath) {
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        matchedPairs++;        
        if (matchedPairs === TOTAL_PAIRS) {
            endGame();
        }
    } else {
        firstCard.isFlipped = false;
        secondCard.isFlipped = false;
    }
    
    firstCard = null;
    secondCard = null;
    isProcessing = false;
    drawAllCards();
}

function flipCard(card) {
    card.isFlipped = true;
    drawAllCards();
    
    if (!firstCard) {
        firstCard = card;
    } else {
        secondCard = card;
        isProcessing = true;
        setTimeout(checkMatch, 500);
    }
}

function checkMatch() {
    if (firstCard.imagePath === secondCard.imagePath) {
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        matchedPairs++;
        
        if (matchedPairs === TOTAL_PAIRS) {
            endGame();
        }
    } else {
        firstCard.isFlipped = false;
        secondCard.isFlipped = false;
    }
    
    firstCard = null;
    secondCard = null;
    isProcessing = false;
    drawAllCards();
}

function startGame() {
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    
    matchedPairs = 0;
    seconds = timeLimit; // Đặt thời gian bắt đầu bằng giới hạn thời gian
    document.getElementById("time").textContent = seconds.toString().padStart(2, '0');
    
    createCards();
    
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!isPaused) {
        seconds--;
        document.getElementById("time").textContent = seconds.toString().padStart(2, '0');
        
        if (seconds <= 0) {
            clearInterval(timer);
            window.location.href = "gameover.html"; // Chuyển hướng sang trang gameover.html
        }
    }
}


function endGame() {
    clearInterval(timer);
    clearTimeout(gameTimer);
    window.location.href = "complete.html"; // Chuyển hướng sang trang win.html
}


function restartGame() {
    location.reload();
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