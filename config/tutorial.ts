// config/tutorial.ts
export type TutorialStep = {
  id: number;
  title: string;
  body: string;
  hint: string;
  highlight: 'basics' | 'rare' | 'powerup' | 'shape';
  duration?: number; // auto-advance time in ms (0 = tap to continue)
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Tap Safe Cells",
    body: "Score by tapping blue, green, yellow, and other safe colors. Leave purple alone.",
    hint: "Safe cells score. Purple hurts.",
    highlight: 'basics',
    duration: 0,
  },
  {
    id: 2,
    title: "Danger Can Change",
    body: "When rare mode appears, the warning tells you the new danger color. Avoid that color until the warning ends.",
    hint: "Read the warning before tapping.",
    highlight: 'rare',
    duration: 0,
  },
  {
    id: 3,
    title: "Use Powerups",
    body: "Heart heals, shield blocks one mistake, freeze slows the board, and 2x doubles points for a short time.",
    hint: "Powerups are safe to tap.",
    highlight: 'powerup',
    duration: 0,
  },
  {
    id: 4,
    title: "Use Shapes Too",
    body: "Rare danger cells can use different shapes. If colors feel close, use the shape as the second clue.",
    hint: "Shape helps confirm danger.",
    highlight: 'shape',
    duration: 0,
  },
];

export const MAX_TUTORIAL_GAMES = 3;
