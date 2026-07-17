<script lang="ts">
  import ColorWheelSegment from "$lib/components/cards/ColorWheelSegment.svelte";
  import { locale } from "$lib/locale.svelte";
  import type { Card } from "$lib/network";
  import { CardColor } from "$lib/network";

  const {
    onpick, onhover, onclosed, hand, isAllColorsEqual = false
  }: {
    onpick: (color: CardColor) => void;
    onhover: (color: CardColor | null) => void;
    onclosed: () => void;
    hand: Card[];
    isAllColorsEqual?: boolean;
  } = $props();

  let pickedColor = $state<CardColor | null>(null);

  const countRed    = $derived(hand.filter(card => card.color === CardColor.Red).length);
  const countYellow = $derived(hand.filter(card => card.color === CardColor.Yellow).length);
  const countGreen  = $derived(hand.filter(card => card.color === CardColor.Green).length);
  const countBlue   = $derived(hand.filter(card => card.color === CardColor.Blue).length);

  const nonZeroCount = $derived(
    [countRed, countYellow, countGreen, countBlue].filter(count => count > 0).length
  );

  const maxCount = $derived(Math.max(countRed, countYellow, countGreen, countBlue));

  const dominantColor = $derived.by(() => {
    if (maxCount === 0) {
      return null;
    }

    const pairs: [CardColor, number][] = [
      [CardColor.Red, countRed],
      [CardColor.Yellow, countYellow],
      [CardColor.Green, countGreen],
      [CardColor.Blue, countBlue]
    ];
    const tops = pairs.filter(([, count]) => count === maxCount);
    return tops.length === 1 ? tops[0][0] : null;
  });

  function pick(color: CardColor): void {
    if (pickedColor !== null) {
      return;
    }

    pickedColor = color;
    onhover(null);
    onpick(color);
    setTimeout(onclosed, 500);
  }

  const segments: {
    color: CardColor;
    fill: string;
    pathData: string;
    label: string;
    count: number;
    badgeCx: number;
    badgeCy: number;
    labelX: number;
    labelY: number;
  }[] = $derived([
    {
      color: CardColor.Red,
      fill: "#E8192C",
      pathData: "M100,100 L100,10 A90,90 0 0,1 190,100 Z",
      label: locale.strings.red,
      count: countRed,
      badgeCx: 148,
      badgeCy: 52,
      labelX: 152,
      labelY: 60
    },
    {
      color: CardColor.Yellow,
      fill: "#FFD600",
      pathData: "M100,100 L190,100 A90,90 0 0,1 100,190 Z",
      label: locale.strings.yellow,
      count: countYellow,
      badgeCx: 148,
      badgeCy: 148,
      labelX: 152,
      labelY: 148
    },
    {
      color: CardColor.Green,
      fill: "#2E7D32",
      pathData: "M100,100 L100,190 A90,90 0 0,1 10,100 Z",
      label: locale.strings.green,
      count: countGreen,
      badgeCx: 52,
      badgeCy: 148,
      labelX: 48,
      labelY: 148
    },
    {
      color: CardColor.Blue,
      fill: "#1565C0",
      pathData: "M100,100 L10,100 A90,90 0 0,1 100,10 Z",
      label: locale.strings.blue,
      count: countBlue,
      badgeCx: 52,
      badgeCy: 52,
      labelX: 48,
      labelY: 60
    }
  ]);
</script>

<div class="backdrop" aria-hidden="true"></div>
<dialog class="wheel-dialog" open>
  <div
    class="wheel-container"
    class:spinning-out={pickedColor !== null}
    onanimationend={() => pickedColor !== null && onclosed()}
  >
    <svg class="wheel" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {#each segments as segment (segment.color)}
        <ColorWheelSegment
          badgeCx={segment.badgeCx}
          badgeCy={segment.badgeCy}
          color={segment.color}
          count={isAllColorsEqual ? 0 : segment.count}
          fill={segment.fill}
          isDominant={!isAllColorsEqual && dominantColor === segment.color}
          label={segment.label}
          labelX={segment.labelX}
          labelY={segment.labelY}
          nonZeroCount={isAllColorsEqual ? 0 : nonZeroCount}
          onHover={onhover}
          onPick={() => pick(segment.color)}
          pathData={segment.pathData}
        />
      {/each}

      <line
        pointer-events="none"
        stroke="rgba(255,255,255,0.3)"
        stroke-width="2.5"
        x1="100" x2="100" y1="10" y2="190"
      />
      <line
        pointer-events="none"
        stroke="rgba(255,255,255,0.3)"
        stroke-width="2.5"
        x1="10" x2="190" y1="100" y2="100"
      />

      <circle
        cx="100" cy="100"
        fill="rgba(10,12,30,0.9)"
        pointer-events="none"
        r="22"
        stroke="rgba(255,255,255,0.15)"
        stroke-width="1.5"
      />
    </svg>
  </div>
</dialog>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1999;
  }

  .wheel-dialog {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 28%;
    left: 0;
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: visible;
    width: auto;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    pointer-events: none;

    @media (hover: none) and (width <= 600px) {
      bottom: 55%;
    }
  }

  .wheel-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    filter: drop-shadow(0 8px 32px rgb(0 0 0 / 70%));
    pointer-events: all;
    animation: wheel-spin-in 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.4) both;

    &.spinning-out {
      animation: wheel-spin-out 0.42s cubic-bezier(0.55, 0, 1, 0.45) both;
    }
  }

  @keyframes wheel-spin-in {
    from {
      opacity: 0%;
      rotate: -360deg;
      scale: 0.08;
    }

    to {
      opacity: 100%;
      rotate: 0deg;
      scale: 1;
    }
  }

  @keyframes wheel-spin-out {
    from {
      opacity: 100%;
      rotate: 0deg;
      scale: 1;
    }

    to {
      opacity: 0%;
      rotate: 540deg;
      scale: 0.05;
    }
  }

  .wheel {
    width: clamp(180px, 50vmin, 270px);
    height: clamp(180px, 50vmin, 270px);
  }
</style>
