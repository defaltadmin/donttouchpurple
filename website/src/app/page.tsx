import Link from "next/link";

const PLAY_URL = "https://defaltadmin.github.io/donttouchpurple";

const features = [
  {
    title: "Boss Events",
    description:
      "Every 30 seconds, a boss attacks. Bomb Surge floods the grid with explosives. Inversion Storm scrambles your brain. Survive them for bonus dust.",
    icon: " ",
  },
  {
    title: "15 Animated Backgrounds",
    description:
      "Galaxy, Hyperspeed, Silk, Lightning, Nebula, Digital Rain, and more. Each one is a live WebGL shader running behind the chaos.",
    icon: " ",
  },
  {
    title: "Special Cells",
    description:
      "Bombs, shields, freezes, multipliers, slides, invisibility, corruption, duplication, portals, time slow, mirror, inversion, split screen. Every tap matters.",
    icon: " ",
  },
  {
    title: "4 Game Modes",
    description:
      "Classic for the purists. Evolve for the challenge seekers. Practice for the learners. Daily Challenge for the competitive.",
    icon: " ",
  },
  {
    title: "37 Achievements",
    description:
      "Dust economy, shop system, and a progression loop that keeps you coming back. Unlock backgrounds, power-ups, and bragging rights.",
    icon: " ",
  },
  {
    title: "Global Leaderboards",
    description:
      "Compete worldwide. Weekly resets keep it fresh. Your best scores are saved and ranked against every player.",
    icon: " ",
  },
];

const specialCells = [
  { name: "Bomb", color: "#ff4444", desc: "Explodes on timeout" },
  { name: "Shield", color: "#4488ff", desc: "Blocks one hit" },
  { name: "Freeze", color: "#44ddff", desc: "Stops the timer" },
  { name: "Multiplier", color: "#ffdd44", desc: "2x score boost" },
  { name: "Slide", color: "#44ff88", desc: "Moves across grid" },
  { name: "Invisible", color: "#888888", desc: "Hidden until tapped" },
  { name: "Corruption", color: "#aa44ff", desc: "Spreads to neighbors" },
  { name: "Portal", color: "#ff44aa", desc: "Teleports on tap" },
  { name: "Time Slow", color: "#44aaff", desc: "Slows everything" },
  { name: "Mirror", color: "#ffaaff", desc: "Reflects inputs" },
  { name: "Inversion", color: "#ff8844", desc: "Flips the rules" },
  { name: "Split", color: "#88ff44", desc: "Divides the grid" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface grid-bg">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight glow mb-4">
            Don&apos;t Touch
            <span className="block text-primary">Purple</span>
          </h1>

          <p className="text-xl md:text-2xl text-foreground/70 max-w-2xl mx-auto mb-8">
            Tap every color. Avoid purple. Survive boss events.
            <br />
            How long can you last?
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-border rounded-full px-8 py-4 text-lg font-semibold text-surface-dim hover:scale-105 transition-transform glow-box"
            >
              Play Now — Free
            </Link>
            <Link
              href="#features"
              className="rounded-full border border-outline-variant px-8 py-4 text-lg font-semibold text-foreground hover:bg-surface-container transition-colors"
            >
              Learn More
            </Link>
          </div>

          <p className="mt-6 text-sm text-foreground/50">
            No ads. No pay-to-win. No accounts required.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce">
          <svg
            className="w-6 h-6 text-foreground/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            Not Your Average <span className="text-primary">Tap Game</span>
          </h2>
          <p className="text-lg text-foreground/60 text-center max-w-2xl mx-auto mb-16">
            Every 30 seconds, something tries to kill you. Boss events, special
            cells, and progressive difficulty keep you on edge.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-outline-variant/30 bg-surface-container p-6 hover:border-primary/30 transition-colors"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  {f.title}
                </h3>
                <p className="text-foreground/70">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Cells */}
      <section className="py-24 px-4 bg-surface-dim/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="text-tertiary">12</span> Special Cell Types
          </h2>
          <p className="text-lg text-foreground/60 text-center max-w-2xl mx-auto mb-16">
            Each one changes the game. Learn their patterns. Master their
            weaknesses. Or die trying.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {specialCells.map((cell) => (
              <div
                key={cell.name}
                className="rounded-xl border border-outline-variant/20 bg-surface-container p-4 text-center hover:scale-105 transition-transform"
              >
                <div
                  className="w-8 h-8 rounded-lg mx-auto mb-2"
                  style={{ backgroundColor: cell.color }}
                />
                <div className="font-semibold text-foreground">{cell.name}</div>
                <div className="text-sm text-foreground/50">{cell.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Play */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            How to <span className="text-secondary">Play</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Tap the Colors</h3>
              <p className="text-foreground/60">
                Cells appear on the grid. Tap every color except purple. Simple.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center text-2xl mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Survive the Boss</h3>
              <p className="text-foreground/60">
                Every 30 seconds, a boss event attacks. Adapt or die.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center text-2xl mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Go for the Score</h3>
              <p className="text-foreground/60">
                Chain combos, collect dust, unlock achievements, climb the
                leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-surface-dim/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-primary glow">Touch</span>?
          </h2>
          <p className="text-lg text-foreground/60 mb-8">
            Free to play. No download. No account. Just open and tap.
          </p>
          <Link
            href={PLAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block gradient-border rounded-full px-10 py-5 text-xl font-bold text-surface-dim hover:scale-105 transition-transform glow-box"
          >
            Play Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-outline-variant/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-foreground/50 text-sm">
            © 2026 Don&apos;t Touch Purple. Built with React, TypeScript, and
            WebGL.
          </div>
          <div className="flex gap-6">
            <Link
              href="https://github.com/defaltadmin/donttouchpurple"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/50 hover:text-primary transition-colors text-sm"
            >
              GitHub
            </Link>
            <Link
              href={PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/50 hover:text-primary transition-colors text-sm"
            >
              Play
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
