<script lang="ts">
  import OpponentCard from "$lib/components/game/OpponentCard.svelte";
  import { type GameState } from "$lib/network";

  interface Props {
    gameRoomState: GameState;
    myId: string;
    isHost: boolean;
    plusFourRecipientId?: string | null;
    stopSkippedPlayerId?: string | null;
    onRenamePlayer: (targetId: string, name: string) => void;
  }

  const {
    gameRoomState, myId, isHost,
    plusFourRecipientId = null, stopSkippedPlayerId = null,
    onRenamePlayer
  }: Props = $props();

  const opponents = $derived(gameRoomState.players.filter(player => player.id !== myId));
</script>

<div class="opponents">
  {#each opponents as opponent (opponent.id)}
    <div class="opponent-wrapper">
      <OpponentCard
        isActive={gameRoomState.players[gameRoomState.iCurrentPlayer].id === opponent.id}
        isEliminated={gameRoomState.eliminatedPlayers?.includes(opponent.id) ?? false}
        {isHost}
        {onRenamePlayer}
        {opponent}
        players={gameRoomState.players}
        {plusFourRecipientId}
        plusTwoValue={gameRoomState.plusTwoValue}
        {stopSkippedPlayerId}
      />
    </div>
  {/each}
</div>

<style>
  .opponents {
    z-index: 20;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    padding: 1rem 1rem 0;

    @media (width <= 600px) {
      flex-wrap: nowrap;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 2rem 0 0.75rem;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }

  .opponent-wrapper {
    display: flex;

    @media (width <= 600px) {
      &:first-child {
        margin-inline-start: 0.75rem;
      }

      &:last-child {
        margin-inline-end: 0.75rem;
      }
    }
  }
</style>
