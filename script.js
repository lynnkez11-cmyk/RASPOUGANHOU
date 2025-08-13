// Game State
let gameState = {
    currentBalance: 50.00,
    totalEarned: 0.00,
    scratchCardsRemaining: 5,
    currentCard: 1,
    isGameActive: false,
    scratchedPercentage: 0,
    prizeAmount: 0.00
};

// Canvas and context
let canvas, ctx;
let isScratching = false;
let scratchedPixels = 0;
let totalPixels = 0;

// Prize configurations for each card
const prizeConfigs = [
    { amount: 100.00, symbols: ['💰', '💰', '💰', '💎', '🎯', '💎', '🎯', '💎', '🎯'] },
    { amount: 50.00, symbols: ['🎯', '🎯', '🎯', '💰', '💎', '💰', '💎', '💰', '💎'] },
    { amount: 25.00, symbols: ['💎', '💎', '💎', '💰', '🎯', '💰', '🎯', '💰', '🎯'] },
    { amount: 0.00, symbols: ['💰', '💎', '🎯', '💰', '💎', '🎯', '💰', '💎', '🎯'] },
    { amount: 75.00, symbols: ['🎯', '🎯', '🎯', '💰', '💎', '💰', '💎', '💰', '💎'] }
];

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    canvas = document.getElementById('scratchCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    
    // Initialize scratch surface
    initializeScratchSurface();
    
    // Event listeners
    setupEventListeners();
    
    // Update UI
    updateUI();
    
    // Update card counter
    updateCardInfo();
});

function resizeCanvas() {
    const container = canvas.parentElement;
    
    canvas.width = 300;
    canvas.height = 200;
    canvas.style.width = '100%';
    canvas.style.height = '200px';
}

function initializeScratchSurface() {
    // Create scratch surface with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#888');
    gradient.addColorStop(0.5, '#999');
    gradient.addColorStop(1, '#777');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add texture pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < canvas.width; i += 15) {
        for (let j = 0; j < canvas.height; j += 15) {
            if ((i + j) % 30 === 0) {
                ctx.fillRect(i, j, 8, 8);
            }
        }
    }
    
    // Set composite operation for scratching
    ctx.globalCompositeOperation = 'destination-out';
    
    // Calculate total pixels for percentage calculation
    totalPixels = canvas.width * canvas.height;
    scratchedPixels = 0;
    
    // Update prize symbols for current card
    updatePrizeSymbols();
}

function updatePrizeSymbols() {
    const currentConfig = prizeConfigs[gameState.currentCard - 1];
    const prizeCells = document.querySelectorAll('.prize-cell');
    const prizeAmount = document.querySelector('.prize-amount');
    
    // Update symbols
    prizeCells.forEach((cell, index) => {
        cell.textContent = currentConfig.symbols[index];
    });
    
    // Update prize amount
    prizeAmount.textContent = formatCurrency(currentConfig.amount);
    gameState.prizeAmount = currentConfig.amount;
}

function setupEventListeners() {
    const buyButton = document.getElementById('buyButton');
    const collectButton = document.getElementById('collectButton');
    
    buyButton.addEventListener('click', startGame);
    collectButton.addEventListener('click', collectPrize);
    
    // Mouse events
    canvas.addEventListener('mousedown', startScratch);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', stopScratch);
    canvas.addEventListener('mouseleave', stopScratch);
    
    // Touch events for mobile - melhorados
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    
    // Prevent default behaviors that interfere with touch
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Prevent page scrolling when touching canvas
    document.body.addEventListener('touchstart', function(e) {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.body.addEventListener('touchend', function(e) {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.body.addEventListener('touchmove', function(e) {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });
}

function startGame() {
    if (gameState.currentBalance < 10) {
        alert('Saldo insuficiente para jogar!');
        return;
    }
    
    // Deduct cost from balance
    gameState.currentBalance -= 10;
    gameState.isGameActive = true;
    
    // Update UI
    updateUI();
    
    // Enable scratching
    document.querySelector('.container').classList.add('game-active');
    
    // Update button
    const buyButton = document.getElementById('buyButton');
    buyButton.textContent = 'Raspando...';
    buyButton.disabled = true;
}

function startScratch(e) {
    if (!gameState.isGameActive) return;
    
    isScratching = true;
    scratch(e);
}

function scratch(e) {
    if (!isScratching || !gameState.isGameActive) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    scratchAtPosition(x, y);
}

function stopScratch() {
    isScratching = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    if (!gameState.isGameActive) return;
    
    isScratching = true;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    scratchAtPosition(x, y);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!isScratching || !gameState.isGameActive) return;
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    scratchAtPosition(x, y);
}

function handleTouchEnd(e) {
    e.preventDefault();
    isScratching = false;
}

function scratchAtPosition(x, y) {
    // Draw larger scratch mark for better touch experience
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add multiple smaller circles around for better coverage
    for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * 15;
        const offsetY = (Math.random() - 0.5) * 15;
        ctx.beginPath();
        ctx.arc(x + offsetX, y + offsetY, 12, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Update scratched percentage
    updateScratchedPercentage();
}

function updateScratchedPercentage() {
    // Get image data to calculate scratched area
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let transparentPixels = 0;
    
    // Count transparent pixels (alpha = 0)
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) {
            transparentPixels++;
        }
    }
    
    gameState.scratchedPercentage = (transparentPixels / totalPixels) * 100;
    
    // Check if enough area is scratched (5% threshold)
    if (gameState.scratchedPercentage >= 5 && gameState.isGameActive) {
        revealPrize();
    }
}

function revealPrize() {
    gameState.isGameActive = false;
    
    // Show prize popup after a short delay
    setTimeout(() => {
        showPrizePopup();
    }, 800);
}

function showPrizePopup() {
    const popup = document.getElementById('popupOverlay');
    const prizeWon = document.getElementById('prizeWon');
    
    if (gameState.prizeAmount > 0) {
        prizeWon.textContent = formatCurrency(gameState.prizeAmount);
        popup.querySelector('h2').textContent = 'Parabéns!';
        popup.querySelector('p').textContent = 'Você ganhou';
    } else {
        prizeWon.textContent = 'R$ 0,00';
        popup.querySelector('h2').textContent = 'Que pena!';
        popup.querySelector('p').textContent = 'Tente novamente';
    }
    
    popup.style.display = 'flex';
}

function collectPrize() {
    // Add prize to total earned
    gameState.totalEarned += gameState.prizeAmount;
    
    // Hide popup
    document.getElementById('popupOverlay').style.display = 'none';
    
    // Move to next card
    nextScratchCard();
}

function nextScratchCard() {
    gameState.currentCard++;
    gameState.scratchCardsRemaining--;
    
    if (gameState.scratchCardsRemaining > 0) {
        // Reset for next card
        resetScratchCard();
    } else {
        // Game completed
        endGame();
    }
    
    updateUI();
    updateCardInfo();
}

function resetScratchCard() {
    // Reset canvas
    ctx.globalCompositeOperation = 'source-over';
    initializeScratchSurface();
    
    // Reset game state
    gameState.isGameActive = false;
    gameState.scratchedPercentage = 0;
    
    // Remove active class
    document.querySelector('.container').classList.remove('game-active');
    
    // Update button text
    const buyButton = document.getElementById('buyButton');
    if (gameState.currentBalance >= 10) {
        buyButton.textContent = 'Raspar (R$ 10,00)';
        buyButton.disabled = false;
    } else {
        buyButton.textContent = 'Saldo Insuficiente';
        buyButton.disabled = true;
    }
}

function endGame() {
    const buyButton = document.getElementById('buyButton');
    buyButton.textContent = 'Jogo Finalizado';
    buyButton.disabled = true;
    
    // Show final message
    setTimeout(() => {
        const finalMessage = `🎉 Parabéns! Você completou todas as 5 raspadinhas!\n\n` +
                           `💰 Total ganho: ${formatCurrency(gameState.totalEarned)}\n` +
                           `💳 Saldo final: ${formatCurrency(gameState.currentBalance)}\n\n` +
                           `Obrigado por jogar!`;
        alert(finalMessage);
    }, 1000);
}

function updateUI() {
    // Update balance
    const userBalance = document.getElementById('userBalance');
    userBalance.textContent = formatCurrency(gameState.currentBalance);
    
    // Update total earned
    const totalEarned = document.getElementById('totalEarned');
    totalEarned.textContent = formatCurrency(gameState.totalEarned);
}

function updateCardInfo() {
    // Update game description with current card info
    const gameDescription = document.querySelector('.game-description');
    if (gameState.scratchCardsRemaining > 0) {
        gameDescription.textContent = `Raspadinha ${gameState.currentCard} de 5 - Prêmios de até R$ 100,00`;
    } else {
        gameDescription.textContent = 'Todas as raspadinhas foram completadas!';
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`;
}

// Window resize handler
window.addEventListener('resize', function() {
    resizeCanvas();
    if (!gameState.isGameActive) {
        initializeScratchSurface();
    }
});

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Add some visual feedback for scratching
function addScratchEffect(x, y) {
    // Create temporary sparkle effect
    const sparkle = document.createElement('div');
    sparkle.style.position = 'absolute';
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    sparkle.style.width = '4px';
    sparkle.style.height = '4px';
    sparkle.style.background = '#FFD700';
    sparkle.style.borderRadius = '50%';
    sparkle.style.pointerEvents = 'none';
    sparkle.style.zIndex = '10';
    sparkle.style.animation = 'sparkle 0.5s ease-out forwards';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
        sparkle.remove();
    }, 500);
}

// Add sparkle animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes sparkle {
        0% {
            opacity: 1;
            transform: scale(1);
        }
        100% {
            opacity: 0;
            transform: scale(2);
        }
    }
`;
document.head.appendChild(style);
