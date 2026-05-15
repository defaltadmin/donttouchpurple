import { GameAnalytics } from "gameanalytics";

const GA_GAME_KEY = import.meta.env.VITE_GA_GAME_KEY;
const GA_SECRET_KEY = import.meta.env.VITE_GA_SECRET_KEY;

const IS_PROD =
  typeof window !== "undefined" &&
  (window.location.hostname === "game.mscarabia.com" || 
   window.location.hostname === "dont-touch-purple.web.app" ||
   window.location.hostname === "dont-touch-purple.firebaseapp.com");

export function initGA(version: string) {
  if (!IS_PROD || !GA_GAME_KEY || !GA_SECRET_KEY) {
    if (!IS_PROD) console.log("[GA] Development mode: Skip init");
    return;
  }

  try {
    GameAnalytics.configureBuild(version);
    
    // Configure available custom dimensions if needed
    // GameAnalytics.configureAvailableCustomDimensions01(["classic", "evolve"]);
    
    // Configure available virtual currencies and item types for business events
    GameAnalytics.configureAvailableVirtualCurrencies(["Dust"]);
    GameAnalytics.configureAvailableResourceItemTypes(["Theme", "Background", "Skin", "Powerup"]);

    GameAnalytics.initialize(GA_GAME_KEY, GA_SECRET_KEY);
    console.log("[GA] Initialized version", version);
  } catch (err) {
    console.error("[GA] Initialization failed", err);
  }
}

/**
 * Progression events track player progress through the game.
 * status: Start, Complete, Fail
 */
export function logProgressionEvent(status: "Start" | "Complete" | "Fail", mode: string, score: number, tick: number) {
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
  } catch (_) { /* GA not available in dev */ }
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
  } catch (_) { /* GA not available in dev */ }
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
  } catch (_) { /* GA not available in dev */ }
}

/**
 * Error events track crashes or exceptions.
 */
export function logErrorEvent(severity: "Error" | "Warning" | "Info" | "Critical", message: string) {
  if (!IS_PROD) return;
  try {
    const gaSeverity = severity === "Error" 
      ? GameAnalytics.EGAErrorSeverity.Error 
      : severity === "Warning" 
        ? GameAnalytics.EGAErrorSeverity.Warning 
        : severity === "Info" 
          ? GameAnalytics.EGAErrorSeverity.Info 
          : GameAnalytics.EGAErrorSeverity.Critical;

    GameAnalytics.addErrorEvent(gaSeverity, message);
  } catch (_) { /* GA not available in dev */ }
}
