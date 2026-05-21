import React from "react";

interface ChampionPlayer {
  name: string;
  score: string;
  time: string;
  avatar?: string;
  rank: number;
  category: string;
}

interface ChampionSpotlightProps {
  player: ChampionPlayer;
  onChallenge?: () => void;
  className?: string;
}

export function ChampionSpotlight({
  player,
  onChallenge,
  className = "",
}: ChampionSpotlightProps) {
  return (
    <div
      className={`dtp-champion-glass ${className}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        maxWidth: 480,
        width: "100%",
      }}
    >
      {/* Rank badge */}
      <span
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "var(--gold)",
          color: "#261a00",
          padding: "4px 12px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          fontFamily: "var(--font-ui)",
        }}
      >
        RANK {String(player.rank).padStart(2, "0")}
      </span>

      {/* Avatar */}
      <div style={{ position: "relative" }}>
        <div className="dtp-champion-avatar">
          {player.avatar ? (
            <img src={player.avatar} alt={player.name} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                color: "var(--accent)",
                fontFamily: "var(--font-game)",
              }}
            >
              {player.name.charAt(0)}
            </div>
          )}
        </div>
        <span
          className="dtp-champion-pill"
          style={{
            position: "absolute",
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          CHAMPION
        </span>
      </div>

      {/* Info */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
            color: "var(--accent)",
            marginBottom: 4,
          }}
        >
          {player.category}
        </p>
        <h2 className="dtp-champion-shimmer-text" style={{ fontSize: 28 }}>
          {player.name}
        </h2>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          width: "100%",
        }}
      >
        <StatCell label="Total Score" value={player.score} color="var(--gold)" />
        <StatCell label="Clear Time" value={player.time} color="var(--accent)" />
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
          marginTop: 8,
        }}
      >
        {onChallenge && (
          <button
            className="dtp-champion-bevel"
            onClick={onChallenge}
            style={{
              background: "var(--purple)",
              color: "#fffafa",
              padding: "12px 20px",
              borderRadius: 14,
              fontFamily: "var(--font-game)",
              fontSize: 16,
              fontWeight: 700,
              width: "100%",
              cursor: "pointer",
              border: "none",
              textTransform: "uppercase" as const,
            }}
          >
            CHALLENGE CHAMPION
          </button>
        )}
      </div>

      {/* Decorative orb */}
      <div
        style={{
          position: "absolute",
          bottom: -40,
          right: -40,
          width: 256,
          height: 256,
          background: "rgba(192,38,211,0.1)",
          filter: "blur(80px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function StatCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 14,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 9,
          fontWeight: 900,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "var(--muted)",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-game)",
          fontSize: 22,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}
