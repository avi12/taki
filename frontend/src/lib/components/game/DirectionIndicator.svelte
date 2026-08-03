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
      <!-- direction=1 advances to the next seat index: the active player sweeps
           left->right across the opponents row, which reads as clockwise. -->
      <svg
        class="direction-svg"
        class:spin-cw={arrowAnimKey > 0}
        height="64"
        viewBox="0 0 40 40"
        width="64"
      >
        <!-- eslint-disable-next-line @stylistic/max-len -->
        <path d="M20 6 A14 14 0 1 1 6 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="3.5"/>
        <polygon fill="currentColor" points="6,16 10,23 2,23"/>
      </svg>
    {:else}
      <!-- direction=-1 advances to the previous seat index: right->left = counter-clockwise. -->
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
