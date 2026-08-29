<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import { JOKER_PENALTY_AMOUNTS, type JokerPenaltyAmount } from "$lib/network";

  const SPIN_FACE_INTERVAL_MS = 70;
  const SIDE_FACE_COUNT       = 5;

  const {
    amount, totalPenalty, isRolling, isRevealed, onroll
  }: {
    amount: JokerPenaltyAmount | null;
    totalPenalty: number;
    isRolling: boolean;
    isRevealed: boolean;
    onroll: () => void;
  } = $props();

  let spinFace = $state<JokerPenaltyAmount>(JOKER_PENALTY_AMOUNTS[0]);

  const frontFace = $derived.by(() => {
    if (isRevealed && amount !== null) {
      return String(amount);
    }

    return isRolling ? String(spinFace) : "?";
  });

  const sideFaces = JOKER_PENALTY_AMOUNTS
    .filter((_, iAmount) => iAmount % 2 === 0)
    .slice(0, SIDE_FACE_COUNT);

  $effect(() => {
    if (!isRolling || isRevealed) {
      return;
    }

    const intervalId = setInterval(() => {
      const iFace = Math.floor(Math.random() * JOKER_PENALTY_AMOUNTS.length);
      spinFace = JOKER_PENALTY_AMOUNTS[iFace];
    }, SPIN_FACE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  });
</script>

<div class="backdrop" aria-hidden="true"></div>
<dialog class="die-dialog" aria-labelledby="joker-die-title" open>
  <h2 id="joker-die-title" class="die-title">{locale.strings.jokerRollTitle}</h2>

  <button
    class="die-button"
    aria-label={locale.strings.jokerRollAriaLabel}
    disabled={isRolling}
    onclick={onroll}
    type="button"
  >
    <span class="die-glow" class:lit={isRevealed} aria-hidden="true"></span>
    <span class="die-stage" class:bouncing={isRolling && !isRevealed}>
      <span
        class="die-cube"
        class:landed={isRevealed}
        class:rolling={isRolling && !isRevealed}
      >
        <span class="die-face die-front">{frontFace}</span>
        <span class="die-face die-back">{sideFaces[0]}</span>
        <span class="die-face die-right">{sideFaces[1]}</span>
        <span class="die-face die-left">{sideFaces[2]}</span>
        <span class="die-face die-top">{sideFaces[3]}</span>
        <span class="die-face die-bottom">{sideFaces[4]}</span>
      </span>
    </span>
  </button>

  <p class="die-caption" aria-live="polite">
    {#if isRevealed && amount !== null}
      {locale.strings.jokerRollResult(totalPenalty)}
    {:else if isRolling}
      {locale.strings.jokerRolling}
    {:else}
      {locale.strings.jokerRollPrompt}
    {/if}
  </p>
</dialog>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1999;
    background: rgb(0 0 0 / 62%);
    backdrop-filter: blur(3px);
    animation: die-fade-in 0.25s ease both;
  }

  .die-dialog {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    justify-content: center;
    align-items: center;
    width: auto;
    max-width: none;
    height: auto;
    max-height: none;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: white;
    animation: die-fade-in 0.3s ease both;
  }

  .die-title {
    margin: 0;
    color: white;
    font-weight: 900;
    font-size: clamp(1.3rem, 5vw, 2rem);
    letter-spacing: 0.02em;
    text-shadow: 0 2px 14px rgb(0 0 0 / 65%);
  }

  .die-button {
    --die-size: clamp(104px, 29vmin, 152px);

    position: relative;
    display: block;
    padding: 0;
    border: none;
    border-radius: 12px;
    background: none;
    cursor: pointer;
    perspective: 760px;

    &:disabled {
      cursor: default;
    }

    &:focus-visible {
      outline: 3px solid #ffd600;
      outline-offset: 14px;
    }
  }

  /* Ground shadow — kept out of the 3D context so its blur cannot flatten the cube */
  .die-glow {
    position: absolute;
    bottom: calc(var(--die-size) * -0.24);
    left: 50%;
    width: calc(var(--die-size) * 1.05);
    height: calc(var(--die-size) * 0.26);
    border-radius: 50%;
    background: rgb(0 0 0 / 55%);
    filter: blur(14px);
    transition: background 0.4s ease, width 0.4s ease;
    translate: -50% 0;

    &.lit {
      width: calc(var(--die-size) * 1.35);
      background: rgb(255 214 0 / 55%);
    }
  }

  .die-stage {
    display: block;
    width: var(--die-size);
    height: var(--die-size);
    transform-style: preserve-3d;
    animation: die-drop-in 0.5s cubic-bezier(0.2, 0, 0, 1) both;

    &.bouncing {
      animation: die-hop 0.45s cubic-bezier(0.4, 0, 0.5, 1) infinite;
    }
  }

  .die-cube {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    transition: transform 0.45s cubic-bezier(0.2, 0, 0, 1);
    transform: rotateX(-18deg) rotateY(24deg);
    transform-style: preserve-3d;

    &.rolling {
      animation: die-roll 0.85s linear infinite;
    }

    &.landed {
      animation: die-land 0.6s cubic-bezier(0.2, 0, 0, 1) both;
    }
  }

  .die-face {
    --face-front: linear-gradient(150deg, #ffffff 0%, #e7edfa 55%, #cdd7ec 100%);
    --face-lit: linear-gradient(150deg, #ffffff 0%, #f2f5fd 100%);
    --face-side: linear-gradient(150deg, #e3e9f7 0%, #c6d1e9 60%, #adbbd9 100%);
    --face-shaded: linear-gradient(150deg, #c9d3e8 0%, #a9b7d6 100%);

    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    border-radius: 14%;
    background: var(--face-front);
    color: #0d1b4b;
    font-family: Impact, "Arial Black", sans-serif;
    font-size: calc(var(--die-size) * 0.38);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    box-shadow: inset 0 0 0 2px rgb(13 27 75 / 9%);
    direction: ltr;
  }

  /* Fake lighting, so the cube reads as solid instead of six flat squares */
  .die-front {
    transform: translateZ(calc(var(--die-size) / 2));
  }

  .die-back {
    background: var(--face-shaded);
    transform: rotateY(180deg) translateZ(calc(var(--die-size) / 2));
  }

  .die-right {
    background: var(--face-side);
    transform: rotateY(90deg) translateZ(calc(var(--die-size) / 2));
  }

  .die-left {
    background: var(--face-side);
    transform: rotateY(-90deg) translateZ(calc(var(--die-size) / 2));
  }

  .die-top {
    background: var(--face-lit);
    transform: rotateX(90deg) translateZ(calc(var(--die-size) / 2));
  }

  .die-bottom {
    background: var(--face-shaded);
    transform: rotateX(-90deg) translateZ(calc(var(--die-size) / 2));
  }

  .die-caption {
    max-width: 18rem;
    margin: 0;
    color: rgb(255 255 255 / 84%);
    font-weight: 600;
    font-size: clamp(0.85rem, 3vw, 1.02rem);
    text-align: center;
    text-shadow: 0 1px 8px rgb(0 0 0 / 60%);
  }

  @keyframes die-fade-in {
    from{ opacity: 0%; }
    to{ opacity: 100%; }
  }

  /* No opacity here — it would force transform-style: preserve-3d back to flat */
  @keyframes die-drop-in {
    0%{ scale: 0.55; translate: 0 -46px; }
    70%{ scale: 1.04; translate: 0 6px; }
    100%{ scale: 1; translate: 0 0; }
  }

  @keyframes die-hop {
    0%,
 100%{ translate: 0 0; }
    50%{ translate: 0 -26px; }
  }

  @keyframes die-roll {
    0%{ transform: rotateX(-18deg) rotateY(24deg); }
    100%{ transform: rotateX(342deg) rotateY(744deg); }
  }

  /* Carries on in the tumble's own direction and decelerates into rest — about a
     third of a turn, so it reads as slowing down rather than as a second spin */
  @keyframes die-land {
    0%{ transform: rotateX(-108deg) rotateY(-96deg) scale(1.14); }
    60%{ transform: rotateX(-12deg) rotateY(31deg) scale(0.95); }
    82%{ transform: rotateX(-22deg) rotateY(20deg) scale(1.04); }
    100%{ transform: rotateX(-18deg) rotateY(24deg) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .backdrop,
    .die-dialog,
    .die-stage,
    .die-stage.bouncing,
    .die-cube.rolling,
    .die-cube.landed {
      animation-duration: 0.01ms;
      animation-iteration-count: 1;
    }

    .die-cube,
    .die-glow {
      transition-duration: 0.01ms;
    }
  }
</style>
