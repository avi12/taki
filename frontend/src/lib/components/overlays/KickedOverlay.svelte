<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import { fade } from "svelte/transition";

  interface Props {
    onLeave: () => void;
  }

  const { onLeave }: Props = $props();
</script>

<div class="kicked-overlay" transition:fade={{ duration: 200 }}>
  <div class="kicked-card">
    <span class="kicked-icon">🚫</span>
    <p class="kicked-title">{locale.strings.kickedTitle}</p>
    <p class="kicked-sub">{locale.strings.kickedBody}</p>
    <button class="primary-btn" onclick={onLeave}>{locale.strings.backHome}</button>
  </div>
</div>

<style>
  .kicked-overlay {
    position: fixed;
    inset: 0;
    z-index: 700;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgb(0 0 0 / 82%);
    backdrop-filter: blur(8px);
  }

  .kicked-card {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    max-width: 320px;
    padding: 2.5rem 3rem;
    border: 1px solid var(--glass-border);
    border-radius: 1.25rem;
    background: var(--panel-bg);
    text-align: center;
  }

  .kicked-icon {
    font-size: 2.5rem;
    line-height: 1;
  }

  .kicked-title {
    margin: 0;
    color: var(--text);
    font-weight: 700;
    font-size: 1.4rem;
  }

  .kicked-sub {
    margin: 0 0 0.5rem;
    color: var(--text-muted);
    font-size: 0.95rem;
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
