import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'fs';

const classicSvg = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="g"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="96" height="96" rx="20" fill="#1a0a2e"/>
  <g transform="translate(20,20)">
    <rect x="0" y="0" width="16" height="16" rx="3" fill="#00ff88" filter="url(#g)"/>
    <rect x="20" y="0" width="16" height="16" rx="3" fill="#2d1b4e"/>
    <rect x="40" y="0" width="16" height="16" rx="3" fill="#2d1b4e"/>
    <rect x="0" y="20" width="16" height="16" rx="3" fill="#2d1b4e"/>
    <rect x="20" y="20" width="16" height="16" rx="3" fill="#00ff88" filter="url(#g)"/>
    <rect x="40" y="20" width="16" height="16" rx="3" fill="#ff2d55" filter="url(#g)"/>
    <rect x="0" y="40" width="16" height="16" rx="3" fill="#2d1b4e"/>
    <rect x="20" y="40" width="16" height="16" rx="3" fill="#2d1b4e"/>
    <rect x="40" y="40" width="16" height="16" rx="3" fill="#00ff88" filter="url(#g)"/>
  </g>
</svg>`;

const evolveSvg = `<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="g"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="ig" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#00ffff"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient>
  </defs>
  <rect width="96" height="96" rx="20" fill="#1a0a2e"/>
  <g transform="translate(14,14)">
    <rect x="0" y="0" width="12" height="12" rx="2" fill="#00ff88" filter="url(#g)"/>
    <rect x="14" y="0" width="12" height="12" rx="2" fill="#00ff88" filter="url(#g)"/>
    <rect x="28" y="0" width="12" height="12" rx="2" fill="#00ff88" filter="url(#g)"/>
    <rect x="42" y="0" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="56" y="0" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="0" y="14" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="14" y="14" width="12" height="12" rx="2" fill="#00ffff" filter="url(#g)"/>
    <rect x="28" y="14" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="42" y="14" width="12" height="12" rx="2" fill="#00ffff" filter="url(#g)"/>
    <rect x="56" y="14" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="0" y="28" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="14" y="28" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="28" y="28" width="12" height="12" rx="2" fill="#ffffff" filter="url(#g)"/>
    <rect x="42" y="28" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="56" y="28" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="0" y="42" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="14" y="42" width="12" height="12" rx="2" fill="#00ffff" filter="url(#g)"/>
    <rect x="28" y="42" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="42" y="42" width="12" height="12" rx="2" fill="#00ffff" filter="url(#g)"/>
    <rect x="56" y="42" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="0" y="56" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="14" y="56" width="12" height="12" rx="2" fill="#2d1b4e"/>
    <rect x="28" y="56" width="12" height="12" rx="2" fill="#8b5cf6" filter="url(#g)"/>
    <rect x="42" y="56" width="12" height="12" rx="2" fill="#8b5cf6" filter="url(#g)"/>
    <rect x="56" y="56" width="12" height="12" rx="2" fill="#8b5cf6" filter="url(#g)"/>
  </g>
  <path d="M36 48c0-5-4-9-8-9s-8 4-8 9 4 9 8 9 8-4 8-9zm20 0c0-5-4-9-8-9s-8 4-8 9 4 9 8 9 8-4 8-9" fill="none" stroke="url(#ig)" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

// Generate Classic icon
const classicResvg = new Resvg(classicSvg, { fitTo: { mode: 'width', value: 96 } });
const classicPng = classicResvg.render();
const classicPngData = classicPng.asPng();
writeFileSync('public/icons/classic.png', classicPngData);
console.log('Created public/icons/classic.png');

// Generate Evolve icon
const evolveResvg = new Resvg(evolveSvg, { fitTo: { mode: 'width', value: 96 } });
const evolvePng = evolveResvg.render();
const evolvePngData = evolvePng.asPng();
writeFileSync('public/icons/evolve.png', evolvePngData);
console.log('Created public/icons/evolve.png');

console.log('Done! Both icons generated at 96x96px.');
