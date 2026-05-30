const BOSS_EVENTS = [
  {
    icon: '\u26A1',
    name: 'Storm',
    desc: 'Cells shuffle at lightning speed. Your muscle memory betrays you.',
    gradient: 'linear-gradient(135deg, #7c3aed, #dc2626)',
    glow: 'rgba(124,58,237,0.3)',
  },
  {
    icon: '\uD83D\uDD04',
    name: 'Inversion',
    desc: 'Safe and danger colors swap. Everything you learned is now wrong.',
    gradient: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
    glow: 'rgba(14,165,233,0.3)',
  },
  {
    icon: '\uD83C\uDF11',
    name: 'Blackout',
    desc: 'The grid goes completely dark. You tap from memory alone.',
    gradient: 'linear-gradient(135deg, #1e1b4b, #000)',
    glow: 'rgba(30,27,75,0.3)',
  },
];

export function BossShowcase() {
  return (
    <section className="landing-section section-boss">
      <h2 className="section-heading">Boss Events</h2>
      <p className="section-subtext">Just when you think you've got it figured out, the rules change.</p>
      <div className="boss-cards">
        {BOSS_EVENTS.map((boss) => (
          <div
            key={boss.name}
            className="glass-card boss-card"
            style={{ '--boss-glow': boss.glow } as Record<string, string>}
          >
            <div className="boss-card-icon">{boss.icon}</div>
            <div
              className="boss-card-name"
              style={{
                background: boss.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {boss.name}
            </div>
            <p className="boss-card-desc">{boss.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
