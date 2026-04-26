const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { Chess } = require("chess.js");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const games = {};

function randomGameID() {
  return Math.random().toString(36).substring(2, 15);
}

function broadcastGameState(gameID) {
  const game = games[gameID];
  if (!game) {
    return;
  }

  const gameState = {
    board: game.chess.board(),
    turn: game.turn,
    state: game.state,
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.gameID === gameID) {
      client.send(
        JSON.stringify({
          type: "game_state",
          gameID,
          gameState,
        })
      );
    }
  });
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  ws.gameID = url.searchParams.get("gameID");
});


app.get("/", (req, res) => {
  res.send("EzChess Server is running.");
});

app.post("/create-game", (req, res) => {
  color = req.body.color;
  player_cookie_hash = req.body.player_cookie_hash;

  gameID = randomGameID();
  games[gameID] = {
    id: gameID,
    chess: new Chess(),
    player1: {
      cookie_hash: player_cookie_hash,
      color: color,
    },
    player2: null,
    turn: "w",
    state: "waiting_for_player",
  };

  res.json({ success: true, gameID: gameID });
});

app.post("/join-game", (req, res) => {
  gameID = req.body.gameID;
  player_cookie_hash = req.body.player_cookie_hash;

  if (games[gameID] && games[gameID].state === "waiting_for_player") {
    games[gameID].player2 = {
      cookie_hash: player_cookie_hash,
      color: games[gameID].player1.color === "w" ? "b" : "w",
    };
    games[gameID].state = "in_progress";
    res.json({ success: true, gameID: gameID });
  } else {
    res.status(400).json({
      success: false,
      message: "Game not found or already in progress.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
