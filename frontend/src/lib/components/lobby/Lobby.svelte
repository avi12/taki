<script lang="ts">
  import LobbyBackground from "$lib/components/lobby/LobbyBackground.svelte";
  import LobbyPlayers from "$lib/components/lobby/LobbyPlayers.svelte";
  import LobbyShare from "$lib/components/lobby/LobbyShare.svelte";
  import TakiLogo from "$lib/components/TakiLogo.svg?raw";
  import { locale } from "$lib/locale.svelte";
  import type { GameState } from "$lib/network";
  import { fly, slide } from "svelte/transition";

  let {
    playerName = $bindable(),
    isJoining = $bindable(false),
    isJoiningViaLink,
    roomIdInput,
    isHost,
    gameRoomState,
    shareUrl,
    isCopied,
    isShareAvailable,
    myId,
    joinErrorMessage,
    onHostGame,
    onJoinGame,
    onStartGame,
    onShareGame,
    onCopyUrl,
    onKickPlayer,
    onReorderPlayers,
    onClearLink,
    onToggleNoMercyMode,
    onRename,
    onPreviewName,
    onCancelRename
  }: {
    playerName: string;
    isJoining: boolean;
    isJoiningViaLink: boolean;
    roomIdInput: string;
    isHost: boolean;
    gameRoomState: GameState | null;
    shareUrl: string;
    isCopied: boolean;
    isShareAvailable: boolean;
    myId: string;
    joinErrorMessage: string | null;
    onHostGame: () => void;
    onJoinGame: () => void;
    onStartGame: () => void;
    onShareGame: () => void;
    onCopyUrl: () => void;
    onKickPlayer: (id: string) => void;
    onReorderPlayers: (playerIds: string[]) => void;
    onClearLink: () => void;
    onToggleNoMercyMode: (enabled: boolean) => void;
    onRename: (name: string) => void;
    onPreviewName: (name: string) => void;
    onCancelRename: () => void;
  } = $props();
</script>

<div
  class="lobby" in:fly={{
    y: 60,
    duration: 500
  }}>
  <LobbyBackground />

  <div class="lobby-inner">
    <div class="game-logo-container" aria-hidden="true">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html TakiLogo}
    </div>
    <h1 class="sr-only">Taki</h1>

    {#if !gameRoomState}
      <form
        onsubmit={e => {
          e.preventDefault();

          if (isJoiningViaLink) {
            onJoinGame();
          } else {
            onHostGame();
          }
        }}
      >
        <label class="name-label" for="player-name">{locale.strings.yourName}</label>
        <input
          id="player-name"
          name="name"
          autocomplete="nickname"
          dir="auto"
          disabled={isJoining}
          type="text"
          bind:value={playerName}
        />

        <div class="actions">
          {#if !isJoiningViaLink}
            <button class="primary-btn" type="submit">
              {locale.strings.createRoom}
            </button>
          {:else}
            <div class="join-room-badge">
              <span class="join-room-icon">🎮</span>
              <span>{locale.strings.joiningRoom}<strong>{roomIdInput}</strong></span>
            </div>
            <button
              class="secondary-btn"
              class:is-joining={isJoining}
              disabled={!playerName || isJoining}
              type="submit"
            >
              {#if isJoining}
                <span class="btn-spinner" aria-hidden="true"></span>
                {locale.strings.connecting}
              {:else}
                {locale.strings.joinGame}
              {/if}
            </button>
            <div class="divider"><span>{locale.strings.or}</span></div>
            <button
              class="text-btn"
              onclick={onClearLink}
              type="button"
            >
              {locale.strings.clearLink}
            </button>
            {#if joinErrorMessage}
              <p class="join-error" role="alert">{joinErrorMessage}</p>
            {/if}
          {/if}
        </div>
      </form>
    {/if}

    <p class="version-label" aria-hidden="true">v{__APP_VERSION__}</p>

    {#if gameRoomState?.players?.length}
      <LobbyPlayers
        {gameRoomState}
        {isHost}
        {myId}
        {onCancelRename}
        {onKickPlayer}
        {onPreviewName}
        {onRename}
        {onReorderPlayers}
      />

      {#if !isHost && gameRoomState?.isNoMercyMode}
        <div class="no-mercy-badge" transition:slide={{ duration: 250 }}>{locale.strings.noMercyActive}</div>
      {/if}

      {#if isHost}
        <div class="mode-toggle">
          <label class="toggle-label">
            <span class="toggle-text">
              <span class="toggle-title">{locale.strings.noMercy} {gameRoomState?.isNoMercyMode ? "⚡" : "😅"}</span>
              <span class="toggle-sub">{locale.strings.noMercySub}</span>
            </span>
            <button
              class="toggle-switch"
              class:on={gameRoomState?.isNoMercyMode}
              aria-checked={gameRoomState?.isNoMercyMode ?? false}
              aria-label={locale.strings.noMercyAriaLabel}
              onclick={() => onToggleNoMercyMode(!gameRoomState?.isNoMercyMode)}
              role="switch"
              type="button"
            >
              <span class="toggle-knob"></span>
            </button>
          </label>
        </div>
        <button class="start-btn" disabled={(gameRoomState?.players?.length ?? 0) < 2} onclick={onStartGame}>
          <span class="start-icon">▶</span>
          {locale.strings.startGame}
        </button>
        <LobbyShare
          {isCopied}
          {isShareAvailable}
          onCopy={onCopyUrl}
          onNativeShare={onShareGame}
          {shareUrl}
        />
      {/if}
    {/if}
  </div>
</div>

<style>
  :global(.taki-logo-svg) {
    width: 100%;
    max-width: 240px;
    height: auto;
    filter: drop-shadow(0 4px 12px rgb(232 25 44 / 40%));
  }

  .lobby {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 460px;
  }

  /* Allow lobby to scroll on short viewports (landscape phones) */
  :global(body:has(.lobby)) {
    overflow-y: auto;
    touch-action: auto;
  }

  .lobby-inner {
    position: relative;
    z-index: 1;
    padding: clamp(1.25rem, 5vw, 2.5rem) clamp(0.75rem, 4vw, 2rem);
    border: 1px solid var(--glass-border);
    border-radius: 2rem;
    background: var(--panel-bg);
    text-align: center;
    box-shadow: var(--panel-shadow);
    backdrop-filter: blur(24px);
  }

  .game-logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.8rem;
  }

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

  .name-label {
    display: block;
    margin: 0 0 0.5rem;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    margin-bottom: 1.5rem;
    padding: 1rem 1.2rem;
    border: 2px solid rgb(232 25 44 / 35%);
    border-radius: 1rem;
    background: var(--input-bg);
    color: var(--text);
    outline: none;
    font-size: clamp(1rem, 3vw, 1.2rem);
    text-align: center;
    transition: border-color 0.25s, box-shadow 0.25s;

    &::placeholder {
      color: var(--input-placeholder);
    }

    &:focus {
      border-color: var(--red);
      box-shadow: 0 0 0 4px rgb(232 25 44 / 15%);
    }
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .primary-btn,
  .secondary-btn,
  .start-btn {
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 1rem;
    color: white;
    font-weight: 800;
    font-size: clamp(0.95rem, 2.5vw, 1.1rem);
    letter-spacing: 0.02em;
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

  .primary-btn {
    background: linear-gradient(135deg, #e8192c, #c0101f);
    box-shadow: 0 8px 20px rgb(232 25 44 / 40%), 0 2px 4px rgb(0 0 0 / 30%);

    &:disabled {
      overflow: hidden;
      height: 0;
      margin: 0;
      padding: 0;
      opacity: 0%;
      pointer-events: none;
    }
  }

  .secondary-btn {
    background: linear-gradient(135deg, #1565c0, #0d3d7a);
    box-shadow: 0 8px 20px rgb(21 101 192 / 40%), 0 2px 4px rgb(0 0 0 / 30%);

    /* Prerequisite not met: clearly blocked, user needs to act */
    &:disabled:not(.is-joining) {
      opacity: 38%;
      cursor: not-allowed;
    }

    /* Loading/pending: system is working, not user's fault */
    &.is-joining {
      opacity: 75%;
      cursor: default;
      pointer-events: none;
    }
  }

  .start-btn {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin-top: 1rem;
    background: linear-gradient(135deg, #2e7d32, #1b4d20);
    box-shadow: 0 8px 20px rgb(46 125 50 / 40%), 0 2px 4px rgb(0 0 0 / 30%);

    &:disabled {
      opacity: 38%;
      cursor: not-allowed;
    }
  }

  .start-icon {
    font-size: 0.9em;
  }

  .btn-spinner {
    display: inline-block;
    vertical-align: middle;
    width: 0.9em;
    height: 0.9em;
    margin-inline-end: 0.3em;
    border: 2px solid rgb(255 255 255 / 35%);
    border-top-color: white;
    border-radius: 50%;
    animation: btn-spin 0.7s linear infinite;
  }

  @keyframes btn-spin {
    to{ rotate: 360deg; }
  }

  .join-room-badge {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
    padding: 0.75rem 1rem;
    border: 1px solid rgb(255 214 0 / 30%);
    border-radius: 0.75rem;
    background: rgb(255 214 0 / 12%);
    color: var(--yellow);
    font-size: 0.95rem;
  }

  .join-room-icon {
    font-size: 1.2rem;
  }

  .divider {
    position: relative;
    margin: 0.25rem 0;
    text-align: center;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: 1px;
      background: var(--divider-line);
      translate: 0 -50%;
    }

    span {
      position: relative;
      padding: 0 1rem;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  }

  .join-error {
    margin: 0;
    color: var(--red);
    font-weight: 500;
    font-size: 0.85rem;
  }

  .version-label {
    margin: 1.25rem 0 0.25rem;
    color: var(--text-muted);
    font-size: 0.72rem;
    text-align: center;
  }

  .text-btn {
    align-self: center;
    border: none;
    background: none;
    color: var(--text-muted);
    font-size: 0.85rem;
    text-decoration: underline;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--text);
    }
  }

  /* No Mercy Mode badge (non-host view) */
  .no-mercy-badge {
    margin-top: 0.75rem;
    padding: 0.5rem 0.9rem;
    border: 1px solid rgb(232 25 44 / 25%);
    border-radius: 0.75rem;
    background: rgb(232 25 44 / 8%);
    color: var(--red);
    font-weight: 700;
    font-size: 0.85rem;
    text-align: center;
  }

  .mode-toggle {
    margin-top: 0.9rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--section-border);
    border-radius: 1rem;
    background: var(--section-bg);
  }

  .toggle-label {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    align-items: flex-start;
    text-align: start;
  }

  .toggle-title {
    min-height: 1.3em;
    color: var(--text);
    font-weight: 700;
    font-size: 0.9rem;
  }

  .toggle-sub {
    color: var(--text-muted);
    font-size: 0.75rem;
    line-height: 1.3;
  }

  .toggle-switch {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    width: 48px;
    height: 26px;
    padding: 3px;
    border: none;
    border-radius: 13px;
    background: var(--input-border);
    cursor: pointer;
    transition: background 0.25s ease;

    &.on {
      background: var(--red);

      .toggle-knob {
        translate: 22px 0;

        :dir(rtl) & {
          translate: -22px 0;
        }

        &::after {
          content: "✓";
          color: var(--red);
        }
      }
    }
  }

  .toggle-knob {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgb(0 0 0 / 30%);
    transition: translate 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &::after {
      content: "✕";
      color: rgb(0 0 0 / 25%);
      font-weight: 900;
      font-size: 8px;
      line-height: 1;
    }
  }
</style>
