import { logger } from './logger';

export const visualA11y = {
  patterns: {
    purple: 'repeating-linear-gradient(45deg, #fda9ff 0, #fda9ff 4px, transparent 4px, transparent 6px)',
    safe: 'radial-gradient(circle, #4ade80 20%, transparent 20%)',
    danger: 'repeating-conic-gradient(#ef4444 0% 25%, transparent 0% 50%) 0 0 / 10px 10px',
    ice: 'linear-gradient(135deg, rgba(147,197,253,0.4) 25%, transparent 25%) -50% 0, linear-gradient(225deg, rgba(147,197,253,0.4) 25%, transparent 25%) -50% 0, linear-gradient(315deg, rgba(147,197,253,0.4) 25%, transparent 25%), linear-gradient(45deg, rgba(147,197,253,0.4) 25%, transparent 25%)',
    bomb: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #f9bd22 2px, #f9bd22 4px)',
  },

  icons: {
    hearts: '\u2764\uFE0F', clock: '\u23F1\uFE0F', score: '\uD83C\uDFC6', play: '\u25B6\uFE0F',
    pause: '\u23F8\uFE0F', retry: '\uD83D\uDD04', settings: '\u2699\uFE0F', shop: '\uD83D\uDED2',
    leaderboards: '\uD83D\uDCCA', boss: '\u2694\uFE0F', combo: '\u26A1', share: '\uD83D\uDCE4',
    challenge: '\uD83D\uDD17', colorblind: '\uD83C\uDFA8', lite: '\uD83D\uDD0B', offset: '\uD83D\uDC46',
    iconMode: '\uD83C\uDF10',
  },

  applyColorblind(enabled: boolean) {
    document.documentElement.classList.toggle('colorblind-active', enabled);
    if (enabled) {
      Object.entries(this.patterns).forEach(([type, css]) => {
        document.documentElement.style.setProperty(`--pattern-${type}`, css);
      });
    } else {
      Object.keys(this.patterns).forEach(type => {
        document.documentElement.style.removeProperty(`--pattern-${type}`);
      });
    }
  },

  applyLiteMode(enabled: boolean) {
    document.documentElement.classList.toggle('lite-mode', enabled);
    document.documentElement.style.setProperty('--particle-density', enabled ? '0' : '1');
    document.documentElement.style.setProperty('--fx-blur', enabled ? '0px' : '8px');
    if (enabled) logger.info('Lite mode enabled: reduced FX & capped render load');
  },
};
