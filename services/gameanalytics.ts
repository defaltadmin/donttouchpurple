import { GameAnalytics } from "gameanalytics";
import { logger } from "../utils/logger";

const GA_GAME_KEY = import.meta.env.VITE_GA_GAME_KEY;
const GA_SECRET_KEY = import.meta.env.VITE_GA_SECRET_KEY;

const IS_PROD =
  typeof window !== "undefined" &&
  (window.location.hostname === "game.mscarabia.com" ||
   window.location.hostname === "dont-touch-purple.web.app" ||
   window.location.hostname === "dont-touch-purple.firebaseapp.com");

export function initGA(version: string) {
  if (!IS_PROD || !GA_GAME_KEY || !GA_SECRET_KEY) {
    if (!IS_PROD) logger.info("[GA] Development mode: Skip init");
    return;
  }

  try {
    GameAnalytics.configureBuild(version);

    // Configure available virtual currencies and item types for business events
    GameAnalytics.configureAvailableResourceCurrencies(["Dust"]);
    GameAnalytics.configureAvailableResourceItemTypes(["Theme", "Background", "Skin", "Powerup"]);

    GameAnalytics.initialize(GA_GAME_KEY, GA_SECRET_KEY);
    logger.info("[GA] Initialized version", version);
  } catch (err) {
    logger.error("[GA] Initialization failed", err);
  }
}

/**
 * Progression events track player progress through the game.
 * status: Start, Complete, Fail
 */
export function logProgressionEvent(status: "Start" | "Complete" | "Fail", mode: string, score: number, _tick: number) {
  if (!IS_PROD) return;
  try {
    const gaStatus = status === "Start" 
      ? GameAnalytics.EGAProgressionStatus.Start 
      : status === "Complete" 
        ? GameAnalytics.EGAProgressionStatus.Complete 
        : GameAnalytics.EGAProgressionStatus.Fail;

    // Use mode as the first progression level, score as the value
    // We can also include ticks in the event name if needed, but keeping it simple for now
    GameAnalytics.addProgressionEvent(gaStatus, mode, "", "", score);
  } catch { /* GA not available in dev */ }
}

/**
 * Design events track specific game mechanics or UI interactions.
 */
export function logDesignEvent(eventId: string, value?: number) {
  if (!IS_PROD) return;
  try {
    if (value !== undefined) {
      GameAnalytics.addDesignEvent(eventId, value);
    } else {
      GameAnalytics.addDesignEvent(eventId);
    }
  } catch { /* GA not available in dev */ }
}

/**
 * Resource events track the flow of virtual currency.
 * flowType: Source (earn), Sink (spend)
 */
export function logResourceEvent(flowType: "Source" | "Sink", currency: string, itemType: string, itemId: string, amount: number) {
  if (!IS_PROD) return;
  try {
    const gaFlowType = flowType === "Source" 
      ? GameAnalytics.EGAResourceFlowType.Source 
      : GameAnalytics.EGAResourceFlowType.Sink;

    GameAnalytics.addResourceEvent(gaFlowType, currency, amount, itemType, itemId);
  } catch { /* GA not available in dev */ }
}

