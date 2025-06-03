const BACKEND_URL = "https://rankops-halloffame.onrender.com";
const boardSize = 4;
let board = [];
let score = 0;
let maxLevel = 0;
let gameOver = false;
let gameStarted = false; // para saber si hay partida activa

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
  "transparent",      
  "#263238",          
  "#37474f",          
  "#455a64",          
  "#546e7a",          
  "#607d8b",          
  "#78909c",          
  "#90a4ae",          
  "#b0bec5",          
  "#cfd8dc",          
  "#eceff1",          
  "#f48fb1",          
  "#f06292",          
  "#e91e63",          
  "#d81b60",          
  "#c2185b",          
  "#ad1457",          
  "#880e4f",          
  "#4a148c",          
  "#311b92",          
  "#1a237e"           
];

const gameBoard = document.getElementById("gameBoard");
const scoreDisplay = document.getElementById("score");
const maxLevelDisplay = document.getElementById("maxLevel");
const startButton = document.querySelector("button.btn.btn-secondary.btn-lg");
const toast = document.getElementById("toast");

// Modal Elements
const modalEl = document.getElementById("hallOfFameModal");
const modalScoreEl = document.getElementById("modalScore");
const modalRankEl = document.getElementById("modalRank");
const submitArcadeNameBtn = document.getElementById("submitArcadeName");
const arcadeLetters = Array.from(document.querySelectorAll(".arcade-letter"));

// Para la selección de letras del nombre en modal
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
let selectedName = ["A", "A", "A"];

// Inicializa el tablero vacío
function initBoard() {
  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
  score = 0;
  maxLevel = 0;
  gameOver = false;
  addRandomRank();
  addRandomRank();
  updateBoard();
}

// Añade una ficha nueva (nivel 1) en un espacio vacío aleatorio
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

async function showHallOfFameInBoard() {
  try {
    const res = await fetch(`${BACKEND_URL}/hall-of-fame`);
    const data = await res.json();

    let table = `<h3 class="text-info mb-3">🏆 Hall of Fame</h3>
      <table class="table table-dark table-striped">
        <thead><tr><th>Nombre</th><th>Puntos</th><th>Rango</th></tr></thead><tbody>`;

    for (const entry of data) {
      table += `<tr><td>${entry.name}</td><td>${entry.score}</td><td>${rangos[entry.rank]}</td></tr>`;
    }
    table += "</tbody></table>";

    gameBoard.innerHTML = table;
    gameBoard.style.border = "none";
  } catch (err) {
    console.error("Error al cargar Hall of Fame:", err);
  }
}

function updateBoard() {
  if (!gameStarted) return;

  gameBoard.innerHTML = "";
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = document.createElement("div");
      const level = board[r][c];
      cell.className = `cell level-${level}`;
      if(level > 0) cell.classList.add("spawn");
      cell.textContent = rangos[level] || "";

      const color = borderColors[maxLevel] || "transparent";
      if (maxLevel > 0) {
        gameBoard.style.border = "6px solid";
        gameBoard.style.borderImage = `linear-gradient(45deg, ${color}, #ffffff) 1`;
      } else {
        gameBoard.style.border = "6px solid transparent";
        gameBoard.style.borderImage = "none";
      }

      gameBoard.appendChild(cell);
    }
  }
  scoreDisplay.textContent = score;
  maxLevelDisplay.textContent = maxLevel;
  saveGame();

  if (isGameOver()) {
    gameOver = true;
    setTimeout(async () => {
      showToast("¡No quedan movimientos!");
      gameStarted = false;
      startButton.textContent = "Start";
      startButton.classList.remove("btn-danger");
      startButton.classList.add("btn-secondary");

      const histMaxScore = parseInt(localStorage.getItem("histMaxScore")) || 0;

      if (score > histMaxScore) {
        // Nuevo récord
        localStorage.setItem("histMaxScore", score);
        await showModalArcade();
      } else {
        await showHallOfFameInBoard();
      }
    }, 100);
  } else {
    gameOver = false;
    startButton.textContent = "Reiniciar";
    startButton.classList.remove("btn-danger");
    startButton.classList.add("btn-secondary");
  }
}

// Función para mover las fichas en la dirección indicada
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

// Detecta si el juego terminó
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
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// Función para reset o start del juego con confirmación para reinicio
function resetGame() {
  if (!gameStarted) {
    gameStarted = true;
    startButton.textContent = "Reiniciar";
    startButton.classList.remove("btn-danger");
    startButton.classList.add("btn-secondary");
    initBoard();
  } else {
    if (confirm("¿Quieres reiniciar la partida?")) {
      initBoard();
    }
  }
}

function saveGame() {
  localStorage.setItem("tablero", JSON.stringify(board));
  localStorage.setItem("puntuacion", score);
  localStorage.setItem("maxPuntuacion", maxLevel);
}

function loadGame() {
  const savedBoard = localStorage.getItem("tablero");
  const savedScore = parseInt(localStorage.getItem("puntuacion")) || 0;
  const savedMaxLevel = parseInt(localStorage.getItem("maxPuntuacion")) || 0;

  if (savedBoard) {
    board = JSON.parse(savedBoard);
    score = savedScore;
    maxLevel = savedMaxLevel;
    gameStarted = true;
    updateBoard();
    startButton.textContent = "Reiniciar";
  } else {
    gameStarted = false;
    startButton.textContent = "Start";
    showHallOfFameInBoard();
  }

  const histMaxScore = parseInt(localStorage.getItem("histMaxScore")) || 0;
  const histMaxLevel = parseInt(localStorage.getItem("histMaxLevel")) || 0;
  document.getElementById("maxScore").textContent = histMaxScore;
  document.getElementById("maxRank").textContent = rangos[histMaxLevel] || "Recluta";
}

// Eventos touch para móviles - detecta swipe y mueve fichas
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 40;

window.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

window.addEventListener("touchend", (e) => {
  if (!gameStarted || gameOver) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) move("right");
    else move("left");
  } else {
    if (dy > 0) move("down");
    else move("up");
  }
});

// Eventos teclado para flechas
window.addEventListener("keydown", (e) => {
  if (!gameStarted || gameOver) return;

  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      move("up");
      break;
    case "ArrowDown":
      e.preventDefault();
      move("down");
      break;
    case "ArrowLeft":
      e.preventDefault();
      move("left");
      break;
    case "ArrowRight":
      e.preventDefault();
      move("right");
      break;
  }
});

// Mostrar modal arcade para guardar récord
async function showModalArcade() {
  modalScoreEl.textContent = score;
  modalRankEl.textContent = rangos[maxLevel] || "Recluta";
  selectedName = ["A", "A", "A"];
  updateArcadeLetters();

  // Mostrar modal con Bootstrap
  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();

  return new Promise((resolve) => {
    submitArcadeNameBtn.onclick = async () => {
      const name = selectedName.join("");
      if (!/^[A-Z]{3}$/.test(name)) {
        alert("Nombre inválido.");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/hall-of-fame`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            score,
            rank: maxLevel,
            date: new Date().toISOString()
          })
        });
        if (!res.ok) throw new Error("Error al enviar");

        // Guardar récord en localStorage
        localStorage.setItem("histMaxScore", score);
        localStorage.setItem("histMaxLevel", maxLevel);

        bsModal.hide();
        showToast("¡Puntuación guardada en el Hall of Fame!");
        await showHallOfFameInBoard();
        resolve();
      } catch {
        alert("Error al enviar la puntuación. Inténtalo de nuevo.");
      }
    };

    // Botones para subir/bajar letras
    arcadeLetters.forEach((letterDiv, idx) => {
      const btnUp = letterDiv.querySelector("button.arrow.up");
      const btnDown = letterDiv.querySelector("button.arrow.down");

      btnUp.onclick = () => {
        let currIdx = letters.indexOf(selectedName[idx]);
        currIdx = (currIdx + 1) % letters.length;
        selectedName[idx] = letters[currIdx];
        updateArcadeLetters();
      };
      btnDown.onclick = () => {
        let currIdx = letters.indexOf(selectedName[idx]);
        currIdx = (currIdx - 1 + letters.length) % letters.length;
        selectedName[idx] = letters[currIdx];
        updateArcadeLetters();
      };
    });
  });
}

function updateArcadeLetters() {
  arcadeLetters.forEach((letterDiv, idx) => {
    const display = letterDiv.querySelector(".letter-display");
    display.textContent = selectedName[idx];
  });
}

// Inicializar juego
window.onload = () => {
  loadGame();
  startButton.onclick = resetGame;
};
