const FEATURES = [
  { icon: '\uD83C\uDFAE', title: 'Two Game Modes', desc: 'Classic for quick reflex training. Evolve for progressive difficulty with expanding grids.' },
  { icon: '\uD83C\uDFC6', title: '37 Achievements', desc: 'Unlock badges and earn dust currency as you master increasingly brutal challenges.' },
  { icon: '\u2728', title: '12 Animated Backgrounds', desc: 'GPU-accelerated WebGL effects \u2014 nebula, aurora, digital rain, and more.' },
  { icon: '\uD83E\uDD16', title: 'AI Bot Assist', desc: 'Activate a companion bot that costs dust to help you survive. Or play solo.' },
  { icon: '\uD83D\uDCC5', title: 'Daily Challenges', desc: 'New objectives every day. Compete on the global leaderboard.' },
  { icon: '\uD83D\uDCF1', title: 'Installable PWA', desc: 'Works on any device. Install as an app. Gamepad support included.' },
];

export function FeatureGrid() {
  return (
    <section className="landing-section section-features">
      <h2 className="section-heading">Everything You Get</h2>
      <p className="section-subtext">More depth than you'd expect from a "don't touch the color" game.</p>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="glass-card feature-card">
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
