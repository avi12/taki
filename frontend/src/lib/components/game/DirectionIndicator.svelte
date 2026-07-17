<script lang="ts">
  interface Props {
    direction: 1 | -1;
    arrowAnimKey: number;
  }

  const { direction, arrowAnimKey }: Props = $props();
</script>

<div class="direction-indicator">
  {#key arrowAnimKey}
    {#if direction === 1}
      <!-- Counter-clockwise arrow (direction=1 visually goes right->top-left = CCW) -->
      <svg
        class="direction-svg"
        class:spin-ccw={arrowAnimKey > 0}
        height="64"
        viewBox="0 0 40 40"
        width="64"
      >
        <!-- eslint-disable-next-line @stylistic/max-len -->
        <path d="M20 6 A14 14 0 1 0 34 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="3.5"/>
        <polygon fill="currentColor" points="34,16 30,23 38,23"/>
      </svg>
    {:else}
      <!-- Clockwise arrow (direction=-1 visually goes left->top-right = CW) -->
      <svg
        class="direction-svg"
        class:spin-cw={arrowAnimKey > 0}
        height="64"
        viewBox="0 0 40 40"
        width="64"
      >
        <!-- eslint-disable-next-line @stylistic/max-len -->
        <path d="M20 6 A14 14 0 1 1 6 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="3.5"/>
        <polygon fill="currentColor" points="6,24 2,17 10,17"/>
      </svg>
    {/if}
  {/key}
</div>

<style>
  .direction-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 5;
    color: var(--direction-arrow);
    pointer-events: none;
    translate: -50% -50%;

    @media (width <= 600px) {
      svg {
        width: 36px;
        height: 36px;
      }
    }
  }

  .direction-svg {
    display: block;

    /* CW reversal: arrow sweeps in from behind (negative rotation = CW entry) */
    &.spin-cw {
      animation: direction-spin-cw 0.85s cubic-bezier(0.34, 1.3, 0.64, 1) both;
    }

    /* CCW reversal: arrow sweeps in the other way; scaleX(-1) makes it look CCW */
    &.spin-ccw {
      animation: direction-spin-ccw 0.85s cubic-bezier(0.34, 1.3, 0.64, 1) both;
    }
  }

  @keyframes direction-spin-cw {
    from{ opacity: 35%; rotate: -360deg; }
    to{ opacity: 100%; rotate: 0deg; }
  }

  @keyframes direction-spin-ccw {
    from{ opacity: 35%; rotate: 360deg; }
    to{ opacity: 100%; rotate: 0deg; }
  }
</style>
