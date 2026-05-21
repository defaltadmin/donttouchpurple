import React from "react";

interface GlassCardProps {
  title: string;
  description: string;
  tag?: string;
  tagColor?: "primary" | "secondary" | "tertiary";
  image?: string;
  timeAgo?: string;
  onAction?: () => void;
  className?: string;
}

export function GlassCard({
  title,
  description,
  tag,
  tagColor = "primary",
  image,
  timeAgo,
  onAction,
  className = "",
}: GlassCardProps) {
  const hoverClass = `dtp-card--hover-${tagColor}`;
  return (
    <article className={`dtp-card ${hoverClass} ${className}`.trim()}>
      {(image || tag) && (
        <div className="dtp-card-image">
          {image && <img src={image} alt="" loading="lazy" />}
          {tag && (
            <span className={`dtp-card-tag dtp-card-tag--${tagColor}`}>
              {tag}
            </span>
          )}
        </div>
      )}
      <div className="dtp-card-body">
        <div>
          <h3 className="dtp-card-title">{title}</h3>
          <p className="dtp-card-desc">{description}</p>
        </div>
        {(timeAgo || onAction) && (
          <div className="dtp-card-footer">
            {timeAgo && <span className="dtp-card-time">{timeAgo}</span>}
            {onAction && (
              <button
                onClick={onAction}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  padding: 4,
                }}
                aria-label={`Open ${title}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
