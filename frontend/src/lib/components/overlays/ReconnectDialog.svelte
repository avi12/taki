<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import { fade } from "svelte/transition";

  const { errorMessage }: { errorMessage?: string } = $props();
</script>

<dialog
  class="reconnect-dialog"
  {@attach node => {
    if (!node) {
      return;
    }

    node.showModal();
    return () => {
      if (node.open) {
        node.close();
      }
    };
  }}
  transition:fade={{ duration: 200 }}
>
  {#if !errorMessage}
    <div class="reconnect-spinner"></div>
  {/if}
  <p class="reconnect-text">{locale.strings.reconnecting}</p>
  {#if errorMessage}
    <p class="error-detail" role="alert">{errorMessage}</p>
    <button class="retry-btn" onclick={() => location.reload()} type="button">
      {locale.strings.backHome}
    </button>
  {/if}
</dialog>

<style>
  dialog.reconnect-dialog {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    max-width: min(90vw, 360px);
    padding: 2rem 2.5rem;
    border: 1px solid var(--glass-border);
    border-radius: 1rem;
    background: var(--panel-bg);
    outline: none;

    &::backdrop {
      background: rgb(0 0 0 / 65%);
      backdrop-filter: blur(6px);
    }
  }

  .reconnect-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgb(255 255 255 / 15%);
    border-top-color: var(--red);
    border-radius: 50%;
    animation: reconnect-spin 0.8s linear infinite;
  }

  @keyframes reconnect-spin {
    to{ rotate: 360deg; }
  }

  .reconnect-text {
    margin: 0;
    color: var(--text);
    font-weight: 500;
    font-size: clamp(1rem, 3vw, 1.2rem);
    text-align: center;
  }

  .error-detail {
    margin: 0;
    color: var(--text-muted);
    font-family: monospace;
    font-size: 0.8rem;
    text-align: center;
    word-break: break-word;
  }

  .retry-btn {
    padding: 0.6rem 1.4rem;
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    background: var(--input-bg);
    color: var(--text);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: var(--chip-border);
    }
  }
</style>
