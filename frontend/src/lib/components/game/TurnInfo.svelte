<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import type { GameState } from "$lib/network";
  import { fly } from "svelte/transition";

  const TURN_TIMEOUT_SECONDS       = 45;
  const URGENT_COUNTDOWN_THRESHOLD = 10;
  const MS_PER_SECOND              = 1_000;

  interface Props {
    gameRoomState: GameState;
    isMyTurnNow: boolean;
    isHost: boolean;
    onSkipDisconnected: () => void;
    onKickPlayer: (targetId: string) => void;
    onHoldTurn: (isHeld: boolean) => void;
  }

  const {
    gameRoomState, isMyTurnNow, isHost,
    onSkipDisconnected, onKickPlayer, onHoldTurn
  }: Props = $props();

  const currentPlayer = $derived(
    gameRoomState.players[gameRoomState.iCurrentPlayer]
  );

  const waitingPrefix = $derived(locale.strings.waitingFor.before);
  const waitingSuffix = $derived(locale.strings.waitingFor.after);

  const nextPlayerAfterSkip = $derived.by(() => {
    const {
      players, iCurrentPlayer, direction, eliminatedPlayers
    } = gameRoomState;
    let iNext = (iCurrentPlayer + direction + players.length) % players.length;
    for (let safety = players.length; safety > 0; safety--) {
      const isSkippable = eliminatedPlayers.includes(players[iNext].id) || !players[iNext].isConnected;
      if (!isSkippable) {
        break;
      }

      iNext = (iNext + direction + players.length) % players.length;
    }

    return players[iNext];
  });

  let secondsRemaining = $state(TURN_TIMEOUT_SECONDS);

  $effect(() => {
    const startedAt = gameRoomState.turnStartedAt;

    function update(): void {
      const elapsed = Math.floor((Date.now() - startedAt) / MS_PER_SECOND);
      secondsRemaining = Math.max(0, TURN_TIMEOUT_SECONDS - elapsed);
    }

    update();
    const interval = setInterval(update, MS_PER_SECOND);
    return () => clearInterval(interval);
  });

  const isGameActive = $derived(
    gameRoomState.discardPile.length > 0 && !gameRoomState.winner && gameRoomState.turnStartedAt > 0
  );
  const isTimeRunningOut = $derived(isGameActive && secondsRemaining <= URGENT_COUNTDOWN_THRESHOLD);
</script>

<div class="game-info" aria-atomic="true" aria-live="polite">
  {#if isMyTurnNow}
    <div class="your-turn-wrap">
      <span class="your-turn">{locale.strings.yourTurn}</span>
      {#if isGameActive}
        <span class="countdown" class:is-urgent={isTimeRunningOut} aria-live="off">⏱ {secondsRemaining}</span>
      {/if}
    </div>
  {:else}
    <div class="waiting-wrap">
      <span class="waiting-text">{waitingPrefix}<span dir="auto">{currentPlayer.name}</span>{waitingSuffix}</span>
      {#if isGameActive}
        <span class="countdown" class:is-urgent={isTimeRunningOut} aria-live="off">⏱ {secondsRemaining}</span>
      {/if}
    </div>
    {@const disconnectedPlayers = gameRoomState.players.filter(player => !player.isConnected)}
    {#if disconnectedPlayers.length > 0}
      <div
        class="disconnected-notice" in:fly={{
          y: -12,
          duration: 320
        }}>
        <span dir="auto">{locale.strings.disconnected} {disconnectedPlayers.map(player => player.name).join(", ")}</span>
        {#if isHost}
          <div class="host-actions">
            {#if !currentPlayer.isConnected}
              <button class="skip-btn" dir="auto" onclick={onSkipDisconnected}>
                {locale.strings.skipTo(nextPlayerAfterSkip.name)}
              </button>
              <button
                class="hold-btn"
                class:is-held={gameRoomState.isIdleTimerHeld}
                onclick={() => onHoldTurn(!gameRoomState.isIdleTimerHeld)}
              >
                {gameRoomState.isIdleTimerHeld ? locale.strings.releaseTurn : locale.strings.holdTurn}
              </button>
            {/if}
            {#each disconnectedPlayers as disconnectedPlayer (disconnectedPlayer.id)}
              <button class="kick-btn" dir="auto" onclick={() => onKickPlayer(disconnectedPlayer.id)}>
                {locale.strings.kickDisconnected} {disconnectedPlayer.name}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  .game-info {
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
    margin: 0.5rem 0 3rem;

    @media (width <= 600px) {
      margin-top: auto;
      margin-bottom: clamp(1rem, 6vh, 4rem);
    }
  }

  .your-turn-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
    pointer-events: auto;
  }

  .waiting-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
  }

  .countdown {
    color: var(--text-muted);
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.03em;
    transition: color 0.3s;

    &.is-urgent {
      color: #e8192c;
      animation: pulse 0.8s ease-in-out infinite;
    }
  }

  @keyframes pulse {
    0%,
 100%{ opacity: 100%; }
    50%{ opacity: 50%; }
  }

  .your-turn {
    display: block;
    color: #ffd600;
    font-weight: 900;
    font-size: clamp(1.4rem, 4.5vw, 2.5rem);
    letter-spacing: -0.01em;
    text-shadow: 0 0 30px rgb(255 214 0 / 60%), 0 2px 4px rgb(0 0 0 / 50%);
  }

  .waiting-text {
    padding: 0.4rem 1rem;
    border-radius: 2rem;
    background: var(--waiting-bg);
    color: var(--waiting-color);
    font-weight: 600;
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
    backdrop-filter: blur(8px);
  }

  .disconnected-notice {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: center;
    padding: 0.5rem 1rem;
    border: 1px solid rgb(232 25 44 / 25%);
    border-radius: 1rem;
    background: rgb(232 25 44 / 10%);
    color: #e8192c;
    font-weight: 700;
    font-size: 0.85rem;
    pointer-events: auto;
  }

  .host-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
  }

  .skip-btn {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 2rem;
    background: rgb(21 101 192 / 80%);
    color: white;
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: var(--blue);
    }
  }

  .kick-btn {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 2rem;
    background: rgb(232 25 44 / 70%);
    color: white;
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: var(--red);
    }
  }

  .hold-btn {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 2rem;
    background: rgb(46 125 50 / 70%);
    color: white;
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.2s;

    &.is-held {
      background: rgb(46 125 50 / 100%);
    }

    &:hover {
      background: rgb(46 125 50 / 90%);
    }
  }
</style>
