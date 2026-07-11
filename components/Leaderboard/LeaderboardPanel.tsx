import React, { useCallback, useEffect, useState } from "react";
import { SHOP_BADGES } from "../../config/powerupWeights";
import { useTranslation } from "../../hooks/useTranslation";
import { logger } from "../../utils/logger";
import { ChampionSpotlight } from "./ChampionSpotlight";
import { FilterTabs } from "../UI/FilterTabs";
import { Icon } from "../UI/Icon";

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
  fetchWeeklyScores?: () => Promise<LeaderboardEntry[]>;
  weekId?: string;
  weekCountdown?: string;
  classicStorageKey: string;
  evolveStorageKey: string;
  // F6: personal best for pinned row
  personalBest?: number;
  weeklyPersonalBest?: number;
  playerName?: string;
  // P1: callback when scores are fetched (for top-10 achievement check)
  onScoresFetched?: (entries: { score: number; initials: string }[]) => void;
}

export function LeaderboardPanel({
  mode: _mode,
  onClose: _onClose,
  fetchGlobalScores,
  fetchWeeklyScores,
  weekId,
  weekCountdown,
  classicStorageKey,
  evolveStorageKey,
  personalBest,
  weeklyPersonalBest,
  playerName,
  onScoresFetched,
}: LeaderboardPanelProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);
  const [board, setBoard] = useState<"global" | "weekly">("global");
  const [modeFilter, setModeFilter] = useState<"all" | "classic" | "evolve">("all");

  const filteredEntries = modeFilter === "all"
    ? entries
    : entries.filter(e => e.mode === modeFilter);

  const activePersonalBest = board === "weekly" ? weeklyPersonalBest : personalBest;

  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const list = board === "weekly" && fetchWeeklyScores
        ? await fetchWeeklyScores()
        : await fetchGlobalScores();
      // F6: cap at top 10
      setEntries(list.slice(0, 10));
      setIsGlobal(true);
      // P1: notify parent with fetched entries (for top-10 achievement check)
      if (onScoresFetched && board === "global") onScoresFetched(list);
    } catch (err) {
      logger.warn("[DTP-LB] Firebase fetch failed, using local fallback:", err);
      if (board === "weekly") {
        setEntries([]);
        setIsGlobal(false);
      } else {
        try {
          const classicRaw = localStorage.getItem(classicStorageKey);
          const evolveRaw  = localStorage.getItem(evolveStorageKey);
          const classic: LeaderboardEntry[] = classicRaw
            ? JSON.parse(classicRaw).map((e: LeaderboardEntry) => ({ ...e, mode: "classic" as const }))
            : [];
          const evolve: LeaderboardEntry[] = evolveRaw
            ? JSON.parse(evolveRaw).map((e: LeaderboardEntry) => ({ ...e, mode: "evolve" as const }))
            : [];
          setEntries([...classic, ...evolve].sort((a, b) => b.score - a.score).slice(0, 10));
        } catch {
          setEntries([]);
        }
        setIsGlobal(false);
      }
    } finally {
      setLoading(false);
    }
  }, [board, classicStorageKey, evolveStorageKey, fetchGlobalScores, fetchWeeklyScores, onScoresFetched]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  // F6: is player already in top 10?
  const playerInTop10 = activePersonalBest != null && playerName
    ? entries.some(e => e.initials === playerName && e.score >= activePersonalBest)
    : false;

  return (
    <div className="lb-wrap screen-slide scrollable-screen">
      <div className="lb-header">
        <span className="lb-title">
          <Icon name="trophy" size={20} />{" "}
          {board === "weekly"
            ? `Weekly Ladder${weekId ? ` · ${weekId}` : ""}`
            : `${isGlobal ? t('leaderboard.global') : t('leaderboard.local')} ${t('leaderboard.title')}`}
        </span>
        <span className="lb-sub" style={{ fontSize: 10, opacity: 0.55 }}>
          {board === "weekly"
            ? `🗓️ Resets Mon 00:00 UTC${weekCountdown ? ` · ${weekCountdown} left` : ""}`
            : (isGlobal ? `🌐 ${t('leaderboard.live')}` : `📴 ${t('leaderboard.offline')}`)}
        </span>
      </div>

      {/* Board type: Global vs Weekly */}
      {fetchWeeklyScores && (
        <div style={{ padding: "0 16px 8px" }}>
          <FilterTabs
            options={[
              { key: "global", label: "🌐 Global" },
              { key: "weekly", label: "🗓️ Weekly" },
            ]}
            active={board}
            onChange={(k) => setBoard(k as typeof board)}
          />
        </div>
      )}

      {/* Mode filter tabs */}
      <div style={{ padding: "0 16px 12px" }}>
        <FilterTabs
          options={[
            { key: "all", label: "All" },
            { key: "classic", label: "⊞ Classic" },
            { key: "evolve", label: "∞ Evolve" },
          ]}
          active={modeFilter}
          onChange={(k) => setModeFilter(k as typeof modeFilter)}
        />
      </div>

      {loading ? (
        <div className="lb-empty" style={{ padding: "32px 0", opacity: 0.6 }}>{t('leaderboard.loading')}</div>
      ) : filteredEntries.length === 0 ? (
        <p className="lb-empty">{t('leaderboard.no_scores')}</p>
      ) : (
        <>
          {/* Champion spotlight for #1 */}
          {modeFilter === "all" && entries.length > 0 && (
            <div style={{ padding: "0 16px 16px" }}>
              <ChampionSpotlight
                player={{
                  name: entries[0].initials,
                  score: entries[0].score.toLocaleString(),
                  time: entries[0].date,
                  rank: 1,
                  category: entries[0].mode === "evolve" ? "EVOLVE OPERATOR" : "CLASSIC OPERATOR",
                }}
              />
            </div>
          )}

          <div className="lb-list">
            {filteredEntries.map((entry, i) => {
              const badgeObj = entry.badge ? SHOP_BADGES.find(b => b.id === entry.badge) : null;
              return (
                <div
                  key={`${entry.initials}-${entry.score}-${entry.date}-${i}`}
                  className={`lb-row ${i === 0 ? "lb-row--gold" : i === 1 ? "lb-row--silver" : i === 2 ? "lb-row--bronze" : ""}`}
                >
                  <span className="lb-rank">{i === 0 ? <Icon name="star" size={18} /> : i === 1 ? <Icon name="star" size={16} /> : i === 2 ? <Icon name="star" size={14} /> : `#${i + 1}`}</span>
                  <span className="lb-ini">
                    {badgeObj && <span style={{ marginRight: 3 }}>{badgeObj.icon}</span>}
                    {entry.initials}
                  </span>
                  <span className="lb-score">{entry.score}</span>
                  <span
                    className="lb-mode-chip"
                    style={{
                      background: entry.mode === "evolve" ? "rgba(192,38,211,0.18)" : "rgba(96,165,250,0.18)",
                      color: entry.mode === "evolve" ? "#fda9ff" : "#93c5fd",
                      fontSize: 9, padding: "1px 5px", borderRadius: 4,
                      fontWeight: 800, fontFamily: "var(--font-ui)",
                    }}
                  >
                    {entry.mode === "evolve" ? "∞ Evolve" : "⊞ Classic"}
                  </span>
                  <span className="lb-date">{entry.date}</span>
                </div>
              );
            })}
          </div>

          {/* F6: Personal best pinned row — shown only if not already in top 10 */}
          {!playerInTop10 && activePersonalBest != null && activePersonalBest > 0 && playerName && (
            <div className="lb-pb-row">
              <span className="lb-pb-label">{t('leaderboard.your_best')}</span>
              <span className="lb-ini">{playerName}</span>
              <span className="lb-score">{activePersonalBest}</span>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12, paddingBottom: 8 }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={fetchScores}>↻ {t('leaderboard.refresh')}</button>
      </div>
    </div>
  );
}
