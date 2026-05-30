'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { GlassOrb } from '@/components/GlassOrb';
import { CrescentRing } from '@/components/CrescentRing';

const PRODUCTS = [
  {
    name: "Don't Touch Purple",
    desc: 'A fast-paced browser reflex game with boss events, 12 special cell types, daily challenges, and a global leaderboard. Open source.',
    url: 'https://game.mscarabia.com',
    icon: '\uD83D\uDFE3',
  },
];

const VALUES = [
  {
    icon: '\u26A1',
    title: 'Speed First',
    desc: 'Every product we build is optimized for performance. Sub-second load times. 60fps interactions. No compromises.',
  },
  {
    icon: '\uD83D\uDD12',
    title: 'Privacy by Default',
    desc: 'No tracking, no ads, no data harvesting. Our products work without accounts or personal information.',
  },
  {
    icon: '\uD83C\uDF10',
    title: 'Open Source',
    desc: 'We believe in transparency. Our core products are MIT-licensed and open for anyone to audit, fork, or contribute.',
  },
  {
    icon: '\uD83C\uDFAE',
    title: 'Craft Over Scale',
    desc: "We'd rather make one exceptional product than a hundred mediocre ones. Quality is the only metric that matters.",
  },
];

const STATS = [
  { value: '212+', label: 'Automated Tests' },
  { value: '12', label: 'WebGL Backgrounds' },
  { value: '37', label: 'Achievements' },
  { value: '100%', label: 'Client-Side' },
];

export function CorporatePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const orbContainerRef = useRef<HTMLDivElement>(null);

  // Mouse parallax
  useEffect(() => {
    const container = orbContainerRef.current;
    if (!container) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      const orb = container.querySelector('.glass-orb') as HTMLElement;
      if (orb) {
        orb.style.transform = `translate(${x}px, ${y}px)`;
      }
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Scroll-triggered animations
  useEffect(() => {
    const sectionEls = document.querySelectorAll('.scroll-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.from(entry.target, { y: 40, opacity: 0, duration: 0.6, ease: 'power2.out' });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Cursor glow for glass cards
  useEffect(() => {
    const cards = document.querySelectorAll('.glass-card');
    const handleMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };
    cards.forEach((card) => {
      card.addEventListener('mousemove', handleMove as EventListener, { passive: true });
    });
    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mousemove', handleMove as EventListener);
      });
    };
  }, []);

  return (
    <div className="corporate-page">
      {/* Navigation */}
      <nav className="corporate-nav">
        <a href="/" className="corporate-logo">MSC Arabia</a>
        <ul className="corporate-nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#products">Products</a></li>
          <li><a href="https://game.mscarabia.com">Play</a></li>
        </ul>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="hero-stage" style={{ paddingTop: '120px' }}>
        <div className="hero-badge">Technology &middot; Gaming &middot; Innovation</div>
        <h1 className="hero-stage-title">
          <span style={{ color: '#fda9ff', textShadow: '0 0 30px rgba(253,169,255,0.4)' }}>MSC</span> Arabia
        </h1>
        <p className="hero-stage-subtitle">
          We build premium digital experiences. Fast, private, open source.
        </p>

        <div style={{ display: 'flex', gap: '16px', zIndex: 10, marginTop: '8px' }}>
          <a href="#products" className="corporate-cta-btn" style={{ fontSize: '0.95rem', padding: '12px 28px' }}>
            Our Products
          </a>
          <a
            href="#about"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 28px',
              borderRadius: '999px',
              color: '#e7deff',
              fontWeight: 700,
              fontSize: '0.95rem',
              fontFamily: "'Fredoka One', cursive",
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              textDecoration: 'none',
              transition: 'border-color 0.2s',
            }}
          >
            Learn More
          </a>
        </div>

        {/* Crescent + Orb */}
        <div ref={orbContainerRef} className="hero-crescent-area">
          <CrescentRing width={900} height={420} />
          <GlassOrb size={220}>
            <span style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '1.5rem',
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              letterSpacing: '-0.02em',
            }}>MSC</span>
          </GlassOrb>
        </div>

        <div className="scroll-indicator">
          <span className="scroll-chevron">&#8964;</span>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-section corporate-section">
        <h2 className="corporate-section-title">What We Believe</h2>
        <p className="corporate-section-sub">
          Technology should be fast, private, and delightful. We build products that respect your time and attention.
        </p>
        <div className="corporate-grid">
          {VALUES.map((v) => (
            <div key={v.title} className="glass-card corporate-card">
              <div className="corporate-card-icon">{v.icon}</div>
              <div className="corporate-card-title">{v.title}</div>
              <p className="corporate-card-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="scroll-section">
        <div className="corporate-stat-grid">
          {STATS.map((s) => (
            <div key={s.label} className="corporate-stat">
              <div className="corporate-stat-value">{s.value}</div>
              <div className="corporate-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section id="products" className="scroll-section corporate-section">
        <h2 className="corporate-section-title">Our Products</h2>
        <p className="corporate-section-sub">
          Crafted with obsessive attention to detail. Every pixel, every frame, every interaction.
        </p>
        <div className="corporate-grid" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {PRODUCTS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              className="glass-card corporate-card"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="corporate-card-icon">{p.icon}</div>
              <div className="corporate-card-title">{p.name}</div>
              <p className="corporate-card-desc">{p.desc}</p>
              <span style={{
                display: 'inline-block',
                marginTop: '16px',
                color: '#fda9ff',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}>
                Play now &rarr;
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="corporate-cta-section">
        <h2 className="cta-heading" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
          Ready to play?
        </h2>
        <p className="cta-subtext">No signup. No ads. Just tap.</p>
        <a href="https://game.mscarabia.com" className="corporate-cta-btn">
          <svg style={{ width: 22, height: 22 }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play Don&apos;t Touch Purple
        </a>
      </section>

      <footer className="corporate-footer">
        <span>&copy; {new Date().getFullYear()} MSC Arabia &middot; Technology. Gaming. Innovation.</span>
      </footer>
    </div>
  );
}
