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

gameBoard.addEventListener('touchmove', function(event) {
  event.preventDefault();  // evita el scroll cuando tocamos en el tablero
}, { passive: false });

const scoreDisplay = document.getElementById("score");
const maxLevelDisplay = document.getElementById("maxLevel");
const startButton = document.getElementById("startBtn");
const toast = document.getElementById("toast");

// Modal Elements
const modalEl = document.getElementById("hallOfFameModal");
const modalScoreEl = document.getElementById("modalScore"); // no usado, puede omitirse o crear si quieres mostrar puntaje ahí
const modalRankEl = document.getElementById("modalRank");   // idem anterior
const submitArcadeNameBtn = document.getElementById("submitArcadeName");

// Para la selección de letras/números del nombre en modal arcade
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let selectedName = ["A", "A", "A"];

function showSpinner() {
  document.getElementById("loadingSpinner").style.display = "flex";
}

function hideSpinner() {
  document.getElementById("loadingSpinner").style.display = "none";
}

function initBoard() {
  board = Array.from({ length: boardSize }, () => Array(boardSize).fill(0));
  score = 0;
  maxLevel = 0;
  gameOver = false;
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

async function showHallOfFameInBoard() {
  try {
    showSpinner();  // Muestra el spinner antes de hacer fetch

    const res = await fetch(`${BACKEND_URL}/hall-of-fame`);
    const data = await res.json();

    hideSpinner();  // Oculta el spinner cuando llega la data

    let table = `
      <table class="table table-dark table-striped text-center align-middle">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Puntos</th>
            <th>Rango</th>
          </tr>
        </thead>
        <tbody>`;

    for (const entry of data) {
      table += `
        <tr>
          <td>${entry.name}</td>
          <td>${entry.score}</td>
          <td>${rangos[entry.rank] || ""}</td>
        </tr>`;
    }

    table += "</tbody></table>";

    document.getElementById("hallOfFameListContent").innerHTML = table;

    // Mostrar el modal (asegúrate que el modal existe)
    const modal = new bootstrap.Modal(document.getElementById("hallOfFameListModal"));
    modal.show();

  } catch (err) {
    hideSpinner();
    console.error("Error al cargar Hall of Fame:", err);
    document.getElementById("hallOfFameListContent").innerHTML = `<p class="text-danger">Error al cargar datos.</p>`;
  }
}

function updateBoard(mergedCells = []) {
  if (!gameStarted) return;

  gameBoard.innerHTML = "";
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      const cell = document.createElement("div");
      const level = board[r][c];
      cell.className = `cell level-${level}`;
      if(level > 0) cell.classList.add("spawn");
      cell.textContent = rangos[level] || "";

      // Aplica animación si esta celda fue fusionada
      if (mergedCells.some(pos => pos.r === r && pos.c === c)) {
        cell.classList.add("merge");
      }     
      
      gameBoard.appendChild(cell);
    }

    const color = borderColors[maxLevel] || "transparent";
    if (maxLevel > 0) {
      gameBoard.style.border = "6px solid";
      gameBoard.style.borderImage = `linear-gradient(45deg, ${color}, #ffffff) 1`;
    } else {
      gameBoard.style.border = "6px solid transparent";
      gameBoard.style.borderImage = "none";
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
        localStorage.setItem("histMaxScore", score);
        await showModalArcade(); // Solo muestra el modal, no la tabla
      } else {
        await showHallOfFameInBoard(); // Solo si no hay récord
      }
    }, 100);
  } else {
    gameOver = false;
    startButton.textContent = "Reiniciar";
    startButton.classList.remove("btn-danger");
    startButton.classList.add("btn-secondary");
  }
}

function move(dir) {
  if (gameOver || !gameStarted) return;
  let moved = false;
  let mergedCells = [];

  for (let i = 0; i < boardSize; i++) {
    let line = [];

    // Extraer la línea actual según la dirección
    for (let j = 0; j < boardSize; j++) {
      let val = (dir === "left" || dir === "right")
        ? board[i][dir === "left" ? j : boardSize - 1 - j]
        : board[dir === "up" ? j : boardSize - 1 - j][i];
      if (val) line.push(val);
    }

    // Fusionar valores adyacentes iguales
    for (let k = 0; k < line.length - 1; k++) {
      if (line[k] === line[k + 1]) {
        line[k]++;
        score += Math.pow(2, line[k]);
        if (line[k] > maxLevel) maxLevel = line[k];
        line.splice(k + 1, 1);

        // Determinar posición real para animación
        const r = (dir === "up" || dir === "down") ? 
          (dir === "up" ? k : boardSize - 1 - k) : i;
        const c = (dir === "left" || dir === "right") ? 
          (dir === "left" ? k : boardSize - 1 - k) : i;

        mergedCells.push({ r, c });
        moved = true;
      }
    }

    // Rellenar con ceros hasta completar línea
    while (line.length < boardSize) line.push(0);

    // Escribir la línea modificada de vuelta al tablero
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
  updateBoard(mergedCells); 
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
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

function resetGame() {
  if (!gameStarted) {
    gameStarted = true;
    startButton.textContent = "Reiniciar";
    startButton.classList.remove("btn-secondary");
    startButton.classList.add("btn-danger");
  }
  initBoard();
}

function saveGame() {
  localStorage.setItem("rankOpsGame", JSON.stringify({ board, score, maxLevel }));
}

function loadGame() {
  const saved = localStorage.getItem("rankOpsGame");
  if (saved) {
    const { board: b, score: s, maxLevel: ml } = JSON.parse(saved);
    board = b;
    score = s;
    maxLevel = ml;
    gameStarted = true;
    startButton.textContent = "Reiniciar";
    startButton.classList.remove("btn-secondary");
    startButton.classList.add("btn-danger");
    updateBoard();
  }
}

async function showModalArcade() {
  // Actualiza letras del modal con nombre por defecto
  selectedName = ["A", "A", "A"];
  updateArcadeLetters();

  // Muestra modal Bootstrap
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // Agregar eventos flechas para cambiar letras
  const selectors = modalEl.querySelectorAll(".arcade-letter-selector");
  selectors.forEach(selector => {
    const index = parseInt(selector.getAttribute("data-index"));
    const upArrow = selector.querySelector(".arrow.up");
    const downArrow = selector.querySelector(".arrow.down");

    upArrow.onclick = () => changeLetter(index, 1);
    downArrow.onclick = () => changeLetter(index, -1);
  });

  // Evento guardar nombre
  submitArcadeNameBtn.onclick = async () => {
    const name = selectedName.join("");
    const rank = maxLevel;
  
    try {
      await fetch(`${BACKEND_URL}/hall-of-fame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score, rank }),
      });
  
      // Oculta el modal
      bootstrap.Modal.getInstance(modalEl).hide();
  
      // Espera unos ms antes de mostrar la tabla
      setTimeout(showHallOfFameInBoard, 300);
    } catch (err) {
      alert("Error al guardar el nombre en el Hall of Fame.");
      console.error(err);
    }
  };
}

function changeLetter(index, delta) {
  let pos = letters.indexOf(selectedName[index]);
  pos = (pos + delta + letters.length) % letters.length;
  selectedName[index] = letters[pos];
  updateArcadeLetters();
}

function updateArcadeLetters() {
  const selectors = modalEl.querySelectorAll(".arcade-letter-selector");
  selectors.forEach((selector, i) => {
    const letterEl = selector.querySelector(".arcade-letter");
    letterEl.textContent = selectedName[i];
  });
}

startButton.onclick = () => {
  resetGame();
};

let touchStartX = 0;
let touchStartY = 0;

gameBoard.addEventListener("touchstart", e => {
  if (!gameStarted || gameOver) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

gameBoard.addEventListener("touchend", e => {
  if (!gameStarted || gameOver) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < 30) return; // ignora toques cortos

  if (absX > absY) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }
}, { passive: true });


document.addEventListener("keydown", e => {
  if (!gameStarted || gameOver) return;
  switch (e.key) {
    case "ArrowLeft":
      move("left");
      break;
    case "ArrowRight":
      move("right");
      break;
    case "ArrowUp":
      move("up");
      break;
    case "ArrowDown":
      move("down");
      break;
  }
});

loadGame();