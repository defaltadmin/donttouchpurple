import type { Achievement } from '../utils/achievements';

/**
 * All achievement definitions.
 * GameEngine constructor loops through this array to register them.
 */
export const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked'>[] = [
  // Core
  { id: 'first_blood',    name: 'First Strike',       desc: 'Clear your first cell',              icon: '⚔️' },
  { id: 'survivor',       name: 'Iron Will',           desc: 'Reach last heart and survive 30s',   icon: '💪' },
  { id: 'daily_master',   name: 'Daily Grind',         desc: "Complete today's challenge",          icon: '📅' },
  // Score milestones
  { id: 'score_100',      name: 'Getting Started',     desc: 'Score 100 points',                   icon: '🌟' },
  { id: 'score_500',      name: 'Rising Star',         desc: 'Score 500 points',                   icon: '⭐' },
  { id: 'score_1000',     name: 'Thousand Club',       desc: 'Score 1,000 points',                 icon: '💫' },
  { id: 'score_2500',     name: 'Quarter King',        desc: 'Score 2,500 points',                 icon: '👑' },
  { id: 'score_5000',     name: 'Half Hero',           desc: 'Score 5,000 points',                 icon: '🏆' },
  { id: 'score_9999',     name: 'Max Master',          desc: 'Score 9,999 points (max)',           icon: '💎' },
  // Streak milestones
  { id: 'streak_10',      name: 'On Fire',             desc: 'Reach a 10-streak',                  icon: '🔥' },
  { id: 'streak_25',      name: 'Unstoppable',         desc: 'Reach a 25-streak',                  icon: '💥' },
  { id: 'streak_50',      name: 'Legend',              desc: 'Reach a 50-streak',                  icon: '⚡' },
  // Mode completions
  { id: 'classic_win',    name: 'Classic Champion',    desc: 'Win a Classic game',                 icon: '🎯' },
  { id: 'evolve_win',     name: 'Evolution Complete',  desc: 'Win an Evolve game',                 icon: '🧬' },
  // Boss
  { id: 'boss_defeat',    name: 'Boss Slayer',         desc: 'Defeat a boss event',                icon: '🐉' },
  { id: 'boss_inversion', name: 'Mind Bender',         desc: 'Survive an Inversion event',         icon: '🔄' },
  // Bombs
  { id: 'bomb_defuse',    name: 'Defuser',             desc: 'Defuse 10 bombs',                    icon: '💣' },
  { id: 'bomb_master',    name: 'Bomb Expert',         desc: 'Defuse 50 bombs',                    icon: '🧨' },
  // Daily streak
  { id: 'streak_3',       name: 'Consistent',          desc: '3-day daily streak',                 icon: '📅' },
  { id: 'streak_7',       name: 'Weekly Warrior',      desc: '7-day daily streak',                 icon: '🗓️' },
  { id: 'streak_14',      name: 'Fortnight Fighter',   desc: '14-day daily streak',                icon: '🏅' },
  { id: 'streak_30',      name: 'Monthly Master',      desc: '30-day daily streak',                icon: '👑' },
  // Dust
  { id: 'dust_1000',      name: 'Dust Collector',      desc: 'Earn 1,000 dust total',              icon: '💜' },
  { id: 'dust_10000',     name: 'Dust Baron',          desc: 'Earn 10,000 dust total',             icon: '💰' },
  // Speed
  { id: 'speed_2x',       name: 'Quick Draw',          desc: 'Reach 2.0x speed',                   icon: '⚡' },
  { id: 'speed_3x',       name: 'Lightning Fast',      desc: 'Reach 3.0x speed',                   icon: '🌩️' },
  // Powerups
  { id: 'shield_5',       name: 'Shield Bearer',       desc: 'Collect 5 shields in one game',      icon: '🛡️' },
  { id: 'freeze_5',       name: 'Frost Master',        desc: 'Collect 5 freezes in one game',      icon: '❄️' },
  // Perfect round
  { id: 'perfect_round',  name: 'Untouchable',         desc: 'Complete a round with no damage',    icon: '✨' },
  // Play count
  { id: 'games_50',       name: 'Dedicated',           desc: 'Play 50 games',                      icon: '🎮' },
  { id: 'games_200',      name: 'Veteran',             desc: 'Play 200 games',                     icon: '🏅' },
  // Secret
  { id: 'secret_purple_tap', name: '???',              desc: '???',                                icon: '🔮' },
  { id: 'secret_speed_run',  name: '???',              desc: '???',                                icon: '🔮' },
];
