

const socket = io();
const chesscom = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
  const board = chesscom.board(); // Returns a 2D array of the complete chessboard
  boardElement.innerHTML = "";
  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      // If square is not null
      if (square) {
        // If square is not null, we have to develop the pieces
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.color === "w" ? "white" : "black"
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (event) => {
          if (pieceElement.draggable) {
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            event.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", (e) => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (event) => {
        event.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  if (playerRole === 'b') {
    boardElement.classList.add('flipped');
  } else {
    boardElement.classList.remove('flipped');
  }
};

const handleMove = (source, target) => {
  const move = chesscom.move({
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: 'q'
  });

  if (move) {
    console.log("Move Emitted:", move);
    socket.emit("move", move);
  } else {
    console.log("Invalid Move:", source, target);
  }
};

socket.on("playerRole", (role) => {
  console.log("Player Role:", role);
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (fen) => {
  chesscom.load(fen);
  renderBoard();
});

socket.on("move", (move) => {
  console.log("Received Move:", move);
  if (move && move.from && move.to) {
    chesscom.move(move);
    renderBoard();
  } else {
    console.error("Invalid move received:", move);
  }
});

const getPieceUnicode = (piece) => {
  const unicodePieces = {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
    K: "♔",
    Q: "♕",
    R: "♖",
    B: "♗",
    N: "♘",
    P: "♙",
  };
  return unicodePieces[piece.type] || "";
};

renderBoard();
