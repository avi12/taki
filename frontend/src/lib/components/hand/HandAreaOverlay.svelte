<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import { fade } from "svelte/transition";

  interface Props {
    isEliminated: boolean;
    isSkipped: boolean;
    stopNextPlayerName: string | null;
  }

  const { isEliminated, isSkipped, stopNextPlayerName }: Props = $props();
</script>

{#if isEliminated}
  <div class="eliminated-hand-block" role="alert" transition:fade={{ duration: 300 }}>
    <span class="eliminated-hand-icon">💥</span>
    <span class="eliminated-hand-text">{locale.strings.cardsExploded}</span>
  </div>
{/if}

{#if isSkipped}
  <div class="stop-hand-block" role="alert" transition:fade={{ duration: 180 }}>
    <div class="stop-block-icon">
      <svg fill="none" height="64" viewBox="0 0 80 80" width="64">
        <circle cx="40" cy="40" fill="#E8192C" r="36" stroke="white" stroke-width="4"/>
        <rect fill="white" height="14" rx="7" width="48" x="16" y="33"/>
      </svg>
    </div>
    {#if stopNextPlayerName}
      <div class="stop-guide-label">
        <span class="stop-guide-arrow">↑</span>
        <span class="stop-guide-name">{stopNextPlayerName}</span>
      </div>
    {/if}
  </div>
  <!-- Flying arrow pointing up toward the next player -->
  <div class="stop-fly-arrow" aria-hidden="true">
    <svg fill="none" height="56" viewBox="0 0 36 56" width="36">
      <!-- eslint-disable-next-line @stylistic/max-len -->
      <path d="M18 52 L18 8 M6 20 L18 6 L30 20" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>
    </svg>
  </div>
{/if}

<style>
  .eliminated-hand-block {
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 150;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: clamp(140px, 28vh, 200px);
    background: rgb(20 4 4 / 82%);
    backdrop-filter: blur(8px);
    pointer-events: none;
  }

  .eliminated-hand-icon {
    font-size: 3rem;
    animation: explode-hand 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.4) both;
  }

  @keyframes explode-hand {
    from{ opacity: 0%; rotate: -30deg; scale: 0.1; }
    to{ opacity: 100%; rotate: 0deg; scale: 1; }
  }

  .eliminated-hand-text {
    color: rgb(255 255 255 / 85%);
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: 0.02em;
  }

  .stop-hand-block {
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 150;
    display: flex;
    gap: 1.25rem;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: clamp(140px, 28vh, 200px);
    background: rgb(10 6 6 / 72%);
    backdrop-filter: blur(6px);
    pointer-events: none;
  }

  .stop-block-icon {
    animation: stop-icon-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.4) both;
  }

  @keyframes stop-icon-pop {
    0%{ opacity: 0%; rotate: -20deg; scale: 0.2; }
    100%{ opacity: 100%; rotate: 0deg; scale: 1; }
  }

  .stop-guide-label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    align-items: center;
    animation: stop-label-in 0.3s 0.65s both;
  }

  @keyframes stop-label-in {
    0%{ opacity: 0%; translate: 0 10px; }
    100%{ opacity: 100%; translate: 0 0; }
  }

  .stop-guide-arrow {
    color: white;
    font-size: 1.8rem;
    line-height: 1;
    animation: stop-arrow-bounce 0.5s 0.75s ease-in-out infinite alternate;
  }

  @keyframes stop-arrow-bounce {
    from{ translate: 0 0; }
    to{ translate: 0 -6px; }
  }

  .stop-guide-name {
    padding: 0.25rem 0.75rem;
    border: 1px solid rgb(255 255 255 / 15%);
    border-radius: 2rem;
    background: rgb(255 255 255 / 10%);
    color: rgb(255 255 255 / 85%);
    font-weight: 800;
    font-size: clamp(0.85rem, 2.5vw, 1.05rem);
  }

  .stop-fly-arrow {
    position: fixed;
    bottom: clamp(150px, 30vh, 210px);
    left: 50%;
    z-index: 160;
    opacity: 0%;
    pointer-events: none;
    translate: -50% 0;
    animation: stop-fly-up 0.7s 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;

    svg path {
      stroke: white;
      filter: drop-shadow(0 0 8px rgb(255 255 255 / 70%));
    }
  }

  @keyframes stop-fly-up {
    0%{ opacity: 0%; scale: 0.8; translate: -50% 0; }
    20%{ opacity: 100%; scale: 1; }
    80%{ opacity: 70%; }
    100%{ opacity: 0%; scale: 0.9; translate: -50% -55vh; }
  }
</style>
