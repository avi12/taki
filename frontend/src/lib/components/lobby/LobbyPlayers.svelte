<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import type { GameState } from "$lib/network";
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";
  import { fly, slide } from "svelte/transition";

  interface Props {
    gameRoomState: GameState;
    myId: string;
    isHost: boolean;
    onKickPlayer: (id: string) => void;
    onReorderPlayers: (playerIds: string[]) => void;
    onRename: (name: string) => void;
    onPreviewName: (name: string) => void;
    onCancelRename: () => void;
  }

  const {
    gameRoomState, myId, isHost, onKickPlayer, onReorderPlayers, onRename,
    onPreviewName, onCancelRename
  }: Props = $props();

  let draggingId = $state<string | null>(null);
  let dragOverId = $state<string | null>(null);
  let isEditingName = $state(false);
  let editNameValue = $state("");
  let elRenameInput = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (isEditingName && elRenameInput) {
      elRenameInput.focus();
      elRenameInput.select();
    }
  });

  function startEditingName(currentName: string): void {
    editNameValue = currentName;
    isEditingName = true;
  }

  function confirmRename(): void {
    const trimmed = editNameValue.trim();
    if (trimmed) {
      onRename(trimmed);
    }

    isEditingName = false;
  }

  function cancelRename(): void {
    onCancelRename();
    isEditingName = false;
  }

  function movePlayer(playerId: string, direction: -1 | 1): void {
    const players = gameRoomState.players;
    const fromIndex = players.findIndex(player => player.id === playerId);
    const toIndex = fromIndex + direction;
    if (toIndex < 1 || toIndex >= players.length) {
      return;
    }

    const newIds = players.map(player => player.id);
    [newIds[fromIndex], newIds[toIndex]] = [newIds[toIndex], newIds[fromIndex]];
    onReorderPlayers(newIds);
  }

  function handleDragOver(event: DragEvent, targetId: string): void {
    if (!draggingId || draggingId === targetId) {
      return;
    }

    event.preventDefault();
    dragOverId = targetId;
  }

  function handleDrop(targetId: string): void {
    if (!draggingId || draggingId === targetId) {
      draggingId = null;
      dragOverId = null;
      return;
    }

    const players = gameRoomState.players;
    const fromIndex = players.findIndex(player => player.id === draggingId);
    const toIndex = players.findIndex(player => player.id === targetId);
    if (fromIndex === 0 || toIndex === 0) {
      draggingId = null;
      dragOverId = null;
      return;
    }

    const newIds = players.map(player => player.id);
    newIds.splice(fromIndex, 1);
    newIds.splice(toIndex, 0, players[fromIndex].id);
    onReorderPlayers(newIds);
    draggingId = null;
    dragOverId = null;
  }
</script>

{#if gameRoomState?.players?.length}
  <div
    class="players-list" in:fly={{
      y: 20,
      duration: 300
    }}>
    <h3 class="players-waiting-title">{locale.strings.playersInRoom}</h3>
    {#if gameRoomState.peekingCount > 0}
      <p class="peeking-notice" aria-live="polite">
        ⏳ {locale.strings.peekingWaiting(gameRoomState.peekingCount)}
      </p>
    {/if}
    <div class="players-grid">
      {#each gameRoomState.players as player, iPlayer (player.id)}
        {@const isMe = player.id === myId}
        {@const isHostPlayer = iPlayer === 0}
        {@const isDraggable = isHost && !isHostPlayer}
        {@const isDraggedOver = dragOverId === player.id && draggingId !== player.id}
        <div
          in:slide={{
            duration: 280,
            easing: cubicOut
          }}
          animate:flip={{
            duration: 280,
            easing: cubicOut
          }}
        >
          <div
            class="player-chip"
            class:is-drag-over={isDraggedOver}
            class:is-dragging={draggingId === player.id}
            class:me={isMe}
            draggable={isDraggable}
            ondragend={() => {
              draggingId = null; dragOverId = null;
            }}
            ondragenter={isDraggable ? event => handleDragOver(event, player.id) : undefined}
            ondragover={isDraggable ? event => handleDragOver(event, player.id) : undefined}
            ondragstart={isDraggable ? () => {
              draggingId = player.id;
            } : undefined}
            ondrop={isDraggable ? () => handleDrop(player.id) : undefined}
            role={isDraggable ? "listitem" : undefined}
          >
            {#if isHost && !isHostPlayer}
              <span class="drag-handle" aria-hidden="true">⠿</span>
            {/if}
            <div style:background="hsl({(iPlayer * 70) % 360}, 65%, 35%)" class="player-avatar">
              {player.name[0].toUpperCase()}
            </div>

            {#if isMe && isEditingName}
              <form
                class="rename-form" onsubmit={e => {
                  e.preventDefault(); confirmRename();
                }}>
                <input
                  bind:this={elRenameInput}
                  class="rename-input"
                  dir="auto"
                  maxlength={24}
                  oninput={() => editNameValue.trim() && onPreviewName(editNameValue.trim())}
                  onkeydown={e => e.key === "Escape" && cancelRename()}
                  type="text"
                  bind:value={editNameValue}
                />
                <button
                  class="rename-action-btn confirm"
                  aria-label={locale.strings.confirmRename}
                  type="submit"
                >✓</button>
                <button
                  class="rename-action-btn cancel"
                  aria-label={locale.strings.cancelRename}
                  onclick={cancelRename}
                  type="button"
                >✕</button>
              </form>
            {:else}
              <button
                class="player-name-btn"
                class:is-editable={isMe}
                class:is-previewing={player.previewName && !isMe}
                aria-label={isMe ? locale.strings.changeName : undefined}
                onclick={isMe ? () => startEditingName(player.name) : undefined}
                tabindex={isMe ? 0 : -1}
                type="button"
              >
                <span class="player-name-text" dir="auto">
                  {player.previewName ?? player.name}
                  {#if player.previewName && !isMe}
                    <span class="preview-indicator" aria-hidden="true">✎</span>
                  {/if}
                  {#if isMe && !isHost}
                    <span class="you-tag">{locale.strings.you}</span>
                  {/if}
                </span>
                {#if isMe}
                  <span class="rename-icon" aria-hidden="true">✎</span>
                {/if}
              </button>
              {#if isHost && !isHostPlayer}
                <div class="player-actions">
                  <button
                    class="sr-only-btn"
                    aria-label={locale.strings.movePlayerUp}
                    disabled={iPlayer <= 1}
                    onclick={() => movePlayer(player.id, -1)}
                    type="button"
                  >▲</button>
                  <button
                    class="sr-only-btn"
                    aria-label={locale.strings.movePlayerDown}
                    disabled={iPlayer >= gameRoomState.players.length - 1}
                    onclick={() => movePlayer(player.id, 1)}
                    type="button"
                  >▼</button>
                  <button
                    class="kick-btn"
                    aria-label={locale.strings.kickPlayer}
                    onclick={() => onKickPlayer(player.id)}
                    type="button"
                  >✕</button>
                </div>
              {:else if isHostPlayer}
                <span class="host-tag">{locale.strings.host}</span>
              {/if}
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .players-list {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--list-border);
  }

  .peeking-notice {
    margin: 0 0 0.75rem;
    color: var(--text-muted);
    font-style: italic;
    font-size: 0.85rem;
  }

  .players-waiting-title {
    margin: 0 0 1rem;
    color: var(--text-muted);
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .players-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .player-chip {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.6rem 0.9rem;
    border: 1px solid var(--chip-border);
    border-radius: 0.75rem;
    background: var(--chip-bg);
    font-size: 0.95rem;
    transition: opacity 0.15s, border-color 0.15s, background 0.15s;

    &[draggable="true"] {
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }

    &.me {
      border-color: rgb(232 25 44 / 30%);
      background: rgb(232 25 44 / 6%);
    }

    &.is-dragging {
      opacity: 40%;
    }

    &.is-drag-over {
      border-color: rgb(21 101 192 / 50%);
      background: rgb(21 101 192 / 6%);
    }
  }

  .drag-handle {
    flex-shrink: 0;
    color: var(--text-muted);
    font-size: 1rem;
    line-height: 1;
    user-select: none;
  }

  .player-avatar {
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: white;
    font-weight: 700;
    font-size: 0.85rem;
    text-shadow: 0 1px 3px rgb(0 0 0 / 50%);
  }

  .player-name-btn {
    display: flex;
    flex: 1;
    gap: 0.4rem;
    align-items: center;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: default;

    &.is-editable {
      margin: -0.15rem -0.4rem;
      padding: 0.15rem 0.4rem;
      border-radius: 0.4rem;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: var(--chip-border);

        .rename-icon {
          opacity: 100%;
        }
      }

      &:focus-visible {
        outline: 2px solid var(--text);
        outline-offset: 2px;
      }
    }

    &.is-previewing {
      font-style: italic;
      opacity: 75%;
    }
  }

  .player-name-text {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rename-icon {
    flex-shrink: 0;
    color: var(--text-muted);
    font-size: 0.85rem;
    opacity: 65%;
    transition: opacity 0.15s;
  }

  .you-tag {
    flex-shrink: 0;
    color: var(--text-muted);
    font-size: 0.78rem;
  }

  .preview-indicator {
    flex-shrink: 0;
    font-size: 0.7em;
    opacity: 55%;
  }

  .host-tag {
    flex-shrink: 0;
    margin-inline-start: auto;
    padding: 0.15rem 0.4rem;
    border: 1px solid rgb(255 214 0 / 30%);
    border-radius: 0.4rem;
    background: rgb(255 214 0 / 20%);
    color: var(--yellow);
    font-weight: 700;
    font-size: 0.7rem;
  }

  .rename-form {
    display: flex;
    flex: 1;
    gap: 0.3rem;
    align-items: center;
    min-width: 0;
  }

  .rename-input {
    flex: 1;
    min-width: 0;
    padding: 0.25rem 0.5rem;
    border: 1.5px solid var(--red);
    border-radius: 0.5rem;
    background: var(--input-bg);
    color: var(--text);
    outline: none;
    font-family: inherit;
    font-size: 0.9rem;
    box-shadow: 0 0 0 3px rgb(232 25 44 / 12%);
  }

  .rename-action-btn {
    flex-shrink: 0;
    padding: 0.28rem;
    border: none;
    border-radius: 0.4rem;
    background: none;
    font-size: 0.8rem;
    line-height: 1;
    cursor: pointer;
    transition: opacity 0.15s, background 0.15s;

    &.confirm {
      color: var(--green);
      opacity: 80%;

      &:hover {
        background: rgb(46 125 50 / 12%);
        opacity: 100%;
      }
    }

    &.cancel {
      color: var(--text-muted);
      opacity: 60%;

      &:hover {
        background: var(--chip-border);
        opacity: 100%;
      }
    }

    &:focus-visible {
      outline: 2px solid var(--text);
      outline-offset: 2px;
      opacity: 100%;
    }
  }

  .player-actions {
    display: flex;
    flex-shrink: 0;
    gap: 0.2rem;
    align-items: center;
    margin-inline-start: auto;
  }

  .sr-only-btn {
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    background: none;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    cursor: pointer;

    &:focus-visible {
      position: static;
      overflow: visible;
      width: auto;
      height: auto;
      margin: 0;
      padding: 0.2rem 0.35rem;
      border-radius: 0.4rem;
      color: var(--text);
      outline: 2px solid var(--text);
      outline-offset: 2px;
      clip: auto;
      font-size: 0.65rem;
      white-space: normal;
    }
  }

  .kick-btn {
    padding: 0.28rem;
    border: none;
    border-radius: 0.4rem;
    background: none;
    color: var(--text-muted, #888888);
    font-size: 0.85rem;
    line-height: 1;
    opacity: 50%;
    cursor: pointer;
    transition: opacity 0.15s, color 0.15s, background 0.15s;

    &:hover {
      background: rgb(232 25 44 / 10%);
      color: var(--red);
      opacity: 100%;
    }
  }
</style>
