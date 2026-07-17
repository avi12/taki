<script lang="ts">
  import { fade } from "svelte/transition";

  interface Props {
    hintX: number;
    hintY: number;
    hintCounts: {
      red: number;
      yellow: number;
      green: number;
      blue: number;
    };
  }

  const { hintX, hintY, hintCounts }: Props = $props();
</script>

<div
  style:left="{hintX}px"
  style:top="{hintY}px"
  class="color-hint"
  transition:fade={{ duration: 160 }}
>
  <span class="hint-pip hint-red"    class:hint-zero={hintCounts.red === 0}>
    {hintCounts.red}
  </span>
  <span class="hint-pip hint-blue"   class:hint-zero={hintCounts.blue === 0}>
    {hintCounts.blue}
  </span>
  <span class="hint-pip hint-green"  class:hint-zero={hintCounts.green === 0}>
    {hintCounts.green}
  </span>
  <span class="hint-pip hint-yellow" class:hint-zero={hintCounts.yellow === 0}>
    {hintCounts.yellow}
  </span>
</div>

<style>
  .color-hint {
    position: fixed;
    z-index: 500;
    display: flex;
    gap: 5px;
    padding: 6px 10px;
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 999px;
    background: rgb(8 10 28 / 88%);
    box-shadow: 0 4px 20px rgb(0 0 0 / 50%);
    backdrop-filter: blur(10px);
    pointer-events: none;
    translate: -50% -100%;
  }

  .hint-pip {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: white;
    font-weight: 900;
    font-size: 0.8rem;
    transition: opacity 0.15s ease;

    &.hint-red{ background: #e8192c; }
    &.hint-blue{ background: #1565c0; }
    &.hint-green{ background: #2e7d32; }
    &.hint-yellow{ background: #ffd600; }

    &.hint-zero {
      opacity: 28%;
      filter: saturate(0.2);
    }
  }
</style>
