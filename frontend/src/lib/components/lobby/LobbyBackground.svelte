<script lang="ts">
</script>

<div class="deco-cards-bg" aria-hidden="true">
  <div class="deco-card deco-red"></div>
  <div class="deco-card deco-blue"></div>
  <div class="deco-card deco-green"></div>
  <div class="deco-card deco-yellow"></div>
</div>

<style>
  .deco-cards-bg {
    position: fixed;
    inset: 0;
    overflow: clip;
    pointer-events: none;
  }

  .deco-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 80px;
    height: 120px;
    border: 3px solid var(--deco-border);
    border-radius: 10px;
    opacity: var(--deco-opacity);
    animation: deco-float 8s ease-in-out infinite;

    &.deco-red {
      --pos-x: 5vw;
      --pos-y: 10vh;
      --r: -15deg;

      background: var(--red);
      animation-delay: 0s;
    }

    &.deco-blue {
      --pos-x: calc(100vw - 8vw - 80px);
      --pos-y: 15vh;
      --r: 12deg;

      background: var(--blue);
      animation-delay: 1.5s;
    }

    &.deco-green {
      --pos-x: 10vw;
      --pos-y: calc(80vh - 120px);
      --r: 20deg;

      background: var(--green);
      animation-delay: 3s;
    }

    &.deco-yellow {
      --pos-x: calc(95vw - 80px);
      --pos-y: calc(75vh - 120px);
      --r: -8deg;

      background: var(--yellow);
      animation-delay: 2s;
    }
  }

  @keyframes deco-float {
    0%,
 100%{ rotate: var(--r); translate: var(--pos-x) var(--pos-y); }
    50%{ rotate: calc(var(--r) + 5deg); translate: var(--pos-x) calc(var(--pos-y) - 18px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .deco-card {
      rotate: var(--r);
      translate: var(--pos-x) var(--pos-y);
      animation: none;
    }
  }
</style>
