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

games = {};

function randomGameID() {
    return Math.random().toString(36).substring(2, 15);
}

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
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
