// Game constants
const CARD_WIDTH = 90;
const CARD_HEIGHT = 135;
const CARD_PADDING = 10;
const TOTAL_PAIRS = 6;
const IMAGE_PATHS = [
    'images/Layer 1.jpg', 'images/Layer 2.jpg', 'images/Layer 3.jpg',
    'images/Layer 4.jpg', 'images/Layer 5.jpg', 'images/Layer 6.jpg'
];

// Game state
let canvas, ctx;
let cards = [];
let firstCard = null, secondCard = null;
let matchedPairs = 0;
let isProcessing = false;
let isPaused = false;
let timer = null;
let timeLimit = 15;
let seconds = timeLimit;
let images = {};
// Các biến audio (KHAI BÁO, nhưng CHƯA gán giá trị)
let clickSound, matchSound, nomatchSound;

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

document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startGameButton");
    
    if (startButton) {
        startButton.addEventListener("click", () => {
            window.location.href = "gameplay.html"; // Chuyển hướng sang trang chơi game
        });
    }
});

// Hàm phát âm thanh
function playSound(sound) {
    if (sound) {
        sound.currentTime = 0;
        sound.play();
    } else {
        console.error("Sounds is not existed!");
    }
}

// Load images
async function loadImages() {
    const loadPromises = IMAGE_PATHS.map(path => loadImage(path));
    
    // Load default card-back image
    const backImagePromise = loadImage('images/defaultcard.png');

    // Wait for all images to load
    await Promise.all([...loadPromises, backImagePromise]);

    clickSound = document.getElementById('clickSound');
    matchSound = document.getElementById('matchSound');
    nomatchSound = document.getElementById('nomatchSound');

    createCards();  // Create cards after loading images
    drawAllCards(); // Draw all cards after loading images
    console.log("All images loaded and cards created");
}

// Helper function to load an image
function loadImage(path) {
    return new Promise((resolve, reject) => {
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
}

// Create an error image
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
    tempCtx.fillText('Image Missing', CARD_WIDTH / 2, CARD_HEIGHT / 2);
    
    const img = new Image();
    img.src = tempCanvas.toDataURL();
    return img;
}

// Handle click on canvas
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

// Create cards
function createCards() {
    cards = [];
    const allPaths = [...IMAGE_PATHS, ...IMAGE_PATHS]; // Doubled IMAGE_PATHS here
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
                    imagePath: allPaths[index],  // Set image for card
                    isFlipped: false,
                    isMatched: false,
                });
            }
        }
    }
}

// Draw all cards
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

// Draw card back
function drawCardBack(card) {
    ctx.save();
    ctx.beginPath();

    // Rounded corners
    const radius = 20;
    ctx.moveTo(card.x + radius, card.y);
    ctx.lineTo(card.x + card.width - radius, card.y);
    ctx.quadraticCurveTo(card.x + card.width, card.y, card.x + card.width, card.y + radius);
    ctx.lineTo(card.x + card.width, card.y + card.height - radius);
    ctx.quadraticCurveTo(card.x + card.width, card.y + card.height, card.x + card.width - radius, card.y + card.height);
    ctx.lineTo(card.x + radius, card.y + card.height);
    ctx.quadraticCurveTo(card.x, card.y + card.height, card.x, card.y + card.height - radius);
    ctx.lineTo(card.x, card.y + radius);
    ctx.quadraticCurveTo(card.x, card.y, card.x + radius, card.y);
    ctx.closePath();
    
    ctx.clip(); // Clip the content within the rounded shape

    // Draw back image
    const backImage = images['images/defaultcard.png'];
    if (backImage && backImage.complete) {
        ctx.drawImage(backImage, card.x, card.y, card.width, card.height);
    } else {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(card.x, card.y, card.width, card.height);
    }

    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// Draw flipped card
function drawFlippedCard(card) {
    ctx.clearRect(card.x, card.y, card.width, card.height);
    
    const img = images[card.imagePath];
    if (img && img.complete) {
        ctx.save();
        ctx.beginPath();
        
        // Rounded corners
        const radius = 20;
        ctx.moveTo(card.x + radius, card.y);
        ctx.lineTo(card.x + card.width - radius, card.y);
        ctx.quadraticCurveTo(card.x + card.width, card.y, card.x + card.width, card.y + radius);
        ctx.lineTo(card.x + card.width, card.y + card.height - radius);
        ctx.quadraticCurveTo(card.x + card.width, card.y + card.height, card.x + card.width - radius, card.y + card.height);
        ctx.lineTo(card.x + radius, card.y + card.height);
        ctx.quadraticCurveTo(card.x, card.y + card.height, card.x, card.y + card.height - radius);
        ctx.lineTo(card.x, card.y + radius);
        ctx.quadraticCurveTo(card.x, card.y, card.x + radius, card.y);
        ctx.closePath();
        
        ctx.clip(); // Clip the content within the rounded shape
        
        // Draw image
        ctx.drawImage(img, card.x, card.y, card.width, card.height);
        
        ctx.restore();
    } else {
        drawErrorCard(card); // Draw error card if image not loaded
    }   
}

// Draw error card
function drawErrorCard(card) {
    ctx.fillStyle = '#ffcccc';
    ctx.fillRect(card.x, card.y, card.width, card.height);
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Image Error', card.x + card.width / 2, card.y + card.height / 2);
}

// Draw matched card
function drawMatchedCard(card) {
    const img = images[card.imagePath];
    if (img && img.complete) {
        ctx.save();
        ctx.beginPath();

        // Rounded corners
        const radius = 20;
        ctx.moveTo(card.x + radius, card.y);
        ctx.lineTo(card.x + card.width - radius, card.y);
        ctx.quadraticCurveTo(card.x + card.width, card.y, card.x + card.width, card.y + radius);
        ctx.lineTo(card.x + card.width, card.y + card.height - radius);
        ctx.quadraticCurveTo(card.x + card.width, card.y + card.height, card.x + card.width - radius, card.y + card.height);
        ctx.lineTo(card.x + radius, card.y + card.height);
        ctx.quadraticCurveTo(card.x, card.y + card.height, card.x, card.y + card.height - radius);
        ctx.lineTo(card.x, card.y + radius);
        ctx.quadraticCurveTo(card.x, card.y, card.x + radius, card.y);
        ctx.closePath();

        ctx.clip(); // Clip the content within the rounded shape

        // Draw image
        ctx.drawImage(img, card.x, card.y, card.width, card.height);

        ctx.restore();
    } else {
        drawErrorCard(card);
    }

    // Green highlight for matched card with rounded corners
    ctx.fillStyle = 'rgba(86, 251, 86, 0.39)'; // Màu xanh trong suốt
    ctx.beginPath();
    const radius = 20;
    ctx.moveTo(card.x + radius, card.y);
    ctx.lineTo(card.x + card.width - radius, card.y);
    ctx.quadraticCurveTo(card.x + card.width, card.y, card.x + card.width, card.y + radius);
    ctx.lineTo(card.x + card.width, card.y + card.height - radius);
    ctx.quadraticCurveTo(card.x + card.width, card.y + card.height, card.x + card.width - radius, card.y + card.height);
    ctx.lineTo(card.x + radius, card.y + card.height);
    ctx.quadraticCurveTo(card.x, card.y + card.height, card.x, card.y + card.height - radius);
    ctx.lineTo(card.x, card.y + radius);
    ctx.quadraticCurveTo(card.x, card.y, card.x + radius, card.y);
    ctx.closePath();
    ctx.fill();
}


// Flip card
function flipCard(card) {
    card.isFlipped = true;
    drawAllCards();
    
    if (!firstCard) {
        firstCard = card;
        playSound(clickSound); // Play click sound
    } else {
        secondCard = card;
        isProcessing = true;
        setTimeout(checkMatch, 500);
        playSound(clickSound); // Play click sound
    }
}

// Check if two flipped cards match
function checkMatch() {
    if (firstCard.imagePath === secondCard.imagePath) {
        // Cards match
        firstCard.isMatched = true;
        secondCard.isMatched = true;
        matchedPairs++;

        playSound(matchSound); // Play match sound
        if (matchedPairs === TOTAL_PAIRS) {
            endGame();
        }
    } else {
        firstCard.isFlipped = false;
        secondCard.isFlipped = false;
        playSound(nomatchSound); // Play no match sound
    }
    
    firstCard = null;
    secondCard = null;
    isProcessing = false;
    drawAllCards();
}

// Start the game
function startGame() {
    document.querySelector('main').style.backgroundImage = "url('logo/bg.jpg')";
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("gameContainer").style.display = "block";
    
    
    matchedPairs = 0;
    seconds = timeLimit; // Set time to limit
    document.getElementById("time").textContent = formatTime(seconds); // Hiển thị thời gian ban đầu
    
    createCards();
    drawAllCards(); // Thêm dòng này để vẽ tất cả các thẻ khi bắt đầu
    
    clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
}


// Update timer
function updateTimer() {
    if (!isPaused) {
        seconds--; // Giảm 1 giây mỗi lần gọi hàm
        
        // Cập nhật thời gian
        const formattedTime = formatTime(seconds);
        document.getElementById("time").textContent = formattedTime;

        // Nếu thời gian kết thúc
        if (seconds <= 0) {
            clearInterval(timer);
            window.location.href = "gameover.html"; // Chuyển hướng sang trang gameover.html
        }
    }
}

// Hàm định dạng thời gian
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);  // Tính số phút
    const remainingSeconds = seconds % 60;     // Tính số giây còn lại

    // Trả về chuỗi thời gian theo định dạng '00:00'
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}


// End the game
function endGame() {
    clearInterval(timer);
    window.location.href = "complete.html"; // Redirect to win page
}

// Restart the game
function restartGame() {
    location.reload();
}

// Nếu truy cập với ?start=true thì tự động bắt đầu game
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldStartGame = urlParams.get("start");

    if (shouldStartGame === "true" && typeof startGame === "function") {
        startGame();
    }
});