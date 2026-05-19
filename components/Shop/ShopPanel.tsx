import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { SHOP_BADGES, SHOP_POWERUPS, SHOP_SKINS, SHOP_THEMES, SHOP_BACKGROUNDS, SHOP_TRAILS } from "../../config/powerupWeights";
import { useTranslation } from "../../hooks/useTranslation";

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

interface ShopData {
  unlockedThemes: string[];
  equippedTheme: string;
  unlockedBadges: string[];
  equippedBadge: string;
  unlockedSkins: string[];
  equippedSkin: string;
  unlockedBackgrounds: string[];
  equippedBackground: string;
  unlockedTrails: string[];
  equippedTrail: string;
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
  const { t } = useTranslation();
  const [shopData, setShopData] = useState(() => loadShopData());
  const [tab, setTab] = useState<"backgrounds" | "themes" | "badges" | "skins" | "powerups" | "trails">(() => {
    try {
      const saved = localStorage.getItem("dtp-shop-tab");
      if (saved === "backgrounds" || saved === "themes" || saved === "badges" || saved === "skins" || saved === "powerups" || saved === "trails") {
        return saved;
      }
    } catch (_) {
      return "backgrounds";
    }
    return "backgrounds";
  });
  const [buyAnim, setBuyAnim] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);

  const handlePreview = useCallback((themeId: string) => {
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    const originalTheme = shopData.equippedTheme;
    const updated = { ...shopData, equippedTheme: themeId };
    saveShopData(updated);
    setPreviewId(themeId);

    previewTimeoutRef.current = window.setTimeout(() => {
      const restored = { ...shopData, equippedTheme: originalTheme };
      saveShopData(restored);
      setPreviewId(null);
    }, 10000);
  }, [shopData, saveShopData]);

  const spend = useCallback((cost: number): boolean => {
    if (devMode) return true;
    if (dust < cost) return false;
    const newDust = dust - cost;
    persistDust(newDust);
    onDustChange(newDust);
    return true;
  }, [devMode, dust, persistDust, onDustChange]);

  const triggerBuyAnim = useCallback((id: string) => {
    setBuyAnim(id);
    setTimeout(() => setBuyAnim(null), 600);
  }, []);

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

  const equipBackground = (bgId: string) => {
    const updated = { ...shopData, equippedBackground: bgId };
    setShopData(updated);
    saveShopData(updated);
  };

  const buyBackground = (bgId: string, cost: number) => {
    if (!spend(cost)) return;
    const updated = { ...shopData, unlockedBackgrounds: [...shopData.unlockedBackgrounds, bgId] };
    setShopData(updated);
    saveShopData(updated);
    triggerBuyAnim(bgId);
  };

  const equipTrail = (trailId: string) => {
    const updated = { ...shopData, equippedTrail: trailId };
    setShopData(updated);
    saveShopData(updated);
  };

  const buyTrail = (trailId: string, cost: number) => {
    if (!spend(cost)) return;
    const updated = { ...shopData, unlockedTrails: [...shopData.unlockedTrails, trailId] };
    setShopData(updated);
    saveShopData(updated);
    triggerBuyAnim(trailId);
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

  const stored = useMemo(() => loadStoredPowerups(), [loadStoredPowerups]);

  useEffect(() => {
    return () => { if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current); };
  }, []);

  return (
    <div className="lb-wrap screen-slide scrollable-screen">
      <div className="lb-header">
        <span className="lb-title">{"🛒 " + t('shop.title')}</span>
        <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 800, fontFamily: "var(--font-ui)" }}>
          💜 {dust.toLocaleString()}
        </span>
      </div>

      <div className="shop-tabs">
        <button className={`shop-tab${tab === "backgrounds" ? " shop-tab--on" : ""}`} onClick={() => { setTab("backgrounds"); localStorage.setItem("dtp-shop-tab", "backgrounds"); }}>{"🌌 " + t('shop.bg')}</button>
        <button className={`shop-tab${tab === "themes" ? " shop-tab--on" : ""}`} onClick={() => { setTab("themes"); localStorage.setItem("dtp-shop-tab", "themes"); }}>{"🎨 " + t('shop.themes')}</button>
        <button className={`shop-tab${tab === "badges" ? " shop-tab--on" : ""}`} onClick={() => { setTab("badges"); localStorage.setItem("dtp-shop-tab", "badges"); }}>{"🏅 " + t('shop.badges')}</button>
        <button className={`shop-tab${tab === "skins" ? " shop-tab--on" : ""}`} onClick={() => { setTab("skins"); localStorage.setItem("dtp-shop-tab", "skins"); }}>{"✨ " + t('shop.skins')}</button>
        <button className={`shop-tab${tab === "powerups" ? " shop-tab--on" : ""}`} onClick={() => { setTab("powerups"); localStorage.setItem("dtp-shop-tab", "powerups"); }}>{"⚡ " + t('shop.powers')}</button>
        <button className={`shop-tab${tab === "trails" ? " shop-tab--on" : ""}`} onClick={() => { setTab("trails"); localStorage.setItem("dtp-shop-tab", "trails"); }}>{"✨ " + t('shop.trails')}</button>
      </div>

      {tab === "themes" && (
        <>
          <div className="shop-hint">{t('shop.hint_themes')}</div>
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
                    <button className={`${equipped ? "btn-primary" : "btn-ghost"} btn-sm shop-btn`} onClick={() => equipTheme(theme.id)}>
                      {equipped ? t('shop.equipped') : t('shop.equip')}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm shop-btn" style={{ opacity: dust >= theme.cost ? 1 : 0.4 }} onClick={() => buyTheme(theme.id, theme.cost)} disabled={dust < theme.cost}>
                      💜 {theme.cost}
                    </button>
                  )}
                  <button
                    className={`btn-ghost btn-sm shop-btn${previewId === theme.id ? ' previewing' : ''}`}
                    onClick={() => handlePreview(theme.id)}
                    disabled={previewId !== null}
                  >
                    {previewId === theme.id ? '👁️ Previewing...' : '🔍 Try Now'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "badges" && (
        <>
          <div className="shop-hint">{t('shop.hint_badges')}</div>
          {shopData.equippedBadge && (
            <div className="shop-inventory">
              <span className="shop-inv-lbl">{t('shop.active_badge')}</span>
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
                    <button className={`${equipped ? "btn-primary" : "btn-ghost"} btn-sm shop-btn`} onClick={() => equipBadge(badge.id)}>
                      {equipped ? t('shop.equipped') : t('shop.equip')}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm shop-btn" style={{ opacity: dust >= badge.cost ? 1 : 0.4 }} onClick={() => buyBadge(badge.id, badge.cost)} disabled={dust < badge.cost}>
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
          <div className="shop-hint">{t('shop.hint_skins')}</div>
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
                    <button className={`${equipped ? "btn-primary" : "btn-ghost"} btn-sm shop-btn`} onClick={() => equipSkin(skin.id)}>
                      {equipped ? t('shop.equipped') : t('shop.equip')}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm shop-btn" style={{ opacity: dust >= skin.cost ? 1 : 0.4 }} onClick={() => buySkin(skin.id, skin.cost)} disabled={dust < skin.cost}>
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
          <div className="shop-hint">{t('shop.hint_powers')}</div>
          {gameMode !== "evolve" && (
            <div className="shop-evolve-notice">
              🔒 {t('shop.evolve_only')}
            </div>
          )}
          {(stored.freeze > 0 || stored.shield > 0 || stored.mult > 0 || stored.heart > 0) ? (
            <div className="shop-inventory">
              <span className="shop-inv-lbl">{t('shop.ready')}</span>
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
                  <button className="btn-ghost btn-sm shop-btn" style={{ opacity: dust >= powerup.cost ? 1 : 0.4 }} onClick={() => buyPowerup(powerup.id, powerup.cost)} disabled={dust < powerup.cost}>
                    💜 {powerup.cost}
                  </button>
                ) : (
                  <button className="btn-ghost btn-sm shop-btn" style={{ opacity: 0.4 }} disabled>
                    {t('shop.locked')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "backgrounds" && (
        <>
          <div className="shop-hint">{t('shop.hint_backgrounds')}</div>
          <div className="shop-grid">
            {SHOP_BACKGROUNDS.map((bg) => {
              const owned = shopData.unlockedBackgrounds.includes(bg.id);
              const equipped = shopData.equippedBackground === bg.id;
              return (
                <div key={bg.id} className={`shop-item${equipped ? " shop-item--equipped" : ""}${buyAnim === bg.id ? " shop-item--bought" : ""}`}>
                  <div className="shop-swatch" style={{ background: "rgba(128,0,255,0.1)", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {bg.icon}
                  </div>
                  <div className="shop-name">{bg.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-ui)", textAlign: "center" }}>{bg.desc}</div>
                  {owned ? (
                    <button className={`${equipped ? "btn-primary" : "btn-ghost"} btn-sm shop-btn`} onClick={() => equipBackground(bg.id)}>
                      {equipped ? t('shop.equipped') : t('shop.equip')}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm shop-btn" style={{ opacity: dust >= bg.cost ? 1 : 0.4 }} onClick={() => buyBackground(bg.id, bg.cost)} disabled={dust < bg.cost}>
                      💜 {bg.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "trails" && (
        <>
          <div className="shop-hint">{t('shop.hint_trails')}</div>
          <div className="shop-grid">
            {SHOP_TRAILS.map((trail) => {
              const owned = shopData.unlockedTrails.includes(trail.id);
              const equipped = shopData.equippedTrail === trail.id;
              return (
                <div key={trail.id} className={`shop-item${equipped ? " shop-item--equipped" : ""}${buyAnim === trail.id ? " shop-item--bought" : ""}`}>
                  <div className="shop-swatch" style={{ background: `hsla(${trail.config.hueMin}, 60%, 50%, 0.2)`, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {trail.icon}
                  </div>
                  <div className="shop-name">{trail.name}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-ui)", textAlign: "center" }}>{trail.desc}</div>
                  {owned ? (
                    <button className={`${equipped ? "btn-primary" : "btn-ghost"} btn-sm shop-btn`} onClick={() => equipTrail(trail.id)}>
                      {equipped ? t('shop.equipped') : t('shop.equip')}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm shop-btn" style={{ opacity: dust >= trail.cost ? 1 : 0.4 }} onClick={() => buyTrail(trail.id, trail.cost)} disabled={dust < trail.cost}>
                      💜 {trail.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
