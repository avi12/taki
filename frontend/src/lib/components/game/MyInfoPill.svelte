<script lang="ts">
  interface Props {
    playerName: string;
    handCount: number;
  }

  const { playerName, handCount }: Props = $props();
</script>

<div class="my-info">
  <div
    style:background="hsl({playerName.charCodeAt(0) * 37 % 360}, 65%, 35%)"
    class="my-avatar"
  >
    {playerName[0].toUpperCase()}
  </div>

  <span class="player-name" dir="auto">{playerName}</span>

  <span class="hand-count-badge">{handCount}</span>
</div>

<style>
  .my-info {
    position: fixed;
    bottom: var(--myinfo-bottom);
    left: 0;
    z-index: 50;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    align-items: center;
    padding: 0.4rem 0.8rem 0.4rem 0.5rem;
    border: 1px solid var(--my-info-border);
    border-radius: 2rem;
    background: var(--my-info-bg);
    white-space: nowrap;
    backdrop-filter: blur(12px);
    pointer-events: none;
    translate: calc(50vw - 50%);
  }

  .my-avatar {
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    color: white;
    font-weight: 700;
    font-size: 0.75rem;
    text-shadow: 0 1px 3px rgb(0 0 0 / 50%);
  }

  .player-name {
    color: var(--text);
    font-weight: 800;
    font-size: clamp(0.75rem, 2vw, 0.95rem);
  }

  .hand-count-badge {
    padding: 0.1rem 0.45rem;
    border: 1px solid var(--badge-border);
    border-radius: 2rem;
    background: var(--badge-bg);
    color: var(--text-muted);
    font-weight: 700;
    font-size: 0.8rem;
  }
</style>
