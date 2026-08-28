import { STORAGE_KEY_AUTO_RELOAD_TIMES } from "$lib/storage";

const AUTO_RELOAD_COOLDOWN_MS = 30_000;
const AUTO_RELOAD_WINDOW_MS   = 600_000;
const AUTO_RELOAD_MAX_COUNT   = 3;

function getRecentReloadTimes(now: number) {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY_AUTO_RELOAD_TIMES) ?? "[]");
    if (!Array.isArray(stored)) {
      return [];
    }

    return stored.filter(
      (time): time is number => typeof time === "number" && now - time < AUTO_RELOAD_WINDOW_MS
    );
  } catch {
    return [];
  }
}

export function reloadForUpdate() {
  const now = Date.now();
  const recentReloadTimes = getRecentReloadTimes(now);
  const isWithinCooldown = recentReloadTimes.some(time => now - time < AUTO_RELOAD_COOLDOWN_MS);
  const isReloadLimitReached = recentReloadTimes.length >= AUTO_RELOAD_MAX_COUNT;
  if (isWithinCooldown || isReloadLimitReached) {
    return;
  }

  sessionStorage.setItem(STORAGE_KEY_AUTO_RELOAD_TIMES, JSON.stringify([...recentReloadTimes, now]));
  location.reload();
}
