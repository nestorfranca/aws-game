const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ws = new WebSocket("ws://<EC2_PUBLIC_IP>:8080");
let playerId = null;
let players = {};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === "init") {
    playerId = msg.playerId;
  } else if (msg.type === "state") {
    players = msg.gameState.players;
    draw();
  }
};

function draw() {
  ctx.clearRect(0, 0, 800, 600);
  for (const id in players) {
    const p = players[id];
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Envia input via fetch (direto para o servidor que escreve no SQS)
async function sendInput(dx, dy) {
  await fetch(`http://<EC2_PUBLIC_IP>:3000/input`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId, dx, dy }),
  });
}

window.addEventListener("keydown", (e) => {
  if (!playerId) return;
  if (e.key === "ArrowUp") sendInput(0, -5);
  if (e.key === "ArrowDown") sendInput(0, 5);
  if (e.key === "ArrowLeft") sendInput(-5, 0);
  if (e.key === "ArrowRight") sendInput(5, 0);
});
