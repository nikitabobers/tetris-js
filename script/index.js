// Variables
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const LINES_PER_LEVEL = 10;

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

// Calculate size of canvas
context.canvas.width = COLS * BLOCK_SIZE;
context.canvas.height = ROWS * BLOCK_SIZE;

// Scale blocks
context.scale(BLOCK_SIZE, BLOCK_SIZE);

// Pieces properties
let score = 0;
let lines = 0;
let level = 1;

const createPiece = (type) => {
  if (type === "I") {
    return [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ];
  }
  if (type === "L") {
    return [
      [0, 2, 0],
      [0, 2, 0],
      [0, 2, 2],
    ];
  }
  if (type === "J") {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [3, 3, 0],
    ];
  }
  if (type === "O") {
    return [
      [4, 4],
      [4, 4],
    ];
  }
  if (type === "Z") {
    return [
      [5, 5, 0],
      [0, 5, 5],
      [0, 0, 0],
    ];
  }
  if (type === "S") {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  }
  if (type === "T") {
    return [
      [0, 7, 0],
      [7, 7, 7],
      [0, 0, 0],
    ];
  }
};

const piece = {
  position: { x: 0, y: 0 },
  shape: null,
};

// Time variables
const time = {
  start: 0,
  elapsed: 0,
  counter: 0,
  interval: 1000,
};

//
const collide = (board, piece) => {
  const m = piece.shape;
  const o = piece.position;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (board[y + o.y] && board[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
};
// Create array of raws (matrix)
const createGrid = (width, height) => {
  const grid = [];
  while (height--) grid.push(new Array(width).fill(0));
  return grid;
};

// Draw
const draw = () => {
  context.fillStyle = "#222";
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  drawPiece(board, { x: 0, y: 0 });
  drawPiece(piece.shape, piece.position);
};

// Create board grid
const board = createGrid(COLS, ROWS);

// Move piece down on update
const pieceDrop = () => {
  piece.position.y++;
  if (collide(board, piece)) {
    piece.position.y--;
    freeze(board, piece);
    pieceReset();
    boardSweep();
    updateScore();
    updateLevel();
  }
  time.counter = 0;
};

// Update piece position every second
const update = (timeNow = 0) => {
  time.elapsed = timeNow - time.start;

  time.counter += time.elapsed;
  if (time.counter > time.interval) pieceDrop();

  time.start = timeNow;

  draw();
  requestAnimationFrame(update);
};

// Draw pieces
const drawPiece = (piece, offset) =>
  piece.forEach((row, y) =>
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        context.strokeStyle = "#fff";
        context.lineWidth = 0.05;
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    })
  );

const colors = [
  null,
  "#FF0D72",
  "#0DC2FF",
  "#0DFF72",
  "#F538FF",
  "#FF8E0D",
  "#FFE138",
  "#3877FF",
];

const pieceMove = (direction) => {
  piece.position.x += direction;
  if (collide(board, piece)) piece.position.x -= direction;
};

const pieceReset = () => {
  const pieces = "ILJOTSZ";
  piece.shape = createPiece(pieces[(pieces.length * Math.random()) | 0]);
  piece.position.y = 0;
  piece.position.x =
    ((board[0].length / 2) | 0) - ((piece.shape[0].length / 2) | 0);

  // Clear board when game over
  if (collide(board, piece))
    board.forEach((row) => {
      row.fill(0);
      score = 0;
      updateScore();
      updateLevel();
    });
};

const pieceRotate = (direction) => {
  const position = piece.position.x;
  let offset = 1;

  rotate(piece.shape, direction);

  while (collide(board, piece)) {
    piece.position.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));

    if (offset > piece.shape[0].length) {
      rotate(piece.shape, -direction);
      piece.position.x = position;
      return;
    }
  }
};

const rotate = (piece, direction) => {
  for (let y = 0; y < piece.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [piece[x][y], piece[y][x]] = [piece[y][x], piece[x][y]];
    }
  }
  if (direction > 0) {
    piece.forEach((row) => row.reverse());
  } else {
    piece.reverse();
  }
};

// Bottom border
const freeze = (board, piece) => {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + piece.position.y][x + piece.position.x] = value;
      }
    });
  });
};

const boardSweep = () => {
  let rowCounter = 1;
  outer: for (let y = board.length - 1; y > 0; --y) {
    for (let x = 0; x < board[y].length; ++x) {
      if (board[y][x] === 0) {
        continue outer;
      }
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    ++y;

    // Count colapsed lines
    lines++;
  }

  // Update score
  score += rowCounter * 10;
  rowCounter *= 2;
};

const updateScore = () => {
  document.querySelector("#score").innerText = score;
};
const updateLevel = () => {
  let levelStep = 50;
  document.querySelector("#level").innerText = level;

  // Maximum speed
  if (time.interval < 100) return;

  //Increase level speed
  if (lines > LINES_PER_LEVEL) {
    time.interval -= levelStep;
    lines = 0;
  }
};

// Move piece on key  press
document.addEventListener("keydown", (e) => {
  if (e.keyCode === 37) pieceMove(-1);
  if (e.keyCode === 39) pieceMove(1);
  if (e.keyCode === 40) {
    pieceDrop();
  }
  if (e.keyCode === 38) {
    pieceRotate(1);
  }
});

pieceReset();
update();
