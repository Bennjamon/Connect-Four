const $ = (selector) => document.querySelector(selector);

const $board = $("#board");
const $scores = {
  player1: $("#player1-score"),
  player2: $("#player2-score"),
};
const $popupContainer = $("#popup-container");
const $popupContent = $("#popup-content");
const $popupButton = $("#popup-button");

const $throwingPiece = document.createElement("div");

$throwingPiece.classList.add("piece");
$throwingPiece.classList.add("red");

const CELL_STATES = {
  EMPTY: 0,
  RED: 1,
  YELLOW: 2,
};

const gameData = {
  board: [...Array(6)].map(() => [...Array(7)].map(() => CELL_STATES.EMPTY)),
  currentPlayer: CELL_STATES.YELLOW,
  score: {
    player1: 0,
    player2: 0,
  },
  animations: [],
};

function setThrowingPiecePosition(column) {
  const $cell = $board.children[column];

  if ($throwingPiece.parentElement) {
    if ($throwingPiece.parentElement === $cell) return;
    -$throwingPiece.parentElement.removeChild($throwingPiece);
  }

  $cell.appendChild($throwingPiece);
}

function getMouseColumn(e) {
  const x = e.clientX - $board.offsetLeft;

  const cellWidth = $board.clientWidth / 6;

  return Math.floor(x / cellWidth);
}

function checkHorizontal(column, row) {
  const cellState = gameData.board[column][row];

  const left = column - 3;
  const right = column + 3;

  const leftBound = left >= 0 ? left : 0;
  const rightBound = right <= 5 ? right : 5;

  let coordinates = [];

  for (let i = leftBound; i <= rightBound; i++) {
    if (gameData.board[i][row] === cellState) {
      coordinates.push([i, row]);
    } else {
      coordinates = [];
    }

    if (coordinates.length >= 4) return coordinates;
  }

  return false;
}

function checkVertical(column, row) {
  const cellState = gameData.board[column][row];

  const top = row - 3;
  const bottom = row + 3;

  const topBound = top >= 0 ? top : 0;
  const bottomBound = bottom <= 6 ? bottom : 5;

  let coordinates = [];

  for (let i = topBound; i <= bottomBound; i++) {
    if (gameData.board[column][i] === cellState) {
      coordinates.push([column, i]);
    } else {
      coordinates = [];
    }

    if (coordinates.length >= 4) return coordinates;
  }

  return false;
}

function checkDiagonal(column, row) {
  const cellState = gameData.board[column][row];

  let coordinates = [];

  for (let i = -3; i <= 3; i++) {
    const columnIndex = column - i;
    const rowIndex = row + i;

    if (columnIndex < 0 || columnIndex > 5 || rowIndex < 0 || rowIndex > 6)
      continue;

    if (gameData.board[columnIndex][rowIndex] === cellState) {
      coordinates.push([columnIndex, rowIndex]);
    } else {
      coordinates = [];
    }

    if (coordinates.length >= 4) return coordinates;
  }

  coordinates = [];

  for (let i = -3; i <= 3; i++) {
    const columnIndex = column - i;
    const rowIndex = row - i;

    if (columnIndex < 0 || columnIndex > 5 || rowIndex < 0 || rowIndex > 6)
      continue;

    if (gameData.board[columnIndex][rowIndex] === cellState) {
      coordinates.push([columnIndex, rowIndex]);
    } else {
      coordinates = [];
    }

    if (coordinates.length >= 4) return coordinates;
  }

  return false;
}

function checkForWin(column, row) {
  const horizontal = checkHorizontal(column, row);

  if (horizontal) return horizontal;

  const vertical = checkVertical(column, row);

  if (vertical) return vertical;

  const diagonal = checkDiagonal(column, row);

  if (diagonal) return diagonal;
}

function checkForTie() {
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 7; j++) {
      if (gameData.board[i][j] === CELL_STATES.EMPTY) return false;
    }
  }

  return true;
}

function resetGame() {
  gameData.board = [...Array(6)].map(() =>
    [...Array(7)].map(() => CELL_STATES.EMPTY)
  );
  gameData.currentPlayer = CELL_STATES.YELLOW;

  Array.from($board.children).forEach(($cell) => {
    while ($cell.firstChild) $cell.removeChild($cell.firstChild);
  });

  $throwingPiece.classList.remove("yellow");
  $throwingPiece.classList.add("red");
}

function throwPiece(column) {
  return new Promise((resolve, reject) => {
    if (gameData.board[column].every((cell) => cell !== CELL_STATES.EMPTY)) {
      return;
    }

    const row = gameData.board[column].findLastIndex(
      (cell) => cell === CELL_STATES.EMPTY
    );

    $throwingPiece.classList.toggle("red");
    $throwingPiece.classList.toggle("yellow");

    gameData.board[column][row] = gameData.currentPlayer;

    const idx = 6 + row * 6 + column;

    const $cell = $board.children[idx];

    const $piece = document.createElement("div");

    $piece.classList.add("piece");

    if (gameData.currentPlayer === CELL_STATES.RED) {
      $piece.classList.add("red");
    } else {
      $piece.classList.add("yellow");
    }

    const originalPosition = $throwingPiece.getBoundingClientRect();

    const targetPosition = $cell.getBoundingClientRect();

    let top = originalPosition.top - targetPosition.top;

    $cell.appendChild($piece);

    $piece.style.position = "absolute";
    $piece.style.width = `${originalPosition.width}px`;
    $piece.style.height = `${originalPosition.height}px`;
    $piece.style.top = `${originalPosition.top - targetPosition.top}px`;
    $piece.style.zIndex = "-1";
    $piece.style.position = "absolute";

    if ($piece.style.width === "0px") {
      console.log($throwingPiece.getBoundingClientRect().width);
      gameData.board[column][row] = CELL_STATES.EMPTY;
      $cell.removeChild($piece);
      return;
    }

    let animationId;
    const id = Date.now();

    const animation = () => {
      animationId = requestAnimationFrame(animation);

      const idx = gameData.animations.findIndex(
        (animation) => animation.id === id
      );

      if (idx === -1) {
        gameData.animations.push({
          abort() {
            cancelAnimationFrame(animationId);
            reject();
          },
          id,
        });
      } else {
        gameData.animations[idx] = {
          abort() {
            cancelAnimationFrame(animationId);
            reject();
          },
          id,
        };
      }

      top += 16;

      $piece.style.top = `${top}px`;

      if (top >= 0) {
        $piece.style.top = "0px";
        $piece.style.position = "relative";
        cancelAnimationFrame(animationId);
        resolve(row);

        gameData.animations = gameData.animations.filter(
          (animation) => animation.id !== id
        );
      }
    };

    $cell.appendChild($piece);

    animation();
  });
}

function determineWinner(coordinates) {
  gameData.animations.forEach((animation) => {
    animation.abort();
  });

  coordinates.forEach(([column, row]) => {
    const idx = 6 + row * 6 + column;

    const $cell = $board.children[idx];

    const $piece = $cell.children[0];

    $piece.classList.add("winner");
  });

  if (gameData.currentPlayer === CELL_STATES.RED) {
    gameData.score.player1++;
    $scores.player1.textContent = gameData.score.player1;

    $popupContent.textContent = "Player 1 wins!";
  } else {
    gameData.score.player2++;
    $scores.player2.textContent = gameData.score.player2;

    $popupContent.textContent = "Player 2 wins!";
  }

  $popupContainer.classList.add("visible");
}

$board.addEventListener("mousemove", (e) => {
  const column = getMouseColumn(e);

  setThrowingPiecePosition(column);
});

$board.addEventListener("click", async (e) => {
  gameData.currentPlayer =
    gameData.currentPlayer === CELL_STATES.RED
      ? CELL_STATES.YELLOW
      : CELL_STATES.RED;

  const column = getMouseColumn(e);

  let row;

  try {
    row = await throwPiece(column);
  } catch (e) {
    return;
  }

  const coordinates = checkForWin(column, row);

  if (coordinates) {
    determineWinner(coordinates);
  }

  if (checkForTie()) {
    $popupContent.textContent = "It's a tie!";
    $popupContainer.classList.add("visible");
  }
});

$popupButton.addEventListener("click", () => {
  $popupContainer.classList.remove("visible");

  resetGame();
});

setThrowingPiecePosition(0);
