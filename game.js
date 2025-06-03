const BACKEND_URL = "https://rankops-halloffame.onrender.com";
const boardSize = 4;
let board = [];
let score = 0;
let maxLevel = 0;
let gameOver = false;
let gameStarted = false; // Estado para saber si la partida está en marcha

const rangos = [
  "",
  "Recluta",
  "Soldado Raso",
  "Cabo",
  "Cabo Primero",
  "Sargento",
  "Sargento Primero",
  "Sub Teniente",
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

// Muestra el Hall of Fame dentro del gameBoard cuando no hay partida activa
async function showHallOfFameInBoard() {
  try {
    const res = await fetch(`${BACKEND_URL}/hall-of-fame`);
    const data = await res.json();

    let table = "<h3 class='text-info mb-3'>🏆 Hall of Fame</h3><table class='table table-dark table-striped'><thead><tr><th>Nombre</th><th>Puntos</th><th>Rango</th></tr></thead><tbody>";
    for (const entry of data) {
      table += `<tr><td>${entry.name}</td><td>${entry.score}</td><td>${rangos[entry.rank]}</td></tr>`;
    }
    table += "</tbody></table>";

    gameBoard.innerHTML = table;
    gameBoard.style.display = "block";
    gameBoard.style.border = "none";
  } catch (err) {
    console.error("Error al cargar el Hall of Fame:", err);
  }
}

function updateBoard() {
  if (!gameStarted) return; // No actualizamos si el juego no está activo

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
    setTimeout(() => {
      showToast("¡No quedan movimientos!");
      gameStarted = false;
      resetButton.textContent = "Reiniciar";
      resetButton.classList.remove("btn-secondary");
      resetButton.classList.add("btn-danger");
      showHallOfFameInBoard();

      const histMaxScore = parseInt(localStorage.getItem("histMaxScore")) || 0;
      if (score > histMaxScore) {
        addToHallOfFame();
      }
    }, 100);
  } else {
    gameOver = false;
    resetButton.classList.remove("btn-danger");
    resetButton.classList.add("btn-secondary");
  }
}

function move(dir) {
  if (gameOver || !gameStarted) return;
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
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (board[r][c] === 0) return false;
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
  if (!gameStarted) {
    // Iniciar partida
    gameStarted = true;
    resetButton.textContent = "Reiniciar";
    initBoard();
  } else {
    // Reiniciar partida en curso (confirmar)
    if (confirm("¿Quieres reiniciar la partida?")) {
      initBoard();
    }
  }
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

  document.getElementById("maxScore").textContent = Math.max(score, historialMaxScore);
  document.getElementById("maxRank").textContent = Math.max(maxLevel, historialMaxLevel);
}

function loadGame() {
  const savedBoard = localStorage.getItem("tablero");
  if (savedBoard && gameStarted) {
    board = JSON.parse(savedBoard);
    score = parseInt(localStorage.getItem("puntuacion")) || 0;
    maxLevel = parseInt(localStorage.getItem("maxPuntuacion")) || 0;
    updateBoard();
  } else {
    // No hay partida activa, mostrar Hall of Fame
    showHallOfFameInBoard();
    resetButton.textContent = "Start";
    gameStarted = false;
  }

  const histMaxScore = parseInt(localStorage.getItem("histMaxScore")) || 0;
  const histMaxLevel = parseInt(localStorage.getItem("histMaxLevel")) || 0;
  document.getElementById("maxScore").textContent = histMaxScore;
  document.getElementById("maxRank").textContent = histMaxLevel;
}

async function addToHallOfFame() {
  const playerName = prompt("¡Nuevo récord! Ingresa tu nombre:");
  if (!playerName) return;

  try {
    await fetch(`${BACKEND_URL}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: playerName,
        score,
        rank: maxLevel
      }),
    });
    showToast("¡Registro guardado!");
  } catch (err) {
    console.error("Error al guardar en Hall of Fame:", err);
    showToast("Error al guardar el récord.");
  }
}

window.addEventListener("load", () => {
  loadGame();
});

document.addEventListener("keydown", (e) => {
  if (!gameStarted) return;
  switch (e.key) {
    case "ArrowUp":
      move("up");
      break;
    case "ArrowDown":
      move("down");
      break;
    case "ArrowLeft":
      move("left");
      break;
    case "ArrowRight":
      move("right");
      break;
  }
});

resetButton.addEventListener("click", resetGame);