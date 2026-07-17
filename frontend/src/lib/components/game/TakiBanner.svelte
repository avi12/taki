<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import { fly } from "svelte/transition";

  interface Props {
    takiColor: string;
    isMyTurn: boolean;
    onCloseTaki: () => void;
  }

  const { takiColor, isMyTurn, onCloseTaki }: Props = $props();
</script>

<div
  style:--taki-color={takiColor}
  class="taki-active-banner"
  in:fly={{
    y: -20,
    duration: 250
  }}
>
  <svg height="22" viewBox="0 0 30 30" width="22">
    <g fill="none" stroke="white" stroke-linecap="round" stroke-width="3.5">
      <path
        d="M15 4 C20 4 26 9 26 15 C26 21 20 26 15 26 C10 26 4 21 4 15 C4 9 10 4 15 8"
        opacity="0.6"
      />
      <path
        d="M15 8 C18.5 8 22 11 22 15 C22 19 18.5 22 15 22
          C11.5 22 8 19 8 15 C8 11 11.5 8 15 10 C16 12 15 14 15 15"
      />
    </g>
  </svg>
  <span>{locale.strings.takiActive}</span>
  {#if isMyTurn}
    <button class="close-taki-inline" onclick={onCloseTaki}>{locale.strings.closeTaki}</button>
  {/if}
</div>

<style>
  .taki-active-banner {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.5rem;
    padding: 0.5rem 1rem 0.5rem 0.75rem;
    border: 1px solid color-mix(in srgb, var(--taki-color, #e8192c) 40%, transparent);
    border-radius: 2rem;
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--taki-color, #e8192c) 15%, transparent),
        rgb(0 0 0 / 30%)
      );
    color: white;
    font-weight: 700;
    font-size: clamp(0.78rem, 2vw, 0.9rem);
    box-shadow: 0 4px 16px rgb(0 0 0 / 30%);

    > svg {
      flex-shrink: 0;
    }
  }

  .close-taki-inline {
    margin-inline-start: 0.75rem;
    padding: 0.3rem 0.8rem;
    border: 1px solid rgb(255 255 255 / 25%);
    border-radius: 2rem;
    background: rgb(255 255 255 / 15%);
    color: white;
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgb(255 255 255 / 25%);
    }
  }
</style>
