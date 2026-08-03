<script lang="ts">
  import PencilIcon from "$lib/components/PencilIcon.svelte";
  import { locale } from "$lib/locale.svelte";

  interface Props {
    playerName: string;
    handCount: number;
    isHost: boolean;
    onRename: (name: string) => void;
    onPreviewName: (name: string) => void;
    onCancelRename: () => void;
  }

  const {
    playerName, handCount, isHost, onRename, onPreviewName, onCancelRename
  }: Props = $props();

  let isRenaming = $state(false);
  let renameValue = $state("");

  function startRename(): void {
    renameValue = playerName;
    isRenaming = true;
  }

  function confirmRename(): void {
    const trimmed = renameValue.trim();
    const isValidNewName = !!trimmed && trimmed !== playerName;
    if (isValidNewName) {
      onRename(trimmed);
    } else {
      onCancelRename();
    }

    isRenaming = false;
  }

  function onRenameKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      confirmRename();
    } else if (event.key === "Escape") {
      isRenaming = false;
      onCancelRename();
    }
  }
</script>

<div class="my-info">
  <div
    style:background="hsl({playerName.charCodeAt(0) * 37 % 360}, 65%, 35%)"
    class="my-avatar"
  >
    {playerName[0].toUpperCase()}
  </div>

  {#if isRenaming}
    <!-- svelte-ignore a11y_autofocus -->
    <input
      class="rename-input"
      autofocus
      dir="auto"
      maxlength="20"
      onblur={confirmRename}
      oninput={() => {
        if (renameValue.trim()) {
          onPreviewName(renameValue.trim());
        } else {
          onCancelRename();
        }
      }}
      onkeydown={onRenameKeydown}
      bind:value={renameValue}
    />
  {:else}
    <span class="player-name" dir="auto">{playerName}</span>
    {#if isHost}
      <button
        class="rename-btn"
        aria-label={locale.strings.renamePlayer}
        onclick={startRename}
      ><PencilIcon /></button>
    {/if}
  {/if}

  <span class="hand-count-badge">{handCount}</span>
</div>

<style>
  .my-info {
    position: fixed;
    bottom: var(--myinfo-bottom);
    left: 0;
    z-index: 50;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
    padding: 0.4rem 0.8rem 0.4rem 0.5rem;
    border: 1px solid var(--my-info-border);
    border-radius: 2rem;
    background: var(--my-info-bg);
    white-space: nowrap;
    backdrop-filter: blur(12px);
    pointer-events: none;
    translate: calc(50vw - 50%);

    & > * {
      pointer-events: auto;
    }

    /* On touch the hand's full-width transparent top-padding (z-index 100)
       overlays this pill; lift it above so the rename button stays tappable. */
    :global(html.touch) & {
      z-index: 101;
    }
  }

  .my-avatar {
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    color: white;
    font-weight: 700;
    font-size: 0.75rem;
    text-shadow: 0 1px 3px rgb(0 0 0 / 50%);
    pointer-events: none;
  }

  .player-name {
    color: var(--text);
    font-weight: 800;
    font-size: clamp(0.75rem, 2vw, 0.95rem);
    pointer-events: none;
  }

  .rename-btn {
    padding: 0 2px;
    border: none;
    background: none;
    color: var(--text);
    font-size: 0.65rem;
    line-height: 1;
    opacity: 40%;
    cursor: pointer;

    &:hover {
      opacity: 90%;
    }
  }

  .rename-input {
    width: 100px;
    padding: 1px 4px;
    border: 1px solid var(--input-border);
    border-radius: 4px;
    background: var(--input-bg);
    color: var(--text);
    outline: none;
    font-family: inherit;
    font-weight: 800;
    font-size: clamp(0.75rem, 2vw, 0.95rem);
  }

  .hand-count-badge {
    padding: 0.1rem 0.45rem;
    border: 1px solid var(--badge-border);
    border-radius: 2rem;
    background: var(--badge-bg);
    color: var(--text-muted);
    font-weight: 700;
    font-size: 0.8rem;
    pointer-events: none;
  }
</style>
