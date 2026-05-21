import React from "react";

interface CTABannerProps {
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

export function CTABanner({
  title,
  subtitle,
  badgeLabel,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  className = "",
}: CTABannerProps) {
  return (
    <section className={`dtp-cta ${className}`.trim()}>
      <div className="dtp-cta-glass">
        {/* Cyber grid texture */}
        <div className="dtp-cta-cyber-grid" />

        {/* Decorative orbs */}
        <div className="dtp-cta-orb dtp-cta-orb--purple" />
        <div className="dtp-cta-orb dtp-cta-orb--secondary" />

        {/* Content */}
        <div className="dtp-cta-content">
          <div className="dtp-cta-text">
            {badgeLabel && (
              <div className="dtp-cta-badge">
                <span className="dtp-cta-badge-dot" />
                <span className="dtp-cta-badge-text">{badgeLabel}</span>
              </div>
            )}
            <h2 className="dtp-cta-title dtp-cta-neon-pulse">{title}</h2>
            {subtitle && <p className="dtp-cta-subtitle">{subtitle}</p>}
          </div>
          <div className="dtp-cta-buttons">
            <button className="dtp-cta-btn-primary" onClick={onPrimary}>
              {primaryLabel}
            </button>
            {secondaryLabel && onSecondary && (
              <button className="dtp-cta-btn-ghost" onClick={onSecondary}>
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
