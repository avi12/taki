<script lang="ts">
  import PencilIcon from "$lib/components/PencilIcon.svelte";
  import { locale } from "$lib/locale.svelte";
  import { type GameState } from "$lib/network";
  import { onDestroy, untrack } from "svelte";
  import { fade, scale } from "svelte/transition";

  interface Props {
    gameRoomState: GameState;
    isHost: boolean;
    playerName: string;
    onPlayAgain: () => void;
    onRename: (name: string) => void;
    onPreviewName: (name: string) => void;
    onCancelRename: () => void;
  }

  const {
    gameRoomState, isHost, playerName, onPlayAgain, onRename,
    onPreviewName, onCancelRename
  }: Props = $props();

  let renameValue = $state(untrack(() => playerName));
  let isRenameActive = $state(false);

  $effect(() => {
    if (!isRenameActive) {
      renameValue = playerName;
    }
  });

  type ConfettiPiece = {
    x: number;
    color: string;
    delay: number;
    dur: number;
    rot: number;
    size: number;
    shape: number;
  };

  function randomFloat(): number {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF;
  }

  function generateConfettiPieces(): ConfettiPiece[] {
    const colors = ["#E8192C", "#1565C0", "#2E7D32", "#FFD600", "#ffffff", "#ff9800", "#e91e63"];
    return Array.from({ length: 70 }, (_, pieceIdx) => ({
      x: randomFloat() * 100,
      color: colors[pieceIdx % colors.length],
      delay: randomFloat() * 3,
      dur: 2.5 + randomFloat() * 2.5,
      rot: randomFloat() * 720 - 360,
      size: 7 + randomFloat() * 11,
      shape: Math.floor(randomFloat() * 3)
    }));
  }

  const WIN_SCREEN_DELAY_MS = 5000;

  let confettiPieces = $state<ConfettiPiece[]>([]);
  let isWinScreenVisible = $state(false);
  let previousWinner: string | null = null;
  let winScreenTimeoutId: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const currentWinner = gameRoomState.winner;
    if (currentWinner === previousWinner) {
      return;
    }

    previousWinner = currentWinner;
    clearTimeout(winScreenTimeoutId);

    if (!currentWinner) {
      confettiPieces = [];
      isWinScreenVisible = false;
      return;
    }

    confettiPieces = generateConfettiPieces();
    isWinScreenVisible = false;
    winScreenTimeoutId = setTimeout(() => {
      isWinScreenVisible = true;
    }, WIN_SCREEN_DELAY_MS);
  });

  onDestroy(() => clearTimeout(winScreenTimeoutId));

  const winnerPlayer = $derived(
    gameRoomState.players.find(player => player.id === gameRoomState.winner)
  );

  const sortedPlayers = $derived(
    [...gameRoomState.players].sort(
      (left, right) => (gameRoomState.wins[right.id] ?? 0) - (gameRoomState.wins[left.id] ?? 0)
    )
  );

  const renamingPlayerNames = $derived(
    gameRoomState.players
      .filter(player => player.previewName)
      .map(player => player.name)
  );
</script>

{#if gameRoomState.winner}
  <p class="sr-only" aria-live="assertive" role="status">
    {winnerPlayer?.name} {locale.strings.won}
  </p>

  {#each confettiPieces as piece, confettiIdx (confettiIdx)}
    <div
      style:--x={piece.x}
      style:--delay={piece.delay}
      style:--dur={piece.dur}
      style:--rot={piece.rot}
      style:--size={piece.size}
      style:--color={piece.color}
      class="confetti-piece"
      class:confetti-circle={piece.shape === 1}
      class:confetti-triangle={piece.shape === 2}
    ></div>
  {/each}

  {#if isWinScreenVisible}
    <div class="winner-overlay" transition:fade={{ duration: 400 }}>
      <div
        class="winner-content" in:scale={{
          duration: 500,
          start: 0.5
        }}>
        <div class="winner-trophy">🏆</div>
        <h1 class="winner-name" dir="auto">{winnerPlayer?.name}</h1>
        <p class="winner-subtitle">{locale.strings.won}</p>

        <div class="leaderboard">
          {#each sortedPlayers as player, rank (player.id)}
            {@const winCount = gameRoomState.wins[player.id] ?? 0}
            <div
              class="leaderboard-row"
              class:leaderboard-winner={player.id === gameRoomState.winner}
            >
              <span class="lb-rank">{rank + 1}</span>
              <span class="lb-name" dir="auto">{player.name}</span>
              {#if winCount > 0}
                <span class="lb-wins">{winCount}🏆</span>
              {:else}
                <span class="lb-wins lb-no-wins">—</span>
              {/if}
            </div>
          {/each}
        </div>

        <form
          class="rename-row" onsubmit={e => {
            e.preventDefault();

            if (renameValue.trim() && renameValue.trim() !== playerName) {
              onRename(renameValue.trim());
            } else {
              renameValue = playerName;
              onCancelRename();
            }

            isRenameActive = false;
          }}>
          <p class="rename-label">{locale.strings.changeName}</p>
          <div class="rename-field">
            <input
              class="rename-input"
              dir="auto"
              maxlength="20"
              onblur={() => {
                setTimeout(() => {
                  if (!isRenameActive) {
                    return;
                  }

                  if (renameValue.trim() && renameValue.trim() !== playerName) {
                    onRename(renameValue.trim());
                  } else {
                    renameValue = playerName;
                    onCancelRename();
                  }

                  isRenameActive = false;
                }, 150);
              }}
              onfocus={() => {
                isRenameActive = true;
                onPreviewName(renameValue.trim() || playerName);
              }}
              oninput={() => {
                if (renameValue.trim()) {
                  onPreviewName(renameValue.trim());
                } else {
                  onCancelRename();
                }
              }}
              placeholder={locale.strings.newNamePlaceholder}
              type="text"
              bind:value={renameValue}
            />
            {#if isRenameActive}
              <button
                class="rename-confirm-btn"
                aria-label={locale.strings.confirmRename}
                type="submit"
              >✓</button>
            {/if}
          </div>
        </form>

        {#if isHost}
          {#if renamingPlayerNames.length > 0}
            <p class="renaming-hint" aria-live="polite">
              <PencilIcon /> {locale.strings.waitingForRename(renamingPlayerNames.join(", "), renamingPlayerNames.length)}
            </p>
          {/if}
          <button class="primary-btn" onclick={onPlayAgain}>{locale.strings.playAgain}</button>
        {:else}
          <p class="waiting-for-host" aria-live="polite">
            {locale.strings.waitingForHost.before}<span dir="auto">{gameRoomState.players[0]?.name ?? ""}</span>{locale.strings.waitingForHost.after}
          </p>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style>
  .sr-only {
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .winner-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background: rgb(0 0 0 / 88%);
    backdrop-filter: blur(16px);
  }

  .winner-content {
    position: relative;
    z-index: 2;
    max-width: 90vw;
    padding: clamp(1.5rem, 5vw, 3rem) clamp(1.5rem, 8vw, 4rem);
    border: 1px solid rgb(255 214 0 / 30%);
    border-radius: 2.5rem;
    background: var(--winner-content-bg);
    color: var(--text);
    text-align: center;
    box-shadow: 0 0 80px rgb(255 214 0 / 15%), 0 40px 80px rgb(0 0 0 / 40%);
  }

  .winner-trophy {
    margin-bottom: 0.5rem;
    font-size: clamp(2.5rem, 7vw, 4rem);
    line-height: 1;
    animation: trophy-spin 3s ease-in-out infinite;
  }

  @keyframes trophy-spin {
    0%,
 100%{ rotate: -5deg; scale: 1; }
    50%{ rotate: 5deg; scale: 1.1; }
  }

  .winner-name {
    margin: 0 0 0.25rem;
    background: linear-gradient(135deg, #ffd600, #e8192c);
    background-clip: text;
    background-clip: text;
    font-weight: 900;
    font-size: clamp(1.8rem, 6vw, 3rem);
    line-height: 1.1;
    -webkit-text-fill-color: transparent;
  }

  .winner-subtitle {
    margin: 0 0 1rem;
    color: var(--winner-subtitle-color);
    font-weight: 600;
    font-size: clamp(1rem, 3vw, 1.4rem);
  }

  .leaderboard {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  .leaderboard-row {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    padding: 0.45rem 0.75rem;
    border-radius: 0.6rem;
    background: rgb(0 0 0 / 5%);

    &.leaderboard-winner {
      background: rgb(255 214 0 / 15%);
      outline: 1px solid rgb(255 214 0 / 35%);
    }
  }

  :global([data-theme="dark"]) .leaderboard-row {
    background: rgb(255 255 255 / 6%);
  }

  .lb-rank {
    width: 1.2em;
    color: var(--winner-subtitle-color);
    font-weight: 800;
    font-size: 0.75rem;
    text-align: center;
  }

  .lb-name {
    flex: 1;
    font-weight: 700;
    font-size: 0.9rem;
    text-align: start;
  }

  .lb-wins {
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: -0.01em;

    &.lb-no-wins {
      color: var(--text-muted);
      font-weight: 400;
    }
  }

  /* Confetti */
  .confetti-piece {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1500;
    width: var(--size);
    height: var(--size);
    border-radius: 2px;
    background: var(--color);
    pointer-events: none;
    translate: calc(var(--x) * 1%) -20px;
    animation: confetti-fall var(--dur) var(--delay) linear forwards;

    &.confetti-circle {
      border-radius: 50%;
    }

    &.confetti-triangle {
      width: 0;
      height: 0;
      border-right: calc(var(--size) / 2) solid transparent;
      border-bottom: var(--size) solid var(--color);
      border-left: calc(var(--size) / 2) solid transparent;
      background: transparent;
    }
  }

  @keyframes confetti-fall {
    0% {
      opacity: 100%;
      rotate: 0deg;
      translate: 0 0;
    }

    80% {
      opacity: 100%;
    }

    100% {
      opacity: 0%;
      rotate: calc(var(--rot) * 1deg);
      translate: 30px 110vh;
    }
  }

  .rename-row {
    width: 100%;
    margin-bottom: 0.75rem;
  }

  .rename-label {
    margin: 0 0 0.35rem;
    color: var(--text-muted);
    font-weight: 700;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-align: center;
    text-transform: uppercase;
  }

  .rename-field {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .rename-input {
    flex: 1;
    box-sizing: border-box;
    min-width: 0;
    padding: 0.65rem 1rem;
    border: 1px solid var(--input-border);
    border-radius: 0.75rem;
    background: var(--input-bg);
    color: var(--text);
    outline: none;
    font-family: inherit;
    font-size: 0.95rem;
    text-align: center;
    transition: border-color 0.2s, box-shadow 0.2s;

    &::placeholder {
      color: var(--input-placeholder);
    }

    &:focus {
      border-color: rgb(255 214 0 / 50%);
      box-shadow: 0 0 0 3px rgb(255 214 0 / 12%);
    }
  }

  .rename-confirm-btn {
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 0.65rem;
    background: linear-gradient(135deg, #2e7d32, #1b5e20);
    color: white;
    font-weight: 800;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgb(46 125 50 / 40%);
    cursor: pointer;
    transition: translate 0.15s, scale 0.15s;

    &:hover {
      scale: 1.05;
      translate: 0 -1px;
    }
  }

  .renaming-hint {
    margin: 0 0 0.5rem;
    color: rgb(255 214 0 / 85%);
    font-weight: 600;
    font-size: 0.8rem;
    animation: hint-pulse 1.5s ease-in-out infinite;
  }

  @keyframes hint-pulse {
    0%,
 100%{ opacity: 70%; }
    50%{ opacity: 100%; }
  }

  .waiting-for-host {
    margin: 0;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.85rem;
    animation: hint-pulse 2s ease-in-out infinite;
  }

  .primary-btn {
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 1rem;
    background: linear-gradient(135deg, #e8192c, #c0101f);
    color: white;
    font-weight: 800;
    font-size: clamp(0.95rem, 2.5vw, 1.1rem);
    letter-spacing: 0.02em;
    box-shadow: 0 8px 20px rgb(232 25 44 / 40%), 0 2px 4px rgb(0 0 0 / 30%);
    cursor: pointer;
    transition:
      translate 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      scale 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275),
      box-shadow 0.2s;

    &:hover:not(:disabled) {
      scale: 1.02;
      translate: 0 -3px;
    }
  }
</style>
