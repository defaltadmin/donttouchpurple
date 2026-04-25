import React, { useCallback, useEffect, useState } from "react";
import { SHOP_BADGES } from "../../config/powerupWeights";

interface LeaderboardEntry {
  score: number;
  initials: string;
  date: string;
  mode?: "classic" | "evolve";
  badge?: string;
}

interface LeaderboardPanelProps {
  mode: "classic" | "evolve";
  onClose: () => void;
  fetchGlobalScores: () => Promise<LeaderboardEntry[]>;
  classicStorageKey: string;
  evolveStorageKey: string;
}

export function LeaderboardPanel({
  mode: _mode,
  onClose: _onClose,
  fetchGlobalScores,
  classicStorageKey,
  evolveStorageKey,
}: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const global = await fetchGlobalScores();
      setEntries(global);
      setIsGlobal(true);
    } catch (err) {
      console.warn("[DTP-LB] Firebase fetch failed, using local fallback:", err);
      try {
        const classicRaw = localStorage.getItem(classicStorageKey);
        const evolveRaw = localStorage.getItem(evolveStorageKey);
        const classic: LeaderboardEntry[] = classicRaw
          ? JSON.parse(classicRaw).map((entry: LeaderboardEntry) => ({ ...entry, mode: "classic" }))
          : [];
        const evolve: LeaderboardEntry[] = evolveRaw
          ? JSON.parse(evolveRaw).map((entry: LeaderboardEntry) => ({ ...entry, mode: "evolve" }))
          : [];
        setEntries([...classic, ...evolve].sort((a, b) => b.score - a.score).slice(0, 20));
      } catch {
        setEntries([]);
      }
      setIsGlobal(false);
    } finally {
      setLoading(false);
    }
  }, [classicStorageKey, evolveStorageKey, fetchGlobalScores]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const visibleEntries = expanded ? entries : entries.slice(0, 10);
  const hasMore = entries.length > 10;

  return (
    <div className="lb-wrap screen-slide scrollable-screen">
      <div className="lb-header">
        <span className="lb-title">🏆 {isGlobal ? "Global" : "Local"} Leaderboard</span>
        <span className="lb-sub" style={{ fontSize: 10, opacity: 0.55 }}>
          {isGlobal ? "🌐 Live" : "📴 Offline"}
        </span>
      </div>
      {loading ? (
        <div className="lb-empty" style={{ padding: "32px 0", opacity: 0.6 }}>
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <p className="lb-empty">No scores yet. Be the first!</p>
      ) : (
        <>
          <div className="lb-list">
            {visibleEntries.map((entry, i) => {
              const badgeObj = entry.badge ? SHOP_BADGES.find((badge) => badge.id === entry.badge) : null;
              return (
                <div
                  key={`${entry.initials}-${entry.score}-${entry.date}-${i}`}
                  className={`lb-row ${i === 0 ? "lb-row--gold" : i === 1 ? "lb-row--silver" : i === 2 ? "lb-row--bronze" : ""}`}
                >
                  <span className="lb-rank">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                  <span className="lb-ini">
                    {badgeObj && <span style={{ marginRight: 3 }}>{badgeObj.icon}</span>}
                    {entry.initials}
                  </span>
                  <span className="lb-score">{entry.score}</span>
                  <span
                    className="lb-mode-chip"
                    style={{
                      background: entry.mode === "evolve" ? "rgba(192,38,211,0.18)" : "rgba(96,165,250,0.18)",
                      color: entry.mode === "evolve" ? "#f0abfc" : "#93c5fd",
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 4,
                      fontWeight: 800,
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    {entry.mode === "evolve" ? "∞ Evolve" : "⊞ Classic"}
                  </span>
                  <span className="lb-date">{entry.date}</span>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <button
              className="btn-ghost"
              style={{ width: "100%", marginTop: 8, fontSize: 13, opacity: 0.75 }}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "▲ Show less" : `▼ Show all ${entries.length}`}
            </button>
          )}
        </>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12, paddingBottom: 8 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={fetchScores}>
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}
