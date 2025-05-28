const boardSize = 4;
let board = [];
let score = 0;
let maxLevel = 0;
let gameOver = false;

const rangos = [
  "",                   
  "Recluta",           
  "Soldado Raso",      
  "Cabo",              
  "Cabo Primero",      
  "Sargento",          
  "Sargento Primero",  
  "Subteniente",       
  "Teniente",          
  "Teniente Primero",  
  "Capitán",           
  "Mayor",             
  "Teniente Coronel",  
  "Coronel",           
  "General de Brigada",
  "General de División",
  "Teniente General",  
  "General",           
  "General en Jefe",   
  "Mariscal",          
  "Comandante Estelar" 
];
const borderColors = [
  "transparent",      // 0 
  "#263238",          // 1
  "#37474f",          // 2
  "#455a64",          // 3
  "#546e7a",          // 4
  "#607d8b",          // 5
  "#78909c",          // 6
  "#90a4ae",          // 7
  "#b0bec5",          // 8
  "#cfd8dc",          // 9
  "#eceff1",          // 10
  "#f48fb1",          // 11 
  "#f06292",          // 12
  "#e91e63",          // 13
  "#d81b60",          // 14
  "#c2185b",          // 15
  "#ad1457",          // 16
  "#880e4f",          // 17
  "#4a148c",          // 18
  "#311b92",          // 19
  "#1a237e"           // 20
];
const gameBoard = document.getElementById("gameBoard");
const scoreDisplay = document.getElementById("score");
const maxLevelDisplay = document.getElementById("maxLevel");
const resetButton = document.querySelector('button.btn-secondary');

function initBoard() {
  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
  addRandomRank();
  addRandomRank();
  updateBoard();
}

function addRandomRank() {
  const empty = [];
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = 1;
}

function updateBoard() {
  gameBoard.innerHTML = "";
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = document.createElement("div");
      const level = board[r][c];
      cell.className = `cell level-${level}`;
      if (level > 0) cell.classList.add("spawn");

      const color = borderColors[maxLevel] || "transparent";
      if (maxLevel > 0) {
        gameBoard.style.border = "6px solid";
        const color = borderColors[maxLevel] || "transparent";
        gameBoard.style.borderImage = `linear-gradient(45deg, ${color}, #ffffff) 1`;
      } else {
        gameBoard.style.border = "6px solid transparent";
        gameBoard.style.borderImage = "none";
      }
      

      cell.textContent = rangos[level] || "";
      gameBoard.appendChild(cell);
    }
  }
  scoreDisplay.textContent = score;
  maxLevelDisplay.textContent = maxLevel;
  saveGame();

  if (isGameOver()) {
    gameOver = true;
    setTimeout(() => showToast("¡No quedan movimientos!"), 100);
    resetButton.classList.remove("btn-secondary");
    resetButton.classList.add("btn-danger");
  } else {
    gameOver = false;
    resetButton.classList.remove("btn-danger");
    resetButton.classList.add("btn-secondary");
  }
}

function move(dir) {
  if (gameOver) return;
  let moved = false;
  for (let i = 0; i < boardSize; i++) {
    let line = [];
    for (let j = 0; j < boardSize; j++) {
      let val = (dir === "left" || dir === "right")
        ? board[i][dir === "left" ? j : boardSize - 1 - j]
        : board[dir === "up" ? j : boardSize - 1 - j][i];
      if (val) line.push(val);
    }

    for (let k = 0; k < line.length - 1; k++) {
      if (line[k] === line[k + 1]) {
        line[k]++;
        score += Math.pow(2, line[k]);
        if (line[k] > maxLevel) maxLevel = line[k];
        line.splice(k + 1, 1);
        moved = true;
      }
    }

    while (line.length < boardSize) line.push(0);

    for (let j = 0; j < boardSize; j++) {
      let val = line[j];
      const r = (dir === "up") ? j :
                (dir === "down") ? boardSize - 1 - j : i;
      const c = (dir === "left") ? j :
                (dir === "right") ? boardSize - 1 - j : i;

      if (board[r][c] !== val) moved = true;
      board[r][c] = val;
    }
  }

  if (moved) addRandomRank();
  updateBoard();
}

function isGameOver() {
  // Si hay celdas vacías, no hay fin de juego
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === 0) return false;
      // Comprobamos contiguos para movimientos posibles
      const current = board[r][c];
      if (
        (r > 0 && board[r - 1][c] === current) ||
        (r < boardSize - 1 && board[r + 1][c] === current) ||
        (c > 0 && board[r][c - 1] === current) ||
        (c < boardSize - 1 && board[r][c + 1] === current)
      ) {
        return false;
      }
    }
  }
  return true;
}

function showToast(message, duration = 2500) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

function resetGame() {
  score = 0;
  maxLevel = 0;
  gameOver = false;
  resetButton.classList.remove("btn-danger");
  resetButton.classList.add("btn-secondary");
  initBoard();
}


function saveGame() {
  localStorage.setItem("tablero", JSON.stringify(board));
  localStorage.setItem("puntuacion", score);
  localStorage.setItem("maxPuntuacion", maxLevel);

  const historialMaxScore = parseInt(localStorage.getItem("histMaxScore")) || 0;
  const historialMaxLevel = parseInt(localStorage.getItem("histMaxLevel")) || 0;

  if (score > historialMaxScore) {
    localStorage.setItem("histMaxScore", score);
  }

  if (maxLevel > historialMaxLevel) {
    localStorage.setItem("histMaxLevel", maxLevel);
  }

  // Refrescar pantalla
  document.getElementById("maxScore").textContent = Math.max(score, historialMaxScore);
  document.getElementById("maxRank").textContent = Math.max(maxLevel, historialMaxLevel);
}



function loadGame() {
  const savedBoard = localStorage.getItem("tablero");
  if (savedBoard) {
    board = JSON.parse(savedBoard);
    score = parseInt(localStorage.getItem("puntuacion")) || 0;
    maxLevel = parseInt(localStorage.getItem("maxPuntuacion")) || 0;
    updateBoard();
  } else {
    initBoard();
  }

  const histMaxScore = parseInt(localStorage.getItem("histMaxScore")) || 0;
  const histMaxLevel = parseInt(localStorage.getItem("histMaxLevel")) || 0;
  document.getElementById("maxScore").textContent = histMaxScore;
  document.getElementById("maxRank").textContent = histMaxLevel;
}


document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") move("up");
  else if (e.key === "ArrowDown") move("down");
  else if (e.key === "ArrowLeft") move("left");
  else if (e.key === "ArrowRight") move("right");
});

// Gestos táctiles
let startX, startY;
document.addEventListener("touchstart", (e) => {
  // Sólo prevenir scroll si el toque es en el gameBoard
  if (e.target.closest("#gameBoard")) {
    e.preventDefault();
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }
}, { passive: false });

document.addEventListener("touchend", (e) => {
  if (e.target.closest("#gameBoard")) {
    e.preventDefault();
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) move("right");
      else if (dx < -30) move("left");
    } else {
      if (dy > 30) move("down");
      else if (dy < -30) move("up");
    }
  }
}, { passive: false });

loadGame();