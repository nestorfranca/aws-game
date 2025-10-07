import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { updateGameState } from "./gameLogic.js";

dotenv.config();

const sqs = new SQSClient({ region: process.env.AWS_REGION });
const QUEUE_URL = process.env.QUEUE_URL;
const PORT = process.env.PORT || 8080;

// Estado global do jogo
const gameState = {
  players: {}, // {playerId: {x, y, color}}
  foods: [],
};

// WebSocket server
const wss = new WebSocketServer({ port: PORT });
console.log(`✅ WebSocket server rodando na porta ${PORT}`);

wss.on("connection", (ws) => {
  console.log("Novo jogador conectado");

  const playerId = "p" + Math.random().toString(36).slice(2, 8);
  gameState.players[playerId] = {
    x: Math.random() * 500,
    y: Math.random() * 500,
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  };

  ws.playerId = playerId;
  ws.send(JSON.stringify({ type: "init", playerId }));

  ws.on("close", () => {
    delete gameState.players[playerId];
  });
});

// Função para enviar o estado atualizado a todos
function broadcastState() {
  const snapshot = JSON.stringify({ type: "state", gameState });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(snapshot);
  });
}

// Lê mensagens do SQS
async function pollSqs() {
  while (true) {
    try {
      const cmd = new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 10, // long polling
      });

      const response = await sqs.send(cmd);
      if (response.Messages) {
        for (const msg of response.Messages) {
          const body = JSON.parse(msg.Body);
          handlePlayerInput(body);

          // Exclui mensagem processada
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: msg.ReceiptHandle,
          }));
        }
      }
    } catch (err) {
      console.error("Erro lendo SQS:", err);
    }
  }
}

function handlePlayerInput(inputMsg) {
  const { playerId, dx, dy } = inputMsg;
  if (!gameState.players[playerId]) return;
  gameState.players[playerId].x += dx;
  gameState.players[playerId].y += dy;
}

// Loop principal do jogo
setInterval(() => {
  updateGameState(gameState);
  broadcastState();
}, 100);

// Inicia o polling do SQS
pollSqs();
