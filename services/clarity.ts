import Clarity from "@microsoft/clarity";

const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

const IS_PROD =
  typeof window !== "undefined" &&
  (window.location.hostname === "game.mscarabia.com" ||
   window.location.hostname === "dont-touch-purple.web.app" ||
   window.location.hostname === "dont-touch-purple.firebaseapp.com");

export function initClarity() {
  if (!IS_PROD || !CLARITY_PROJECT_ID) {
    if (!IS_PROD) console.log("[Clarity] Development mode: Skip init");
    return;
  }

  try {
    Clarity.init(CLARITY_PROJECT_ID);
    console.log("[Clarity] Initialized, project:", CLARITY_PROJECT_ID);
  } catch (err) {
    console.error("[Clarity] Initialization failed", err);
  }
}
