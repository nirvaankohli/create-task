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

function getGameState(game) {
  return {
    board: game.chess.board(),
    turn: game.chess.turn(),
    state: game.state,
  };
}

function broadcastToGame(gameID, payload) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.gameID === gameID) {
      client.send(JSON.stringify(payload));
    }
  });
}

function broadcastGameState(gameID) {
  const game = games[gameID];
  if (!game) {
    return;
  }

  game.turn = game.chess.turn();
  broadcastToGame(gameID, {
    type: "game_state",
    gameID,
    gameState: getGameState(game),
  });
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  ws.gameID = url.searchParams.get("gameID");
  ws.player_cookie_hash = url.searchParams.get("player_cookie_hash");

  if (
    ws.player_cookie_hash !== games[ws.gameID]?.player1?.cookie_hash &&
    ws.player_cookie_hash !== games[ws.gameID]?.player2?.cookie_hash
  ) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid player." }));
    ws.close();
    return;
  }

  ws.on("message", (message) => {
    const data = JSON.parse(message.toString());
    const gameID = ws.gameID;
    const game = games[gameID];

    if (!game) {
      ws.send(JSON.stringify({ type: "error", message: "Game not found." }));
      return;
    }

    if (data.type === "move") {
      try {
        const player = [game.player1, game.player2].find(
          (p) => p?.cookie_hash === ws.player_cookie_hash,
        );

        if (!player || player.color !== game.turn) {
          ws.send(
            JSON.stringify({
              type: "move_result",
              status: "illegal",
              message: "Invalid move.",
            }),
          );
          return;
        }

        if (game.chess.get(data.move.from)?.color !== game.turn) {
          ws.send(
            JSON.stringify({
              type: "move_result",
              status: "illegal",
              message: "Invalid move.",
            }),
          );
          return;
        }

        const result = game.chess.move(data.move);
        game.turn = game.chess.turn();

        if (game.chess.isCheckmate()) {
          game.state = "checkmate";
        } else if (game.chess.isDraw()) {
          game.state = "draw";
        } else {
          game.state = "in_progress";
        }

        ws.send(
          JSON.stringify({
            type: "move_result",
            status: "legal",
            move: result,
          }),
        );
        broadcastGameState(gameID);
      } catch (error) {
        ws.send(
          JSON.stringify({
            type: "move_result",
            status: "illegal",
            message: error.message,
          }),
        );
      }
      return;
    }

    if (data.type === "update") {
      if (data.update === "resign") {
        game.state = "resigned";
        broadcastToGame(gameID, {
          type: "update",
          gameID,
          update: "resign",
          player: data.player ?? null,
          gameState: getGameState(game),
        });
        return;
      }

      if (data.update === "propose_draw") {
        broadcastToGame(gameID, {
          type: "update",
          gameID,
          update: "propose_draw",
          player: data.player ?? null,
        });
        return;
      }

      ws.send(
        JSON.stringify({ type: "error", message: "Unknown update type." }),
      );
      return;
    }

    ws.send(
      JSON.stringify({ type: "error", message: "Unknown message type." }),
    );
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

app.get("/", (req, res) => {
  res.send("EzChess Server is running.");
});

app.post("/create-game", (req, res) => {
  const color = req.body.color;
  const player_cookie_hash = req.body.player_cookie_hash;

  const gameID = randomGameID();
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
  const gameID = req.body.gameID;
  const player_cookie_hash = req.body.player_cookie_hash;

  if (games[gameID] && games[gameID].state === "waiting_for_player") {
    games[gameID].player2 = {
      cookie_hash: player_cookie_hash,
      color: games[gameID].player1.color === "w" ? "b" : "w",
    };
    games[gameID].state = "in_progress";
    broadcastGameState(gameID);
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
