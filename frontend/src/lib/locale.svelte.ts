export type Locale = "he" | "en";

function getInitialLocale() {
  const saved = localStorage.getItem("taki_locale");
  if (saved === "he" || saved === "en") {
    return saved;
  }

  if (navigator.language.startsWith("he")) {
    return "he";
  }

  return "en";
}

const heStrings = {
  yourName: "השם שלך:",
  createRoom: "צור חדר חדש",
  joiningRoom: "מצטרף לחדר: ",
  connecting: "מתחבר...",
  joinGame: "הצטרף למשחק",
  or: "או",
  clearLink: "מחק קישור וצור חדר משלך",
  noMercyActive: "⚡ ללא רחמים פעיל — 25 קלפים = פיצוץ",
  noMercy: "ללא רחמים",
  noMercySub: "שחקן עם 25 קלפים מתפוצץ ויוצא מהסיבוב",
  noMercyAriaLabel: "מצב ללא רחמים",
  startGame: "התחל משחק",
  yourTurn: "התור שלך!",
  waitingFor: {
    before: "ממתין ל-",
    after: "..."
  },
  disconnected: "⚠️ מנותק:",
  skipTo: (name: string) => `דלג אל ${name}`,
  kickDisconnected: "הוצא",
  holdTurn: "החזק תור",
  releaseTurn: "שחרר תור",
  cards: "קלפים",
  exploded: "פוצץ",
  red: "אדום",
  yellow: "צהוב",
  green: "ירוק",
  blue: "כחול",
  won: "ניצח/ה!",
  changeName: "שנה שם",
  newNamePlaceholder: "שם חדש",
  playAgain: "שחק שוב",
  waitingForHost: {
    before: "ממתין ל-",
    after: " להתחיל את הסיבוב הבא"
  },
  inviteFriends: "הזמן חברים:",
  copied: "הועתק! ✓",
  copy: "העתק 📋",
  share: "שתף",
  playersInRoom: "שחקנים בחדר",
  host: "מארח",
  you: "(את/ה)",
  kickPlayer: "בעט שחקן",
  movePlayerUp: "הזז שחקן למעלה",
  movePlayerDown: "הזז שחקן למטה",
  confirmRename: "אשר שם",
  cancelRename: "בטל",
  kickedTitle: "הוצאת מהחדר",
  kickedBody: "המארח הסיר אותך מהמשחק",
  backHome: "חזור לדף הבית",
  reconnecting: "מתחבר מחדש...",
  peekingWaiting: (count: number) => count === 1 ? "שחקן אחד ממתין להצטרף" : `${count} שחקנים ממתינים להצטרף`,
  joinFailed: "ההתחברות נכשלה. בדוק את החיבור ונסה שוב.",
  cardsExploded: "הקלפים שלך התפוצצו!",
  playerExploded: (name: string) => `${name} התפוצץ/ה!`,
  youExploded: "התפוצצת!",
  explodedSub: "25 קלפים — מחוץ לסיבוב",
  takiActive: "טאקי פעיל!",
  closeTaki: "סגור טאקי ›",
  plusThreePlayed: (name: string) => `${name} שיחק +3!`,
  plusThreeSub: "כל שחקן אחר חייב למשוך 3 קלפים",
  plusThreeMustDraw: "משוך 3 קלפים מהחפיסה",
  plusThreeCanBlock: "שחק קלף בלוק או משוך 3",
  playBlock: "שחק בלוק +3",
  youDontHave: "(אין בידך)",
  acceptDraw3: "קבל — משוך 3 קלפים",
  waitingResponses: (count: number) => `ממתין לתגובות שחקנים... (${count} נותרו)`,
  waitingForRename: (name: string, count: number) => `${name} ${count > 1 ? "משנים" : "משנה"} שם...`,
  jokerRollTitle: "ג׳וקר!",
  jokerRollPrompt: "הקש/י על הקובייה כדי להטיל",
  jokerRolling: "מתגלגלת...",
  jokerRollResult: (count: number) => `השחקן הבא ימשוך ${count} קלפים`,
  jokerRollAriaLabel: "הטל קובייה",
  discardPile: "ערימת זריקה",
  dropHere: "זרוק כאן",
  shareTitle: "בוא לשחק טאקי!",
  shareText: "הצטרף לחדר שלי בטאקי",
  drawCard: "משוך קלף",
  drawCardWithPenalty: (count: number) => `משוך ${count} קלפים (+${count})`,
  getCardAriaLabel(color: string, value: string) {
    const colorNames: Record<string, string> = {
      red: "אדום",
      yellow: "צהוב",
      green: "ירוק",
      blue: "כחול"
    };
    const valueNames: Record<string, string> = {
      1: "1",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      8: "8",
      9: "9",
      "+2": "+2",
      "+6": "+6",
      "+10": "+10",
      stop: "עצור",
      taki: "טאקי",
      change_color: "שנה צבע",
      "+": "+",
      direction: "הפיכון",
      super_taki: "סופר טאקי",
      "+3": "+3",
      "+3_block": "בלוק +3",
      crown: "כתר",
      "+4": "+4",
      joker: "ג׳וקר"
    };
    const colorLabel = colorNames[color];
    return colorLabel ? `${colorLabel} ${valueNames[value] ?? value}` : (valueNames[value] ?? value);
  }
};

const enStrings: typeof heStrings = {
  yourName: "Your name:",
  createRoom: "Create a new room",
  joiningRoom: "Joining room: ",
  connecting: "Connecting...",
  joinGame: "Join game",
  or: "or",
  clearLink: "Delete link and create your own room",
  noMercyActive: "⚡ No mercy active — 25 cards = eliminated",
  noMercy: "No mercy",
  noMercySub: "A player with 25 cards is eliminated from the round",
  noMercyAriaLabel: "No mercy mode",
  startGame: "Start game",
  yourTurn: "Your turn!",
  waitingFor: {
    before: "Waiting for ",
    after: "..."
  },
  disconnected: "⚠️ Disconnected:",
  skipTo: name => `Skip to ${name}`,
  kickDisconnected: "Kick",
  holdTurn: "Hold turn",
  releaseTurn: "Release turn",
  cards: "cards",
  exploded: "Out",
  red: "Red",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  won: "Won!",
  changeName: "Change name",
  newNamePlaceholder: "New name",
  playAgain: "Play again",
  waitingForHost: {
    before: "Waiting for ",
    after: " to start the next round"
  },
  inviteFriends: "Invite friends:",
  copied: "Copied! ✓",
  copy: "Copy 📋",
  share: "Share",
  playersInRoom: "Players in room",
  host: "Host",
  you: "(You)",
  kickPlayer: "Kick player",
  movePlayerUp: "Move player up",
  movePlayerDown: "Move player down",
  confirmRename: "Confirm name",
  cancelRename: "Cancel",
  kickedTitle: "Kicked from room",
  kickedBody: "The host removed you from the game",
  backHome: "Back to home",
  reconnecting: "Reconnecting...",
  peekingWaiting: (count: number) => count === 1 ? "1 player waiting to join" : `${count} players waiting to join`,
  joinFailed: "Failed to connect. Check your connection and try again.",
  cardsExploded: "Your cards exploded!",
  playerExploded: name => `${name} exploded!`,
  youExploded: "You exploded!",
  explodedSub: "25 cards — out for this round",
  takiActive: "Taki active!",
  closeTaki: "Close Taki ›",
  plusThreePlayed: name => `${name} played +3!`,
  plusThreeSub: "Every other player must draw 3 cards",
  plusThreeMustDraw: "Draw 3 cards from the pile",
  plusThreeCanBlock: "Play your block card or draw 3",
  playBlock: "Play +3 Block",
  youDontHave: "(You don't have it)",
  acceptDraw3: "Accept — Draw 3 cards",
  waitingResponses: count => `Waiting for responses... (${count} left)`,
  waitingForRename: (name: string, count: number) => `${name} ${count > 1 ? "are" : "is"} renaming...`,
  jokerRollTitle: "Joker!",
  jokerRollPrompt: "Tap the die to roll",
  jokerRolling: "Rolling...",
  jokerRollResult: count => `Next player draws ${count} cards`,
  jokerRollAriaLabel: "Roll the die",
  discardPile: "Discard pile",
  dropHere: "Drop here",
  shareTitle: "Come play Taki!",
  shareText: "Join my Taki room",
  drawCard: "Draw a card",
  drawCardWithPenalty: (count: number) => `Draw ${count} cards (+${count})`,
  getCardAriaLabel(color: string, value: string) {
    const colorNames: Record<string, string> = {
      red: "Red",
      yellow: "Yellow",
      green: "Green",
      blue: "Blue"
    };
    const valueNames: Record<string, string> = {
      1: "1",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      8: "8",
      9: "9",
      "+2": "Plus 2",
      "+6": "Plus 6",
      "+10": "Plus 10",
      stop: "Stop",
      taki: "Taki",
      change_color: "Change Color",
      "+": "Plus",
      direction: "Reverse",
      super_taki: "Super Taki",
      "+3": "Plus 3",
      "+3_block": "Block Plus 3",
      crown: "Crown",
      "+4": "Plus 4",
      joker: "Joker"
    };
    const colorLabel = colorNames[color];
    return colorLabel ? `${colorLabel} ${valueNames[value] ?? value}` : (valueNames[value] ?? value);
  }
};

class LocaleStore {
  lang = $state<Locale>(getInitialLocale());

  get strings() {
    return this.lang === "he" ? heStrings : enStrings;
  }

  toggle() {
    this.lang = this.lang === "he" ? "en" : "he";
    localStorage.setItem("taki_locale", this.lang);
  }
}

export const locale = new LocaleStore();
