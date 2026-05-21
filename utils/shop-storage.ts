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
      const str = (v: unknown, d: string) => typeof v === 'string' ? v : d;
      const arr = (v: unknown, d: string[]) => Array.isArray(v) ? v : d;
      return {
        unlockedThemes: arr(data.unlockedThemes || data.ownedThemes, ["default"]),
        equippedTheme:  str(data.equippedTheme, "default"),
        unlockedBadges: arr(data.unlockedBadges || data.ownedBadges, []),
        equippedBadge:  str(data.equippedBadge, ""),
        unlockedSkins:  arr(data.unlockedSkins || data.ownedSkins, ["default"]),
        equippedSkin:   str(data.equippedSkin, "default"),
        unlockedBackgrounds: arr(data.unlockedBackgrounds, ["default"]),
        equippedBackground: str(data.equippedBackground, "default"),
        unlockedTrails: arr(data.unlockedTrails, ["default"]),
        equippedTrail: str(data.equippedTrail, "default")
      };
    }
  } catch { /* invalid JSON, return defaults */ }
  return { unlockedThemes: ["default"], equippedTheme: "default", unlockedBadges: [], equippedBadge: "", unlockedSkins: ["default"], equippedSkin: "default", unlockedBackgrounds: ["default"], equippedBackground: "default", unlockedTrails: ["default"], equippedTrail: "default" };
}

export function saveShopData(d: ShopData) {
  try { localStorage.setItem(LS_KEYS.SHOP, JSON.stringify(d)); } catch { /* storage full or unavailable */ }
}
