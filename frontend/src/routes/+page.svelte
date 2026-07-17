<script lang="ts">
  import { CardColor, CardValue, type Card, type GameState } from "@taki/shared";
  import ColorPicker from "$lib/components/cards/ColorPicker.svelte";
  import GameBoard from "$lib/components/game/GameBoard.svelte";
  import LanguageToggle from "$lib/components/LanguageToggle.svelte";
  import Lobby from "$lib/components/lobby/Lobby.svelte";
  import KickedOverlay from "$lib/components/overlays/KickedOverlay.svelte";
  import PlusThreeOverlay from "$lib/components/overlays/PlusThreeOverlay.svelte";
  import ReconnectDialog from "$lib/components/overlays/ReconnectDialog.svelte";
  import { locale } from "$lib/locale.svelte";
  import { GameNetwork } from "$lib/network";
  import {
    STORAGE_KEY_CLIENT_ROOM_ID,
    STORAGE_KEY_HOST_ROOM_ID,
    STORAGE_KEY_PLAYER_NAME,
    STORAGE_KEY_STORAGE_ID
  } from "$lib/storage";
  import { canPlayCard, getBestColorForHand, sortHand } from "$lib/utils/cards";
  import { isNameAvailable } from "$lib/utils/players";
  import { onMount } from "svelte";
  import { cubicIn } from "svelte/easing";
  import { fade, fly, type TransitionConfig } from "svelte/transition";

  const DRAWN_CARD_EXEMPT_DURATION_MS = 1800;
  const COPY_FEEDBACK_DURATION_MS     = 2000;

  const network = new GameNetwork();
  let gameRoomState = $state<GameState | null>(null);
  let hand = $state<Card[]>([]);
  let myId = $state<string>("");
  let playerName = $state<string>("");

  let roomIdInput = $state<string>("");
  let isJoiningViaLink = $state<boolean>(false);
  let isInLobby = $state<boolean>(true);
  let isHost = $state<boolean>(false);
  let shareUrl = $state<string>("");
  let isCopied = $state<boolean>(false);

  let storageId = $state<string>("");
  let isShareAvailable = $state<boolean>(false);

  let isColorPickerVisible = $state<boolean>(false);
  let currentWildCardId = $state<number | null>(null);
  let hoveredPickerColor = $state<CardColor | null>(null);

  $effect(() => {
    if (!isColorPickerVisible || !gameRoomState) {
      return;
    }

    const isMyTurn = gameRoomState.players[gameRoomState.iCurrentPlayer].id === myId;
    if (!isMyTurn) {
      isColorPickerVisible = false;
      currentWildCardId = null;
    }
  });

  const isPlusThreeRecipient = $derived(
    !!gameRoomState?.pendingPlusThree
    && gameRoomState.pendingPlusThree.fromId !== myId
    && gameRoomState.pendingPlusThree.waiting.includes(myId)
  );
  const isPlusThreeBreakerAvailable = $derived(
    isPlusThreeRecipient
    && !!gameRoomState?.pendingPlusThree?.isBreakable
    && hand.some(card => card.value === CardValue.PlusThreeBreaker)
  );
  let isJoining = $state<boolean>(false);
  let joinErrorMessage = $state<string | null>(null);
  let isReconnecting = $state<boolean>(false);
  let reconnectErrorMessage = $state<string | undefined>(undefined);
  let isKicked = $state<boolean>(false);

  let lastDrawnCardId = $state<number | null>(null);
  let newlyDrawnExemptId = $state<number | null>(null);

  function lobbyExitTransition(node: Element): TransitionConfig {
    if (isReconnecting) {
      return fade(node, { duration: 300 });
    }

    return fly(node, {
      y: -600,
      duration: 500,
      easing: cubicIn
    });
  }

  function isCardPlayable(card: Card): boolean {
    if (!gameRoomState) {
      return false;
    }

    return canPlayCard(card, gameRoomState, myId, hand);
  }

  onMount(() => {
    network.onStateUpdate = (newState, newHand) => {
      // Detect newly drawn cards (not in previous hand)
      const prevIds = new Set(hand.map(card => card.id));
      const drawn = newHand.find(card => !prevIds.has(card.id));
      if (drawn) {
        lastDrawnCardId = drawn.id;
        newlyDrawnExemptId = drawn.id;
        setTimeout(() => {
          newlyDrawnExemptId = null;
        }, DRAWN_CARD_EXEMPT_DURATION_MS);
      }

      const { discardPile, players } = newState;
      gameRoomState = newState;
      hand = sortHand(newHand);
      isInLobby = discardPile.length === 0;

      const myPlayer = players.find(player => player.id === myId);
      if (myPlayer && myPlayer.name !== playerName) {
        const { name } = myPlayer;
        playerName = name;
        localStorage.setItem(STORAGE_KEY_PLAYER_NAME, name);
      }
    };

    network.onConnectionChange = (connected, error) => {
      isReconnecting = !connected;
      reconnectErrorMessage = error;

      if (connected) {
        myId = network.id;
      }
    };

    network.onKicked = () => {
      isKicked = true;
    };

    const hash = location.hash.slice(1);
    const savedHostRoomId   = localStorage.getItem(STORAGE_KEY_HOST_ROOM_ID);
    const savedClientRoomId = localStorage.getItem(STORAGE_KEY_CLIENT_ROOM_ID);

    const savedStorageId = localStorage.getItem(STORAGE_KEY_STORAGE_ID);
    if (savedStorageId) {
      storageId = savedStorageId;
    } else {
      storageId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY_STORAGE_ID, storageId);
    }

    if (hash && hash === savedHostRoomId) {
      roomIdInput = hash;
      const savedName = localStorage.getItem(STORAGE_KEY_PLAYER_NAME);
      if (savedName) {
        playerName = savedName;
      }

      void rejoinAsHost();
    } else if (hash && hash === savedClientRoomId) {
      roomIdInput = hash;
      isJoiningViaLink = true;
      const savedName = localStorage.getItem(STORAGE_KEY_PLAYER_NAME);
      if (savedName) {
        playerName = savedName;
      }

      void joinGame();
    } else if (hash) {
      roomIdInput = hash;
      isJoiningViaLink = true;
      void network.startPeeking(hash);
    }

    if ("share" in navigator) {
      isShareAvailable = true;
    }
  });

  async function hostGame(): Promise<void> {
    try {
      const generatedId = Math.random().toString(36).substring(2, 9);
      roomIdInput = generatedId;

      localStorage.setItem(STORAGE_KEY_HOST_ROOM_ID, generatedId);
      localStorage.setItem(STORAGE_KEY_PLAYER_NAME, playerName);

      myId = await network.initHost(playerName, generatedId, storageId);
      isHost = true;
      history.replaceState(null, "", "#" + myId);
      shareUrl = location.origin + location.pathname + "#" + myId;
    } catch (err) {
      console.error(err);
    }
  }

  async function rejoinAsHost(): Promise<void> {
    isReconnecting = true;
    myId = roomIdInput;

    try {
      myId = await network.initHost(playerName, roomIdInput, storageId);
      isHost = true;
      isReconnecting = false;
      shareUrl = location.origin + location.pathname + "#" + myId;
    } catch (err) {
      isReconnecting = false;
      localStorage.removeItem(STORAGE_KEY_HOST_ROOM_ID);
      console.error("Failed to rejoin as host:", err);
    }
  }

  async function joinGame(): Promise<void> {
    network.stopPeeking();
    isJoining = true;
    joinErrorMessage = null;
    try {
      if (roomIdInput) {
        const connecting = network.initClient(roomIdInput, playerName, storageId);
        myId = network.id;
        await connecting;
        localStorage.setItem(STORAGE_KEY_CLIENT_ROOM_ID, roomIdInput);
        localStorage.setItem(STORAGE_KEY_PLAYER_NAME, playerName);
      }
    } catch (err) {
      console.error(err);
      isJoining = false;
      joinErrorMessage = locale.strings.joinFailed;
      localStorage.removeItem(STORAGE_KEY_CLIENT_ROOM_ID);
    }
  }

  function playCard(card: Card): void {
    const isRespondingToPlusThree = card.value === CardValue.PlusThreeBreaker && !!gameRoomState?.pendingPlusThree;
    if (isRespondingToPlusThree) {
      network.sendPlayPlusThreeBreaker(card.id);
      return;
    }

    if (gameRoomState?.players[gameRoomState.iCurrentPlayer].id !== myId) {
      return;
    }

    if (card.value === CardValue.ChangeColor || card.value === CardValue.PlusFour) {
      currentWildCardId = card.id;
      isColorPickerVisible = true;
      return;
    }

    network.sendPlayCard(card.id);
  }

  function pickColor(color: CardColor): void {
    if (currentWildCardId) {
      network.sendPlayCard(currentWildCardId, color);
      currentWildCardId = null;
    }
  }

  function closeColorPicker(): void {
    isColorPickerVisible = false;
  }

  function drawCard(): void {
    if (gameRoomState?.eliminatedPlayers?.includes(myId)) {
      return;
    }

    const isAcceptingPlusThree = isPlusThreeRecipient && !isPlusThreeBreakerAvailable;
    if (isAcceptingPlusThree) {
      network.sendAcceptPlusThree();
      return;
    }

    if (gameRoomState?.players[gameRoomState.iCurrentPlayer].id === myId) {
      network.sendDrawCard();
    }
  }

  function closeTaki(): void {
    if (gameRoomState?.players[gameRoomState.iCurrentPlayer].id === myId) {
      network.sendCloseTaki();
    }
  }

  function pendingCardPlay(card: Card): void {
    if (card.value === CardValue.ChangeColor || card.value === CardValue.PlusFour) {
      network.sendPlayCard(card.id, getBestColorForHand(hand, card.id));
      return;
    }

    network.sendPlayCard(card.id);
  }

  function startGame(): void {
    if (isHost) {
      network.sendStartGame();
    }
  }

  async function shareGame(): Promise<void> {
    if (isShareAvailable) {
      try {
        await navigator.share({
          title: locale.strings.shareTitle,
          text: locale.strings.shareText,
          url: shareUrl
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      isCopied = true;
      setTimeout(() => (isCopied = false), COPY_FEEDBACK_DURATION_MS);
    }
  }

  function skipDisconnected(): void {
    network.skipDisconnectedPlayer();
  }

  function kickPlayer(playerId: string): void {
    network.kickPlayer(playerId);
  }

  function leaveAfterKick(): void {
    isKicked = false;
    localStorage.removeItem(STORAGE_KEY_CLIENT_ROOM_ID);
    location.hash = "";
    location.reload();
  }
</script>

<!-- ═══════════════════════════════ HTML ═══════════════════════════════ -->

<svelte:head>
  <title>טאקי</title>
</svelte:head>

<LanguageToggle />
<main dir={locale.lang === "he" ? "rtl" : "ltr"}>
  <!-- ─── GAME BOARD ─── -->
  {#if !isInLobby && gameRoomState}
    <GameBoard
      canPlayCard={isCardPlayable}
      {gameRoomState}
      {hand}
      {hoveredPickerColor}
      {isColorPickerVisible}
      {isHost}
      {isPlusThreeBreakerAvailable}
      {isPlusThreeRecipient}
      {lastDrawnCardId}
      {myId}
      {newlyDrawnExemptId}
      onCancelRename={() => network.sendCancelRename()}
      onCloseTaki={closeTaki}
      onDrawCard={drawCard}
      onHoldTurn={isHeld => network.holdDisconnectedTurn(isHeld)}
      onKickPlayer={kickPlayer}
      onLastDrawnCardIntroEnd={() => (lastDrawnCardId = null)}
      onPendingCardPlay={pendingCardPlay}
      onPlayCard={playCard}
      onPreviewName={name => network.sendPreviewName(name)}
      onRename={name => {
        const isValidRename = !!gameRoomState && isNameAvailable(gameRoomState.players, myId, name);
        if (!isValidRename) {
          return;
        }

        playerName = name;
        localStorage.setItem(STORAGE_KEY_PLAYER_NAME, name);
        network.sendRename(name);
      }}
      onRenamePlayer={(targetId, name) => network.hostRenamePlayer(targetId, name)}
      onSkipDisconnected={skipDisconnected}
      onStartGame={startGame}
      {playerName}
    />
  {/if}

  <!-- ─── LOBBY (overlays game board, flies out on game start) ─── -->
  {#if isInLobby}
    <div class="lobby-overlay" out:lobbyExitTransition>
      <Lobby
        {gameRoomState}
        {isCopied}
        {isHost}
        {isJoiningViaLink}
        {isShareAvailable}
        {joinErrorMessage}
        {myId}
        onCancelRename={() => network.sendCancelRename()}
        onClearLink={() => {
          isJoiningViaLink = false;
          roomIdInput = "";
          location.hash = "";
        }}
        onCopyUrl={async () => {
          await navigator.clipboard.writeText(shareUrl);
          isCopied = true;
          setTimeout(() => (isCopied = false), COPY_FEEDBACK_DURATION_MS);
        }}
        onHostGame={hostGame}
        onJoinGame={joinGame}
        onKickPlayer={kickPlayer}
        onPreviewName={name => network.sendPreviewName(name)}
        onRename={name => {
          if (!gameRoomState || !isNameAvailable(gameRoomState.players, myId, name)) {
            return;
          }

          playerName = name;
          localStorage.setItem(STORAGE_KEY_PLAYER_NAME, name);
          network.sendRename(name);
        }}
        onReorderPlayers={playerIds => network.reorderPlayers(playerIds)}
        onShareGame={shareGame}
        onStartGame={startGame}
        onToggleNoMercyMode={enabled => network.setNoMercyMode(enabled)}
        {roomIdInput}
        {shareUrl}
        bind:isJoining
        bind:playerName
      />
    </div>
  {/if}
</main>

<!-- Color picker overlay -->
{#if isColorPickerVisible}
  <ColorPicker
    {hand}
    isAllColorsEqual={hand.find(card => card.id === currentWildCardId)?.value === CardValue.PlusFour}
    onclosed={closeColorPicker}
    onhover={color => {
      hoveredPickerColor = color;
    }}
    onpick={pickColor}
  />
{/if}

<!-- +3 overlay: fullscreen action card for recipients, waiting banner for sender -->
{#if gameRoomState?.pendingPlusThree && !isInLobby && !gameRoomState.winner}
  <PlusThreeOverlay
    {hand}
    {myId}
    onaccept={() => network.sendAcceptPlusThree()}
    onbreaker={cardId => network.sendPlayPlusThreeBreaker(cardId)}
    pendingPlusThree={gameRoomState.pendingPlusThree}
    players={gameRoomState.players}
  />
{/if}

<!-- Kicked overlay -->
{#if isKicked}
  <KickedOverlay onLeave={leaveAfterKick} />
{/if}

<!-- Reconnect overlay (client lost connection / host rejoining) -->
{#if isReconnecting}
  <ReconnectDialog errorMessage={reconnectErrorMessage} />
{/if}

<!-- ═══════════════════════════════ STYLES ═══════════════════════════════ -->
<style>
  @import url("https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&family=Roboto:wght@300;400;500;700;900&display=swap");

  /* ── Design Tokens — Light mode defaults ── */
  :root {
    --red: #e8192c;
    --blue: #1565c0;
    --green: #2e7d32;
    --yellow: #b45309;
    --navy: #0d1b4b;

    /* Backgrounds */
    --body-bg: #dde5f5;
    --bg-game: radial-gradient(ellipse at 50% 0%, #d8e4f8 0%, #b8ccee 70%);
    --bg-lobby: radial-gradient(circle at 40% 30%, #cddaf8 0%, #dde5f5 100%);

    /* Glass layer */
    --glass: rgb(255 255 255 / 70%);
    --glass-border: rgb(0 0 0 / 8%);
    --text: #0f172a;
    --text-muted: rgb(15 23 42 / 65%);

    /* Shadows */
    --card-shadow: 0 12px 32px rgb(0 0 0 / 18%), 0 4px 8px rgb(0 0 0 / 10%);
    --card-hover-shadow: 0 24px 48px rgb(0 0 0 / 22%), 0 8px 16px rgb(0 0 0 / 14%);

    /* Panels */
    --panel-bg: rgb(255 255 255 / 82%);
    --panel-shadow: 0 32px 80px rgb(0 0 0 / 10%), inset 0 1px 0 rgb(255 255 255 / 90%);

    /* Inputs */
    --input-bg: rgb(0 0 0 / 4%);
    --input-border: rgb(0 0 0 / 10%);
    --input-placeholder: rgb(0 0 0 / 30%);
    --divider-line: rgb(0 0 0 / 8%);
    --list-border: rgb(0 0 0 / 7%);

    /* Chips / sections */
    --chip-bg: rgb(0 0 0 / 4%);
    --chip-border: rgb(0 0 0 / 7%);
    --section-bg: rgb(0 0 0 / 4%);
    --section-border: rgb(0 0 0 / 7%);
    --share-btn-bg: rgb(0 0 0 / 4%);
    --share-btn-border: rgb(0 0 0 / 9%);

    /* Game board elements */
    --opponent-bg: rgb(0 0 0 / 5%);
    --opponent-border: rgb(0 0 0 / 8%);
    --card-back-oval-bg: rgb(255 255 255 / 20%);
    --card-back-oval-border: rgb(255 255 255 / 35%);
    --badge-bg: rgb(0 0 0 / 7%);
    --badge-border: rgb(0 0 0 / 10%);
    --waiting-bg: rgb(0 0 0 / 8%);
    --waiting-color: rgb(15 23 42 / 65%);
    --direction-arrow: rgb(15 23 42 / 35%);

    /* Overlays */
    --my-info-bg: rgb(255 255 255 / 75%);
    --my-info-border: rgb(0 0 0 / 7%);
    --winner-content-bg: rgb(255 255 255 / 97%);
    --winner-subtitle-color: rgb(15 23 42 / 55%);
    --picker-card-bg: rgb(255 255 255 / 99%);
    --picker-card-border: rgb(0 0 0 / 8%);
    --picker-title-color: #0f172a;

    /* Deco */
    --deco-border: rgb(0 0 0 / 10%);
    --deco-opacity: 0.28;

    /* ── Fluid responsive sizing ── */
    --card-w: clamp(80px, 18vw, 140px);
    --card-h: calc(var(--card-w) * 1.55);
    --card-br: clamp(10px, 2.5vw, 18px);
    --hand-overlap: clamp(-60px, -6.67vw, -34px);
    --game-pad-bottom: calc(var(--card-h) + 50px);
    --myinfo-bottom: calc(var(--card-h) + 20px);
  }

  /* ── Portrait phone: increase card size for touch targets ── */
  @media (width <= 600px) and (orientation: portrait) {
    :root {
      --card-w: clamp(88px, 22vw, 120px);
    }
  }

  /* ── Landscape phone: switch to height-based card sizing ── */
  @media (orientation: landscape) and (height <= 500px) {
    :root {
      --card-w: clamp(55px, 13vh, 90px);
      --hand-overlap: clamp(-50px, -5.5vh, -28px);
    }
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --yellow: #ffd600;
      --body-bg: #0a0f1e;
      --bg-game: radial-gradient(ellipse at 50% 0%, #1a2744 0%, #0a0f1e 70%);
      --bg-lobby: radial-gradient(circle at 40% 30%, #1c2a5e 0%, #0a0f1e 100%);
      --glass: rgb(255 255 255 / 7%);
      --glass-border: rgb(255 255 255 / 12%);
      --text: #f0f4ff;
      --text-muted: rgb(240 244 255 / 55%);
      --card-shadow: 0 12px 32px rgb(0 0 0 / 55%), 0 4px 8px rgb(0 0 0 / 40%);
      --card-hover-shadow: 0 24px 48px rgb(0 0 0 / 65%), 0 8px 16px rgb(0 0 0 / 50%);
      --panel-bg: rgb(10 15 40 / 75%);
      --panel-shadow: 0 32px 80px rgb(0 0 0 / 60%), inset 0 1px 0 rgb(255 255 255 / 8%);
      --input-bg: rgb(255 255 255 / 6%);
      --input-border: rgb(255 255 255 / 12%);
      --input-placeholder: rgb(255 255 255 / 25%);
      --divider-line: rgb(255 255 255 / 10%);
      --list-border: rgb(255 255 255 / 8%);
      --chip-bg: rgb(255 255 255 / 4%);
      --chip-border: rgb(255 255 255 / 7%);
      --section-bg: rgb(255 255 255 / 4%);
      --section-border: rgb(255 255 255 / 8%);
      --share-btn-bg: rgb(255 255 255 / 5%);
      --share-btn-border: rgb(255 255 255 / 10%);
      --opponent-bg: rgb(255 255 255 / 4%);
      --opponent-border: rgb(255 255 255 / 8%);
      --card-back-oval-bg: rgb(255 255 255 / 10%);
      --card-back-oval-border: rgb(255 255 255 / 20%);
      --badge-bg: rgb(255 255 255 / 12%);
      --badge-border: rgb(255 255 255 / 15%);
      --waiting-bg: rgb(0 0 0 / 40%);
      --waiting-color: rgb(255 255 255 / 55%);
      --direction-arrow: rgb(255 255 255 / 60%);
      --my-info-bg: rgb(0 0 0 / 50%);
      --my-info-border: rgb(255 255 255 / 8%);
      --winner-content-bg: linear-gradient(135deg, rgb(15 20 50 / 95%), rgb(5 8 25 / 98%));
      --winner-subtitle-color: rgb(255 255 255 / 60%);
      --picker-card-bg: linear-gradient(135deg, rgb(15 20 50 / 98%), rgb(5 8 25 / 99%));
      --picker-card-border: rgb(255 255 255 / 10%);
      --picker-title-color: #ffffff;
      --deco-border: rgb(255 255 255 / 15%);
      --deco-opacity: 0.18;
    }
  }

  /* ── Reset & Base ── */
  :global(body) {
    overflow: hidden;
    margin: 0;
    background: var(--body-bg);
    color: var(--text);
    font-family: Heebo, Roboto, sans-serif;
    font-weight: 400;
    touch-action: none;
    transition: background 0.3s ease, color 0.3s ease;
  }

  :global(button, input, select, textarea) {
    font-family: inherit;
  }

  main {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    min-height: 100dvh;
    padding: 1rem;
    background: var(--bg-lobby);
  }

  .lobby-overlay {
    position: fixed;
    inset: 0;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-y: auto;
    box-sizing: border-box;
    padding: 1rem;
    background: var(--bg-lobby);
    touch-action: auto;
  }
</style>
