<script lang="ts">
  import {
    CardColor,
    CardValue,
    isDrawPenaltyCard,
    JOKER_PENALTY_AMOUNTS,
    type JokerPenaltyAmount
  } from "$lib/network";
  import { getCardColorHex } from "$lib/utils/cards";

  const { value, jokerPenalty }: {
    value: CardValue;
    jokerPenalty?: JokerPenaltyAmount;
  } = $props();

  const SYMBOL_MAP = new Map<CardValue, string>([
    [CardValue.SuperTaki,       "supertaki"],
    [CardValue.Taki,            "taki"],
    [CardValue.Stop,            "stop"],
    [CardValue.ChangeColor,     "color"],
    [CardValue.PlusTwo,         "+2"],
    [CardValue.PlusSix,         "+6"],
    [CardValue.PlusTen,         "+10"],
    [CardValue.Plus,            "plus"],
    [CardValue.Direction,       "direction"],
    [CardValue.PlusThree,       "+3"],
    [CardValue.PlusThreeBreaker, "breaker"],
    [CardValue.Crown,            "crown"],
    [CardValue.PlusFour,         "+4"],
    [CardValue.Joker,            "joker"]
  ]);

  const symbol = $derived(SYMBOL_MAP.get(value) ?? value);

  const isDrawPenaltySymbol = $derived(isDrawPenaltyCard(value) && value !== CardValue.Joker);

  const jokerLabel = $derived(
    jokerPenalty
      ? `+${jokerPenalty}`
      : `${JOKER_PENALTY_AMOUNTS[0]}–${JOKER_PENALTY_AMOUNTS[JOKER_PENALTY_AMOUNTS.length - 1]}`
  );

  const jokerInkColor = getCardColorHex(CardColor.None);
</script>

<div class="card-content-wrapper">
  {#if symbol === "taki"}
    {@render taki_svg()}
  {:else if symbol === "supertaki"}
    {@render supertaki_svg()}
  {:else if symbol === "stop"}
    {@render stop_svg()}
  {:else if symbol === "color"}
    {@render color_wheel_svg()}
  {:else if isDrawPenaltySymbol}
    {@render plus_count_svg(symbol.slice(1))}
  {:else if symbol === "plus"}
    {@render plus_svg()}
  {:else if symbol === "direction"}
    {@render direction_svg()}
  {:else if symbol === "+3"}
    {@render plus_three_svg()}
  {:else if symbol === "breaker"}
    {@render breaker_svg()}
  {:else if symbol === "crown"}
    {@render crown_svg()}
  {:else if symbol === "joker"}
    {@render joker_svg()}
  {:else}
    <span class="card-value">{value}</span>
  {/if}
</div>

{#snippet taki_svg()}
  <!-- Single-color Taki: shadow+connectors at 0.45 opacity, face at full -->
  <svg class="card-icon-svg taki-square-svg" viewBox="0 0 53 85" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.5469 50V82H36.7812V50H43.5469Z" fill="currentColor" opacity="0.45"/>
    <polygon fill="currentColor" opacity="0.45" points="41.7812,42 48.5469,42 43.5469,50 36.7812,50"/>
    <polygon fill="currentColor" opacity="0.45" points="48.5469,42 48.5469,74 43.5469,82 43.5469,50"/>
    <path d="M48.5469 42V74H41.7812V42H48.5469Z" fill="currentColor"/>
    <!-- eslint-disable-next-line @stylistic/max-len -->
    <path d="M25.2969 42H18.0469L29.0938 10H37.8125L48.8438 42H41.5938L33.5781 17.3125H33.3281L25.2969 42ZM24.8438 29.4219H41.9688V34.7031H24.8438V29.4219Z" fill="currentColor" opacity="0.45"/>
    <polygon fill="currentColor" opacity="0.45" points="34.0938,2 42.8125,2 37.8125,10 29.0938,10"/>
    <polygon fill="currentColor" opacity="0.45" points="42.8125,2 53.8438,34 48.8438,42 37.8125,10"/>
    <polygon
      fill="currentColor"
      opacity="0.45"
      points="29.8438,21.4219 46.9688,21.4219 41.9688,29.4219 24.8438,29.4219"
    />
    <polygon
      fill="currentColor"
      opacity="0.45"
      points="46.9688,21.4219 46.9688,26.7031 41.9688,34.7031 41.9688,29.4219"
    />
    <!-- eslint-disable-next-line @stylistic/max-len -->
    <path d="M30.2969 34H23.0469L34.0938 2H42.8125L53.8438 34H46.5938L38.5781 9.3125H38.3281L30.2969 34ZM29.8438 21.4219H46.9688V26.7031H29.8438V21.4219Z" fill="currentColor"/>
    <path d="M1.5625 15.5781V10H27.8438V15.5781H18.0469V42H11.3594V15.5781H1.5625Z" fill="currentColor" opacity="0.45"/>
    <polygon fill="currentColor" opacity="0.45" points="6.5625,2 32.8438,2 27.8438,10 1.5625,10"/>
    <polygon fill="currentColor" opacity="0.45" points="32.8438,2 32.8438,7.57812 27.8438,15.5781 27.8438,10"/>
    <polygon fill="currentColor" opacity="0.45" points="23.0469,7.57812 23.0469,34 18.0469,42 18.0469,15.5781"/>
    <path d="M6.5625 7.57812V2H32.8438V7.57812H23.0469V34H16.3594V7.57812H6.5625Z" fill="currentColor"/>
    <!-- eslint-disable-next-line @stylistic/max-len -->
    <path d="M4.78125 82V50H11.5469V64.1094H11.9688L23.4844 50H31.5938L19.7188 64.3281L31.7344 82H23.6406L14.875 68.8437L11.5469 72.9062V82H4.78125Z" fill="currentColor" opacity="0.45"/>
    <polygon fill="currentColor" opacity="0.45" points="13.7812,42 20.5469,42 11.5469,50 4.78125,50"/>
    <polygon fill="currentColor" opacity="0.45" points="20.5469,42 20.5469,56.1094 11.5469,64.1094 11.5469,50"/>
    <polygon fill="currentColor" opacity="0.45" points="20.9688,56.1094 32.4844,42 23.4844,50 11.9688,64.1094"/>
    <polygon fill="currentColor" opacity="0.45" points="32.4844,42 40.5938,42 31.5938,50 23.4844,50"/>
    <polygon fill="currentColor" opacity="0.45" points="28.7188,56.3281 40.7344,74 31.7344,82 19.7188,64.3281"/>
    <polygon fill="currentColor" opacity="0.45" points="20.5469,64.9062 20.5469,74 11.5469,82 11.5469,72.9062"/>
    <!-- eslint-disable-next-line @stylistic/max-len -->
    <path d="M13.7812 74V42H20.5469V56.1094H20.9688L32.4844 42H40.5938L28.7188 56.3281L40.7344 74H32.6406L23.875 60.8437L20.5469 64.9062V74H13.7812Z" fill="currentColor"/>
  </svg>
{/snippet}

{#snippet supertaki_svg()}
  <!-- Super Taki: full 4-color with connectors -->
  <svg class="card-icon-svg taki-square-svg" viewBox="0 0 53 85" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.5469 50V82H36.7812V50H43.5469Z" fill="#465095"/>
    <polygon fill="#465095" points="41.7812,42 48.5469,42 43.5469,50 36.7812,50"/>
    <polygon fill="#465095" points="48.5469,42 48.5469,74 43.5469,82 43.5469,50"/>
    <path d="M48.5469 42V74H41.7812V42H48.5469Z" fill="#68B9D4"/>
    <!-- eslint-disable-next-line @stylistic/max-len -->
    <path d="M25.2969 42H18.0469L29.0938 10H37.8125L48.8438 42H41.5938L33.5781 17.3125H33.3281L25.2969 42ZM24.8438 29.4219H41.9688V34.7031H24.8438V29.4219Z" fill="#B62D24"/>
    <polygon fill="#B62D24" points="34.0938,2 42.8125,2 37.8125,10 29.0938,10"/>
    <polygon fill="#B62D24" points="42.8125,2 53.8438,34 48.8438,42 37.8125,10"/>
    <polygon fill="#B62D24" points="29.8438,21.4219 46.9688,21.4219 41.9688,29.4219 24.8438,29.4219"/>
    <polygon fill="#B62D24" points="46.9688,21.4219 46.9688,26.7031 41.9688,34.7031 41.9688,29.4219"/>
    <!-- eslint-disable-next-line @stylistic/max-len -->
    <path d="M30.2969 34H23.0469L34.0938 2H42.8125L53.8438 34H46.5938L38.5781 9.3125H38.3281L30.2969 34ZM29.8438 21.4219H46.9688V26.7031H29.8438V21.4219Z" fill="#E04A3E"/>
    <path d="M1.5625 15.5781V10H27.8438V15.5781H18.0469V42H11.3594V15.5781H1.5625Z" fill="#203B18"/>
    <polygon fill="#203B18" points="6.5625,2 32.8438,2 27.8438,10 1.5625,10"/>
    <polygon fill="#203B18" points="32.8438,2 32.8438,7.57812 27.8438,15.5781 27.8438,10"/>
    <polygon fill="#203B18" points="23.0469,7.57812 23.0469,34 18.0469,42 18.0469,15.5781"/>
    <path d="M6.5625 7.57812V2H32.8438V7.57812H23.0469V34H16.3594V7.57812H6.5625Z" fill="#7EB444"/>
    <!-- eslint-disable-next-line @stylistic/max-len -->
    <path d="M4.78125 82V50H11.5469V64.1094H11.9688L23.4844 50H31.5938L19.7188 64.3281L31.7344 82H23.6406L14.875 68.8437L11.5469 72.9062V82H4.78125Z" fill="#EFA13C"/>
    <polygon fill="#EFA13C" points="13.7812,42 20.5469,42 11.5469,50 4.78125,50"/>
    <polygon fill="#EFA13C" points="20.5469,42 20.5469,56.1094 11.5469,64.1094 11.5469,50"/>
    <polygon fill="#EFA13C" points="20.9688,56.1094 32.4844,42 23.4844,50 11.9688,64.1094"/>
    <polygon fill="#EFA13C" points="32.4844,42 40.5938,42 31.5938,50 23.4844,50"/>
    <polygon fill="#EFA13C" points="28.7188,56.3281 40.7344,74 31.7344,82 19.7188,64.3281"/>
    <polygon fill="#EFA13C" points="20.5469,64.9062 20.5469,74 11.5469,82 11.5469,72.9062"/>
    <!-- eslint-disable-next-line @stylistic/max-len -->
    <path d="M13.7812 74V42H20.5469V56.1094H20.9688L32.4844 42H40.5938L28.7188 56.3281L40.7344 74H32.6406L23.875 60.8437L20.5469 64.9062V74H13.7812Z" fill="#F9F755"/>
  </svg>
{/snippet}

{#snippet stop_svg()}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" fill="none" r="44" stroke="currentColor" stroke-width="9" />
    <line stroke="currentColor" stroke-linecap="round" stroke-width="11" x1="22" x2="78" y1="22" y2="78" />
  </svg>
{/snippet}

{#snippet plus_count_svg(count: string)}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <text
      fill="currentColor"
      font-family="Impact, 'Arial Black', sans-serif"
      font-size="46"
      font-weight="900"
      text-anchor="middle"
      x="50"
      y="45"
    >+</text>
    <text
      fill="currentColor"
      font-family="Impact, 'Arial Black', sans-serif"
      font-size={count.length > 1 ? 46 : 54}
      font-weight="900"
      text-anchor="middle"
      x="50"
      y="96"
    >{count}</text>
  </svg>
{/snippet}

{#snippet color_wheel_svg()}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" fill="#111" r="46" />
    <path d="M50 50 L50 4 A46 46 0 0 1 96 50 Z" fill="#E8192C" />
    <path d="M50 50 L96 50 A46 46 0 0 1 50 96 Z" fill="#1565C0" />
    <path d="M50 50 L50 96 A46 46 0 0 1 4 50 Z" fill="#2E7D32" />
    <path d="M50 50 L4 50 A46 46 0 0 1 50 4 Z" fill="#FFD600" />
    <line opacity="0.6" stroke="white" stroke-width="2.5" x1="50" x2="50" y1="4" y2="96" />
    <line opacity="0.6" stroke="white" stroke-width="2.5" x1="4" x2="96" y1="50" y2="50" />
    <circle cx="50" cy="50" fill="white" r="10" />
  </svg>
{/snippet}

{#snippet plus_svg()}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <text
      fill="currentColor"
      font-family="Impact, 'Arial Black', sans-serif"
      font-size="86"
      font-weight="900"
      text-anchor="middle"
      x="50"
      y="80"
    >+</text>
  </svg>
{/snippet}

{#snippet direction_svg()}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 32 A32 32 0 0 1 80 32" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="8"/>
    <polygon fill="currentColor" points="80,32 90,22 90,42"/>
    <path d="M80 68 A32 32 0 0 1 20 68" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="8"/>
    <polygon fill="currentColor" points="20,68 10,58 10,78"/>
  </svg>
{/snippet}

{#snippet breaker_svg()}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <text
      fill="#c293c6"
      font-family="Impact, 'Arial Black', sans-serif"
      font-size="86"
      font-weight="900"
      text-anchor="middle"
      x="50"
      y="86"
    >3</text>
    <text
      fill="#f6765b"
      font-family="Impact, 'Arial Black', sans-serif"
      font-size="34"
      font-weight="900"
      text-anchor="middle"
      x="24"
      y="56"
    >+</text>
    <line stroke="currentColor" stroke-linecap="round" stroke-width="6" x1="16" x2="84" y1="16" y2="84"/>
  </svg>
{/snippet}

{#snippet crown_svg()}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Crown shape -->
    <path
      d="M10 75 L10 55 L25 30 L50 55 L75 30 L90 55 L90 75 Z"
      fill="currentColor"
      stroke="rgba(0,0,0,0.18)"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <!-- Three jewels on crown points -->
    <circle cx="10"  cy="55" fill="#FFD600" r="5.5" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/>
    <circle cx="50"  cy="55" fill="#FFD600" r="5.5" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/>
    <circle cx="90"  cy="55" fill="#FFD600" r="5.5" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/>
    <!-- Base band -->
    <rect fill="rgba(0,0,0,0.18)" height="11" rx="3" width="80" x="10" y="72"/>
  </svg>
{/snippet}

{#snippet joker_svg()}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M48 60 Q26 58 8 30 Q30 44 50 52 Z" fill="#E8192C" />
    <path d="M52 60 Q74 58 92 30 Q70 44 50 52 Z" fill="#1565C0" />
    <path d="M40 58 Q42 32 56 15 Q66 34 60 58 Z" fill="#2E7D32" />
    <circle cx="8" cy="27" fill="#FFD600" r="7" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
    <circle cx="92" cy="27" fill="#FFD600" r="7" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
    <circle cx="57" cy="11" fill="#FFD600" r="7" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
    <rect fill={jokerInkColor} height="14" rx="7" width="66" x="17" y="55" />
    <text
      class="joker-label"
      fill={jokerInkColor}
      font-family="Impact, 'Arial Black', sans-serif"
      font-size={jokerLabel.length > 2 ? 26 : 34}
      font-weight="900"
      text-anchor="middle"
      x="50"
      y="97"
    >{jokerLabel}</text>
  </svg>
{/snippet}

{#snippet plus_three_svg()}
  <svg class="card-icon-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <text
      fill="#c293c6"
      font-family="Impact, 'Arial Black', sans-serif"
      font-size="86"
      font-weight="900"
      text-anchor="middle"
      x="50"
      y="86"
    >3</text>
    <text
      fill="#f6765b"
      font-family="Impact, 'Arial Black', sans-serif"
      font-size="34"
      font-weight="900"
      text-anchor="middle"
      x="35"
      y="60"
    >+</text>
  </svg>
{/snippet}

<style>
  .card-icon-svg {
    position: relative;
    z-index: 2;
    width: 76%;
    height: 76%;
    color: var(--card-color, #0d1b4b);
    filter: drop-shadow(0 2px 3px rgb(0 0 0 / 15%));

    &.taki-square-svg {
      width: auto;
      height: 86%;
    }
  }

  .card-content-wrapper {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  /* Keeps "+8" / "2–10" in reading order inside the RTL board */
  .joker-label {
    unicode-bidi: isolate;
    direction: ltr;
  }

  .card-value {
    position: relative;
    z-index: 2;
    color: var(--card-color);
    font-family: Impact, "Arial Black", sans-serif;
    font-weight: 900;
    font-size: clamp(2.4rem, 6.5vw, 4.8rem);
    line-height: 1;
    text-shadow: 1px 2px 0 rgb(0 0 0 / 12%);
  }
</style>
