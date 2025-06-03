import { collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const boardSize = 4;
let board = [];
let score = 0;
let maxLevel = 0;
let gameOver = false;
let gameStarted = false; // controla si hay partida activa

const rangos = [
  "", "Recluta", "Soldado Raso", "Cabo", "Cabo Primero", "Sargento", "Sargento Primero",
  "Sub Teniente", "Teniente", "Teniente Primero", "Capitán", "Mayor", "Teniente Coronel",
  "Coronel", "General de Brigada", "General de División", "Teniente General", "General",
  "General en Jefe", "Mariscal", "Comandante Estelar"
];

const borderColors = [
  "transparent",           // index 0
  "#2F4F4F",  // level-1  - Dark Slate Gray
  "#556B2F",  // level-2  - Dark Olive Green
  "#6B8E23",  // level-3  - Olive Drab
  "#808000",  // level-4  - Olive
  "#9ACD32",  // level-5  - Yellow Green
  "#8F9779",  // level-6  - Camouflage Green
  "#708238",  // level-7  - Moss Green
  "#4B5320",  // level-8  - Army Green
  "#3B5323",  // level-9  - Military Green
  "#556B2F",  // level-10 - Dark Olive Green (repeated)
  "#6E7F41",  // level-11 - Laurel Green
  "#7C9C56",  // level-12 - Olive Green Light
  "#9DBF9E",  // level-13 - Sage Green
  "#A9BA9D",  // level-14 - Soft Olive
  "#C1C6B8",  // level-15 - Light Military Green
  "#D4D6AA",  // level-16 - Pale Olive
  "#F0E68C",  // level-17 - Khaki
  "#EEE8AA",  // level-18 - Pale Goldenrod
  "#BDB76B",  // level-19 - Dark Khaki
  "#556B2F"   // level-20 - Dark Olive Green (again)
];

// Referencias DOM (con comprobación)
const gameBoard = document.getElementById("gameBoard");
if (!gameBoard) throw new Error("No se encontró el elemento #gameBoard");

gameBoard.style.borderRadius = "12px";
gameBoard.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

const scoreDisplay = document.getElementById("score");
const maxLevelDisplay = document.getElementById("maxLevel");
const startButton = document.getElementById("startBtn");
const toast = document.getElementById("toast");

const modalEl = document.getElementById("hallOfFameModal");
const submitArcadeNameBtn = document.getElementById("submitArcadeName");
const hallOfFameModalEl = document.getElementById("hallOfFameListModal");
if (!hallOfFameModalEl) throw new Error("No se encontró el modal de Hall of Fame");

const hallOfFameModal = new bootstrap.Modal(hallOfFameModalEl);

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let selectedName = ["A", "A", "A"];

function showSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) spinner.style.display = "flex";
}

function hideSpinner() {
  const spinner = document.getElementById("loadingSpinner");
  if (spinner) spinner.style.display = "none";
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

function bounceScroll(element, distance = null, duration = 2000) {
  let direction = 1; // 1 = bajar, -1 = subir
  let scrollTop = 0;
  const maxScroll = element.scrollHeight - element.clientHeight;
  if (maxScroll <= 0) return; // No hay scroll, no hacer nada

  // Ajustar distance si es null o mayor que el maxScroll
  if (distance === null || distance > maxScroll) {
    distance = maxScroll;
  }

  const stepTime = 20; // ms por paso
  const steps = duration / stepTime;
  const stepSize = distance / steps;

  function step() {
    scrollTop += direction * stepSize;

    if (scrollTop >= distance) {
      scrollTop = distance;
      direction = -1;
    } else if (scrollTop <= 0) {
      scrollTop = 0;
      direction = 1;
    }
    element.scrollTop = scrollTop;
    setTimeout(step, stepTime);
  }

  step();
}


async function showHallOfFameInBoard() {
  try {
    showSpinner();
    const q = query(collection(db, "score"), orderBy("score", "desc"), limit(10));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => doc.data());
    hideSpinner();

    let table = `
      <div class="hallOfFameTableWrapper" style="max-height: 300px; overflow-y: auto; overflow-x: hidden; font-size: 0.8rem;">
        <table class="table table-dark table-striped text-center align-middle hallOfFameTable">
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

    table += `
          </tbody>
        </table>
      </div>`;

    document.getElementById("hallOfFameListContent").innerHTML = table;
    hallOfFameModal.show();
    setTimeout(() => {
      const wrapper = document.querySelector(".hallOfFameTableWrapper");
      if(wrapper) bounceScroll(wrapper);
    }, 300);

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
      if (level > 0) cell.classList.add("spawn");
      cell.textContent = rangos[level] || "";

      // Animación para celdas fusionadas
      if (mergedCells.some(pos => pos.r === r && pos.c === c)) {
        cell.classList.add("merge");
      }
      gameBoard.appendChild(cell);
    }
  }

  const color = borderColors[maxLevel] || "transparent";
  gameBoard.style.border = maxLevel > 0 ? `6px solid ${color}` : "6px solid transparent";

  scoreDisplay.textContent = score;
  maxLevelDisplay.textContent = maxLevel;

  saveGame();

  if (isGameOver()) {
    gameOver = true;
    setTimeout(async () => {
      try {
        showToast("¡No quedan movimientos!");
        startButton.textContent = "Reiniciar";
        startButton.classList.remove("btn-success");
        startButton.classList.add("btn-danger");
        gameBoard.style.opacity = 0.5;
    
        const histMaxScore = parseInt(localStorage.getItem("histMaxScore") || "0", 10);
        console.log("Puntuaciones:", score, histMaxScore);
    
        gameStarted = false;
    
        if (score > histMaxScore) {
          localStorage.setItem("histMaxScore", score.toString());
          await showModalArcade();
        } else {
          await showHallOfFameInBoard();
          //console.log("No superaste el record");
        }
      } catch (err) {
        console.error("Error en el timeout post gameover:", err);
      }
    }, 100);
  } else {
    gameOver = false;
    gameBoard.style.opacity = 1;
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

    // Extraer línea según dirección
    for (let j = 0; j < boardSize; j++) {
      let val = (dir === "left" || dir === "right")
        ? board[i][dir === "left" ? j : boardSize - 1 - j]
        : board[dir === "up" ? j : boardSize - 1 - j][i];
      if (val) line.push(val);
    }

    // Fusionar adyacentes iguales
    for (let k = 0; k < line.length - 1; k++) {
      if (line[k] === line[k + 1]) {
        line[k]++;
        score += Math.pow(2, line[k]);
        if (line[k] > maxLevel) maxLevel = line[k];
        line.splice(k + 1, 1);

        const r = (dir === "up" || dir === "down") ? (dir === "up" ? k : boardSize - 1 - k) : i;
        const c = (dir === "left" || dir === "right") ? (dir === "left" ? k : boardSize - 1 - k) : i;

        mergedCells.push({ r, c });
        moved = true;
      }
    }

    while (line.length < boardSize) line.push(0);

    // Escribir línea modificada de vuelta al tablero
    for (let j = 0; j < boardSize; j++) {
      const val = line[j];
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
  setTimeout(() => toast.classList.remove("show"), duration);
}

function resetGame() {
  if (gameStarted) {
    showToast(`Última puntuación: ${score} | Rango: ${rangos[maxLevel] || "N/A"}`, 3000);
  }

  gameStarted = true;
  startButton.textContent = "Reiniciar";
  startButton.classList.remove("btn-secondary");
  startButton.classList.add("btn-danger");

  initBoard();
}
function saveGame() {
  try {
    localStorage.setItem("rankOpsGame", JSON.stringify({ board, score, maxLevel }));
  } catch (e) {
    console.warn("No se pudo guardar el juego:", e);
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem("rankOpsGame");
    if (!saved) return;
    const { board: b, score: s, maxLevel: ml } = JSON.parse(saved);
    if (!b || !s || !ml) return;
    board = b;
    score = s;
    maxLevel = ml;
    gameStarted = true;
    updateBoard();
    startButton.textContent = "Reiniciar";
    startButton.classList.remove("btn-success");
    startButton.classList.add("btn-secondary");
  } catch (e) {
    console.warn("Error cargando el juego:", e);
  }
}

// Abrir modal para ingresar nombre al final de la partida
async function showModalArcade() {
  const modalEl = document.getElementById("hallOfFameModal");
  const modalInstance = new bootstrap.Modal(modalEl);

  // Inicializamos el nombre
  selectedName = ["A", "A", "A"];
  updateNameDisplay();

  // Quitamos listeners previos para evitar acumulación
  submitArcadeNameBtn.replaceWith(submitArcadeNameBtn.cloneNode(true));
  const newSubmitBtn = document.getElementById("submitArcadeName");

  newSubmitBtn.addEventListener("click", async () => {
    const name = selectedName.join("").trim();
    if (!name) {
      alert("Por favor ingresa un nombre válido.");
      return;
    }

    newSubmitBtn.disabled = true;

    await saveRecordToFirebase(name);

    modalInstance.hide();

    newSubmitBtn.disabled = false;

    await showHallOfFameInBoard();
  });

  // Configurar selección de letras si usas selects o divs (como en el HTML)
  const letterSelectors = modalEl.querySelectorAll(".arcade-letter-selector");
  letterSelectors.forEach((selector, idx) => {
    const upArrow = selector.querySelector(".arrow.up");
    const downArrow = selector.querySelector(".arrow.down");
    const letterDiv = selector.querySelector(".arcade-letter");

    // Inicializar letra
    letterDiv.textContent = selectedName[idx];

    upArrow.onclick = () => {
      const currentIndex = letters.indexOf(selectedName[idx]);
      selectedName[idx] = letters[(currentIndex + 1) % letters.length];
      letterDiv.textContent = selectedName[idx];
      updateNameDisplay();
    };

    downArrow.onclick = () => {
      const currentIndex = letters.indexOf(selectedName[idx]);
      selectedName[idx] = letters[(currentIndex - 1 + letters.length) % letters.length];
      letterDiv.textContent = selectedName[idx];
      updateNameDisplay();
    };
  });

  modalInstance.show();
}


function updateNameDisplay() {
  document.getElementById("arcadeName").textContent = selectedName.join("");
}


async function saveRecordToFirebase(name) {
  if (score > 0) {  // o if (gameOver && score > 0) para más seguridad
    try {
      const scoresRef = collection(db, "score");

      const allScoresSnapshot = await getDocs(scoresRef);
      const totalRecords = allScoresSnapshot.size;

      if (totalRecords < 10) {
        await addDoc(scoresRef, {
          name,
          score,
          rank: maxLevel,
        });
        showToast("¡Record guardado!");
      } else {
        const lowestScoreQuery = query(scoresRef, orderBy("score", "asc"), limit(1));
        const lowestScoreSnapshot = await getDocs(lowestScoreQuery);

        if (!lowestScoreSnapshot.empty) {
          const lowestDoc = lowestScoreSnapshot.docs[0];
          const lowestData = lowestDoc.data();

          if (score > lowestData.score) {
            await deleteDoc(doc(db, "score", lowestDoc.id));
            await addDoc(scoresRef, {
              name,
              score,
              rank: maxLevel,
              timestamp: Date.now(),
            });
            showToast("¡Nuevo record guardado!");
          } else {
            showToast("No superaste la puntuación más baja del top 10.");
          }
        }
      }
    } catch (err) {
      console.error("Error guardando record:", err);
      showToast("Error guardando record");
    }
  }
}

// Listeners de controles
startButton.addEventListener("click", resetGame);

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
  if (!gameStarted) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    switch (e.key) {
      case "ArrowUp": move("up"); break;
      case "ArrowDown": move("down"); break;
      case "ArrowLeft": move("left"); break;
      case "ArrowRight": move("right"); break;
    }
  }
});

// Al cargar la página
window.onload = () => {
  loadGame();
  if (!gameStarted) resetGame();
};


document.getElementById("showHallOfFame").addEventListener("click", async () => {
  await showHallOfFameInBoard();
});