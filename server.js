const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { Chess } = require("chess.js");

const app = express();
const PORT = 3000;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

games = {};

app.get("/", (req, res) => {
  res.send("EzChess Server is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
