<script lang="ts">
  import { locale } from "$lib/locale.svelte";
  import { type GamePlayer } from "$lib/network";
  import { randomFloat } from "$lib/utils/random";
  import { fade } from "svelte/transition";

  interface Props {
    explodedPlayerId: string;
    players: GamePlayer[];
    myId: string;
  }

  const { explodedPlayerId, players, myId }: Props = $props();

  const SHARD_COUNT  = 24;
  const SPARK_COUNT  = 26;
  const SHARD_COLORS = ["#E8192C", "#1565C0", "#2E7D32", "#FFD600"];

  type Shard = {
    angle: number;
    distance: number;
    delay: number;
    duration: number;
    spin: number;
    width: number;
    color: string;
  };

  type Spark = {
    angle: number;
    distance: number;
    delay: number;
    duration: number;
    size: number;
  };

  const shards: Shard[] = Array.from({ length: SHARD_COUNT }, (_, iShard) => ({
    angle: iShard * (360 / SHARD_COUNT) + randomFloat() * 16 - 8,
    distance: 22 + randomFloat() * 52,
    delay: randomFloat() * 0.22,
    duration: 0.85 + randomFloat() * 0.85,
    spin: randomFloat() * 860 - 430,
    width: 20 + randomFloat() * 18,
    color: SHARD_COLORS[iShard % SHARD_COLORS.length]
  }));

  const sparks: Spark[] = Array.from({ length: SPARK_COUNT }, () => ({
    angle: randomFloat() * 360,
    distance: 34 + randomFloat() * 46,
    delay: randomFloat() * 0.14,
    duration: 0.6 + randomFloat() * 0.5,
    size: 3 + randomFloat() * 5
  }));

  const explodedPlayer = $derived(players.find(player => player.id === explodedPlayerId));
  const explosionTitle = $derived(
    explodedPlayerId === myId
      ? locale.strings.youExploded
      : locale.strings.playerExploded(explodedPlayer?.name ?? "")
  );
</script>

<div class="explosion" out:fade={{ duration: 400 }}>
  <div class="explosion-scrim" aria-hidden="true"></div>
  <div class="explosion-flash" aria-hidden="true"></div>
  <div class="explosion-core" aria-hidden="true"></div>
  <div class="explosion-ring" aria-hidden="true"></div>
  <div class="explosion-ring explosion-ring-late" aria-hidden="true"></div>

  {#each sparks as spark, iSpark (iSpark)}
    <i
      style:--angle="{spark.angle}deg"
      style:--distance="{spark.distance}vmin"
      style:--delay="{spark.delay}s"
      style:--duration="{spark.duration}s"
      style:--size="{spark.size}px"
      class="explosion-spark"
      aria-hidden="true"
    ></i>
  {/each}

  {#each shards as shard, iShard (iShard)}
    <div
      style:--angle="{shard.angle}deg"
      style:--distance="{shard.distance}vmin"
      style:--delay="{shard.delay}s"
      style:--duration="{shard.duration}s"
      style:--spin="{shard.spin}deg"
      style:--width="{shard.width}px"
      style:--color={shard.color}
      class="explosion-shard"
      aria-hidden="true"
    >
      <span class="explosion-shard-oval"></span>
    </div>
  {/each}

  <div class="explosion-plate" aria-live="assertive" role="alert">
    <p class="explosion-title" dir="auto">{explosionTitle}</p>
    <p class="explosion-sub">{locale.strings.explodedSub}</p>
  </div>
</div>

<style>
  .explosion {
    position: fixed;
    inset: 0;
    z-index: 900;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    pointer-events: none;
  }

  .explosion-scrim {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 50% 50%, rgb(46 8 0 / 55%), rgb(4 2 10 / 0%) 62%),
      rgb(6 3 12 / 78%);
    backdrop-filter: blur(5px);
    animation: explosion-scrim 2.4s linear both;
  }

  @keyframes explosion-scrim {
    0%{ opacity: 0%; }
    7%{ opacity: 100%; }
    76%{ opacity: 100%; }
    100%{ opacity: 0%; }
  }

  .explosion-flash {
    position: absolute;
    inset: 0;
    background:
 radial-gradient(
      circle at 50% 50%,
      rgb(255 248 226 / 92%),
      rgb(255 152 46 / 50%) 30%,
      rgb(255 152 46 / 0%) 64%
    );
    animation: explosion-flash 0.55s ease-out both;
  }

  @keyframes explosion-flash {
    0%{ opacity: 0%; }
    9%{ opacity: 100%; }
    100%{ opacity: 0%; }
  }

  .explosion-core {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 26vmin;
    height: 26vmin;
    border-radius: 50%;
    background:
 radial-gradient(
      circle,
      #ffffff 0%,
      #ffe680 14%,
      #ffb300 32%,
      #ff6a00 52%,
      rgb(198 20 30 / 55%) 68%,
      rgb(198 20 30 / 0%) 78%
    );
    filter: blur(3px);
    animation: explosion-core 1.05s cubic-bezier(0.12, 0.78, 0.28, 1) both;
  }

  @keyframes explosion-core {
    0%{ opacity: 0%; transform: translate(-50%, -50%) scale(0.1); }
    12%{ opacity: 100%; }
    100%{ opacity: 0%; transform: translate(-50%, -50%) scale(2.9); }
  }

  .explosion-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    box-sizing: border-box;
    width: 18vmin;
    height: 18vmin;
    border: 0.7vmin solid rgb(255 209 102 / 90%);
    border-radius: 50%;
    box-shadow: 0 0 6vmin rgb(255 160 60 / 35%);
    animation: explosion-ring 1.05s cubic-bezier(0.16, 0.86, 0.24, 1) both;

    &.explosion-ring-late {
      border-color: rgb(232 25 44 / 75%);
      box-shadow: 0 0 5vmin rgb(232 25 44 / 30%);
      animation-duration: 1.3s;
      animation-delay: 0.16s;
    }
  }

  @keyframes explosion-ring {
    0%{ opacity: 95%; transform: translate(-50%, -50%) scale(0.18); }
    100%{ opacity: 0%; transform: translate(-50%, -50%) scale(5); }
  }

  .explosion-spark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    background: radial-gradient(circle, #ffffff 0%, #ffc247 45%, rgb(255 106 0 / 0%) 72%);
    animation: explosion-spark var(--duration) var(--delay) cubic-bezier(0.1, 0.75, 0.3, 1) both;
  }

  @keyframes explosion-spark {
    0% {
      opacity: 0%;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0.5);
    }

    10% {
      opacity: 100%;
    }

    100% {
      opacity: 0%;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(calc(var(--distance) * -1)) scale(1.1);
    }
  }

  .explosion-shard {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    width: var(--width);
    height: calc(var(--width) * 1.5);
    border: 1.5px solid rgb(255 255 255 / 90%);
    border-radius: 4px;
    background: var(--color);
    box-shadow: 0 3px 12px rgb(0 0 0 / 45%);
    animation: explosion-shard var(--duration) var(--delay) cubic-bezier(0.12, 0.72, 0.26, 1) both;
  }

  .explosion-shard-oval {
    width: 112%;
    height: 78%;
    border-radius: 50%;
    background: rgb(255 255 255 / 94%);
    rotate: -25deg;
  }

  @keyframes explosion-shard {
    0% {
      opacity: 0%;
      transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) rotate(0deg) scale(0.3);
    }

    10% {
      opacity: 100%;
    }

    72% {
      opacity: 100%;
    }

    100% {
      opacity: 0%;
      transform:
        translate(-50%, -50%) rotate(var(--angle))
        translateY(calc(var(--distance) * -1)) rotate(var(--spin)) scale(0.85);
    }
  }

  .explosion-plate {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    align-items: center;
    box-sizing: border-box;
    max-width: min(88vw, 30rem);
    padding: clamp(0.9rem, 3vw, 1.35rem) clamp(1.5rem, 7vw, 3rem);
    border: 1px solid rgb(255 150 60 / 42%);
    border-radius: 1.75rem;
    background: linear-gradient(180deg, rgb(38 12 6 / 94%), rgb(14 5 10 / 94%));
    box-shadow: 0 0 70px rgb(255 120 20 / 32%), 0 24px 60px rgb(0 0 0 / 55%);
    animation: explosion-plate 0.6s 0.26s cubic-bezier(0.175, 0.885, 0.32, 1.35) both;
  }

  @keyframes explosion-plate {
    0%{ opacity: 0%; scale: 0.6; }
    100%{ opacity: 100%; scale: 1; }
  }

  .explosion-title {
    margin: 0;
    color: #ffffff;
    font-weight: 900;
    font-size: clamp(1.35rem, 5.4vw, 2.4rem);
    line-height: 1.15;
    letter-spacing: 0.01em;
    text-align: center;
    text-wrap: balance;
    text-shadow: 0 0 28px rgb(255 128 24 / 70%);
  }

  .explosion-sub {
    margin: 0;
    color: rgb(255 196 140 / 85%);
    font-weight: 700;
    font-size: clamp(0.68rem, 2.2vw, 0.82rem);
    letter-spacing: 0.14em;
    text-align: center;
    text-transform: uppercase;
  }

  @media (prefers-reduced-motion: reduce) {
    @keyframes explosion-appear {
      from{ opacity: 0%; }
      to{ opacity: 100%; }
    }

    .explosion-flash,
    .explosion-core,
    .explosion-ring,
    .explosion-shard,
    .explosion-spark {
      display: none;
    }

    .explosion-scrim,
    .explosion-plate {
      animation: explosion-appear 0.3s ease-out both;
    }
  }
</style>
