import { LS_KEYS } from "../config/difficulty";

export type ShopData = {
  unlockedThemes: string[]; equippedTheme: string;
  unlockedBadges: string[]; equippedBadge: string;
  unlockedSkins:  string[]; equippedSkin:  string;
  unlockedBackgrounds: string[]; equippedBackground: string;
  unlockedTrails: string[]; equippedTrail: string;
};

export function loadShopData(): ShopData {
  try {
    const r = localStorage.getItem(LS_KEYS.SHOP);
    if (r) {
      const data = JSON.parse(r);
      return {
        unlockedThemes: data.unlockedThemes || data.ownedThemes || ["default"],
        equippedTheme:  data.equippedTheme || "default",
        unlockedBadges: data.unlockedBadges || data.ownedBadges || [],
        equippedBadge:  data.equippedBadge || "",
        unlockedSkins:  data.unlockedSkins || data.ownedSkins || ["default"],
        equippedSkin:   data.equippedSkin || "default",
        unlockedBackgrounds: data.unlockedBackgrounds || ["default"],
        equippedBackground: data.equippedBackground || "default",
        unlockedTrails: data.unlockedTrails || ["default"],
        equippedTrail: data.equippedTrail || "default"
      };
    }
  } catch { /* invalid JSON, return defaults */ }
  return { unlockedThemes: ["default"], equippedTheme: "default", unlockedBadges: [], equippedBadge: "", unlockedSkins: ["default"], equippedSkin: "default", unlockedBackgrounds: ["default"], equippedBackground: "default", unlockedTrails: ["default"], equippedTrail: "default" };
}

export function saveShopData(d: ShopData) {
  try { localStorage.setItem(LS_KEYS.SHOP, JSON.stringify(d)); } catch { /* storage full or unavailable */ }
}
