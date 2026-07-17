<script lang="ts">
  import { CardColor } from "$lib/network";

  interface Props {
    color: CardColor;
    fill: string;
    pathData: string;
    label: string;
    count: number;
    nonZeroCount: number;
    isDominant: boolean;
    badgeCx: number;
    badgeCy: number;
    labelX: number;
    labelY: number;
    onPick: () => void;
    onHover: (color: CardColor | null) => void;
  }

  const {
    color, fill, pathData, label, count, nonZeroCount, isDominant,
    badgeCx, badgeCy, labelX, labelY, onPick, onHover
  }: Props = $props();

  const isEmpty = $derived(nonZeroCount > 0 && count === 0);

  let isKeyboardFocused = $state(false);
</script>

<path
  class="seg"
  class:dominant={isDominant}
  class:empty={isEmpty}
  aria-label={label}
  d={pathData}
  {fill}
  onblur={() => isKeyboardFocused = false}
  onclick={onPick}
  onfocus={event => isKeyboardFocused = event.currentTarget.matches(":focus-visible")}
  onkeydown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick())}
  onpointerenter={() => onHover(color)}
  onpointerleave={() => onHover(null)}
  role="button"
  tabindex="0"
/>

<g class="count-badge" class:badge-empty={isEmpty} class:revealed={isKeyboardFocused} pointer-events="none">
  <circle cx={badgeCx} cy={badgeCy} {fill} r="16" stroke="white" stroke-width="2.5"/>
  <text
    style:--seg-fill={fill}
    class="badge-text"
    dominant-baseline="middle"
    fill="white"
    font-family="Heebo, system-ui, sans-serif"
    font-size="14"
    font-weight="900"
    pointer-events="none"
    text-anchor="middle"
    x={badgeCx} y={badgeCy}
  >{count}</text>
</g>

<text
  style:--seg-fill={fill}
  class="seg-label"
  class:revealed={isKeyboardFocused}
  dominant-baseline="middle"
  fill="white"
  font-family="Heebo, system-ui, sans-serif"
  font-size="14"
  font-weight="800"
  pointer-events="none"
  text-anchor="middle"
  x={labelX} y={labelY}
>{label}</text>

<style>
  .seg {
    outline: none;
    cursor: pointer;
    touch-action: manipulation;
    transition: filter 0.18s ease, opacity 0.18s ease;

    &:focus-visible {
      outline: 3px solid white;
      outline-offset: 2px;
    }

    &:hover:not(.empty) {
      filter: brightness(1.28) drop-shadow(0 0 14px rgb(255 255 255 / 35%));
    }

    &:active:not(.empty) {
      filter: brightness(0.85);
    }

    &.empty {
      opacity: 32%;
      filter: saturate(0.25);
    }

    &.dominant {
      animation: seg-pulse 1.6s ease-in-out infinite;
    }
  }

  @keyframes seg-pulse {
    0%,
 100%{ filter: brightness(1); }
    50%{ filter: brightness(1.32) drop-shadow(0 0 16px rgb(255 255 255 / 45%)); }
  }

  .count-badge {
    opacity: 0%;
    transition: opacity 0.2s ease;

    &.revealed {
      opacity: 100%;
    }

    &.revealed.badge-empty {
      opacity: 35%;
    }
  }

  .seg-label {
    display: block;
    opacity: 0%;
    transition: opacity 0.2s ease;

    &.revealed {
      opacity: 100%;
    }
  }

  .seg-label,
  .badge-text {
    fill: color-contrast(var(--seg-fill) vs black, white);
  }
</style>
