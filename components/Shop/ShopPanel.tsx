import React, { useState } from "react";
import { SHOP_BADGES, SHOP_POWERUPS, SHOP_SKINS, SHOP_THEMES } from "../../config/powerupWeights";

interface ShopData {
  unlockedThemes: string[];
  equippedTheme: string;
  unlockedBadges: string[];
  equippedBadge: string;
  unlockedSkins: string[];
  equippedSkin: string;
}

interface StoredPowerups {
  freeze: number;
  shield: number;
  mult: number;
  heart: number;
}

interface ShopPanelProps {
  dust: number;
  onDustChange: (dust: number) => void;
  onClose: () => void;
  devMode?: boolean;
  gameMode?: "classic" | "evolve" | "duo";
  loadShopData: () => ShopData;
  saveShopData: (data: ShopData) => void;
  loadStoredPowerups: () => StoredPowerups;
  saveStoredPowerups: (data: StoredPowerups) => void;
  persistDust: (dust: number) => void;
}

export function ShopPanel({
  dust,
  onDustChange,
  onClose: _onClose,
  devMode,
  gameMode = "evolve",
  loadShopData,
  saveShopData,
  loadStoredPowerups,
  saveStoredPowerups,
  persistDust,
}: ShopPanelProps) {
  const [shopData, setShopData] = useState(() => loadShopData());
  const [tab, setTab] = useState<"themes" | "badges" | "powerups" | "skins">("themes");
  const [buyAnim, setBuyAnim] = useState<string | null>(null);

  const spend = (cost: number): boolean => {
    if (devMode) return true;
    if (dust < cost) return false;
    const newDust = dust - cost;
    persistDust(newDust);
    onDustChange(newDust);
    return true;
  };

  const triggerBuyAnim = (id: string) => {
    setBuyAnim(id);
    setTimeout(() => setBuyAnim(null), 600);
  };

  const buyTheme = (themeId: string, cost: number) => {
    if (!spend(cost)) return;
    const updated = { ...shopData, unlockedThemes: [...shopData.unlockedThemes, themeId] };
    setShopData(updated);
    saveShopData(updated);
    triggerBuyAnim(themeId);
  };

  const equipTheme = (themeId: string) => {
    const updated = { ...shopData, equippedTheme: themeId };
    setShopData(updated);
    saveShopData(updated);
  };

  const buyBadge = (badgeId: string, cost: number) => {
    if (!spend(cost)) return;
    const updated = { ...shopData, unlockedBadges: [...shopData.unlockedBadges, badgeId] };
    setShopData(updated);
    saveShopData(updated);
    triggerBuyAnim(badgeId);
  };

  const equipBadge = (badgeId: string) => {
    const updated = { ...shopData, equippedBadge: shopData.equippedBadge === badgeId ? "" : badgeId };
    setShopData(updated);
    saveShopData(updated);
  };

  const buySkin = (skinId: string, cost: number) => {
    if (!spend(cost)) return;
    const updated = { ...shopData, unlockedSkins: [...shopData.unlockedSkins, skinId] };
    setShopData(updated);
    saveShopData(updated);
    triggerBuyAnim(skinId);
  };

  const equipSkin = (skinId: string) => {
    const updated = { ...shopData, equippedSkin: skinId };
    setShopData(updated);
    saveShopData(updated);
  };

  const buyPowerup = (itemId: string, cost: number) => {
    if (!spend(cost)) return;
    const stored = loadStoredPowerups();
    if (itemId === "freeze1") saveStoredPowerups({ ...stored, freeze: stored.freeze + 1 });
    if (itemId === "freeze2") saveStoredPowerups({ ...stored, freeze: stored.freeze + 2 });
    if (itemId === "shield1") saveStoredPowerups({ ...stored, shield: stored.shield + 1 });
    if (itemId === "shield2") saveStoredPowerups({ ...stored, shield: stored.shield + 2 });
    if (itemId === "mult1") saveStoredPowerups({ ...stored, mult: stored.mult + 1 });
    if (itemId === "heart1") saveStoredPowerups({ ...stored, heart: stored.heart + 1 });
    if (itemId === "heart2") saveStoredPowerups({ ...stored, heart: stored.heart + 2 });
    triggerBuyAnim(itemId);
  };

  const stored = loadStoredPowerups();

  return (
    <div className="lb-wrap screen-slide scrollable-screen">
      <div className="lb-header">
        <span className="lb-title">🛒 Shop</span>
        <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 800, fontFamily: "var(--font-ui)" }}>
          💜 {dust.toLocaleString()}
        </span>
      </div>

      <div className="shop-tabs">
        <button className={`shop-tab${tab === "themes" ? " shop-tab--on" : ""}`} onClick={() => setTab("themes")}>🎨 Themes</button>
        <button className={`shop-tab${tab === "badges" ? " shop-tab--on" : ""}`} onClick={() => setTab("badges")}>🏅 Badges</button>
        <button className={`shop-tab${tab === "skins" ? " shop-tab--on" : ""}`} onClick={() => setTab("skins")}>✨ Skins</button>
        <button className={`shop-tab${tab === "powerups" ? " shop-tab--on" : ""}`} onClick={() => setTab("powerups")}>⚡ Powers</button>
      </div>

      {tab === "themes" && (
        <>
          <div className="shop-hint">Changes game colors &amp; background</div>
          <div className="shop-grid">
            {SHOP_THEMES.map((theme) => {
              const owned = shopData.unlockedThemes.includes(theme.id);
              const equipped = shopData.equippedTheme === theme.id;
              return (
                <div key={theme.id} className={`shop-item${equipped ? " shop-item--equipped" : ""}${buyAnim === theme.id ? " shop-item--bought" : ""}`}>
                  <div className="shop-swatch" style={{ background: `linear-gradient(135deg, ${theme.colors.bg} 0%, ${theme.colors.purple}88 100%)` }}>
                    <span style={{ fontSize: 22, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }}>🎨</span>
                  </div>
                  <div className="shop-name">{theme.name}</div>
                  {theme.cost === 0 || owned ? (
                    <button className={equipped ? "btn-primary btn-sm" : "btn-ghost btn-sm"} style={{ fontSize: 11, padding: "4px 12px" }} onClick={() => equipTheme(theme.id)}>
                      {equipped ? "✓ On" : "Equip"}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm" style={{ fontSize: 11, padding: "4px 12px", opacity: dust >= theme.cost ? 1 : 0.4 }} onClick={() => buyTheme(theme.id, theme.cost)} disabled={dust < theme.cost}>
                      💜 {theme.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "badges" && (
        <>
          <div className="shop-hint">Shown next to your name on the leaderboard</div>
          {shopData.equippedBadge && (
            <div className="shop-inventory">
              <span className="shop-inv-lbl">Active badge:</span>
              <span className="shop-inv-chip">
                {SHOP_BADGES.find((badge) => badge.id === shopData.equippedBadge)?.icon} {SHOP_BADGES.find((badge) => badge.id === shopData.equippedBadge)?.name}
              </span>
            </div>
          )}
          <div className="shop-grid">
            {SHOP_BADGES.map((badge) => {
              const owned = shopData.unlockedBadges.includes(badge.id);
              const equipped = shopData.equippedBadge === badge.id;
              return (
                <div key={badge.id} className={`shop-item${equipped ? " shop-item--equipped" : ""}${buyAnim === badge.id ? " shop-item--bought" : ""}`}>
                  <div className="shop-swatch" style={{ background: "rgba(192,38,211,0.1)", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {badge.icon}
                  </div>
                  <div className="shop-name">{badge.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-ui)", textAlign: "center" }}>{badge.desc}</div>
                  {owned ? (
                    <button className={equipped ? "btn-primary btn-sm" : "btn-ghost btn-sm"} style={{ fontSize: 11, padding: "4px 12px" }} onClick={() => equipBadge(badge.id)}>
                      {equipped ? "✓ On" : "Equip"}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm" style={{ fontSize: 11, padding: "4px 12px", opacity: dust >= badge.cost ? 1 : 0.4 }} onClick={() => buyBadge(badge.id, badge.cost)} disabled={dust < badge.cost}>
                      💜 {badge.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "skins" && (
        <>
          <div className="shop-hint">Changes the look of all grid cells</div>
          <div className="shop-grid">
            {SHOP_SKINS.map((skin) => {
              const owned = shopData.unlockedSkins.includes(skin.id);
              const equipped = shopData.equippedSkin === skin.id;
              return (
                <div key={skin.id} className={`shop-item${equipped ? " shop-item--equipped" : ""}${buyAnim === skin.id ? " shop-item--bought" : ""}`}>
                  <div className="shop-swatch" style={{ background: skin.preview, border: "2px solid rgba(255,255,255,0.15)" }}>
                    <span style={{ fontSize: 22 }}>{skin.icon}</span>
                  </div>
                  <div className="shop-name">{skin.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-ui)", textAlign: "center" }}>{skin.desc}</div>
                  {skin.cost === 0 || owned ? (
                    <button className={equipped ? "btn-primary btn-sm" : "btn-ghost btn-sm"} style={{ fontSize: 11, padding: "4px 12px" }} onClick={() => equipSkin(skin.id)}>
                      {equipped ? "✓ On" : "Equip"}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm" style={{ fontSize: 11, padding: "4px 12px", opacity: dust >= skin.cost ? 1 : 0.4 }} onClick={() => buySkin(skin.id, skin.cost)} disabled={dust < skin.cost}>
                      💜 {skin.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "powerups" && (
        <>
          <div className="shop-hint">Charges carry into your next game.</div>
          {gameMode !== "evolve" && (
            <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: "8px 16px" }}>
              🔒 Powerups only work in Evolve mode
            </div>
          )}
          {(stored.freeze > 0 || stored.shield > 0 || stored.mult > 0 || stored.heart > 0) ? (
            <div className="shop-inventory">
              <span className="shop-inv-lbl">Ready:</span>
              {stored.freeze > 0 && <span className="shop-inv-chip">❄ ×{stored.freeze}</span>}
              {stored.shield > 0 && <span className="shop-inv-chip">◈ ×{stored.shield}</span>}
              {stored.mult > 0 && <span className="shop-inv-chip">⚡ ×{stored.mult}</span>}
              {stored.heart > 0 && <span className="shop-inv-chip">♥ ×{stored.heart}</span>}
            </div>
          ) : null}
          <div className="shop-grid">
            {SHOP_POWERUPS.map((powerup) => (
              <div key={powerup.id} className={`shop-item${buyAnim === powerup.id ? " shop-item--bought" : ""}${gameMode !== "evolve" ? " shop-item--locked" : ""}`}>
                <div className="shop-swatch" style={{ background: "rgba(192,38,211,0.1)", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {powerup.icon}
                </div>
                <div className="shop-name">{powerup.name}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-ui)", textAlign: "center" }}>{powerup.desc}</div>
                {gameMode === "evolve" ? (
                  <button className="btn-ghost btn-sm" style={{ fontSize: 11, padding: "4px 12px", opacity: dust >= powerup.cost ? 1 : 0.4 }} onClick={() => buyPowerup(powerup.id, powerup.cost)} disabled={dust < powerup.cost}>
                    💜 {powerup.cost}
                  </button>
                ) : (
                  <button className="btn-ghost btn-sm" style={{ fontSize: 11, padding: "4px 12px", opacity: 0.4 }} disabled>
                    🔒 Locked
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
