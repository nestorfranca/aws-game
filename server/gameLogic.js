export function updateGameState(state) {
  // Exemplo simples: manter posições dentro da tela
  for (const id in state.players) {
    const p = state.players[id];
    p.x = Math.max(0, Math.min(800, p.x));
    p.y = Math.max(0, Math.min(600, p.y));
  }
}
