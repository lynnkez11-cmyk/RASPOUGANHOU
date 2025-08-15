// Estado do jogo
let gameState = {
  currentBalance: 50.0,
  totalEarned: 0.0,
  scratchCardsRemaining: 5,
  currentCard: 1,
  isGameActive: false,
  scratchedPercentage: 0,
  prizeAmount: 0.0,
};

let canvas, ctx;
let isScratching = false;
let scratchedPixels = 0;
let totalPixels = 0;
let dpr = Math.max(1, window.devicePixelRatio || 1);

const symbolPool = [
  { img: "images/1.png", value: 1 },
  { img: "images/2.png", value: 2 },
  { img: "images/5.jpg", value: 5 },
  { img: "images/10.png", value: 10 },
  { img: "images/20.png", value: 20 },
  { img: "images/50.png", value: 50 },
  { img: "images/100.png", value: 100 },
  { img: "images/200.jpg", value: 200 },
  { img: "images/500.png", value: 500 },
];

let brushPattern = null;
let coverImage = null;

window.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("scratchCanvas");
  ctx = canvas.getContext("2d");

  preloadCoverAndInit();
  setupEventListeners();
  updateUI();
  updateCardInfo();
});

function preloadCoverAndInit() {
  coverImage = new Image();
  coverImage.src = "images/raspeaqui.png";
  coverImage.onload = () => {
    const brushImg = new Image();
    brushImg.src = "images/raspagem-textura.png";
    brushImg.onload = () => {
      brushPattern = ctx.createPattern(brushImg, "repeat");
      sizeCanvasFromImage(coverImage);
      drawCover();
      totalPixels = canvas.width * canvas.height;
      updatePrizeSymbols();
    };
  };
}

function sizeCanvasFromImage(img) {
  const container = canvas.parentElement;
  const cssWidth = container.clientWidth;
  const ratio = img.height / img.width;
  const cssHeight = Math.max(160, Math.round(cssWidth * ratio));
  canvas.style.width = cssWidth + "px";
  canvas.style.height = cssHeight + "px";
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawCover() {
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(coverImage, 0, 0, canvas.width / dpr, canvas.height / dpr);
  scratchedPixels = 0;
}

function setupEventListeners() {
  document.getElementById("buyButton").addEventListener("click", startGame);
  document.getElementById("collectButton").addEventListener("click", collectPrize);
  canvas.addEventListener("mousedown", startScratch);
  canvas.addEventListener("mousemove", scratch);
  window.addEventListener("mouseup", stopScratch);
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
  window.addEventListener("touchend", handleTouchEnd, { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("touchmove", (e) => {
    if (e.target === canvas && gameState.isGameActive) e.preventDefault();
  }, { passive: false });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      sizeCanvasFromImage(coverImage);
      if (!gameState.isGameActive) drawCover();
      totalPixels = canvas.width * canvas.height;
    }, 120);
  });
}

function startGame() {
  if (gameState.currentBalance < 10) {
    alert("Saldo insuficiente para jogar!");
    return;
  }
  gameState.currentBalance -= 10;
  gameState.isGameActive = true;
  updateUI();
  document.querySelector(".container").classList.add("game-active");
  const buyButton = document.getElementById("buyButton");
  buyButton.textContent = "Raspando...";
  buyButton.disabled = true;
}

function startScratch(e) { if (!gameState.isGameActive) return; isScratching = true; scratch(e); }
function scratch(e) {
  if (!isScratching || !gameState.isGameActive) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;
  scratchAtPosition(x, y);
}
function stopScratch() { isScratching = false; }
function handleTouchStart(e) { e.preventDefault(); if (!gameState.isGameActive) return; isScratching = true; scratch(e); }
function handleTouchMove(e) { e.preventDefault(); scratch(e); }
function handleTouchEnd(e) { e.preventDefault(); isScratching = false; }

function scratchAtPosition(x, y) {
  if (!gameState.isGameActive) return;
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = brushPattern || "rgba(0,0,0,1)";
  ctx.beginPath();
  ctx.arc(x, y, 18 * dpr, 0, 2 * Math.PI);
  ctx.fill();
  updateScratchedPercentage();
}

function updateScratchedPercentage() {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let transparentPixels = 0;
  for (let i = 3; i < imageData.data.length; i += 4) {
    if (imageData.data[i] === 0) transparentPixels++;
  }
  gameState.scratchedPercentage = (transparentPixels / totalPixels) * 100;
  if (gameState.isGameActive && gameState.scratchedPercentage >= 65) revealPrize();
}

function revealPrize() { if (!gameState.isGameActive) return; gameState.isGameActive = false; ctx.clearRect(0, 0, canvas.width, canvas.height); checkWinCondition(); }
function revealAll() { if (!gameState.isGameActive) return; ctx.clearRect(0, 0, canvas.width, canvas.height); checkWinCondition(); gameState.isGameActive = false; }

function checkWinCondition() {
  const prizeImgs = document.querySelectorAll(".prize-cell img");
  const map = {};
  prizeImgs.forEach((img, i) => { const v = img.dataset.value; (map[v] ||= []).push({ index: i, src: img.src }); });
  for (const v in map) {
    if (map[v].length === 3) {
      map[v].forEach((item) => { prizeImgs[item.index].parentElement.classList.add("winning"); });
      gameState.prizeAmount = Number(v);
      const prizeImageSrc = map[v][0].src;
      setTimeout(() => {
        document.getElementById("prizeWon").textContent = formatCurrency(gameState.prizeAmount);
        document.querySelector(".money-icon").innerHTML = `<img src="${prizeImageSrc}" alt="Prêmio" style="width:60px;height:auto;" />`;
        document.getElementById("popupOverlay").style.display = "flex";
      }, 800);
      break;
    }
  }
}

function collectPrize() { gameState.totalEarned += gameState.prizeAmount; document.getElementById("popupOverlay").style.display = "none"; nextScratchCard(); }
function nextScratchCard() {
  gameState.currentCard++;
  gameState.scratchCardsRemaining--;
  if (gameState.scratchCardsRemaining > 0) resetScratchCard(); else endGame();
  updateUI();
  updateCardInfo();
}

function updatePrizeSymbols() {
  document.querySelectorAll(".prize-cell").forEach((c) => c.classList.remove("winning"));
  const highValueSymbols = symbolPool.filter((sym) => sym.value >= 50 && sym.value <= 200);
  const winningSymbol = highValueSymbols[Math.floor(Math.random() * highValueSymbols.length)];
  const roundSymbols = [];
  for (let i = 0; i < 3; i++) roundSymbols.push(winningSymbol);
  const otherSymbols = symbolPool.filter((sym) => sym.value !== winningSymbol.value);
  while (roundSymbols.length < 9) roundSymbols.push(otherSymbols[Math.floor(Math.random() * otherSymbols.length)]);
  for (let i = roundSymbols.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [roundSymbols[i], roundSymbols[j]] = [roundSymbols[j], roundSymbols[i]]; }
  gameState.prizeAmount = winningSymbol.value;
  const prizeCells = document.querySelectorAll(".prize-cell");
  prizeCells.forEach((cell, index) => {
    const img = document.createElement("img");
    img.src = roundSymbols[index].img;
    img.alt = `${roundSymbols[index].value} Reais`;
    img.dataset.value = roundSymbols[index].value;
    cell.innerHTML = "";
    cell.appendChild(img);
  });
}

function resetScratchCard() {
  document.querySelector(".container").classList.remove("game-active");
  gameState.scratchedPercentage = 0;
  drawCover();
  updatePrizeSymbols();
  if (gameState.currentCard === 1) {
    gameState.isGameActive = false;
    const buyButton = document.getElementById("buyButton");
    if (gameState.currentBalance >= 10) { buyButton.textContent = "Raspar (R$ 10,00)"; buyButton.disabled = false; }
    else { buyButton.textContent = "Saldo Insuficiente"; buyButton.disabled = true; }
  } else {
    if (gameState.currentBalance >= 10) {
      gameState.currentBalance -= 10;
      gameState.isGameActive = true;
      updateUI();
      document.querySelector(".container").classList.add("game-active");
    } else {
      gameState.isGameActive = false;
      const buyButton = document.getElementById("buyButton");
      buyButton.textContent = "Saldo Insuficiente";
      buyButton.disabled = true;
    }
  }
}

function endGame() {
  document.getElementById("buyButton").style.display = "none";
  const redeemButton = document.getElementById("redeemButton");
  redeemButton.style.display = "inline-block";
  redeemButton.onclick = function () {
    const premio = encodeURIComponent(gameState.totalEarned);
    window.location.href = `saque.html?valor=${premio}`;
  };
}

function updateUI() {
  document.getElementById("userBalance").textContent = formatCurrency(gameState.currentBalance);
  document.getElementById("totalEarned").textContent = formatCurrency(gameState.totalEarned);
}

function updateCardInfo() {
  const gameDescription = document.querySelector(".game-description");
  if (gameState.scratchCardsRemaining > 0) gameDescription.textContent = `Raspadinha ${gameState.currentCard} de 5 - Prêmios de até R$ 500,00`;
  else gameDescription.textContent = "Todas as raspadinhas foram completadas!";
}

function formatCurrency(amount) { return `R$ ${amount.toFixed(2).replace(".", ",")}`; }

const style = document.createElement("style");
style.textContent = `@keyframes sparkle { 0% {opacity:1; transform:scale(1);} 100% {opacity:0; transform:scale(2);} }`;
document.head.appendChild(style);