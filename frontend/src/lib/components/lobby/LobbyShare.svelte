<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import { scale } from "svelte/transition";

  interface Props {
    shareUrl: string;
    isShareAvailable: boolean;
    isCopied: boolean;
    onCopy: () => void;
    onNativeShare: () => void;
  }

  const {
    shareUrl, isShareAvailable, isCopied, onCopy, onNativeShare
  }: Props = $props();
</script>

<div class="share-section">
  <p class="share-title">{locale.strings.inviteFriends}</p>
  <div class="share-controls">
    <button class="share-url-btn" onclick={onCopy}>
      <span class="url-display">{shareUrl}</span>
      <div class="copy-action" aria-live="polite">
        {#if isCopied}
          <span class="status-text success" in:scale={{ duration: 300 }}>{locale.strings.copied}</span>
        {:else}
          <span class="status-text">{locale.strings.copy}</span>
        {/if}
      </div>
    </button>
    {#if isShareAvailable}
      <button class="native-share-btn" onclick={onNativeShare}>{locale.strings.share}</button>
    {/if}
  </div>
</div>

<style>
  .share-section {
    margin-top: 1.25rem;
    padding: 1.25rem;
    border: 1px solid var(--section-border);
    border-radius: 1.25rem;
    background: var(--section-bg);
  }

  .share-title {
    margin: 0 0 0.75rem;
    color: var(--text-muted);
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .share-controls {
    display: flex;
    gap: 0.5rem;
    align-items: stretch;
  }

  .share-url-btn {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.3rem;
    align-items: center;
    overflow: hidden;
    padding: 0.7rem;
    border: 1px solid var(--share-btn-border);
    border-radius: 0.75rem;
    background: var(--share-btn-bg);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;

    &:hover {
      border-color: rgb(21 101 192 / 60%);
      background: rgb(21 101 192 / 8%);
    }
  }

  .url-display {
    color: var(--text-muted);
    font-family: monospace;
    font-size: 0.75rem;
    line-height: 1.3;
    text-align: center;
    word-break: break-all;
  }

  .copy-action {
    color: var(--blue);
    font-weight: 800;
    font-size: 0.85rem;
  }

  .status-text {
    &.success {
      color: #4ade80;
    }
  }

  .native-share-btn {
    padding: 0.7rem 1rem;
    border: none;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #1565c0, #0d3d7a);
    color: white;
    font-weight: 800;
    font-size: 0.9rem;
    white-space: nowrap;
    cursor: pointer;
    transition: scale 0.2s;

    &:hover {
      scale: 1.05;
    }
  }
</style>
