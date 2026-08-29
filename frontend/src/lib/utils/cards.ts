import {
  CardColor,
  CardValue,
  isDrawPenaltyCard,
  type Card,
  type GameState
} from "@taki/shared";

export function getCardColorHex(color: CardColor) {
  const map: Record<CardColor, string> = {
    [CardColor.Red]: "#E8192C",
    [CardColor.Blue]: "#1565C0",
    [CardColor.Green]: "#2E7D32",
    [CardColor.Yellow]: "#FFD600",
    [CardColor.None]: "#0d1b4b"
  };
  return map[color] || "#0d1b4b";
}

export function getCardColorDark(color: CardColor) {
  const map: Record<CardColor, string> = {
    [CardColor.Red]: "#a00f1c",
    [CardColor.Blue]: "#0d3d7a",
    [CardColor.Green]: "#1b4d20",
    [CardColor.Yellow]: "#C8A800",
    [CardColor.None]: "#060e2a"
  };
  return map[color] || "#060e2a";
}

// Deterministic rotation derived from card ID — same result on every client
export function cardDealRotation(id: number) {
  const magnitude = (id % 13) + 3; // 3–15 degrees
  return id % 2 === 0 ? magnitude : -magnitude;
}

export function isActionCard(val: CardValue) {
  return val !== CardValue.One
    && val !== CardValue.Three
    && val !== CardValue.Four
    && val !== CardValue.Five
    && val !== CardValue.Six
    && val !== CardValue.Seven
    && val !== CardValue.Eight
    && val !== CardValue.Nine;
}

export enum CardEffect {
  Taki             = "taki",
  SuperTaki        = "supertaki",
  PlusTwo          = "plus-two",
  PlusSix          = "plus-six",
  PlusTen          = "plus-ten",
  Stop             = "stop",
  Plus             = "plus",
  Direction        = "direction",
  PlusThree        = "plus-three",
  PlusThreeBreaker = "breaker",
  ChangeColor      = "change-color",
  Crown            = "crown",
  PlusFour         = "plus-four",
  Joker            = "joker",
  Number           = "number"
}

export function getCardEffect(val: CardValue) {
  switch (val) {
    case CardValue.Taki:             return CardEffect.Taki;
    case CardValue.SuperTaki:        return CardEffect.SuperTaki;
    case CardValue.PlusTwo:          return CardEffect.PlusTwo;
    case CardValue.PlusSix:          return CardEffect.PlusSix;
    case CardValue.PlusTen:          return CardEffect.PlusTen;
    case CardValue.Stop:             return CardEffect.Stop;
    case CardValue.Plus:             return CardEffect.Plus;
    case CardValue.Direction:        return CardEffect.Direction;
    case CardValue.PlusThree:        return CardEffect.PlusThree;
    case CardValue.PlusThreeBreaker: return CardEffect.PlusThreeBreaker;
    case CardValue.ChangeColor:      return CardEffect.ChangeColor;
    case CardValue.Crown:            return CardEffect.Crown;
    case CardValue.PlusFour:         return CardEffect.PlusFour;
    case CardValue.Joker:            return CardEffect.Joker;
    default:                         return CardEffect.Number;
  }
}

const COLOR_ORDER: Record<CardColor, number> = {
  [CardColor.Red]: 0,
  [CardColor.Blue]: 1,
  [CardColor.Green]: 2,
  [CardColor.Yellow]: 3,
  [CardColor.None]: 4
};

const VALUE_SORT_ORDER: CardValue[] = [
  CardValue.One,
  CardValue.Three,
  CardValue.Four,
  CardValue.Five,
  CardValue.Six,
  CardValue.Seven,
  CardValue.Eight,
  CardValue.Nine,
  CardValue.Plus,
  CardValue.Stop,
  CardValue.PlusTwo,
  CardValue.PlusSix,
  CardValue.PlusTen,
  CardValue.Taki,
  CardValue.Direction,
  CardValue.ChangeColor,
  CardValue.SuperTaki,
  CardValue.PlusThree,
  CardValue.PlusThreeBreaker,
  CardValue.Crown,
  CardValue.PlusFour,
  CardValue.Joker
];

const VALUE_ORDER = new Map<CardValue, number>(
  VALUE_SORT_ORDER.map((value, iValue) => [value, iValue])
);

export function sortHand(cards: Card[]) {
  return [...cards].sort((left, right) => {
    const colorDiff = COLOR_ORDER[left.color] - COLOR_ORDER[right.color];
    return colorDiff !== 0
      ? colorDiff
      : (VALUE_ORDER.get(right.value) ?? 99) - (VALUE_ORDER.get(left.value) ?? 99);
  });
}

export function canPlayCard(card: Card, gameState: GameState, playerId: string, hand: Card[]) {
  if (gameState.eliminatedPlayers?.includes(playerId)) {
    return false;
  }

  if (gameState.pendingPlusThree) {
    const pending = gameState.pendingPlusThree;
    if (playerId === pending.fromId) {
      return false;
    }

    if (!pending.waiting.includes(playerId)) {
      return false;
    }

    return card.value === CardValue.PlusThreeBreaker && pending.isBreakable;
  }

  const isMyTurn = gameState.players[gameState.iCurrentPlayer].id === playerId;
  if (!isMyTurn) {
    return false;
  }

  const top = gameState.discardPile[gameState.discardPile.length - 1];
  if (!top) {
    return false;
  }

  const activeTaki = gameState.activeTakiColor;
  if (activeTaki !== null && !gameState.isSuperTakiActive) {
    return card.color === activeTaki || card.value === CardValue.ChangeColor;
  }

  if (card.value === CardValue.Crown) {
    return true;
  }

  if (gameState.isCrownActive) {
    return true;
  }

  if (gameState.drawPenaltyValue > 0) {
    return isDrawPenaltyCard(card.value);
  }

  if (card.value === CardValue.PlusThreeBreaker) {
    return true;
  }

  if (card.value === CardValue.PlusFour) {
    if (gameState.isSuperTakiActive) {
      return false;
    }

    const activeColor = activeTaki ?? top.color;
    const hasActiveColorCard = hand.some(handCard => handCard.id !== card.id && handCard.color === activeColor);
    if (hasActiveColorCard) {
      return false;
    }

    function isOtherPlayableColorCard(handCard: Card) {
      return handCard.id !== card.id
        && handCard.color !== CardColor.None
        && canPlayCard(handCard, gameState, playerId, hand);
    }

    return !hand.some(isOtherPlayableColorCard);
  }

  const isWild = card.value === CardValue.ChangeColor
    || card.value === CardValue.SuperTaki
    || card.value === CardValue.PlusThree
    || card.value === CardValue.Joker;
  if (isWild) {
    return !gameState.isSuperTakiActive;
  }

  if (activeTaki !== null) {
    return card.color === activeTaki;
  }

  if (card.color === top.color) {
    return true;
  }

  return card.value === top.value;
}

export function getBestColorForHand(hand: Card[], excludeCardId: number) {
  const counts: Partial<Record<CardColor, number>> = {};
  for (const card of hand) {
    if (card.id !== excludeCardId && card.color !== CardColor.None) {
      counts[card.color] = (counts[card.color] ?? 0) + 1;
    }
  }

  const colors: CardColor[] = [CardColor.Red, CardColor.Blue, CardColor.Green, CardColor.Yellow];
  return colors.reduce(
    (best, color) => (counts[color] ?? 0) > (counts[best] ?? 0) ? color : best,
    colors[0]
  );
}
