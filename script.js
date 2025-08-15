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

// Símbolos disponíveis
const symbolPool = [
    { img: 'images/1.png', value: 1 },
    { img: 'images/2.png', value: 2 },
    { img: 'images/5.jpg', value: 5 },
    { img: 'images/10.png', value: 10 },
    { img: 'images/20.png', value: 20 },
    { img: 'images/50.png', value: 50 },
    { img: 'images/100.png', value: 100 },
    { img: 'images/200.jpg', value: 200 },
    { img: 'images/500.png', value: 500 },
];

// Init
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('scratchCanvas');
    ctx = canvas.getContext('2d');

    resizeCanvas();
    initializeScratchSurface();
    setupEventListeners();
    updateUI();
    updateCardInfo();
});

function resizeCanvas() {
    // Calcula dimensões responsivas baseadas no container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - 30; // Subtrai padding
    const containerHeight = Math.min(window.innerHeight * 0.3, 250);
    
    // Define proporção 4:3 para manter consistência
    const aspectRatio = 4 / 3;
    let canvasWidth = containerWidth;
    let canvasHeight = canvasWidth / aspectRatio;
    
    // Ajusta se a altura calculada for muito grande
    if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = canvasHeight * aspectRatio;
    }
    
    // Garante dimensões mínimas
    canvasWidth = Math.max(canvasWidth, 280);
    canvasHeight = Math.max(canvasHeight, 180);
    
    // Aplica as dimensões
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxHeight = containerHeight + 'px';
}

let brushPattern = null;

function initializeScratchSurface() {
    const img = new Image();
    img.src = 'images/raspeaqui.png';

    img.onload = function () {
        // Redimensiona o canvas baseado no container
        resizeCanvas();
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const brushImg = new Image();
        brushImg.src = 'images/raspagem-textura.png';
        brushImg.onload = function () {
            brushPattern = ctx.createPattern(brushImg, 'repeat');
        };

        totalPixels = canvas.width * canvas.height;
        scratchedPixels = 0;

        updatePrizeSymbols();
    };
    
    img.onerror = function() {
        // Fallback se a imagem não carregar
        resizeCanvas();
        ctx.fillStyle = 'linear-gradient(135deg, #666, #888)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        totalPixels = canvas.width * canvas.height;
        scratchedPixels = 0;
        updatePrizeSymbols();
    };
}

function updatePrizeSymbols() {
    // limpa marcas anteriores
    document.querySelectorAll('.prize-cell').forEach(c => c.classList.remove('winning'));

    // Gera apenas símbolos com valor entre 50 e 200
    const highValueSymbols = symbolPool.filter(sym => sym.value >= 50 && sym.value <= 200);
    const winningSymbol = highValueSymbols[Math.floor(Math.random() * highValueSymbols.length)];

    // Garante 3 iguais
    const roundSymbols = [];
    for (let i = 0; i < 3; i++) {
        roundSymbols.push(winningSymbol);
    }

    // Preenche com outros símbolos quaisquer
    const otherSymbols = symbolPool.filter(sym => sym.value !== winningSymbol.value);
    while (roundSymbols.length < 9) {
        roundSymbols.push(otherSymbols[Math.floor(Math.random() * otherSymbols.length)]);
    }

    // Embaralha
    for (let i = roundSymbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roundSymbols[i], roundSymbols[j]] = [roundSymbols[j], roundSymbols[i]];
    }

    gameState.prizeAmount = winningSymbol.value;

    const prizeCells = document.querySelectorAll('.prize-cell');
    prizeCells.forEach((cell, index) => {
        const img = document.createElement('img');
        img.src = roundSymbols[index].img;
        img.alt = `${roundSymbols[index].value} Reais`;
        img.dataset.value = roundSymbols[index].value;
        
        // Adiciona tratamento de erro para imagens
        img.onerror = function() {
            // Fallback: mostra o valor como texto se a imagem não carregar
            cell.innerHTML = `<div class="prize-amount">R$ ${roundSymbols[index].value}</div>`;
        };
        
        cell.innerHTML = '';
        cell.appendChild(img);
    });
}

function setupEventListeners() {
    const buyButton = document.getElementById('buyButton');
    const collectButton = document.getElementById('collectButton');

    buyButton.addEventListener('click', startGame);
    collectButton.addEventListener('click', collectPrize);

    // Mouse
    canvas.addEventListener('mousedown', startScratch);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', stopScratch);
    canvas.addEventListener('mouseleave', stopScratch);

    // Touch
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // Bloqueia menu contexto no canvas
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Impede scroll enquanto raspa
    document.body.addEventListener('touchstart', function (e) {
        if (e.target === canvas) e.preventDefault();
    }, { passive: false });
    document.body.addEventListener('touchend', function (e) {
        if (e.target === canvas) e.preventDefault();
    }, { passive: false });
    document.body.addEventListener('touchmove', function (e) {
        if (e.target === canvas) e.preventDefault();
    }, { passive: false });

    // Resize responsivo
    window.addEventListener('resize', debounce(function () {
        resizeCanvas();
        if (!gameState.isGameActive) {
            initializeScratchSurface();
        }
    }, 250));
    
    // Orientação
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            resizeCanvas();
            if (!gameState.isGameActive) {
                initializeScratchSurface();
            }
        }, 100);
    });
}

// Função debounce para otimizar resize
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function startGame() {
    if (gameState.currentBalance < 10) {
        alert('Saldo insuficiente para jogar!');
        return;
    }
    gameState.currentBalance -= 10;
    gameState.isGameActive = true;
    updateUI();

    document.querySelector('.container').classList.add('game-active');

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

function stopScratch() { isScratching = false; }

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

function handleTouchEnd(e) { e.preventDefault(); isScratching = false; }

function scratchAtPosition(x, y) {
    if (!gameState.isGameActive) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = brushPattern ? brushPattern : 'rgba(0,0,0,1)';
    ctx.beginPath();
    
    // Ajusta o tamanho do pincel baseado no tamanho da tela
    const brushSize = Math.max(15, Math.min(35, canvas.width * 0.08));
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
    ctx.fill();

    updateScratchedPercentage();
}

// -------- ÚNICA versão dessa função ----------
function updateScratchedPercentage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) transparentPixels++;
    }
    gameState.scratchedPercentage = (transparentPixels / totalPixels) * 100;

    // Quando raspou ~65% revela a cartela
    if (gameState.isGameActive && gameState.scratchedPercentage >= 65) {
        revealPrize();
    }
}

function revealPrize() {
    if (!gameState.isGameActive) return;

    // Finaliza raspagem
    gameState.isGameActive = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameState.scratchedPercentage = 100;

    // Marca as 3 iguais
    checkWinCondition();

    // (Opcional) popup aqui
    // showPrizePopup();
}

function revealAll() {
    if (!gameState.isGameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameState.scratchedPercentage = 100;
    checkWinCondition();
    gameState.isGameActive = false;
}

function checkWinCondition() {
    const prizeImgs = document.querySelectorAll('.prize-cell img');
    const map = {};

    prizeImgs.forEach((img, i) => {
        const v = img.dataset.value;
        (map[v] ||= []).push({ index: i, src: img.src });
    });

    for (const v in map) {
        if (map[v].length === 3) {
            map[v].forEach(item => {
                prizeImgs[item.index].parentElement.classList.add('winning');
            });
            gameState.prizeAmount = Number(v);

            // Pega a imagem do símbolo vencedor
            const prizeImageSrc = map[v][0].src;

            // Espera para o jogador ver a vitória
            setTimeout(() => {
                document.getElementById('prizeWon').textContent = formatCurrency(gameState.prizeAmount);

                // Troca o emoji pela imagem real do prêmio
                const moneyIcon = document.querySelector('.money-icon');
                moneyIcon.innerHTML = `<img src="${prizeImageSrc}" alt="Prêmio" style="width:60px;height:auto;max-width:100%;">`;

                document.getElementById('popupOverlay').style.display = 'flex';
            }, 2000);

            break;
        }
    }
}

function collectPrize() {
    gameState.totalEarned += gameState.prizeAmount;
    document.getElementById('popupOverlay').style.display = 'none';
    nextScratchCard();
}

function nextScratchCard() {
    gameState.currentCard++;
    gameState.scratchCardsRemaining--;

    if (gameState.scratchCardsRemaining > 0) {
        resetScratchCard();
    } else {
        endGame();
    }

    updateUI();
    updateCardInfo();
}

function generateRoundSymbols() {
    const roundSymbols = [];
    const winningSymbol = symbolPool[Math.floor(Math.random() * symbolPool.length)];

    // exatamente 3 iguais
    for (let i = 0; i < 3; i++) roundSymbols.push(winningSymbol);

    // completa sem repetir o vencedor
    const otherSymbols = symbolPool.filter(s => s.value !== winningSymbol.value);
    while (roundSymbols.length < 9) {
        roundSymbols.push(otherSymbols[Math.floor(Math.random() * otherSymbols.length)]);
    }

    // embaralha
    for (let i = roundSymbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roundSymbols[i], roundSymbols[j]] = [roundSymbols[j], roundSymbols[i]];
    }

    return { symbols: roundSymbols, prizeValue: winningSymbol.value };
}

function resetScratchCard() {
    ctx.globalCompositeOperation = 'source-over';
    initializeScratchSurface();

    gameState.scratchedPercentage = 0;
    document.querySelector('.container').classList.remove('game-active');

    if (gameState.currentCard === 1) {
        // Primeira vez precisa clicar
        gameState.isGameActive = false;
        const buyButton = document.getElementById('buyButton');
        if (gameState.currentBalance >= 10) {
            buyButton.textContent = 'Raspar (R$ 10,00)';
            buyButton.disabled = false;
        } else {
            buyButton.textContent = 'Saldo Insuficiente';
            buyButton.disabled = true;
        }
    } else {
        // Nas próximas vezes já ativa direto
        if (gameState.currentBalance >= 10) {
            gameState.currentBalance -= 10;
            gameState.isGameActive = true;
            updateUI();
            document.querySelector('.container').classList.add('game-active');
        } else {
            // Se não tiver saldo, desativa o jogo
            gameState.isGameActive = false;
            const buyButton = document.getElementById('buyButton');
            buyButton.textContent = 'Saldo Insuficiente';
            buyButton.disabled = true;
        }
    }
}

function endGame() {
    // Esconde botão de Raspar
    document.getElementById('buyButton').style.display = 'none';

    // Mostra botão de Resgatar
    const redeemButton = document.getElementById('redeemButton');
    redeemButton.style.display = 'inline-block';

    // Define o clique para ir à página de resgate
    redeemButton.onclick = function () {
        const premio = encodeURIComponent(gameState.totalEarned);
        window.location.href = `saque.html?valor=${premio}`;
    };
}

function updateUI() {
    document.getElementById('userBalance').textContent = formatCurrency(gameState.currentBalance);
    document.getElementById('totalEarned').textContent = formatCurrency(gameState.totalEarned);
}

function updateCardInfo() {
    const gameDescription = document.querySelector('.game-description');
    if (gameState.scratchCardsRemaining > 0) {
        gameDescription.textContent = `Raspadinha ${gameState.currentCard} de 5 - Prêmios de até R$ 500,00`;
    } else {
        gameDescription.textContent = 'Todas as raspadinhas foram completadas!';
    }
}

function formatCurrency(amount) {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`;
}

// Efeito visual (opcional)
function addScratchEffect(x, y) {
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
    setTimeout(() => sparkle.remove(), 500);
}

const style = document.createElement('style');
style.textContent = `
@keyframes sparkle { 0% {opacity:1; transform:scale(1);} 100% {opacity:0; transform:scale(2);} }
`;
document.head.appendChild(style);