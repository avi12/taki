<script lang="ts">
  import type { GameState } from "@taki/shared";
  import TakiLogo from "$lib/components/TakiLogo.svg?raw";
  import { locale } from "$lib/locale.svelte";
  import { fade, scale } from "svelte/transition";

  const MAX_DISPLAYED_MINI_CARDS  = 12;
  const MINI_CARD_STACK_SHIFT_PX  = 12;
  const AVATAR_HUE_MULTIPLIER     = 37;

  interface Props {
    opponent: GameState["players"][number];
    isActive: boolean;
    isEliminated: boolean;
    plusFourRecipientId: string | null;
    drawPenaltyValue: number;
    stopSkippedPlayerId: string | null;
  }

  const {
    opponent, isActive, isEliminated,
    plusFourRecipientId, drawPenaltyValue, stopSkippedPlayerId
  }: Props = $props();
</script>

<div
  class="opponent"
  class:active={isActive}
  class:eliminated={isEliminated}
>
  <div
    style:background="hsl({opponent.name[0].codePointAt(0)! * AVATAR_HUE_MULTIPLIER % 360}, 65%, 35%)"
    class="opponent-avatar"
  >
    {opponent.name[0].toUpperCase()}
    {#if !opponent.isConnected}
      <span
        class="disconnected-dot"
        aria-label={locale.strings.disconnected}
        role="img"
        title={locale.strings.disconnected}
      ></span>
    {/if}
  </div>
  <div class="player-label">
    <span class="player-name" dir="auto">{opponent.name}</span>
    <span class="player-count">{opponent.handCount} {locale.strings.cards}</span>
  </div>
  <div class="opponent-hand">
    {#each Array(Math.min(Math.max(0, opponent.handCount), MAX_DISPLAYED_MINI_CARDS)) as _, iCard (iCard)}
      <div style:--shift={iCard * -MINI_CARD_STACK_SHIFT_PX} style:z-index={iCard} class="mini-back-wrap">
        <div class="card mini-card-back">
          <div class="card-inner card-back-inner">
            <div class="card-back-oval"></div>
            <div class="mini-back-logo">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html TakiLogo}
            </div>
          </div>
        </div>
      </div>
    {/each}
    {#if opponent.handCount > MAX_DISPLAYED_MINI_CARDS}
      <span class="overflow-count" dir="ltr">+{opponent.handCount - MAX_DISPLAYED_MINI_CARDS}</span>
    {/if}
  </div>
  {#if drawPenaltyValue > 0 && isActive}
    <div class="draw-penalty-badge" dir="ltr" in:scale={{ duration: 250 }}>
      +{drawPenaltyValue}
    </div>
  {/if}
  {#if isActive}
    <div class="active-pulse" in:fade={{ duration: 200 }}></div>
  {/if}
  {#if opponent.id === stopSkippedPlayerId}
    <div
      class="stop-opponent-overlay" in:scale={{
        start: 0.5,
        duration: 300
      }} out:fade={{ duration: 300 }}>
      <svg fill="none" height="46" viewBox="0 0 80 80" width="46">
        <circle cx="40" cy="40" fill="#E8192C" r="36" stroke="white" stroke-width="4"/>
        <rect fill="white" height="14" rx="7" width="48" x="16" y="33"/>
      </svg>
    </div>
  {/if}
  {#if opponent.id === plusFourRecipientId}
    <div
      class="plus-four-overlay" in:scale={{
        start: 0.5,
        duration: 300
      }} out:fade={{ duration: 500 }}>
      <span class="plus-four-text" dir="ltr">+4</span>
    </div>
  {/if}
  {#if isEliminated}
    <div class="eliminated-overlay">
      <span class="eliminated-icon">💥</span>
      <span class="eliminated-label">{locale.strings.exploded}</span>
    </div>
  {/if}
</div>

<style>
  @import url("../../styles/card.css");

  .opponent {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: center;
    min-width: clamp(90px, 22vw, 130px);
    padding: clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.5rem, 2vw, 1rem);
    border: 1px solid var(--opponent-border);
    border-radius: 1.25rem;
    background: var(--opponent-bg);
    transition: box-shadow 0.3s, scale 0.3s, border-color 0.3s;

    @media (width <= 600px) {
      flex-direction: row;
      gap: 0.4rem;
      align-items: center;
      min-width: unset;
      padding: 0.35rem 0.5rem;
      border-radius: 0.75rem;
    }

    &.active {
      border-color: rgb(255 214 0 / 50%);
      box-shadow: 0 0 0 2px rgb(255 214 0 / 20%), 0 8px 24px rgb(255 214 0 / 15%);
      scale: 1.04;

      @media (prefers-color-scheme: light) {
        border-color: #8b6914;
        box-shadow: 0 0 0 2px rgb(139 105 20 / 35%), 0 8px 24px rgb(139 105 20 / 20%);
      }
    }

    &.eliminated {
      opacity: 55%;
      filter: grayscale(0.5);
    }
  }

  .active-pulse {
    position: absolute;
    inset: -4px;
    border: 2px solid rgb(255 214 0 / 40%);
    border-radius: 1.5rem;
    pointer-events: none;
    animation: pulse-ring 1.6s ease-out infinite;

    @media (width <= 600px) {
      border-radius: calc(0.75rem + 4px);
    }

    @media (prefers-color-scheme: light) {
      border-color: rgb(139 105 20 / 50%);
    }
  }

  @keyframes pulse-ring {
    0%{ opacity: 70%; scale: 1; }
    70%{ opacity: 0%; scale: 1.08; }
    100%{ opacity: 0%; }
  }

  .opponent-avatar {
    position: relative;
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: white;
    font-weight: 700;
    font-size: clamp(0.75rem, 2vw, 1rem);
    text-shadow: 0 1px 3px rgb(0 0 0 / 50%);
    box-shadow: 0 2px 8px rgb(0 0 0 / 40%);

    @media (width <= 600px) {
      width: 28px;
      height: 28px;
      font-size: 0.7rem;
    }
  }

  .disconnected-dot {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 10px;
    height: 10px;
    border: 2px solid #0a0f1e;
    border-radius: 50%;
    background: #e8192c;
  }

  .player-label {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    align-items: center;

    @media (width <= 600px) {
      gap: 0;
      align-items: flex-start;
    }
  }

  .player-name {
    color: var(--text);
    font-weight: 800;
    font-size: clamp(0.75rem, 2vw, 0.95rem);

    @media (width <= 600px) {
      overflow: hidden;
      max-width: 60px;
      font-size: 0.7rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .player-count {
    color: var(--text-muted);
    font-weight: 500;
    font-size: clamp(0.6rem, 1.6vw, 0.75rem);

    @media (width <= 600px) {
      font-size: 0.6rem;
    }
  }

  .opponent-hand {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 48px;

    @media (width <= 600px) {
      overflow: hidden;
      max-width: 52px;
      height: 34px;
    }
  }

  .mini-back-wrap {
    position: relative;
    margin-inline-end: -7px;

    @media (width <= 600px) {
      margin-inline-end: -10px;
    }
  }

  .overflow-count {
    margin-inline-start: 6px;
    color: var(--yellow);
    font-weight: 800;
    font-size: 0.75rem;
  }

  /* Mini card back (opponents) - doubled class for specificity over .card */
  .mini-card-back.mini-card-back {
    position: relative;
    overflow: hidden;
    width: 34px;
    height: 50px;
    border: 2px solid rgb(255 255 255 / 50%);
    border-radius: 5px;
    background: linear-gradient(145deg, #0d1b4b, #060e2a);
    box-shadow: 2px 3px 8px rgb(0 0 0 / 50%);

    @media (width <= 600px) {
      width: 20px;
      height: 30px;
      border-width: 1.5px;
      border-radius: 3px;
    }
  }

  .mini-back-logo {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 85%;

    :global(.taki-logo-svg) {
      width: 100%;
      height: auto;
    }
  }

  .draw-penalty-badge {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 20;
    padding: 0.2rem 0.55rem;
    border: 2px solid rgb(255 255 255 / 30%);
    border-radius: 2rem;
    background: linear-gradient(135deg, #e8192c, #c0101f);
    color: white;
    font-weight: 900;
    font-size: 0.85rem;
    box-shadow: 0 4px 12px rgb(232 25 44 / 50%);
    translate: 12px -12px;
    animation: badge-pulse 1s ease-in-out infinite alternate;
  }

  @keyframes badge-pulse {
    from{ scale: 1; }
    to{ scale: 1.12; }
  }

  .eliminated-overlay {
    position: absolute;
    inset: 0;
    z-index: 15;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    justify-content: center;
    align-items: center;
    border-radius: inherit;
    background: rgb(0 0 0 / 60%);
    pointer-events: none;
  }

  .eliminated-icon {
    font-size: 1.6rem;
    line-height: 1;
    animation: explode-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.4) both;
  }

  @keyframes explode-pop {
    from{ opacity: 0%; scale: 0.3; }
    to{ opacity: 100%; scale: 1; }
  }

  .eliminated-label {
    color: rgb(255 255 255 / 80%);
    font-weight: 800;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* +4 penalty overlay on recipient opponent tile */
  .plus-four-overlay {
    position: absolute;
    inset: 0;
    z-index: 15;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid rgb(232 25 44 / 60%);
    border-radius: inherit;
    background: rgb(232 25 44 / 25%);
    pointer-events: none;
    animation: plus-four-flash 0.6s ease-out;
  }

  .plus-four-text {
    color: #e8192c;
    font-family: Impact, "Arial Black", sans-serif;
    font-weight: 900;
    font-size: 1.4rem;
    text-shadow: 0 2px 8px rgb(232 25 44 / 50%);
    animation: plus-four-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.4) both;
  }

  @keyframes plus-four-flash {
    0%{ background: rgb(232 25 44 / 50%); }
    100%{ background: rgb(232 25 44 / 25%); }
  }

  @keyframes plus-four-pop {
    0%{ opacity: 0%; scale: 0.3; }
    100%{ opacity: 100%; scale: 1; }
  }

  /* Stop card overlay on skipped opponent tile */
  .stop-opponent-overlay {
    position: absolute;
    inset: 0;
    z-index: 15;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: inherit;
    background: rgb(8 4 4 / 68%);
    backdrop-filter: blur(3px);
    pointer-events: none;
  }
</style>
