import type { GameState } from "@taki/shared";

export function isNameAvailable(players: GameState["players"], selfId: string, name: string): boolean {
  return !players.some(player => player.id !== selfId && player.name === name);
}
