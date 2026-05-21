import React, { useId } from "react";

/**
 * DTP Icon — inline SVG icons with unique filter IDs to avoid DOM conflicts.
 * All icons from the Stitch design system, inlined for zero network requests.
 */

export type IconName = PowerupIcon | UIIcon | AchievementIcon | StageIcon;

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export type PowerupIcon =
  | "shield" | "freeze" | "multiplier" | "medpack"
  | "bomb" | "ice" | "lightning" | "safe_cell"
  | "purple_cell" | "void_cell";

export type UIIcon =
  | "heart" | "heart_empty" | "star" | "bolt" | "fire"
  | "combo" | "clock" | "speed" | "trophy" | "play"
  | "pause" | "settings" | "close" | "back" | "share"
  | "copy" | "info" | "warning" | "checkmark" | "chevron";

export type AchievementIcon =
  | "first_win" | "void_walker" | "streak_100" | "speed_demon"
  | "untouchable" | "combo_king" | "purple_slayer"
  | "marathon" | "perfect_round" | "boss_slayer";

export type StageIcon =
  | "3x3" | "4x4" | "5x5" | "6x6" | "max" | "arrow" | "lock";

export function Icon({ name, size = 24, ...svgProps }: IconProps) {
  // useId generates a unique prefix per component instance — prevents filter ID collisions
  const uid = useId().replace(/:/g, "");

  const svg = renderIcon(name, uid);
  if (!svg) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      {...svgProps}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function renderIcon(name: string, uid: string): string {
  const g = (id: string) => `${uid}-${id}`;

  switch (name) {
    // ── POWERUPS ──
    case "shield":
      return `
        <defs>
          <linearGradient id="${g("sg")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f3aeff"/>
            <stop offset="100%" stop-color="#fda9ff"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <path d="M12 2L4 5v6c0 5.5 3.5 10.3 8 12 4.5-1.7 8-6.5 8-12V5l-8-3z" fill="none" stroke="url(#${g("sg")})" stroke-width="2" stroke-linejoin="round" filter="url(#${g("gf")})"/>
        <path d="M12 7l1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L12 7z" fill="url(#${g("sg")})" filter="url(#${g("gf")})"/>`;

    case "freeze":
      return `
        <defs>
          <linearGradient id="${g("fg")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#93c5fd"/>
            <stop offset="100%" stop-color="#ffffff"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <g fill="none" stroke="url(#${g("fg")})" stroke-width="2" stroke-linecap="round" filter="url(#${g("gf")})">
          <path d="M12 2v20M2 12h20M19 7l-14 10M5 7l14 10"/>
          <path d="M12 7l1.5-1.5M12 7l-1.5-1.5M12 17l1.5 1.5M12 17l-1.5 1.5M7 12l-1.5 1.5M7 12l-1.5-1.5M17 12l1.5 1.5M17 12l1.5-1.5"/>
        </g>`;

    case "multiplier":
      return `
        <defs>
          <linearGradient id="${g("mg")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fb923c"/>
            <stop offset="100%" stop-color="#f9bd22"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <path d="M12 2l9 10-9 10-9-10 9-10z" fill="none" stroke="url(#${g("mg")})" stroke-width="2" filter="url(#${g("gf")})"/>
        <path d="M8 11.5c0-.8.4-1.5 1.2-1.5h1.5c.8 0 1.2.7 1.2 1.5 0 1.5-3.9 1.5-3.9 3h3.9M13 10l3 5M16 10l-3 5" fill="none" stroke="url(#${g("mg")})" stroke-width="1.5" stroke-linecap="round" filter="url(#${g("gf")})"/>`;

    case "medpack":
      return `
        <defs>
          <linearGradient id="${g("mdg")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ef4444"/>
            <stop offset="100%" stop-color="#f3aeff"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="url(#${g("mdg")})" stroke-width="2" filter="url(#${g("gf")})"/>
        <path d="M12 8v6M9 11h6" fill="none" stroke="url(#${g("mdg")})" stroke-width="2" stroke-linecap="round" filter="url(#${g("gf")})"/>`;

    case "bomb":
      return `
        <defs>
          <radialGradient id="${g("bg")}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fb923c"/>
            <stop offset="100%" stop-color="#ef4444"/>
          </radialGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <circle cx="11" cy="13" r="7" fill="none" stroke="url(#${g("bg")})" stroke-width="2" filter="url(#${g("gf")})"/>
        <path d="M15 9l3-3M19 5l1-1" fill="none" stroke="url(#${g("bg")})" stroke-width="2" stroke-linecap="round" filter="url(#${g("gf")})"/>
        <path d="M21 3l1 1M21 5l-1-1" fill="none" stroke="#f9bd22" stroke-width="2" stroke-linecap="round" filter="url(#${g("gf")})"/>`;

    case "ice":
      return `
        <defs>
          <linearGradient id="${g("ig")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#93c5fd"/>
            <stop offset="100%" stop-color="#ffffff"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="url(#${g("ig")})" stroke-width="2" filter="url(#${g("gf")})"/>
        <path d="M7 7l4 4M17 7l-3 3M17 17l-10-10M12 17l-2-2M20 12l-3-1" fill="none" stroke="url(#${g("ig")})" stroke-width="1.5" stroke-linecap="round" filter="url(#${g("gf")})"/>`;

    case "lightning":
      return `
        <defs>
          <linearGradient id="${g("lg")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f9bd22"/>
            <stop offset="100%" stop-color="#ffffff"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#${g("lg")})" filter="url(#${g("gf")})"/>`;

    case "safe_cell":
      return `
        <defs>
          <linearGradient id="${g("scg")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#93c5fd"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="url(#${g("scg")})" stroke-width="2" filter="url(#${g("gf")})"/>
        <path d="M9 12l2 2 4-4" fill="none" stroke="url(#${g("scg")})" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#${g("gf")})"/>`;

    case "purple_cell":
      return `
        <defs>
          <linearGradient id="${g("pcg")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fda9ff"/>
            <stop offset="100%" stop-color="#c026d3"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="url(#${g("pcg")})" stroke-width="2" filter="url(#${g("gf")})"/>
        <path d="M9 9l6 6M15 9l-6 6" fill="none" stroke="url(#${g("pcg")})" stroke-width="2" stroke-linecap="round" filter="url(#${g("gf")})"/>`;

    case "void_cell":
      return `
        <defs>
          <linearGradient id="${g("vg")}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#c026d3"/>
            <stop offset="100%" stop-color="#000000"/>
          </linearGradient>
          <filter id="${g("gf")}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="#c026d3" stroke-width="1.5" filter="url(#${g("gf")})"/>
        <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="url(#${g("vg")})" filter="url(#${g("gf")})"/>
        <path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="#000" filter="url(#${g("gf")})"/>`;

    // ── UI ICONS ──
    case "heart":
      return `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7Z" fill="#ffb4ab"/>`;

    case "heart_empty":
      return `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7 7-7Z" fill="none" stroke="#ffb4ab" stroke-width="2"/>`;

    case "star":
      return `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#f9bd22"/>`;

    case "bolt":
      return `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="var(--gold, #f9bd22)"/>`;

    case "fire":
      return `<path d="M12 2C8 6 6 9 6 13c0 3.31 2.69 6 6 6s6-2.69 6-6c0-4-2-7-6-11z" fill="url(#fire-g)" stroke="none"/>
      <defs><linearGradient id="fire-g" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#f9bd22"/></linearGradient></defs>`;

    case "combo":
      return `<g fill="none" stroke="var(--accent, #fda9ff)" stroke-width="2" stroke-linecap="round">
        <circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/></g>`;

    case "clock":
      return `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 7v5l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

    case "speed":
      return `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 12l4-6" fill="none" stroke="var(--danger, #ffb4ab)" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="12" r="1.5" fill="var(--danger, #ffb4ab)"/>`;

    case "trophy":
      return `<path d="M8 2h8v4a4 4 0 0 1-8 0V2z" fill="none" stroke="var(--gold, #f9bd22)" stroke-width="2"/>
      <path d="M6 4H4a2 2 0 0 0 0 4h1M18 4h2a2 2 0 0 1 0 4h-1" fill="none" stroke="var(--gold, #f9bd22)" stroke-width="2"/>
      <path d="M10 14h4v2a2 2 0 0 1-4 0v-2zM8 18h8" fill="none" stroke="var(--gold, #f9bd22)" stroke-width="2"/>`;

    case "play":
      return `<path d="M8 5v14l11-7z" fill="var(--accent, #fda9ff)"/>`;

    case "pause":
      return `<rect x="7" y="5" width="3" height="14" rx="1" fill="currentColor"/>
      <rect x="14" y="5" width="3" height="14" rx="1" fill="currentColor"/>`;

    case "settings":
      return `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>`;

    case "close":
      return `<path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

    case "back":
      return `<path d="M19 12H5M12 19l-7-7 7-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

    case "share":
      return `<circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" fill="none" stroke="currentColor" stroke-width="2"/>`;

    case "copy":
      return `<rect x="9" y="9" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="2"/>`;

    case "info":
      return `<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 16v-4M12 8h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;

    case "warning":
      return `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="var(--danger, #ffb4ab)" stroke-width="2"/>
      <path d="M12 9v4M12 17h.01" fill="none" stroke="var(--danger, #ffb4ab)" stroke-width="2" stroke-linecap="round"/>`;

    case "checkmark":
      return `<path d="M20 6L9 17l-5-5" fill="none" stroke="var(--success, #4ade80)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

    case "chevron":
      return `<path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

    default:
      return "";
  }
}
