<script lang="ts">
  import CardIcon from "$lib/components/cards/CardIcon.svelte";
  import { locale } from "$lib/locale.svelte";
  import { CardColor, CardValue, type GameState } from "$lib/network";
  import {
    cardDealRotation,
    getCardColorHex,
    getCardColorDark,
    isActionCard,
    getCardEffect
  } from "$lib/utils/cards";
  import { fly } from "svelte/transition";

  interface Props {
    gameRoomState: GameState;
    isDraggingOver: boolean;
    cardEffectValue: CardValue | null;
    isSuperTakiAnimating: boolean;
    onDragOver: () => void;
    onDragLeave: () => void;
    onEffectEnd: () => void;
    onSuperTakiEffectEnd: () => void;
  }

  let {
    gameRoomState,
    isDraggingOver,
    cardEffectValue,
    isSuperTakiAnimating,
    onDragOver,
    onDragLeave,
    onEffectEnd,
    onSuperTakiEffectEnd,
    elPile = $bindable<HTMLElement | null>(null)
  }: Props & { elPile?: HTMLElement | null } = $props();

  const topCard = $derived(gameRoomState.discardPile.at(-1) ?? null);
  const activeColor = $derived(
    gameRoomState.activeTakiColor ?? topCard?.color ?? null
  );
  const activeColorHex = $derived(activeColor ? getCardColorHex(activeColor) : null);

  const isColorIndicatorVisible = $derived(!!activeColor && activeColor !== "none" && !!activeColorHex);

  const colorLabel = $derived.by((): Partial<Record<CardColor, string>> => ({
    [CardColor.Red]: locale.strings.red,
    [CardColor.Blue]: locale.strings.blue,
    [CardColor.Green]: locale.strings.green,
    [CardColor.Yellow]: locale.strings.yellow
  }));
</script>

<div
  bind:this={elPile}
  class="discard-pile"
  class:drag-over={isDraggingOver}
  aria-label={locale.strings.discardPile}
  ondragleave={onDragLeave}
  ondragover={e => {
    e.preventDefault();
    onDragOver();
  }}
  role="region"
>
  {#each gameRoomState.discardPile.slice(-5) as discCard, iDiscard (discCard.id)}
    {@const rotation = cardDealRotation(discCard.id)}
    {@const sliceLen = gameRoomState.discardPile.slice(-5).length}
    {@const isTopCard = iDiscard === sliceLen - 1}
    {@const effectiveColor = (discCard.value === CardValue.SuperTaki && gameRoomState.activeTakiColor != null)
      ? gameRoomState.activeTakiColor
      : discCard.color}
    {@const colorHex = getCardColorHex(effectiveColor)}
    {@const colorDark = getCardColorDark(effectiveColor)}
    <div
      style:--card-color={colorHex}
      style:--card-dark={colorDark}
      style:rotate="{rotation}deg"
      style:z-index={iDiscard}
      class="card discard"
      class:action-card={isActionCard(discCard.value)}
      in:fly={{
        y: -60,
        duration: 350
      }}
    >
      <div class="card-inner">
        <div class="card-oval"></div>
        <CardIcon value={discCard.value} />
      </div>
      {#if isTopCard && cardEffectValue !== null}
        <div class="card-effect" data-effect={getCardEffect(cardEffectValue)} onanimationend={onEffectEnd}></div>
      {/if}
      {#if isTopCard && discCard.value === CardValue.SuperTaki && isSuperTakiAnimating}
        <div class="card-effect" data-effect="supertaki" onanimationend={onSuperTakiEffectEnd}></div>
      {/if}
    </div>
  {/each}
  {#if gameRoomState.discardPile.length === 0}
    <div class="discard-empty-hint">{locale.strings.dropHere}</div>
  {/if}

  <!-- Active color indicator -->
  {#if isColorIndicatorVisible && activeColor && activeColorHex}
    <div
      style:--active-color={activeColorHex}
      class="active-color-badge"
    >
      <span class="active-color-dot"></span>
      <span class="active-color-label">{colorLabel[activeColor] ?? activeColor}</span>
    </div>
  {:else if topCard && (topCard.value === CardValue.ChangeColor || topCard.value === CardValue.PlusFour)}
    <div class="active-color-badge wild-badge">
      <svg class="wild-dots" height="14" viewBox="0 0 38 14" width="38">
        <circle cx="4" cy="7" fill="#E8192C" r="4"/>
        <rect fill="#1565C0" height="8" rx="1.5" width="8" x="10" y="3"/>
        <polygon fill="#2E7D32" points="24,3 28,11 20,11"/>
        <polygon fill="#FFD600" points="34,3 38,7 34,11 30,7"/>
      </svg>
    </div>
  {/if}
</div>

<style>
  @import url("../../styles/card.css");

  .card.card.discard {
    position: absolute;
  }

  .discard-pile {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: var(--card-w);
    height: var(--card-h);
    border: 2px dashed rgb(255 255 255 / 15%);
    border-radius: var(--card-br);
    transition: border-color 0.25s, background 0.25s, scale 0.25s;

    &.drag-over {
      border-color: #1565c0;
      background: rgb(21 101 192 / 15%);
      box-shadow: 0 0 30px rgb(21 101 192 / 30%);
      scale: 1.05;
    }
  }

  .active-color-badge {
    position: absolute;
    bottom: -36px;
    left: 50%;
    z-index: 20;
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 4px 12px 4px 8px;
    border: 1px solid color-mix(in sRGB, var(--active-color) 40%, transparent);
    border-radius: 2rem;
    background: rgb(8 10 28 / 85%);
    white-space: nowrap;
    box-shadow: 0 2px 12px rgb(0 0 0 / 40%);
    backdrop-filter: blur(10px);
    translate: -50% 0;

    &.wild-badge {
      padding: 5px 10px;
      border-color: rgb(255 255 255 / 15%);
    }
  }

  .active-color-dot {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--active-color);
    box-shadow: 0 0 8px color-mix(in sRGB, var(--active-color) 60%, transparent);
  }

  .active-color-label {
    color: rgb(255 255 255 / 85%);
    font-weight: 700;
    font-size: 0.75rem;
  }

  .wild-dots {
    display: block;
  }

  .discard-empty-hint {
    color: rgb(255 255 255 / 20%);
    font-weight: 600;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
  }

  /* ── Card effect overlay ── */
  .card-effect {
    position: absolute;
    inset: 0;
    z-index: 50;
    border-radius: var(--card-br);
    pointer-events: none;

    /* Taki: yellow expanding ring pulse */
    &[data-effect="taki"] {
      --ring-color: 249, 247, 85;

      animation: fx-ring 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* Super Taki: rainbow conic spin then fade */
    &[data-effect="supertaki"] {
      background: conic-gradient(#e8192c 0deg, #ffd600 90deg, #2e7d32 180deg, #1565c0 270deg, #e8192c 360deg);
      opacity: 0%;
      animation: fx-conic-spin 0.85s ease-out both;
    }

    /* +2: red burst */
    &[data-effect="plus-two"] {
      --ring-color: 232, 25, 44;

      animation: fx-ring 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* +6: orange burst */
    &[data-effect="plus-six"] {
      --ring-color: 255, 138, 0;

      animation: fx-ring 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* +10: magenta double-ring burst */
    &[data-effect="plus-ten"] {
      --ring-color: 233, 30, 99;

      animation: fx-double-ring 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* Stop: cold blue freeze flash */
    &[data-effect="stop"] {
      background: rgb(100 190 255 / 0%);
      animation: fx-freeze 1s ease both;
    }

    /* Plus: green pulse glow */
    &[data-effect="plus"] {
      --ring-color: 126, 180, 68;

      animation: fx-ring 1s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* Direction: rotating sweep */
    &[data-effect="direction"] {
      border: 3px solid rgb(104 185 212 / 0%);
      animation: fx-direction 1s ease both;
    }

    /* +3: aggressive double-ring burst */
    &[data-effect="plus-three"] {
      animation: fx-plus-three 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    /* +3 Breaker: silver shield flash */
    &[data-effect="breaker"] {
      animation: fx-breaker 0.9s ease both;
    }

    /* ChangeColor: conic gradient spin */
    &[data-effect="change-color"] {
      background: conic-gradient(#e8192c 0deg, #ffd600 90deg, #2e7d32 180deg, #1565c0 270deg, #e8192c 360deg);
      opacity: 0%;
      animation: fx-conic-spin 0.9s ease-out both;
    }

    /* No effect for plain numbers */
    &[data-effect="number"] {
      display: none;
    }
  }

  @keyframes fx-ring {
    0%{ opacity: 100%; box-shadow: 0 0 0 0 rgb(var(--ring-color), 0.9); }
    60%{ opacity: 100%; box-shadow: 0 0 0 28px rgb(var(--ring-color), 0.25); }
    100%{ opacity: 0%; box-shadow: 0 0 0 55px rgb(var(--ring-color), 0); }
  }

  @keyframes fx-double-ring {
    0% {
      opacity: 100%;
      box-shadow:
        0 0 0 0 rgb(var(--ring-color), 0.95),
        0 0 0 0 rgb(var(--ring-color), 0.4);
    }

    50% {
      box-shadow:
        0 0 0 24px rgb(var(--ring-color), 0.4),
        0 0 0 48px rgb(var(--ring-color), 0.1);
    }

    100% {
      opacity: 0%;
      box-shadow:
        0 0 0 48px rgb(var(--ring-color), 0),
        0 0 0 86px rgb(var(--ring-color), 0);
    }
  }

  @keyframes fx-freeze {
    0%{ background: rgb(100 190 255 / 0%); }
    15%{ background: rgb(100 190 255 / 55%); box-shadow: 0 0 0 20px rgb(100 190 255 / 20%); }
    100%{ background: rgb(100 190 255 / 0%); box-shadow: 0 0 0 40px rgb(100 190 255 / 0%); }
  }

  @keyframes fx-direction {
    0%{ border-color: rgb(104 185 212 / 0%); rotate: 0deg; }
    20%{ border-color: rgb(104 185 212 / 80%); }
    100%{ border-color: rgb(104 185 212 / 0%); rotate: 180deg; }
  }

  @keyframes fx-plus-three {
    0% {
      opacity: 100%;
      box-shadow:
        0 0 0 0 rgb(255 70 70 / 95%),
        0 0 0 0 rgb(255 70 70 / 40%);
    }

    50% {
      box-shadow:
        0 0 0 22px rgb(255 70 70 / 40%),
        0 0 0 44px rgb(255 70 70 / 10%);
    }

    100% {
      opacity: 0%;
      box-shadow:
        0 0 0 44px rgb(255 70 70 / 0%),
        0 0 0 80px rgb(255 70 70 / 0%);
    }
  }

  @keyframes fx-breaker {
    0%{ background: rgb(210 210 230 / 0%); box-shadow: 0 0 0 0 rgb(210 210 230 / 0%); }
    18%{ background: rgb(210 210 230 / 30%); box-shadow: 0 0 28px 8px rgb(210 210 230 / 85%); }
    80%{ background: rgb(210 210 230 / 0%); box-shadow: 0 0 12px 4px rgb(210 210 230 / 20%); }
    100%{ box-shadow: 0 0 0 0 rgb(210 210 230 / 0%); }
  }

  @keyframes fx-conic-spin {
    0%{ opacity: 75%; rotate: 0deg; scale: 1; }
    60%{ opacity: 55%; rotate: 270deg; scale: 1.04; }
    100%{ opacity: 0%; rotate: 540deg; scale: 0.98; }
  }
</style>
