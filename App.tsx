/*
 * ================================================================
 *  DON'T TOUCH THE PURPLE  —  v5.2
 * ================================================================
 *
 *  All game logic, UI, and styles live in this single file.
 *
 *  WHAT'S NEW IN v5.1
 *  ──────────────────
 *  • Spin speed overhaul: level-based, +5% per level, hard cap at ~2.2s/rev
 *  • CW/CCW rotation epochs: direction flips every 4 levels (seeded deterministic)
 *  • Rotation indicator arrows: translucent SVG arrows behind the grid signal direction
 *  • Fixed iMultRef direction bug: level-up now correctly accelerates tick interval
 *  • Level-up toast no longer duplicates (pwr-zone rendered once per mode)
 *  • Toast repositioned to bottom-30% — never overlaps HUD or header
 *  • Duo mode spacing: grids spread far apart on phone, no finger overlap
 *  • PillRow<T> generic fixed: now accepts number | string (NumPlayers fix)
 *  • spinLevel resets correctly on startGame and goMenu
 *
 *  WHAT'S IN v5.0
 *  ──────────────
 *  • Balloon-burst pop animation with shards
 *  • Purple cells show NO symbol
 *  • Corrected keyboard layout for all grid stages
 *  • "Endless" renamed to "Evolve Mode" throughout
 *  • Evolve mode max grid: 5×5 touch / 4×4 keyboard
 *  • Colorblind mode with shape symbols + SVG filters
 *  • Cell size option: S / M / L
 *  • Developer credit footer
 *  • Privacy / cookie notice banner
 *  • Settings drawer with ⚙ icon; icon-enhanced menu labels
 * ================================================================
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Firebase (modular npm SDK) ──────────────────────────────────
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, addDoc, getDocs, doc, setDoc,
  query, orderBy, limit, serverTimestamp
} from "firebase/firestore";

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDGUxT4nhAPYsxzmOAESKsFgkd4jhUif4o",
  authDomain:        "dont-touch-purple.firebaseapp.com",
  projectId:         "dont-touch-purple",
  storageBucket:     "dont-touch-purple.firebasestorage.app",
  messagingSenderId: "46782482111",
  appId:             "1:46782482111:web:a47a1b9afc5feba4eaa80a",
  measurementId:     "G-QVXYQ7C2WN",
};

let _db: any = null;

export function getDB(): any {
  try {
    if (_db) return _db;
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    _db = getFirestore(app);
    return _db;
  } catch(e) {
    console.warn("[DTP-Firebase] Firestore init failed:", e);
    return null;
  }
}



// ─── Constants ──────────────────────────────────────────────────

// ─── New collection names ────────────────────────────────────────
// lb_global: merged leaderboard (classic + evolve in one collection)
// dust_wallet: per-player dust totals
// weekly_bonus: tracks weekly top-3 bonus payouts

async function fbAddScoreGlobal(entry: {score:number,initials:string,date:string,mode:"classic"|"evolve"}): Promise<void> {
  const db = getDB();
  if (!db) return;
  await addDoc(collection(db, "lb_global"), { ...entry, ts: serverTimestamp() });
}

async function fbFetchTop20Global(): Promise<any[]> {
  const db = getDB();
  if (!db) throw new Error("no db");
  try {
    const q = query(collection(db, "lb_global"), orderBy("score","desc"), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return { score: data.score ?? 0, initials: data.initials ?? "???", date: data.date ?? "", mode: data.mode ?? "classic" };
    });
  } catch(e) {
    throw e;
  }
}

async function fbSyncDust(name: string, dust: number): Promise<void> {
  const db = getDB();
  if (!db) return;
  // Use setDoc with a stable doc ID (sanitized player name) so we upsert instead of accumulate
  const docRef = doc(db, "dust_wallet", name.toLowerCase().replace(/\s+/g, "_"));
  await setDoc(docRef, { name, dust, ts: serverTimestamp() }, { merge: true });
}

async function fbCheckWeeklyBonus(name: string): Promise<number> {
  // Check if this player is in top 3 weekly — returns bonus dust (0 or 500)
  const db = getDB();
  if (!db) return 0;
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const q = query(collection(db, "lb_global"), orderBy("score","desc"), limit(50));
    const snap = await getDocs(q);
    const entries = snap.docs.map(d => d.data());
    // Filter by roughly this week (date string comparison is approximate)
    const weekly = entries.filter(e => e.date >= oneWeekAgo);
    const top3 = weekly.slice(0, 3);
    return top3.some(e => e.initials === name) ? 500 : 0;
  } catch { return 0; }
}


// ─── Constants ──────────────────────────────────────────────────
const INIT_MS        = 2000;
const MIN_MS         = 380;
const DECAY_EXP      = 0.960;
const DECAY_EVERY    = 5;
const MAX_HEARTS     = 5;
const STAGE_TAPS_NEEDED = 12;
const LS_P1_KEYS     = "dtp-keys-p1";
const LS_P2_KEYS     = "dtp-keys-p2";
const LS_LB_CLASSIC  = "dtp-lb-classic";
const LS_LB_EVOLVE   = "dtp-lb-evolve";
const LS_PRIVACY_OK  = "dtp-privacy-ok";
// New localStorage keys
const LS_PLAYER_NAME = "dtp-player-name";
const LS_DUST        = "dtp-dust";
const LS_ENERGY      = "dtp-energy-data"; // {count, lastRegen: timestamp}
const LS_SHOP        = "dtp-shop";        // {unlockedThemes:[],equippedTheme:string}
const LS_WEEKLY_BONUS = "dtp-weekly-bonus"; // {checked: datestring}
const LS_STORED_PWR  = "dtp-stored-pwr";   // {freeze:number, shield:number}

const MAX_ENERGY     = 5;
const ENERGY_REGEN_MS = 15 * 60 * 1000; // 15 min
const DUST_PER_ENERGY = 50;

// Themes available in shop
const SHOP_THEMES: { id:string; name:string; cost:number; colors:{bg:string;purple:string;accent:string;text:string} }[] = [
  { id:"default",  name:"Default",  cost:0,    colors:{bg:"#0d0820",purple:"#c026d3",accent:"#f0abfc",text:"#f0eaff"} },
  { id:"neon",     name:"Neon",     cost:800,  colors:{bg:"#001a1a",purple:"#00ffe0",accent:"#00ffa0",text:"#e0fff8"} },
  { id:"midnight", name:"Midnight", cost:600,  colors:{bg:"#060614",purple:"#818cf8",accent:"#c7d2fe",text:"#e0e7ff"} },
  { id:"pastel",   name:"Pastel",   cost:700,  colors:{bg:"#fdf0ff",purple:"#c084fc",accent:"#f9a8d4",text:"#3b0764"} },
  { id:"blood",    name:"Blood",    cost:900,  colors:{bg:"#0f0000",purple:"#ef4444",accent:"#fca5a5",text:"#fff0f0"} },
  { id:"ocean",    name:"Ocean",    cost:750,  colors:{bg:"#000c1a",purple:"#0ea5e9",accent:"#7dd3fc",text:"#e0f7ff"} },
];

// Shop powerup items (one-time-use charges carried into next game)
const SHOP_POWERUPS: { id:string; name:string; icon:string; cost:number; desc:string }[] = [
  { id:"freeze1", name:"Freeze ×1", icon:"❄", cost:120, desc:"Save for use mid-game" },
  { id:"freeze2", name:"Freeze ×2", icon:"❄❄", cost:220, desc:"Two freeze charges" },
  { id:"shield1", name:"Shield ×1", icon:"◈", cost:150, desc:"Save for use mid-game" },
  { id:"shield2", name:"Shield ×2", icon:"◈◈", cost:280, desc:"Two shield charges" },
];

const STAGES: { cols: number; rows: number; total: number; name: string; mask: number[] | null }[] = [
  // Stage 0 — 2×2 square (4 cells)
  { cols: 2, rows: 2, total: 4,  name: "Spark",    mask: null },
  // Stage 1 — Plus / cross in 3×3 (5 active)
  { cols: 3, rows: 3, total: 9,  name: "Cross",    mask: [1,3,4,5,7] },
  // Stage 2 — 3×3 full square (9 cells)
  { cols: 3, rows: 3, total: 9,  name: "Grid",     mask: null },
  // Stage 3 — Diamond in 4×4 (8 active)
  { cols: 4, rows: 4, total: 16, name: "Diamond",  mask: [1,2,4,7,8,11,13,14] },
  // Stage 4 — 4×3 full (12 cells)
  { cols: 4, rows: 3, total: 12, name: "Block",    mask: null },
  // Stage 5 — Ring / hollow 4×4 (12 border cells)
  { cols: 4, rows: 4, total: 16, name: "Ring",     mask: [0,1,2,3,4,7,8,11,12,13,14,15] },
  // Stage 6 — L-shape in 3×4 (9 active)
  { cols: 3, rows: 4, total: 12, name: "Spiral",   mask: [0,1,2,5,8,9,10,11,7] },
  // Stage 7 — 4×4 full (16 cells)
  { cols: 4, rows: 4, total: 16, name: "Chaos",    mask: null },
  // Stage 8 — X shape in 5×5 (9 active)
  { cols: 5, rows: 5, total: 25, name: "X-Ray",    mask: [0,4,6,8,12,16,18,20,24] },
  // Stage 9 — 5×5 full (25 cells)
  { cols: 5, rows: 5, total: 25, name: "APEX",     mask: null },
];

// ─── Expanded evolve pattern library (item 13) ───────────────────
// Each pattern is a mask. Codes are for internal reference only.
// Patterns support 2×2 through 5×5. Null means full grid.
const EVOLVE_PATTERNS: { cols: number; rows: number; mask: number[] | null; minStage: number }[] = [
  // 2×2
  { cols:2, rows:2, mask: null, minStage: 0 },
  // 3×3 shapes
  { cols:3, rows:3, mask:[1,3,4,5,7], minStage:1 },           // cross
  { cols:3, rows:3, mask:null, minStage:1 },                   // full 3×3
  { cols:3, rows:3, mask:[0,2,4,6,8], minStage:1 },           // corners+center
  { cols:3, rows:3, mask:[0,1,2,3,5,6,7,8], minStage:1 },    // ring 3×3
  { cols:3, rows:3, mask:[0,1,2,5,7,8], minStage:1 },         // L-shape
  { cols:3, rows:3, mask:[1,3,5,7], minStage:1 },             // edges
  { cols:3, rows:3, mask:[0,2,3,5,6,8], minStage:1 },        // Z/S wave
  { cols:3, rows:3, mask:[0,1,2,4,6,7,8], minStage:1 },      // U-shape
  // 4×4 shapes
  { cols:4, rows:4, mask:[1,2,4,7,8,11,13,14], minStage:3 }, // diamond
  { cols:4, rows:4, mask:null, minStage:3 },                   // full 4×4
  { cols:4, rows:4, mask:[0,1,2,3,4,7,8,11,12,13,14,15], minStage:3 }, // ring
  { cols:4, rows:4, mask:[0,3,5,6,9,10,12,15], minStage:3 }, // X pattern
  { cols:4, rows:4, mask:[0,1,2,4,5,8,9,12,13,14], minStage:3 }, // staircase
  { cols:4, rows:4, mask:[0,1,4,5,10,11,14,15], minStage:3 }, // 4 corners blocks
  { cols:4, rows:4, mask:[1,2,4,6,7,9,11,13,14], minStage:3 }, // arrow
  { cols:4, rows:3, mask:null, minStage:3 },                   // 4×3 block
  // 5×5 shapes
  { cols:5, rows:5, mask:[0,4,6,8,12,16,18,20,24], minStage:7 }, // X
  { cols:5, rows:5, mask:null, minStage:7 },                   // full 5×5
  { cols:5, rows:5, mask:[2,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,22], minStage:7 }, // hollow cross
  { cols:5, rows:5, mask:[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24], minStage:7 }, // frame
  { cols:5, rows:5, mask:[0,2,4,6,8,10,12,14,16,18,20,22,24], minStage:7 }, // checkerboard
  { cols:5, rows:5, mask:[0,1,4,5,6,7,8,9,10,12,14,15,16,17,18,19,20,23,24], minStage:7 }, // T+
  // Mixed unique
  { cols:3, rows:4, mask:[0,1,2,5,8,9,10,11,7], minStage:2 }, // spiral
  { cols:3, rows:4, mask:[0,2,3,5,6,8,9,11], minStage:2 },   // zigzag column
];

// ─── Rare color mode table (item 17) ─────────────────────────────
const RARE_COLORS: { color: string; cssColor: string; bg: string }[] = [
  { color: "red",    cssColor: "#ef4444", bg: "radial-gradient(circle at 20% 20%, #4a1010 0%, #1a0404 55%)" },
  { color: "blue",   cssColor: "#3b82f6", bg: "radial-gradient(circle at 20% 20%, #0f1a4a 0%, #04071a 55%)" },
  { color: "green",  cssColor: "#22c55e", bg: "radial-gradient(circle at 20% 20%, #0a3018 0%, #041a0a 55%)" },
  { color: "orange", cssColor: "#f97316", bg: "radial-gradient(circle at 20% 20%, #4a2010 0%, #1a0a04 55%)" },
  { color: "cyan",   cssColor: "#06b6d4", bg: "radial-gradient(circle at 20% 20%, #083040 0%, #020e14 55%)" },
  { color: "pink",   cssColor: "#ec4899", bg: "radial-gradient(circle at 20% 20%, #4a1030 0%, #1a0410 55%)" },
  { color: "yellow", cssColor: "#eab308", bg: "radial-gradient(circle at 20% 20%, #3a3010 0%, #141004 55%)" },
];

// ─── Cell shape per turn (item 18) ───────────────────────────────
function pickCellShape(tick: number): CellShape {
  // Every ~8 ticks in evolve, potentially shift shape
  const cycle = Math.floor(tick / 8) % 5;
  if (cycle === 0) return "square";
  if (cycle === 1) return "circle";
  if (cycle === 2) return "square";
  if (cycle === 3) return "triangle";
  return "mixed"; // some square, some circle, some triangle
}


type CellType =
  | "inactive" | "void" | "purple"
  | "white" | "blue" | "red" | "orange" | "yellow"
  | "green" | "cyan" | "lime" | "teal"
  | "pink" | "rose" | "magenta"
  | "medpack" | "shield" | "freeze" | "multiplier"
  | "ice" | "hold";

// Evolve block shape: what shape all cells render as this turn
type CellShape = "square" | "circle" | "triangle" | "mixed";

// Rare color mode — "don't touch X" instead of purple
interface RareColorMode { active: boolean; color: string; cssColor: string; turnsLeft: number; }

type GameMode        = "classic" | "evolve";
type InputMode       = "touch" | "keyboard";
type Screen          = "menu" | "howto" | "leaderboard" | "keybind" | "playing" | "gameover" | "shop";
type NumPlayers      = 1 | 2;
type Winner          = "p1" | "p2" | "tie" | null;
type ColorblindMode  = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";


interface ActiveCell {
  idx: number;
  type: CellType;
  clicked: boolean;
  iceCount?: number;      // for ice blocks: taps remaining
  holdStart?: number;     // for hold blocks: timestamp when hold started
  holdRequired?: number;  // ms needed to hold
  _holding?: boolean;     // true while pointer is held down on a hold cell
}

interface PlayerState {
  cells:                CellType[];
  active:               ActiveCell[];
  score:                number;
  streak:               number;
  alive:                boolean;
  anim:                 Record<number, string>;
  health:               number;
  shield:               boolean;
  shieldCount:          number;
  freezeEnd:            number;
  multiplierEnd:        number;
  gridStage:            number;
  stageProgress:        number;
  patternIdx:           number;
  storedFreezeCharges:  number;  // saved from shop / in-game pickup
  storedShieldCharges:  number;  // saved from shop / in-game pickup
}

// ─── Seeded PRNG (Mulberry32) ────────────────────────────────────
// Each game gets a random 32-bit seed. All "random" progression events
// (rotation direction, shape epochs, rare color timing) derive from this
// seed so a replay of the same seed produces the same game.
function mulberry32(seed: number) {
  return function(): number {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function makeGameSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

// ─── Spin rotation plan ──────────────────────────────────────────────
const SPIN_BASE_DURATION = 14;
const SPIN_SPEED_CAP     = 2.2;
const SPIN_GROWTH        = 0.05;
const SPIN_EPOCH_LEVELS  = 4;

function getSpinConfig(level: number, gameSeed: number): { duration: number; direction: 1 | -1 } {
  const rawDur = SPIN_BASE_DURATION * Math.pow(1 - SPIN_GROWTH, level);
  const duration = Math.max(SPIN_SPEED_CAP, rawDur);
  const epoch = Math.floor(level / SPIN_EPOCH_LEVELS);
  // Seed per epoch derived from gameSeed — deterministic per game
  const epochSeed = (gameSeed ^ (epoch * 0x9e3779b9)) >>> 0;
  const rng = mulberry32(epochSeed);
  const direction: 1 | -1 = rng() > 0.5 ? 1 : -1;
  return { duration, direction };
}

interface LeaderboardEntry { score: number; date: string; initials: string; }

// ─── End-screen messages ─────────────────────────────────────────
const MESSAGES: { min: number; max: number; texts: string[] }[] = [
  { min: 0,  max: 4,  texts: [
    "Bro couldn't avoid ONE color. 💀",
    "The grid had 12 safe colors. You still lost. 🫠",
    "Have you considered... not touching purple?",
    "A goldfish would've scored higher. Scientifically.",
    "Congratulations on finding the worst possible score.",
    "Purple: 1. You: somehow less than 1.",
    "Even accidentally tapping would've been better.",
    "Did you mean to play a different game? 🙃",
  ]},
  { min: 5,  max: 9,  texts: [
    "Single digits. Your fingers need a firmware update.",
    "That was painful to watch. 😬",
    "You tapped purple like it was the goal.",
    "Somewhere, a purple cell is laughing at you.",
    "Basic difficulty called. It wants a refund.",
    "Bold strategy. Terrible execution.",
    "The tutorial is embarrassed on your behalf.",
  ]},
  { min: 10, max: 19, texts: [
    "Double digits. The minimum bar cleared. Barely.",
    "You made it to double digits. The grid is unimpressed.",
    "10+ — technically not a complete disaster.",
    "Your thumbs are getting warmed up, apparently.",
    "Progress! You avoided purple... some of the time.",
    "Not bad for your first conscious attempt.",
    "The grid acknowledges your existence. Faintly.",
  ]},
  { min: 20, max: 34, texts: [
    "Now we're cooking. Medium rare. 🔥",
    "The grid is starting to take you seriously.",
    "20+ — you have actual reflexes. Interesting.",
    "You're in the zone. Stay there.",
    "Your thumbs are having a moment.",
    "The purple is slightly nervous. Good.",
    "Something resembling skill detected.",
  ]},
  { min: 35, max: 49, texts: [
    "Serious reflexes detected. 🔥",
    "35+? Tell your friends. Brag a little.",
    "Your fingers are professionally trained, apparently.",
    "The grid didn't see that coming.",
    "Almost 50. The threshold of greatness.",
    "You tapped so fast the purple forgot its job.",
    "We're getting somewhere. Keep going.",
  ]},
  { min: 50, max: 74, texts: [
    "FIFTY. You're a natural. 🏆",
    "Half-century! Legendary energy.",
    "50+ means fast hands and questionable hobbies.",
    "The grid can't stop you. It's accepted this.",
    "Your mom would be proud. Probably.",
    "50+ and counting. You're becoming the grid.",
    "Genuine talent spotted. Finally.",
  ]},
  { min: 75, max: 99, texts: [
    "75+ is elite territory. 👑",
    "Approaching triple digits. A god awakens.",
    "Your fingers are a biological miracle.",
    "The purple filed a formal complaint. About you.",
    "At this point just go pro.",
    "75+ — researchers want to study your hands.",
    "The grid is scared. Keep it scared.",
  ]},
  { min: 100, max: 149, texts: [
    "TRIPLE DIGITS. Frame this. 🤯",
    "100+. You've transcended the average human.",
    "The game is genuinely afraid of you now.",
    "Are you using one hand?? Impressive.",
    "100+ — this score belongs in a museum.",
    "The grid has filed for emotional damages.",
    "Absolute specimen. This is real now.",
  ]},
  { min: 150, max: 999, texts: [
    "ARE YOU HUMAN?? 👾",
    "150+ — we need to talk about your reflexes.",
    "Legend. Myth. Tap god. You.",
    "The purple has retired. Because of you.",
    "Scientists want to study your nervous system.",
    "You broke the intended difficulty curve. Congratulations.",
    "This score should not be possible. And yet.",
    "GOAT status confirmed. No debate.",
  ]},
];

function getMessage(score: number): string {
  const bucket = MESSAGES.find(b => score >= b.min && score <= b.max) ?? MESSAGES[MESSAGES.length - 1];
  return bucket.texts[Math.floor(Math.random() * bucket.texts.length)];
}

// ─── Keyboard defaults ───────────────────────────────────────────
// Item 3: corrected layout
// P1: Row1: 1 2 3 4 | Row2: q w e r | Row3: a s d f | Row4: z x c v
const DEFAULT_P1_KEYS = ["1","2","3","4","q","w","e","r","a","s","d","f","z","x","c","v"];
// P2: Row1: 7 8 9 0 | Row2: u i o p | Row3: j k l ; | Row4: m , . /
const DEFAULT_P2_KEYS = ["7","8","9","0","u","i","o","p","j","k","l",";","m",",",".","/"];


function toLabel(k: string) {
  if (!k) return "?";
  if (/^[a-z]$/.test(k)) return k.toUpperCase();
  const m: Record<string,string> = {" ":"SPC",escape:"ESC",backspace:"⌫",enter:"↵",tab:"↹",",":","};
  return m[k] ?? (k.length === 1 ? k : k.slice(0,3).toUpperCase());
}
function loadKeys(key: string, def: string[]): string[] {
  try { const r = localStorage.getItem(key); if (r) { const p = JSON.parse(r); if (Array.isArray(p) && p.length === 16) return p; } } catch(_){}
  return [...def];
}
function saveKeys(key: string, val: string[]) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(_){} }

// ─── Bad word filter (client-side, kids-safe) ────────────────────
const BAD_WORDS = ["ass","fuck","shit","bitch","cunt","dick","cock","pussy","nigger","nigga","faggot","fag","whore","slut","bastard","damn","hell","sex","porn","nude","kill","rape","pedo","nazi"];
function sanitizeName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_ ]/g, "").trim().slice(0, 8) || "Player";
  const lower = cleaned.toLowerCase();
  for (const w of BAD_WORDS) {
    if (lower.includes(w)) return "Player";
  }
  // Block URLs
  if (/https?:|www\.|\.com|\.net|\.org/i.test(cleaned)) return "Player";
  return cleaned;
}

// ─── Leaderboard helpers ─────────────────────────────────────────
function loadLB(key: string): LeaderboardEntry[] {
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch(_){}
  return [];
}
function saveLB(key: string, entries: LeaderboardEntry[]) {
  try { localStorage.setItem(key, JSON.stringify(entries.slice(0,10))); } catch(_){}
}
function addToLB(key: string, score: number, name: string): LeaderboardEntry[] {
  const safe = sanitizeName(name);
  const entries = loadLB(key);
  entries.push({ score, date: new Date().toLocaleDateString(), initials: safe });
  entries.sort((a,b) => b.score - a.score);
  const trimmed = entries.slice(0,10);
  saveLB(key, trimmed);
  return trimmed;
}

// ─── Color palette ───────────────────────────────────────────────
const SAFE: CellType[] = ["white","blue","red","orange","yellow","green","cyan","lime","teal","pink","rose","magenta"];

function randCell(tick = 0, isClassic = false): CellType {
  // Classic: purple chance scales from 22% → 42% as game progresses
  const purpleChance = isClassic
    ? Math.min(0.42, 0.22 + Math.floor(tick / 20) * 0.02)
    : 0.22;
  if (Math.random() < purpleChance) return "purple";
  return SAFE[Math.floor(Math.random() * SAFE.length)];
}

// ─── Audio ───────────────────────────────────────────────────────
let _actx: AudioContext | null = null;
let _muted = false;
function getACtx() {
  if (!_actx) _actx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return _actx;
}
function playSound(type: "ok"|"bad"|"tick"|"powerup"|"levelup") {
  if (_muted) return;
  try {
    const ctx = getACtx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    const t = ctx.currentTime;
    if (type === "ok") {
      o.type="sine"; o.frequency.setValueAtTime(880,t); o.frequency.exponentialRampToValueAtTime(1320,t+0.08);
      g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.12);
      o.start(); o.stop(t+0.12);
    } else if (type === "bad") {
      o.type="sawtooth"; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(55,t+0.25);
      g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.28);
      o.start(); o.stop(t+0.28);
    } else if (type === "powerup") {
      o.type="sine"; o.frequency.setValueAtTime(660,t); o.frequency.exponentialRampToValueAtTime(1320,t+0.15);
      g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
      o.start(); o.stop(t+0.2);
    } else if (type === "levelup") {
      o.type="triangle"; o.frequency.setValueAtTime(440,t); o.frequency.setValueAtTime(660,t+0.1); o.frequency.setValueAtTime(880,t+0.2);
      g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
      o.start(); o.stop(t+0.35);
    } else {
      o.type="square"; o.frequency.setValueAtTime(330,t);
      g.gain.setValueAtTime(0.03,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.04);
      o.start(); o.stop(t+0.04);
    }
  } catch(_){}
}

// ─── Game helpers ─────────────────────────────────────────────────
function computeMs(tick: number, mult = 1) {
  return Math.max(MIN_MS, INIT_MS * Math.pow(DECAY_EXP, Math.floor(tick / DECAY_EVERY)) * mult);
}
function speedLabel(tick: number, frozen: boolean) {
  return (INIT_MS / computeMs(tick, frozen ? 1.4 : 1)).toFixed(1) + "×";
}
function speedPct(tick: number) {
  return Math.max(4, ((INIT_MS - computeMs(tick)) / (INIT_MS - MIN_MS)) * 96);
}

// Item 5 / Master's Touch: spawnActive — deterministic spread + weighted powerup table
// Uses Fisher-Yates for O(n) slot selection; powerup weights sum to 100 for clarity.
const POWERUP_TABLE: { type: CellType; weight: number }[] = [
  { type: "medpack",    weight: 7  },
  { type: "shield",     weight: 5  },
  { type: "freeze",     weight: 4  },
  { type: "multiplier", weight: 5  },
];

function spawnActive(stage: number, health: number, patternOverride?: { cols: number; rows: number; mask: number[] | null }, isEvolve?: boolean, rareColor?: string, tick = 0): ActiveCell[] {
  const pat = patternOverride ?? STAGES[Math.min(stage, STAGES.length-1)];
  const { mask } = pat;
  const total = pat.cols * pat.rows;
  const validSlots = mask ? [...mask] : Array.from({ length: total }, (_, i) => i);
  const validCount = validSlots.length;

  const minCount = Math.min(2 + Math.floor(stage * 0.4), validCount - 1);
  const maxCount = Math.min(2 + Math.floor(stage * 0.6), Math.min(validCount - 1, 5)); // hard cap at 5 active cells
  const count = Math.max(1, minCount + Math.floor(Math.random() * (maxCount - minCount + 1)));

  const pool = [...validSlots];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const idxs = pool.slice(0, count);

  // Weighted powerup roll — evolve: stage ≥ 2; classic: always with lower chance
  let powerup: CellType | null = null;
  const powerupEligible = isEvolve ? stage >= 2 : true;
  if (powerupEligible) {
    const table = POWERUP_TABLE.map(p =>
      p.type === "medpack" && health < MAX_HEARTS ? { ...p, weight: p.weight + 10 } : p
    );
    // Classic mode gets ~40% of the normal powerup rate
    const totalWeight = table.reduce((s, p) => s + p.weight, 0);
    const effectiveTotal = isEvolve ? totalWeight : totalWeight * 0.4;
    const roll = Math.random() * 100;
    if (roll < effectiveTotal) {
      let cursor = 0;
      for (const p of table) {
        cursor += p.weight;
        if (roll < cursor) { powerup = p.type; break; }
      }
    }
  }

  // Evolve special blocks: ice, hold
  let evolveSpecial: CellType | null = null;
  if (isEvolve && stage >= 3) {
    const r = Math.random();
    if (r < 0.10) evolveSpecial = "ice";
    else if (r < 0.17) evolveSpecial = "hold";
  }

  const regularCells = idxs.map((idx, i) => {
    if (i === 0 && powerup) return { idx, clicked: false, type: powerup as CellType };
    if (i === 0 && evolveSpecial === "ice") {
      return { idx, clicked: false, type: "ice" as CellType, iceCount: 2 + Math.floor(Math.random() * 3) };
    }
    if (i === 0 && evolveSpecial === "hold") {
      return { idx, clicked: false, type: "hold" as CellType, holdRequired: 700 + Math.random() * 500 };
    }
    const baseType = randCell(tick, !isEvolve);
    if (rareColor && baseType === "purple") return { idx, clicked: false, type: rareColor as CellType };
    return { idx, clicked: false, type: baseType };
  });

  return regularCells;
}

// Pick a random evolve pattern for a given stage, different from lastIdx (item 13 & 15)
function pickPattern(stage: number, lastIdx: number, score: number): number {
  const valid = EVOLVE_PATTERNS
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.minStage <= stage)
    .filter(({ p }) => {
      if (score < 20)  return p.cols <= 2 && p.rows <= 2;   // stay 2×2 until score 20
      if (score < 50)  return p.cols <= 3 && p.rows <= 3;   // max 3×3 until score 50
      if (score < 120) return p.cols <= 3 && p.rows <= 4;   // max 3×4 until score 120
      if (score < 250) return p.cols <= 4 && p.rows <= 4;   // max 4×4 until score 250
      return true; // score >= 250: allow 5×5
    });
  if (valid.length <= 1) return valid[0]?.i ?? 0;
  const filtered = valid.filter(({ i }) => i !== lastIdx);
  const pick = filtered[Math.floor(Math.random() * filtered.length)];
  return pick?.i ?? valid[0].i;
}

// activeToCells with arbitrary pattern (not just STAGES array)
function activeToCellsP(active: ActiveCell[], pattern: { cols: number; rows: number; mask: number[] | null }): CellType[] {
  const { cols, rows, mask } = pattern;
  const gridTotal = cols * rows;
  const cells: CellType[] = Array(25).fill("inactive");
  if (mask) {
    const maskSet = new Set(mask);
    for (let i = 0; i < gridTotal; i++) {
      if (!maskSet.has(i)) cells[i] = "void" as CellType;
    }
  }
  active.forEach(c => {
    if (!c.clicked) cells[c.idx] = c.type;
  });
  return cells;
}


// ─── Stored powerup charges (shop purchases) ─────────────────────
function loadStoredPwr(): {freeze:number;shield:number} {
  try { const r = localStorage.getItem(LS_STORED_PWR); if (r) return JSON.parse(r); } catch {}
  return { freeze: 0, shield: 0 };
}
function saveStoredPwr(d: {freeze:number;shield:number}) {
  try { localStorage.setItem(LS_STORED_PWR, JSON.stringify(d)); } catch {}
}

function makePS(): PlayerState {
  // Load stored powerup charges from localStorage when starting
  const stored = loadStoredPwr();
  return {
    cells: Array(25).fill("inactive"), active: [], score: 0, streak: 0,
    alive: true, anim: {}, health: MAX_HEARTS, shield: false, shieldCount: 0,
    freezeEnd: 0, multiplierEnd: 0, gridStage: 0, stageProgress: 0,
    patternIdx: 0,
    storedFreezeCharges: stored.freeze,
    storedShieldCharges: stored.shield,
  };
}

// ─── Symbols ─────────────────────────────────────────────────────
// Item 2: "purple" removed from SYMBOLS — no symbol on purple cells
const SYMBOLS: Partial<Record<CellType,string>> = {
  medpack:"♥", shield:"◈", freeze:"❄", multiplier:"⚡"
};

// Item 6: Colorblind shape map — shown when colorblind mode is active
const CB_SYMBOLS: Partial<Record<CellType,string>> = {
  white:      "●",
  blue:       "■",
  red:        "▲",
  orange:     "◆",
  yellow:     "★",
  green:      "✚",
  cyan:       "⬟",
  lime:       "⬡",
  teal:       "⬢",
  pink:       "♦",
  rose:       "▼",
  magenta:    "❋",
  purple:     "✕",   // danger marker — colorblind only
  medpack:    "♥",
  shield:     "◈",
  freeze:     "❄",
  multiplier: "⚡",
};

// ─── Cell component ───────────────────────────────────────────────
// Item 1: balloon-burst pop with shards
interface Shard { id: number; dx: string; dy: string; dr: string; color: string; }

function getShardColor(type: CellType): string {
  const map: Partial<Record<CellType,string>> = {
    white:"#c7d9f5", blue:"#3b82f6", red:"#ef4444", orange:"#f97316",
    yellow:"#eab308", green:"#22c55e", cyan:"#06b6d4", lime:"#84cc16",
    teal:"#14b8a6", pink:"#ec4899", rose:"#f43f5e",
    magenta:"#d946ef", purple:"#a855f7",
    medpack:"#f59e0b", shield:"#06b6d4", freeze:"#60a5fa", multiplier:"#f97316",
  };
  return map[type] || "#fff";
}

function Cell({ type, animState, keyLabel, showKey, pressing, onTap, onHoldStart, onHoldEnd, colorblind, cellShape, counterSpinDur, iceCount, holdRequired, holdStart, cellIdx }: {
  type: CellType; animState: string|null; keyLabel: string; showKey: boolean;
  pressing: boolean; onTap: (x:number,y:number)=>void;
  onHoldStart: ()=>void; onHoldEnd: ()=>void;
  colorblind: boolean; cellShape?: CellShape; counterSpinDur?: string|null;
  iceCount?: number; holdRequired?: number; holdStart?: number;
  cellIdx?: number;
}) {
  const [ripples, setRipples] = useState<{id:number;x:number;y:number}[]>([]);
  const [shards,  setShards]  = useState<Shard[]>([]);
  const [tilt,    setTilt]    = useState(0);
  const [holdPct, setHoldPct] = useState(0);

  const sym = colorblind
    ? (type !== "inactive" ? CB_SYMBOLS[type] ?? null : null)
    : (SYMBOLS[type] ?? null);

  const cls = ["cell", type, animState, pressing && type !== "inactive" ? "cell--press" : null]
    .filter(Boolean).join(" ");

  // Shards on pop
  useEffect(() => {
    if (animState !== "pop" || type === "inactive") return;
    setTilt(Math.round((Math.random() * 16) - 8));
    const color = getShardColor(type);
    const newShards: Shard[] = Array.from({length:5}, (_,i) => {
      const angle = (i/5) * Math.PI * 2 + Math.random() * 0.8;
      const dist  = 28 + Math.random() * 22;
      return { id:Date.now()+i, dx:`${Math.round(Math.cos(angle)*dist)}px`, dy:`${Math.round(Math.sin(angle)*dist)}px`, dr:`${Math.round(120+Math.random()*240)}deg`, color };
    });
    setShards(newShards);
    setTimeout(() => setShards([]), 420);
  }, [animState]);

  // Hold progress
  useEffect(() => {
    if (type !== "hold" || !holdStart || !holdRequired) { setHoldPct(0); return; }
    const id = setInterval(() => setHoldPct(Math.min(100, ((Date.now()-holdStart)/holdRequired)*100)), 50);
    return () => clearInterval(id);
  }, [type, holdStart, holdRequired]);

  const onPtr = (e: React.PointerEvent) => {
    if (type === "inactive") return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    setRipples(p => [...p, {id:Date.now()+Math.random(),x,y}]);
    if (type === "hold") { onHoldStart(); return; }
    onTap(x, y);
  };
  const onPtrUp = (e: React.PointerEvent) => {
    if (type === "hold") { e.preventDefault(); onHoldEnd(); }
  };

  const counterSpinStyle: React.CSSProperties = counterSpinDur
    ? { animation: `cellCounterSpin ${counterSpinDur} linear infinite` }
    : {};

  // Triangle shape: only span gets clip-path, button keeps full hit area
  const isTriangle = cellShape === "triangle";
  const shapeStyle: React.CSSProperties = {};
  if (cellShape === "circle") shapeStyle.borderRadius = "50%";

  return (
    <button
      className={cls}
      data-cell-idx={cellIdx}
      onPointerDown={onPtr}
      onPointerUp={onPtrUp}
      onPointerLeave={onPtrUp}
      onContextMenu={e => e.preventDefault()}
      style={{
        touchAction:"none",
        userSelect:"none",
        WebkitUserSelect:"none",
        ...shapeStyle,
        ...counterSpinStyle,
        ...(animState==="pop"?{"--tilt":`${tilt}deg`} as any:{})
      }}
      aria-label={`${type} cell`}>
      {/* Triangle shape overlay — clip-path on span, not button */}
      {isTriangle && <span className="cell-tri-shape" />}
      {/* Ice */}
      {type === "ice" && iceCount != null && <span className="cell-overlay-ice">❄{iceCount}</span>}
      {/* Hold */}
      {type === "hold" && (
        <span className="cell-overlay-hold">
          <span className="hold-btn-outer">
            <span className={`hold-btn-inner${holdPct>0?" hold-btn-pressed":""}`}>
              {holdPct > 0 ? "⬤" : "HOLD"}
            </span>
          </span>
          {holdPct > 0 && <span className="hold-progress"><span className="hold-progress-fill" style={{width:holdPct+"%"}} /></span>}
        </span>
      )}
      {/* Symbol */}
      {sym && type!=="ice" && type!=="hold" && <span className="sym">{sym}</span>}
      {showKey && type!=="inactive" && <span className="kbadge">{toLabel(keyLabel)}</span>}
      {/* Ripples */}
      {ripples.map(r => (
        <span key={r.id} className="ripple" style={{left:r.x,top:r.y}}
          onAnimationEnd={() => setRipples(p => p.filter(x=>x.id!==r.id))} />
      ))}
      {/* Shards */}
      {shards.map(s => (
        <span key={s.id} className="shard"
          style={{background:s.color,"--dx":s.dx,"--dy":s.dy,"--dr":s.dr,top:"50%",left:"50%",marginTop:"-3px",marginLeft:"-3px"} as any} />
      ))}
    </button>
  );
}

// ─── Hearts display ───────────────────────────────────────────────
function Hearts({ health, anim, shieldCount }: { health: number; anim: boolean; shieldCount?: number }) {
  const sc = shieldCount ?? 0;
  const total = Math.max(MAX_HEARTS, Math.ceil(health));
  return (
    <div className="hearts">
      {Array.from({length: total}, (_,i) => {
        const isFull = i < health;
        const isShieldHeart = sc > 0 && isFull && i >= total - sc;
        return (
          <span key={i} className={[
            "heart",
            isFull ? (isShieldHeart ? "heart--shield" : "heart--full") : "heart--empty",
            anim && i === Math.ceil(health) ? "heart--loss" : ""
          ].filter(Boolean).join(" ")}>♥</span>
        );
      })}
    </div>
  );
}

// ─── Power-up status pills — progress bars instead of countdowns ──
function PwrBadges({ shield, freezeEnd, multiplierEnd, freezeTotal, multTotal }: {
  shield: boolean; freezeEnd: number; multiplierEnd: number;
  freezeTotal?: number; multTotal?: number;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const active = shield || freezeEnd > Date.now() || multiplierEnd > Date.now();
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [shield, freezeEnd, multiplierEnd]);

  const freezeActive = freezeEnd > now;
  const multActive   = multiplierEnd > now;
  const freezePct    = freezeActive ? Math.max(0, ((freezeEnd - now) / (freezeTotal ?? 15000)) * 100) : 0;
  const multPct      = multActive   ? Math.max(0, ((multiplierEnd - now) / (multTotal ?? 24000)) * 100) : 0;

  if (!shield && !freezeActive && !multActive) return null;

  return (
    <div className="pwr-pills">
      {shield && (
        <div className="pwr-chip pwr-chip--shield">
          <span className="pwr-chip-icon">◈</span>
          <span className="pwr-chip-lbl">Shield</span>
        </div>
      )}
      {freezeActive && (
        <div className="pwr-chip pwr-chip--freeze">
          <span className="pwr-chip-icon">❄</span>
          <div className="pwr-chip-bar-track">
            <div className="pwr-chip-bar pwr-chip-bar--freeze" style={{width:`${freezePct}%`}} />
          </div>
        </div>
      )}
      {multActive && (
        <div className="pwr-chip pwr-chip--mult">
          <span className="pwr-chip-icon">⚡</span>
          <div className="pwr-chip-bar-track">
            <div className="pwr-chip-bar pwr-chip-bar--mult" style={{width:`${multPct}%`}} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Player grid panel ────────────────────────────────────────────
// ─── Rotation Direction Arrows ───────────────────────────────────────
// Shows only when direction is about to change — displays the INCOMING direction
// Arrow: thick arc, bold arrowhead, tapers at tail end
function RotationArrows({ direction, visible }: { direction: 1 | -1; visible: boolean }) {
  if (!visible) return null;
  const isCW = direction === 1;
  return (
    <div className="rot-arrows-container" aria-hidden>
      {isCW ? (
        // Clockwise: arc sweeps clockwise, arrowhead points in CW direction
        <svg className="rot-arrow rot-arrow--cw rot-arrow--active"
          viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
          {/* Thick short arc — CW quarter turn at bottom-right */}
          <path d="M 80 12 A 68 68 0 1 1 20 108"
            fill="none" stroke="currentColor"
            strokeWidth="20" strokeLinecap="round"
            strokeOpacity="0.9"/>
          {/* Taper: thin tail at start */}
          <path d="M 80 12 A 68 68 0 0 1 136 56"
            fill="none" stroke="currentColor"
            strokeWidth="4" strokeLinecap="round"
            strokeOpacity="0.35"/>
          {/* Bold arrowhead pointing CW (tangent at arc end ~230deg) */}
          <polygon points="0,-16 14,12 -14,12" fill="currentColor"
            transform="translate(20,108) rotate(235)"/>
        </svg>
      ) : (
        // Counter-clockwise: arc sweeps CCW, arrowhead points in CCW direction
        <svg className="rot-arrow rot-arrow--ccw rot-arrow--active"
          viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
          {/* Thick arc — CCW */}
          <path d="M 80 12 A 68 68 0 1 0 140 108"
            fill="none" stroke="currentColor"
            strokeWidth="20" strokeLinecap="round"
            strokeOpacity="0.9"/>
          {/* Taper: thin tail */}
          <path d="M 80 12 A 68 68 0 0 0 24 56"
            fill="none" stroke="currentColor"
            strokeWidth="4" strokeLinecap="round"
            strokeOpacity="0.35"/>
          {/* Bold arrowhead pointing CCW */}
          <polygon points="0,-16 14,12 -14,12" fill="currentColor"
            transform="translate(140,108) rotate(305)"/>
        </svg>
      )}
    </div>
  );
}

// ─── Dynamic cell size based on grid dimensions ──────────────────
// Bigger cells for small grids, smaller for large grids
function getDynamicCellVar(cols: number, rows: number, is2P: boolean): string {
  const maxDim = Math.max(cols, rows);
  if (is2P) {
    // 2P always compact
    return "clamp(38px, 9vw, 56px)";
  }
  if (maxDim <= 2) return "clamp(100px, 28vw, 140px)";  // 2×2 — huge
  if (maxDim <= 3) return "clamp(80px, 22vw, 110px)";   // 3×3 — big
  if (maxDim <= 4) return "clamp(60px, 16vw, 84px)";    // 4×4 — medium
  return "clamp(48px, 13vw, 66px)";                      // 5×5 — normal
}

function PlayerPanel({ ps, anim, onTap, onHoldStart, onHoldEnd, keyLabels, showKeys, pressing, label, heartAnim, mode, colorblind, cbFilter, is2P, shakeGrid, cellShape, rareMode, onPause, isFS, spinLevel, gameSeed }: {
  ps: PlayerState; anim: Record<number,string>; onTap:(i:number)=>void;
  onHoldStart:(i:number)=>void; onHoldEnd:(i:number)=>void;
  keyLabels: string[]; showKeys: boolean; pressing: Set<number>;
  label: string|null; heartAnim: boolean; mode: GameMode;
  colorblind: boolean; cbFilter: string; is2P: boolean; shakeGrid: boolean;
  cellShape: CellShape; rareMode: RareColorMode; onPause: ()=>void; isFS: boolean;
  spinLevel: number; gameSeed: number;
}) {
  const now = Date.now();
  const patData = mode === "evolve"
    ? (EVOLVE_PATTERNS[ps.patternIdx] ?? STAGES[0])
    : { cols:3, rows:3, total:9, name:"", mask:null as number[]|null };
  const { cols, rows, mask } = patData;
  const gridTotal = cols * rows;
  const frozen = ps.freezeEnd > now;
  const maskSet = mask ? new Set(mask) : null;

  const spinning = mode === "evolve" && spinLevel >= 3;
  const spinCfg = spinning ? getSpinConfig(spinLevel, gameSeed) : null;
  const spinStyle: React.CSSProperties = spinCfg ? {
    animation: `gpanelSpinContinuous${spinCfg.direction === 1 ? "CW" : "CCW"} ${spinCfg.duration.toFixed(2)}s linear infinite`,
  } : {};

  // Arrow shows only when direction is CHANGING — displays the direction grid will spin NEXT
  const isEpochBoundary = spinning && (spinLevel % SPIN_EPOCH_LEVELS === SPIN_EPOCH_LEVELS - 1);
  const nextSpinCfg = spinning ? getSpinConfig(spinLevel + 1, gameSeed) : null;
  const directionChanging = isEpochBoundary && spinCfg && nextSpinCfg && spinCfg.direction !== nextSpinCfg.direction;
  // Show the INCOMING direction so player knows which way it's about to spin
  const arrowDirection: 1|-1 = nextSpinCfg ? nextSpinCfg.direction : 1;

  const counterSpinDur: string | null =
    spinLevel >= 20 ? (spinCfg ? `${(spinCfg.duration * 1.4).toFixed(2)}s` : null) : null;

  return (
    <div className={`ppanel${!ps.alive ? " ppanel--dead" : ""}`}>
      {label && (
        <div className="plabel-row">
          <div className="plabel">{label}</div>
        </div>
      )}
      {is2P && (
        <div className="phud">
          <div className="phud-score-row">
            <div className="phud-score">{ps.score}</div>
            {ps.streak >= 3 && <div className="combo-wrap combo-wrap--sm">×{ps.streak}</div>}
          </div>
          <Hearts health={ps.health} anim={heartAnim} shieldCount={ps.shieldCount} />
        </div>
      )}
      {/* Fixed-height powerup banner zone — only shown for 2P in-panel display */}
      {is2P && (
        <div className="pwr-zone">
          <PwrBadges shield={ps.shield} freezeEnd={ps.freezeEnd} multiplierEnd={ps.multiplierEnd} freezeTotal={15000} multTotal={24000} />
        </div>
      )}
      {/* Grid wrapper — rotation indicator arrows sit behind the grid */}
      <div className="gpanel-wrap" style={{ "--cell": getDynamicCellVar(cols, rows, is2P) } as any}>
        {directionChanging && (
          <RotationArrows direction={arrowDirection} visible={true} />
        )}
        <div
          className={`gpanel${shakeGrid ? " shake-grid" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${cols}, var(--cell))`,
            gridTemplateRows:    `repeat(${rows}, var(--cell))`,
            ...(frozen ? {outline:"2px solid #60a5fa"} : {}),
            ...(cbFilter ? {filter: cbFilter} : {}),
            ...(rareMode.active ? {outline:`2px solid ${rareMode.cssColor}`} : {}),
            ...spinStyle,
          }}>
          {Array.from({length: gridTotal}, (_, i) => {
            const isVoid = maskSet && !maskSet.has(i);
            if (isVoid) return <div key={i} className="cell-void" />;
            const type = ps.cells[i] ?? "inactive";
            const activeCell = ps.active.find(c => c.idx === i);
            const shape: CellShape = cellShape === "mixed"
              ? (["square","circle","triangle"] as CellShape[])[i % 3]
              : cellShape;
            const row2 = Math.floor(i / cols), col2 = i % cols;
            const keyIdx = row2 * 4 + col2;

            return (
              <Cell key={i} type={type} animState={anim[i]||null}
                keyLabel={keyLabels[keyIdx]||""} showKey={showKeys}
                pressing={pressing.has(i)} onTap={() => onTap(i)}
                onHoldStart={() => onHoldStart(i)} onHoldEnd={() => onHoldEnd(i)}
                colorblind={colorblind}
                cellShape={mode === "evolve" ? shape : "square"}
                counterSpinDur={counterSpinDur}
                iceCount={activeCell?.iceCount}
                holdRequired={activeCell?.holdRequired}
                holdStart={activeCell?.holdStart}
                cellIdx={i}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── NEW: Merged Global Leaderboard ─────────────────────────────
function LeaderboardPanel({ mode, onClose }: { mode: "classic" | "evolve"; onClose: () => void }) {
  const [entries, setEntries]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [isGlobal, setIsGlobal] = useState(false);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const global = await fbFetchTop20Global();
      setEntries(global);
      setIsGlobal(true);
    } catch(err) {
      console.warn("[DTP-LB] Firebase fetch failed, using local fallback:", err);
      // Offline: merge local classic + evolve
      try {
        const c = localStorage.getItem(LS_LB_CLASSIC);
        const e = localStorage.getItem(LS_LB_EVOLVE);
        const classic: any[] = c ? JSON.parse(c).map((x:any) => ({...x,mode:"classic"})) : [];
        const evolve:  any[] = e ? JSON.parse(e).map((x:any) => ({...x,mode:"evolve"}))  : [];
        const merged = [...classic,...evolve].sort((a,b) => b.score - a.score).slice(0,20);
        setEntries(merged);
      } catch { setEntries([]); }
      setIsGlobal(false);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  return (
    <div className="lb-wrap screen-slide">
      <div className="lb-header">
        <span className="lb-title">🏆 {isGlobal ? "Global" : "Local"} Leaderboard</span>
        <span className="lb-sub" style={{fontSize:10,opacity:0.55}}>{isGlobal ? "🌐 Live" : "📴 Offline"}</span>
      </div>
      {loading
        ? <div className="lb-empty" style={{padding:"32px 0",opacity:0.6}}>Loading...</div>
        : entries.length === 0
          ? <p className="lb-empty">No scores yet. Be the first!</p>
          : <div className="lb-list">
              {entries.map((e,i) => (
                <div key={i} className={`lb-row ${i===0?"lb-row--gold":i===1?"lb-row--silver":i===2?"lb-row--bronze":""}`}>
                  <span className="lb-rank">{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span>
                  <span className="lb-ini">{e.initials}</span>
                  <span className="lb-score">{e.score}</span>
                  <span className="lb-mode-chip" style={{
                    background: e.mode==="evolve" ? "rgba(192,38,211,0.18)" : "rgba(96,165,250,0.18)",
                    color: e.mode==="evolve" ? "#f0abfc" : "#93c5fd",
                    fontSize:9,padding:"1px 5px",borderRadius:4,fontWeight:800,fontFamily:"var(--font-ui)",
                  }}>{e.mode==="evolve"?"∞ Evolve":"⊞ Classic"}</span>
                  <span className="lb-date">{e.date}</span>
                </div>
              ))}
            </div>
      }
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button className="btn-ghost" style={{flex:1}} onClick={onClose}>← Back</button>
        <button className="btn-ghost" style={{flex:1}} onClick={fetchScores}>↻ Refresh</button>
      </div>
    </div>
  );
}

// ─── NEW: Dust Wallet helpers ─────────────────────────────────────
function loadDust(): number {
  try { return parseInt(localStorage.getItem(LS_DUST) || "0", 10) || 0; } catch { return 0; }
}
function saveDust(d: number) {
  try { localStorage.setItem(LS_DUST, String(Math.max(0, d))); } catch {}
}
function addDust(amount: number): number {
  const newVal = loadDust() + amount;
  saveDust(newVal);
  return newVal;
}

// ─── NEW: Energy system helpers ────────────────────────────────────
interface EnergyData { count: number; lastRegen: number; }
function loadEnergy(): EnergyData {
  try {
    const r = localStorage.getItem(LS_ENERGY);
    if (r) return JSON.parse(r);
  } catch {}
  return { count: MAX_ENERGY, lastRegen: Date.now() };
}
function saveEnergy(d: EnergyData) {
  try { localStorage.setItem(LS_ENERGY, JSON.stringify(d)); } catch {}
}
// Returns computed energy state (applies regen based on elapsed time)
function computeEnergy(): EnergyData {
  const data = loadEnergy();
  if (data.count >= MAX_ENERGY) return { count: MAX_ENERGY, lastRegen: Date.now() };
  const elapsed = Date.now() - data.lastRegen;
  const regenCount = Math.floor(elapsed / ENERGY_REGEN_MS);
  if (regenCount > 0) {
    const newCount = Math.min(MAX_ENERGY, data.count + regenCount);
    const newLastRegen = data.lastRegen + regenCount * ENERGY_REGEN_MS;
    const updated = { count: newCount, lastRegen: newLastRegen };
    saveEnergy(updated);
    return updated;
  }
  return data;
}
function consumeEnergy(): boolean {
  const data = computeEnergy();
  if (data.count <= 0) return false;
  saveEnergy({ count: data.count - 1, lastRegen: data.lastRegen });
  return true;
}
function getNextRegenMs(): number {
  const data = loadEnergy();
  if (data.count >= MAX_ENERGY) return 0;
  const elapsed = Date.now() - data.lastRegen;
  const remaining = ENERGY_REGEN_MS - (elapsed % ENERGY_REGEN_MS);
  return remaining;
}


// ─── NEW: Shop ─────────────────────────────────────────────────────
function loadShopData(): {unlockedThemes:string[];equippedTheme:string} {
  try { const r = localStorage.getItem(LS_SHOP); if (r) return JSON.parse(r); } catch {}
  return { unlockedThemes: ["default"], equippedTheme: "default" };
}
function saveShopData(d: {unlockedThemes:string[];equippedTheme:string}) {
  try { localStorage.setItem(LS_SHOP, JSON.stringify(d)); } catch {}
}

function ShopPanel({ dust, onDustChange, onClose }: {
  dust: number; onDustChange: (d: number) => void; onClose: () => void;
}) {
  const [shopData, setShopData] = useState(() => loadShopData());
  const [tab, setTab] = useState<"themes"|"powerups">("themes");
  const [buyAnim, setBuyAnim] = useState<string|null>(null);

  const spend = (cost: number): boolean => {
    if (dust < cost) return false;
    const newDust = dust - cost;
    saveDust(newDust);
    onDustChange(newDust);
    return true;
  };

  const buyTheme = (themeId: string, cost: number) => {
    if (!spend(cost)) return;
    const updated = { ...shopData, unlockedThemes: [...shopData.unlockedThemes, themeId] };
    setShopData(updated);
    saveShopData(updated);
    setBuyAnim(themeId);
    setTimeout(() => setBuyAnim(null), 600);
  };

  const equip = (themeId: string) => {
    const updated = { ...shopData, equippedTheme: themeId };
    setShopData(updated);
    saveShopData(updated);
  };

  const buyPowerup = (itemId: string, cost: number) => {
    if (!spend(cost)) return;
    const stored = loadStoredPwr();
    if (itemId === "freeze1") saveStoredPwr({ ...stored, freeze: stored.freeze + 1 });
    if (itemId === "freeze2") saveStoredPwr({ ...stored, freeze: stored.freeze + 2 });
    if (itemId === "shield1") saveStoredPwr({ ...stored, shield: stored.shield + 1 });
    if (itemId === "shield2") saveStoredPwr({ ...stored, shield: stored.shield + 2 });
    setBuyAnim(itemId);
    setTimeout(() => setBuyAnim(null), 600);
  };

  const stored = loadStoredPwr();

  return (
    <div className="lb-wrap screen-slide">
      <div className="lb-header">
        <span className="lb-title">🛒 Shop</span>
        <span style={{fontSize:13,color:"var(--accent)",fontWeight:800,fontFamily:"var(--font-ui)"}}>💜 {dust.toLocaleString()}</span>
      </div>

      {/* Tab switcher */}
      <div className="shop-tabs">
        <button className={`shop-tab${tab==="themes"?" shop-tab--on":""}`} onClick={() => setTab("themes")}>🎨 Themes</button>
        <button className={`shop-tab${tab==="powerups"?" shop-tab--on":""}`} onClick={() => setTab("powerups")}>⚡ Power-ups</button>
      </div>

      {tab === "themes" && (
        <>
          <div className="shop-hint">Cosmetic themes — affects colors &amp; background</div>
          <div className="shop-grid">
            {SHOP_THEMES.map(t => {
              const owned   = shopData.unlockedThemes.includes(t.id);
              const equipped = shopData.equippedTheme === t.id;
              return (
                <div key={t.id} className={`shop-item${equipped?" shop-item--equipped":""}${buyAnim===t.id?" shop-item--bought":""}`}>
                  <div className="shop-swatch" style={{background:`linear-gradient(135deg, ${t.colors.bg} 0%, ${t.colors.purple}88 100%)`}}>
                    <span style={{fontSize:22,filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.5))"}}>🎨</span>
                  </div>
                  <div className="shop-name">{t.name}</div>
                  {t.cost === 0 || owned ? (
                    <button className={equipped?"btn-primary btn-sm":"btn-ghost btn-sm"} style={{fontSize:11,padding:"4px 12px"}} onClick={() => equip(t.id)}>
                      {equipped ? "✓ On" : "Equip"}
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm" style={{fontSize:11,padding:"4px 12px",opacity:dust>=t.cost?1:0.4}} onClick={() => buyTheme(t.id,t.cost)} disabled={dust<t.cost}>
                      💜 {t.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "powerups" && (
        <>
          <div className="shop-hint">Saved charges carry into your next game — tap to activate mid-round</div>
          {stored.freeze > 0 || stored.shield > 0 ? (
            <div className="shop-inventory">
              <span className="shop-inv-lbl">In your bag:</span>
              {stored.freeze > 0 && <span className="shop-inv-chip">❄ ×{stored.freeze}</span>}
              {stored.shield > 0 && <span className="shop-inv-chip">◈ ×{stored.shield}</span>}
            </div>
          ) : null}
          <div className="shop-pwr-list">
            {SHOP_POWERUPS.map(p => (
              <div key={p.id} className={`shop-pwr-item${buyAnim===p.id?" shop-item--bought":""}`}>
                <div className="shop-pwr-icon">{p.icon.split("").map((c,i) => <span key={i}>{c}</span>)}</div>
                <div className="shop-pwr-info">
                  <div className="shop-pwr-name">{p.name}</div>
                  <div className="shop-pwr-desc">{p.desc}</div>
                </div>
                <button className="btn-ghost btn-sm" style={{fontSize:12,padding:"5px 14px",flexShrink:0,opacity:dust>=p.cost?1:0.4}} onClick={() => buyPowerup(p.id,p.cost)} disabled={dust<p.cost}>
                  💜 {p.cost}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <button className="btn-ghost" style={{width:"100%",marginTop:14}} onClick={onClose}>← Back</button>
    </div>
  );
}

// ─── NEW: DustWidget (always-visible HUD element) ─────────────────
function DustWidget({ dust }: { dust: number }) {
  return (
    <div className="dust-widget">
      <span className="dust-icon">💜</span>
      <span className="dust-val">{dust.toLocaleString()}</span>
    </div>
  );
}

// ─── How to play panel ────────────────────────────────────────────
function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="how-wrap screen-slide">
      <h2 className="how-title">How to Play</h2>
      <div className="how-grid">
        <div className="how-row"><span className="how-icon" style={{color:"#dde4ee"}}>⬜</span><div><b>Safe colors</b><br/>Tap as fast as you can for +1 point</div></div>
        <div className="how-row"><span className="how-icon" style={{color:"#a855f7"}}>🟣</span><div><b>Purple = danger</b><br/>Never tap purple — you lose a heart</div></div>
        <div className="how-row"><span className="how-icon" style={{color:"#fcd34d"}}>♥</span><div><b>Medpack</b><br/>Restores one heart</div></div>
        <div className="how-row"><span className="how-icon" style={{color:"#67e8f9"}}>◈</span><div><b>Shield</b><br/>Blocks the next damage</div></div>
        <div className="how-row"><span className="how-icon" style={{color:"#bfdbfe"}}>❄</span><div><b>Freeze</b><br/>Slows time by 40% for 5 seconds</div></div>
        <div className="how-row"><span className="how-icon" style={{color:"#fb923c"}}>⚡</span><div><b>Multiplier</b><br/>Double points for 8 seconds</div></div>
      </div>
      <div className="how-modes">
        <div className="how-mode"><b>⊞ Classic</b> — Fixed 3×3 grid, pure speed challenge</div>
        <div className="how-mode"><b>∞ Evolve Mode</b> — Grid grows from 2×2 to 5×5 as you improve</div>
      </div>
      <p className="how-tip">⚡ Miss a safe cell = lose a heart · Tap purple = lose a heart · Survive = glory</p>
      <button className="btn-ghost" onClick={onClose}>← Back</button>
    </div>
  );
}

// ─── Key binder ───────────────────────────────────────────────────
function KeyBinder({ initP1, initP2, numPlayers, onSave, onCancel }: {
  initP1: string[]; initP2: string[]; numPlayers: NumPlayers;
  onSave:(p1:string[],p2:string[])=>void; onCancel:()=>void;
}) {
  const [ap, setAP] = useState<1|2>(1);
  const [d1, setD1] = useState([...initP1]);
  const [d2, setD2] = useState([...initP2]);
  const [sel, setSel] = useState<number|null>(null);
  const selRef = useRef<number|null>(null);
  selRef.current = sel;
  const draft = ap === 1 ? d1 : d2;
  const setDraft = ap === 1 ? setD1 : setD2;

  useEffect(() => {
    const blocked = new Set(["control","alt","meta","shift","tab","capslock","f1","f2","f3","f4","f5","f6","f7","f8","f9","f10","f11","f12"]);
    const fn = (e: KeyboardEvent) => {
      if (selRef.current === null) return;
      const k = e.key.toLowerCase();
      if (blocked.has(k)) return;
      e.preventDefault();
      if (k === "escape") { setSel(null); return; }
      setDraft(prev => {
        const n = [...prev];
        const dup = n.indexOf(k);
        if (dup !== -1 && dup !== selRef.current!) n[dup] = "";
        n[selRef.current!] = k;
        return n;
      });
      setSel(null);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [setDraft]);

  return (
    <div className="kb-overlay">
      <div className="kb-panel">
        <h2 className="kb-title">Customize Keys</h2>
        {numPlayers === 2 && (
          <div className="kb-tabs">
            {([1,2] as const).map(p => (
              <button key={p} className={`kb-tab ${ap===p?"kb-tab--on":""}`}
                onClick={() => { setAP(p); setSel(null); }}>Player {p}</button>
            ))}
          </div>
        )}
        <p className="kb-hint">
          {sel !== null
            ? `Press a key for Row ${Math.floor(sel/4)+1}, Col ${(sel%4)+1} (Esc = cancel)`
            : "Tap a cell to select it, then press the key you want"}
        </p>
        <div className="kb-grid">
          {draft.map((k,i) => (
            <button key={i}
              className={["kb-cell", sel===i?"kb-cell--on":"", !k?"kb-cell--empty":""].filter(Boolean).join(" ")}
              onClick={() => setSel(p => p===i ? null : i)}>
              {toLabel(k) || "—"}
            </button>
          ))}
        </div>
        <div className="kb-footer">
          <button className="btn-ghost" onClick={() => { ap===1?setD1([...DEFAULT_P1_KEYS]):setD2([...DEFAULT_P2_KEYS]); setSel(null); }}>Reset</button>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={() => onSave(d1,d2)}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Score share card ─────────────────────────────────────────────
function ShareCard({ score, mode, onClose }: {
  score: number; mode: GameMode; onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = "https://game.mscarabia.com";
  const modeLabel = mode === "classic" ? "Classic" : "Evolve";
  const shareText = `🎮 I scored ${score} in Don't Touch the Purple — ${modeLabel} Mode!\nCan you beat me? 👇\n${url}`;
  const encodedText = encodeURIComponent(shareText);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
  const waUrl      = `https://wa.me/?text=${encodedText}`;

  const copy = () => {
    const tryFallback = () => {
      const el = document.createElement("textarea");
      el.value = shareText; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 2000);
      }).catch(tryFallback);
    } else { tryFallback(); }
  };

  return (
    <div className="share-card">
      <div className="share-inner">
        <div className="share-logo">Don't Touch the <span style={{color:"#c026d3"}}>Purple</span></div>
        <div className="share-score">{score}</div>
        <div className="share-mode">{modeLabel} Mode</div>
        <div className="share-invite">Think you can beat that? 👀</div>
        <div className="share-url">{url}</div>
      </div>
      <div className="share-btns">
        <a className="share-social share-social--x" href={twitterUrl} target="_blank" rel="noopener">
          <span className="share-social-icon">𝕏</span> Post on X
        </a>
        <a className="share-social share-social--wa" href={waUrl} target="_blank" rel="noopener">
          <span className="share-social-icon">📱</span> WhatsApp
        </a>
        <button className="share-social share-social--copy" onClick={copy}>
          <span className="share-social-icon">{copied ? "✓" : "📋"}</span> {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
      <button className="btn-ghost" style={{width:"100%",marginTop:8}} onClick={onClose}>← Back</button>
    </div>
  );
}

// ─── PillRow ─────────────────────────────────────────────────────
function PillRow<T extends string | number>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const selIdx   = options.findIndex(o => o.value === value);
  const thumbRef = useRef<HTMLDivElement>(null);
  const rowRef   = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const row   = rowRef.current;
    const thumb = thumbRef.current;
    if (!row || !thumb) return;
    const btns = row.querySelectorAll<HTMLButtonElement>(".pill-opt");
    const btn  = btns[selIdx];
    if (!btn) return;
    thumb.style.left  = btn.offsetLeft + "px";
    thumb.style.width = btn.offsetWidth + "px";
  }, [selIdx]);

  // Reposition on every render, resize, AND after two animation frames
  // so the thumb never lags when the menu expands (e.g. Duo mode).
  useEffect(() => {
    reposition();
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(reposition); });
    const row = rowRef.current;
    if (!row || typeof ResizeObserver === "undefined") return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    const ro = new ResizeObserver(() => { reposition(); requestAnimationFrame(reposition); });
    ro.observe(row);
    if (row.parentElement) ro.observe(row.parentElement);
    return () => { ro.disconnect(); cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [reposition, selIdx]);

  return (
    <div className="pill-row" ref={rowRef}>
      <div className="pill-thumb" ref={thumbRef} />
      {options.map((o, i) => (
        <button
          key={o.value}
          className={`pill-opt${i === selIdx ? " pill-opt--on" : ""}`}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Settings drawer ─────────────────────────────────────────────
function SettingsDrawer({
  colorblindMode, setColorblindMode,
  theme, setTheme,
  muted, setMuted,
  isFS, toggleFS,
  onClose,
}: {
  colorblindMode: ColorblindMode; setColorblindMode: (m: ColorblindMode) => void;
  theme: "dark"|"light"; setTheme: (t: "dark"|"light") => void;
  muted: boolean; setMuted: (m: boolean) => void;
  isFS: boolean; toggleFS: () => void;
  onClose: () => void;
}) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">⚙ Settings</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {/* Appearance */}
        <div className="opt-section">
          <div className="opt-label">🌙 Appearance</div>
          <PillRow<"dark"|"light">
            options={[{value:"dark",label:"🌑 Dark"},{value:"light",label:"☀️ Light"}]}
            value={theme} onChange={setTheme} />
        </div>

        {/* Sound */}
        <div className="opt-section">
          <div className="opt-label">🔊 Sound</div>
          <PillRow<"on"|"off">
            options={[{value:"on",label:"🔊 On"},{value:"off",label:"🔇 Off"}]}
            value={muted ? "off" : "on"} onChange={v => setMuted(v === "off")} />
        </div>

        {/* Fullscreen */}
        <div className="opt-section">
          <div className="opt-label">⊞ Display</div>
          <PillRow<"window"|"full">
            options={[{value:"window",label:"⊟ Window"},{value:"full",label:"⊞ Fullscreen"}]}
            value={isFS ? "full" : "window"} onChange={() => toggleFS()} />
        </div>

        {/* Colorblind mode */}
        <div className="opt-section">
          <div className="opt-label">👁 Colorblind Mode</div>
          <PillRow<ColorblindMode>
            options={[
              {value:"none",       label:"None"},
              {value:"deuteranopia",label:"Deuter"},
              {value:"protanopia",  label:"Protan"},
              {value:"tritanopia",  label:"Tritan"},
              {value:"monochrome",  label:"Mono"},
            ]}
            value={colorblindMode} onChange={setColorblindMode} />
        </div>
      </div>
    </div>
  );
}

// ─── Privacy banner — auto-dismisses after 6s, manual dismiss available ────────────────────
function PrivacyBanner({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 6000);
    return () => clearTimeout(id);
  }, [onDismiss]);
  return (
    <div className="privacy-banner">
      <span className="privacy-txt">
        By playing you accept our terms.{" "}
        <a href="/privacy.html" className="privacy-link-inline">Learn more</a>.
      </span>
      <button className="privacy-dismiss-btn" onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}

// ─── SVG colorblind filters ───────────────────────────────────────
// Item 6: hidden SVG filter definitions
function ColorblindFilters() {
  return (
    <svg style={{position:"absolute",width:0,height:0,overflow:"hidden"}} aria-hidden>
      <defs>
        <filter id="deuteranopia">
          <feColorMatrix type="matrix" values="
            0.625 0.375 0     0 0
            0.7   0.3   0     0 0
            0     0.3   0.7   0 0
            0     0     0     1 0" />
        </filter>
        <filter id="protanopia">
          <feColorMatrix type="matrix" values="
            0.567 0.433 0     0 0
            0.558 0.442 0     0 0
            0     0.242 0.758 0 0
            0     0     0     1 0" />
        </filter>
        <filter id="tritanopia">
          <feColorMatrix type="matrix" values="
            0.95  0.05  0     0 0
            0     0.433 0.567 0 0
            0     0.475 0.525 0 0
            0     0     0     1 0" />
        </filter>
      </defs>
    </svg>
  );
}

function cbFilterStyle(mode: ColorblindMode): string {
  if (mode === "deuteranopia") return "url('#deuteranopia')";
  if (mode === "protanopia")   return "url('#protanopia')";
  if (mode === "tritanopia")   return "url('#tritanopia')";
  if (mode === "monochrome")   return "grayscale(1)";
  return "";
}


// ─── Main App ─────────────────────────────────────────────────────
// ─── Error codes registry ─────────────────────────────────────────
// DTP-001: gameTick called after component unmount
// DTP-002: spawnActive received invalid pattern (cols/rows 0)
// DTP-003: buildSliderPath found no valid path
// DTP-004: handleTap player ref not found
// DTP-005: localStorage unavailable (private browsing)
// DTP-006: AudioContext creation failed
// DTP-007: PlayerPanel RAF cleanup failed
// DTP-008: Fullscreen API not supported
// DTP-009: PointerCapture not supported on target element
// DTP-010: Invalid game state — screen=playing but no active cells

function safeLS(fn: () => void) {
  try { fn(); } catch(e) { console.warn("[DTP-005]", e); }
}

// ─── Dev overlay ─────────────────────────────────────────────────
function DevOverlay({ p1, p2, tick, gameMode, numPlayers, rareMode, cellShape, paused, screen, onClose }: {
  p1: PlayerState; p2: PlayerState; tick: number; gameMode: GameMode;
  numPlayers: NumPlayers; rareMode: RareColorMode; cellShape: CellShape;
  paused: boolean; screen: string; onClose: () => void;
}) {
  const row = (label: string, val: string | number | boolean) => (
    <div className="dev-row" key={label}>
      <span className="dev-key">{label}</span>
      <span className="dev-val">{String(val)}</span>
    </div>
  );
  return (
    <div className="dev-overlay" onClick={onClose}>
      <div className="dev-panel" onClick={e => e.stopPropagation()}>
        <div className="dev-title">🛠 DEV — Press Ctrl+Shift+D to close</div>
        <div className="dev-section">GAME</div>
        {row("screen", screen)}
        {row("mode", gameMode)}
        {row("players", numPlayers)}
        {row("tick", tick)}
        {row("paused", paused)}
        {row("cellShape", cellShape)}
        {row("rareMode.active", rareMode.active)}
        {rareMode.active && row("rareMode.color", rareMode.color)}
        {rareMode.active && row("rareMode.turnsLeft", rareMode.turnsLeft)}
        <div className="dev-section">PLAYER 1</div>
        {row("score", p1.score)}
        {row("health", p1.health)}
        {row("stage", p1.gridStage)}
        {row("patternIdx", p1.patternIdx)}
        {row("streak", p1.streak)}
        {row("shield", p1.shield)}
        {row("alive", p1.alive)}
        {row("active cells", p1.active.length)}
        {p1.active.map((c,i) => row(`  [${i}] idx:${c.idx} type`, `${c.type}${c.iceCount!=null?` ice×${c.iceCount}`:""}${c.holdRequired!=null?" hold":""} clicked:${c.clicked}`))}
        {numPlayers === 2 && <>
          <div className="dev-section">PLAYER 2</div>
          {row("score", p2.score)}
          {row("health", p2.health)}
          {row("stage", p2.gridStage)}
          {row("patternIdx", p2.patternIdx)}
          {row("alive", p2.alive)}
        </>}
        <div className="dev-section">FORCE STAGE (click)</div>
        {STAGES.map((s,i) => (
          <span key={i} className="dev-btn" onClick={() => {
            // Force stage in dev — dispatches custom event picked up by App
            window.dispatchEvent(new CustomEvent("dtp-dev-stage", { detail: i }));
          }}>{s.name}</span>
        ))}
        <div className="dev-section">FORCE PATTERN (click)</div>
        {EVOLVE_PATTERNS.slice(0, 12).map((p,i) => (
          <span key={i} className="dev-btn" onClick={() => {
            window.dispatchEvent(new CustomEvent("dtp-dev-pattern", { detail: i }));
          }}>P{i} {p.cols}×{p.rows}{p.mask ? "m" : ""}</span>
        ))}
        <div className="dev-section">RARE MODE</div>
        {RARE_COLORS.map(r => (
          <span key={r.color} className="dev-btn" style={{color: r.cssColor}} onClick={() => {
            window.dispatchEvent(new CustomEvent("dtp-dev-rare", { detail: r }));
          }}>{r.color}</span>
        ))}
        <span className="dev-btn" onClick={() => window.dispatchEvent(new CustomEvent("dtp-dev-rare", { detail: null }))}>clear rare</span>
      </div>
    </div>
  );
}


// ─── NEW: Loading Screen with optional name entry ─────────────────
function LoadingScreen({ progress, done, showNameEntry, onNameSubmit }: {
  progress: number; done: boolean;
  showNameEntry: boolean; onNameSubmit: (name: string) => void;
}) {
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");

  const handleSubmit = () => {
    const safe = sanitizeName(nameInput.trim() || "Player");
    if (safe === "Player" && nameInput.trim().length > 0) {
      setNameError("That name isn't allowed. Try another!");
      return;
    }
    onNameSubmit(safe || "Player");
  };

  return (
    <div
      className={`loading-screen${done && !showNameEntry ? " loading-screen--out" : ""}`}
      style={{
        background: "linear-gradient(145deg,#0d0820,#1a0a3e)",
        fontFamily: "'Fredoka One',system-ui,sans-serif"
      }}
    >
      {/* Animated background orbs */}
      <div className="loading-orb loading-orb-1" />
      <div className="loading-orb loading-orb-2" />
      <div className="loading-orb loading-orb-3" />

      <div className="loading-logo" style={{ textShadow: "0 0 40px rgba(192,38,211,0.8)" }}>
        Don't Touch the <span className="loading-purple">Purple</span>
      </div>
      <div className="loading-sub">Get your fingers ready...</div>

      {!done ? (
        <div style={{ width: "min(280px, 80vw)", marginTop: 20 }}>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="loading-pct" style={{ marginTop: 8 }}>{Math.round(progress)}%</div>
        </div>
      ) : showNameEntry ? (
        <div className="loading-name-entry" style={{
          background: "rgba(255,255,255,0.05)",
          padding: "24px",
          borderRadius: "24px",
          border: "1px solid rgba(192,38,211,0.3)",
          backdropFilter: "blur(10px)",
          marginTop: 20,
          width: "min(320px, 90vw)"
        }}>
          <div className="loading-name-label" style={{ marginBottom: 12 }}>What should we call you?</div>
          <input
            className="go-input"
            maxLength={8}
            placeholder="Your name"
            value={nameInput}
            autoFocus
            style={{ width: "100%", marginBottom: 12 }}
            onChange={e => { setNameInput(e.target.value.replace(/[^a-zA-Z0-9_ ]/g,"").slice(0,8)); setNameError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          <button className="btn-primary" style={{ width: "100%", padding: "12px" }} onClick={handleSubmit}>Let's Go!</button>
          {nameError && <div style={{color:"#f87171",fontSize:12,marginTop:8,fontFamily:"var(--font-ui)"}}>{nameError}</div>}
        </div>
      ) : (
        <div style={{ width: "min(280px, 80vw)", marginTop: 20 }}>
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: "100%" }} />
          </div>
          <div className="loading-pct" style={{ marginTop: 8 }}>100%</div>
        </div>
      )}
    </div>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────
export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: Error|null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight:"100vh",background:"#0d0820",color:"#e0d0ff",fontFamily:"system-ui",padding:24,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
          <h1 style={{fontSize:24,marginBottom:8}}>Something went wrong</h1>
          <p style={{fontSize:14,opacity:0.7,marginBottom:16,maxWidth:400}}>
            The game encountered an error. Try refreshing, or report the bug below.
          </p>
          {this.state.error && (
            <pre style={{background:"rgba(255,255,255,0.05)",padding:12,borderRadius:8,fontSize:11,maxWidth:500,overflow:"auto",marginBottom:16,textAlign:"left"}}>
              {this.state.error.message}
            </pre>
          )}
          <button onClick={() => window.location.reload()} style={{background:"linear-gradient(135deg,#c026d3,#a21caf)",color:"#fff",border:"none",padding:"12px 24px",borderRadius:999,fontSize:14,cursor:"pointer",marginBottom:8}}>
            🔄 Refresh
          </button>
          <a href={`mailto:info@mscarabia.com?subject=${encodeURIComponent("DTP Crash Report")}&body=${encodeURIComponent(
            `Error: ${this.state.error?.message}\nURL: ${window.location.href}\nUA: ${navigator.userAgent}`
          )}`} target="_blank" rel="noopener" style={{color:"#60a5fa",textDecoration:"none",fontSize:13}}>
            🐛 Report Bug
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── SwitchModal — must be outside App to avoid identity change on every render ──
function SwitchModal({ playerName, onSave, onClose }: {
  playerName: string | null;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(playerName || "");
  const save = () => {
    const safe = sanitizeName(val.trim()) || "Player";
    try { localStorage.setItem(LS_PLAYER_NAME, safe); } catch {}
    onSave(safe);
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="glass-panel" onClick={e => e.stopPropagation()}>
        <h2 style={{fontFamily:"var(--font-game)",fontSize:20,marginBottom:4,color:"var(--text)"}}>Switch Player</h2>
        <p style={{fontSize:12,color:"var(--muted)",fontFamily:"var(--font-ui)",marginBottom:16}}>Enter a name for this device's player</p>
        <input
          className="go-input"
          maxLength={8}
          placeholder="Name (8 chars)"
          autoFocus
          value={val}
          style={{width:"100%",marginBottom:14}}
          onChange={e => setVal(e.target.value.replace(/[^a-zA-Z0-9_ ]/g,"").slice(0,8))}
          onKeyDown={e => e.key === "Enter" && save()}
        />
        <div style={{display:"flex",gap:8}}>
          <button className="btn-ghost" style={{flex:1}} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{flex:1,padding:"10px"}} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  // ── Loading state ──
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadDone, setLoadDone]         = useState(false);
  const [appReady, setAppReady]         = useState(false);

  // ── Player identity ──
  const [playerName, setPlayerName] = useState<string|null>(() => {
    try { return localStorage.getItem(LS_PLAYER_NAME); } catch { return null; }
  });
  const [showNameEntry, setShowNameEntry] = useState(false);

  // ── Dust wallet ──
  const [dust, setDust] = useState(() => loadDust());

  // ── Energy system ──
  const [energyData, setEnergyData] = useState<EnergyData>(() => computeEnergy());
  const energyCount = energyData.count;

  // Refresh energy on focus (handles regen while app was in background)
  useEffect(() => {
    const refresh = () => setEnergyData(computeEnergy());
    window.addEventListener("focus", refresh);
    const id = setInterval(refresh, 30000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(id); };
  }, []);

  // ── Shop ──
  const [showShop, setShowShop] = useState(false);
  const [showSwitchPlayer, setShowSwitchPlayer] = useState(false);
  const [shopData, setShopDataState] = useState(() => loadShopData());

  // Apply equipped theme colors
  const equippedTheme = SHOP_THEMES.find(t => t.id === shopData.equippedTheme) ?? SHOP_THEMES[0];

  useEffect(() => {
    // Check weekly bonus on load (once per day)
    const lastCheck = localStorage.getItem(LS_WEEKLY_BONUS);
    const today = new Date().toLocaleDateString();
    if (lastCheck !== today && playerName) {
      fbCheckWeeklyBonus(playerName).then(bonus => {
        if (bonus > 0) {
          const newDust = addDust(bonus);
          setDust(newDust);
          // Toast handled after appReady
        }
        localStorage.setItem(LS_WEEKLY_BONUS, today);
      }).catch(() => {});
    }
  }, [playerName]);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 8 + Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setLoadProgress(100);
        setTimeout(() => {
          setLoadDone(true);
          if (!localStorage.getItem(LS_PLAYER_NAME)) {
            // First launch — show name entry in loading screen
            setShowNameEntry(true);
          } else {
            setTimeout(() => setAppReady(true), 600);
          }
        }, 300);
      }
      setLoadProgress(p);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const handleNameSubmit = (name: string) => {
    try { localStorage.setItem(LS_PLAYER_NAME, name); } catch {}
    setPlayerName(name);
    setShowNameEntry(false);
    setTimeout(() => setAppReady(true), 400);
  };

  // ── Dev overlay ──
  const [showDev, setShowDev] = useState(false);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") { e.preventDefault(); setShowDev(d => !d); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // ── Screens & options ──
  const [screen, setScreen]         = useState<Screen>("menu");
  const [gameMode, setGameMode]      = useState<GameMode>("classic");
  const [numPlayers, setNumPlayers]  = useState<NumPlayers>(1);
  const [inputMode, setInputMode]    = useState<InputMode>("touch");
  const [muted, setMuted]            = useState(false);
  const [isFS, setIsFS]              = useState(false);
  const [toast, setToast]            = useState<string|null>(null);
  const [showShare, setShowShare]    = useState(false);
  const [shareMsg, setShareMsg]      = useState("");
  const [lbMode, setLbMode]          = useState<GameMode>("classic");
  const [initials, setInitials]      = useState("");
  const [initialsEntered, setIE]     = useState(false);
  const [levelUpBadge, setLevelUpBadge] = useState<string|null>(null);
  const [theme, setTheme]            = useState<"dark"|"light">("dark");
  const [shakeGrid1, setShakeGrid1]  = useState(false);
  const [shakeGrid2, setShakeGrid2]  = useState(false);
  const [colorblindMode, setColorblindMode] = useState<ColorblindMode>("none");
  const [showSettings, setShowSettings]     = useState(false);
  const [showPrivacy, setShowPrivacy]       = useState(() => {
    try { return !localStorage.getItem(LS_PRIVACY_OK); } catch(_){ return false; }
  });

  // ── Player state ──
  const [p1, setP1] = useState<PlayerState>(makePS());
  const [p2, setP2] = useState<PlayerState>(makePS());
  const [heartAnimP1, setHA1] = useState(false);
  const [heartAnimP2, setHA2] = useState(false);
  const [pressP1, setPP1] = useState<Set<number>>(new Set());
  const [pressP2, setPP2] = useState<Set<number>>(new Set());
  const [tick, setTick]   = useState(0);
  const [winner, setWinner] = useState<Winner>(null);
  const [best1, setBest1]   = useState(0);
  const [best2, setBest2]   = useState(0);

  const [p1Keys, setP1Keys] = useState(() => loadKeys(LS_P1_KEYS, DEFAULT_P1_KEYS));
  const [p2Keys, setP2Keys] = useState(() => loadKeys(LS_P2_KEYS, DEFAULT_P2_KEYS));

  const [cellShape, setCellShape]   = useState<CellShape>("square");
  const [rareMode, setRareMode]     = useState<RareColorMode>({ active:false, color:"", cssColor:"", turnsLeft:0 });
  const [rareSplash, setRareSplash] = useState<{color:string;cssColor:string}|null>(null);
  const [evolveTick, setEvolveTick] = useState(0);
  const [spinLevel, setSpinLevel]   = useState(0);
  const [gameSeed, setGameSeed]     = useState(() => makeGameSeed());
  const [paused, setPaused] = useState(false);

  const p1Ref       = useRef<PlayerState>(makePS());
  const p2Ref       = useRef<PlayerState>(makePS());
  const tickRef     = useRef(0);
  const screenRef   = useRef<Screen>("menu");
  const npRef       = useRef<NumPlayers>(1);
  const imRef       = useRef<InputMode>("touch");
  const gmRef       = useRef<GameMode>("classic");
  const p1KRef      = useRef(p1Keys);
  const p2KRef      = useRef(p2Keys);
  const loopRef     = useRef<ReturnType<typeof setTimeout>|null>(null);
  const iMultRef    = useRef(1);
  const rareModeRef = useRef<RareColorMode>({ active:false, color:"", cssColor:"", turnsLeft:0 });
  const evolveTickRef = useRef(0);
  const pausedRef   = useRef(false);
  const mountedRef  = useRef(true);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { npRef.current = numPlayers; }, [numPlayers]);
  useEffect(() => { imRef.current = inputMode; }, [inputMode]);
  useEffect(() => { gmRef.current = gameMode; }, [gameMode]);
  useEffect(() => { p1KRef.current = p1Keys; }, [p1Keys]);
  useEffect(() => { p2KRef.current = p2Keys; }, [p2Keys]);
  useEffect(() => { _muted = muted; }, [muted]);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const sync = useCallback(() => {
    if (!mountedRef.current) return;
    setP1({...p1Ref.current});
    setP2({...p2Ref.current});
    setTick(tickRef.current);
  }, []);

  const toastRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const toast$ = useCallback((msg: string) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const addAnim = useCallback((ref: React.MutableRefObject<PlayerState>, set: React.Dispatch<React.SetStateAction<PlayerState>>, idx: number, name: string) => {
    ref.current.anim = {...ref.current.anim, [idx]: name};
    set({...ref.current});
    setTimeout(() => {
      if (!mountedRef.current) return;
      const n = {...ref.current.anim};
      delete n[idx];
      ref.current.anim = n;
      set({...ref.current});
    }, name === "pop" ? 300 : 420);
  }, []);

  const heartAnim = useCallback((player: 1|2) => {
    if (player === 1) { setHA1(true); setTimeout(() => setHA1(false), 420); }
    else              { setHA2(true); setTimeout(() => setHA2(false), 420); }
  }, []);

  const triggerShake = useCallback((player: 1|2) => {
    if (player === 1) { setShakeGrid1(true); setTimeout(() => setShakeGrid1(false), 400); }
    else              { setShakeGrid2(true); setTimeout(() => setShakeGrid2(false), 400); }
  }, []);

  // ── Game over — now also awards dust ──
  const gameOver = useCallback((w: Winner) => {
    if (loopRef.current) clearTimeout(loopRef.current);
    pausedRef.current = false;
    setTimeout(() => {
      if (!mountedRef.current) return;
      const s1 = p1Ref.current.score;
      const s2 = p2Ref.current.score;
      const earned = npRef.current === 1 ? s1 : Math.max(s1,s2);
      // Award dust: 1 score point = 1 dust
      const newDust = addDust(earned);
      setDust(newDust);
      if (earned > 0) {
        const name = localStorage.getItem(LS_PLAYER_NAME) || "Player";
        fbSyncDust(name, newDust).catch(() => {});
      }
      setBest1(b => Math.max(b, s1));
      setBest2(b => Math.max(b, s2));
      setWinner(w);
      setShareMsg(getMessage(npRef.current === 1 ? s1 : Math.max(s1,s2)));
      screenRef.current = "gameover"; setScreen("gameover");
    }, 400);
  }, []);

  // ── handleTap ──
  const handleTap = useCallback((player: 1|2, idx: number) => {
    if (screenRef.current !== "playing") return;
    const ref = player === 1 ? p1Ref : p2Ref;
    const set = player === 1 ? setP1  : setP2;
    if (!ref.current || !ref.current.alive) { console.warn("[DTP-004]"); return; }

    const cell = ref.current.active.find(c => c.idx === idx);
    if (!cell || cell.clicked) return;

    const mode = gmRef.current;
    const isEvolve = mode === "evolve";
    const patIdx = ref.current.patternIdx;
    const pat = isEvolve
      ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0])
      : { cols:3, rows:3, mask:null as number[]|null };
    const validSlots = pat.mask ?? Array.from({length: pat.cols * pat.rows}, (_,i) => i);
    if (!validSlots.includes(idx)) return;

    const dangerColor = rareModeRef.current.active ? rareModeRef.current.color : "purple";

    if (cell.type === "ice") {
      const remaining = (cell.iceCount ?? 1) - 1;
      addAnim(ref, set, idx, remaining <= 0 ? "pop" : "shake");
      playSound(remaining <= 0 ? "ok" : "tick");
      if (remaining <= 0) {
        cell.clicked = true;
        const mult = Date.now() < ref.current.multiplierEnd ? 2 : 1;
        ref.current.score += mult; ref.current.streak += 1; ref.current.stageProgress += 1;
      } else { cell.iceCount = remaining; }
      ref.current.cells = activeToCellsP(ref.current.active, pat);
      set({...ref.current}); return;
    }

    if (cell.type === "hold") return;

    cell.clicked = true;
    const dmg = isEvolve ? 0.5 : 1;

    // dangerColor is "purple" by default, or another color in rare mode.
    // A cell is dangerous if it matches the current danger color OR is purple while danger is something else.
    const isDanger = cell.type === dangerColor || (cell.type === "purple" && dangerColor !== "purple");
    if (isDanger) {
      if (ref.current.shieldCount > 0) {
        ref.current.shieldCount -= 1; ref.current.shield = ref.current.shieldCount > 0;
        playSound("ok"); addAnim(ref, set, idx, "pop");
      } else {
        ref.current.health = Math.max(0, ref.current.health - dmg);
        ref.current.shield = false; ref.current.streak = 0;
        playSound("bad"); addAnim(ref, set, idx, "shake");
        heartAnim(player); triggerShake(player);
        if (ref.current.health <= 0) {
          ref.current.alive = false;
          const other = npRef.current === 2 ? (player===1 ? p2Ref.current.alive : p1Ref.current.alive) : false;
          gameOver(npRef.current === 1 ? null : other ? (player===1?"p2":"p1") : "tie");
        }
      }
    } else if (["medpack","shield","freeze","multiplier"].includes(cell.type)) {
      playSound("powerup"); addAnim(ref, set, idx, "pop");
      if (cell.type === "medpack")    ref.current.health += 1;
      if (cell.type === "shield") { ref.current.shieldCount += 1; ref.current.shield = true; }
      if (cell.type === "freeze") {
        // Add to stored charges — player activates manually
        ref.current.storedFreezeCharges = (ref.current.storedFreezeCharges ?? 0) + 1;
      }
      if (cell.type === "multiplier") ref.current.multiplierEnd = Date.now() + 24000;
      toast$(cell.type==="medpack"?"♥ +1 Heart!":cell.type==="shield"?`🛡 Shield ×${ref.current.shieldCount}!`:cell.type==="freeze"?"❄ Freeze saved! Tap to use":"⚡ 2× Points!");
    } else {
      playSound("ok"); addAnim(ref, set, idx, "pop");
      const mult = Date.now() < ref.current.multiplierEnd ? 2 : 1;
      ref.current.score += mult; ref.current.streak += 1; ref.current.stageProgress += 1;
      if (isEvolve && ref.current.stageProgress >= STAGE_TAPS_NEEDED && ref.current.gridStage < STAGES.length - 1) {
        ref.current.gridStage += 1; ref.current.stageProgress = 0; iMultRef.current = 1;
        playSound("levelup"); setSpinLevel(sl => sl + 1);
        setLevelUpBadge(`Stage ${ref.current.gridStage}`);
        setTimeout(() => setLevelUpBadge(null), 2200);
      }
    }
    ref.current.cells = activeToCellsP(ref.current.active, pat);
    set({...ref.current});
  }, [addAnim, gameOver, heartAnim, triggerShake, toast$]);

  const handleHoldStart = useCallback((player: 1|2, idx: number) => {
    const ref = player === 1 ? p1Ref : p2Ref;
    const set = player === 1 ? setP1 : setP2;
    if (!ref.current.alive) return;
    const cell = ref.current.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell) return;
    cell.holdStart = Date.now();
    cell._holding = true;
    set({...ref.current});
  }, []);

  const handleHoldEnd = useCallback((player: 1|2, idx: number) => {
    const ref = player === 1 ? p1Ref : p2Ref;
    const set = player === 1 ? setP1 : setP2;
    if (!ref.current.alive) return;
    const cell = ref.current.active.find(c => c.idx === idx && c.type === "hold" && !c.clicked);
    if (!cell || !cell.holdStart || !cell.holdRequired) return;
    const mode = gmRef.current;
    const pat = mode === "evolve"
      ? (EVOLVE_PATTERNS[ref.current.patternIdx] ?? EVOLVE_PATTERNS[0])
      : { cols:3, rows:3, mask:null as number[]|null };
    const elapsed = Date.now() - cell.holdStart;
    if (elapsed >= cell.holdRequired) {
      cell.clicked = true; cell._holding = false;
      addAnim(ref, set, idx, "pop"); playSound("powerup");
      const mult = Date.now() < ref.current.multiplierEnd ? 2 : 1;
      ref.current.score += mult * 2; ref.current.streak += 1; ref.current.stageProgress += 1;
      toast$("💪 Hold! +2");
    } else {
      cell.holdStart = undefined; addAnim(ref, set, idx, "shake");
    }
    ref.current.cells = activeToCellsP(ref.current.active, pat);
    set({...ref.current});
  }, [addAnim, toast$]);

  // ── gameTick ──
  const gameTick = useCallback(() => {
    if (!mountedRef.current) { console.warn("[DTP-001]"); return; }
    if (screenRef.current !== "playing" || pausedRef.current) return;
    const now = Date.now();
    const mode = gmRef.current;
    evolveTickRef.current += 1;
    const eTick = evolveTickRef.current;

    if (mode === "evolve") setCellShape(pickCellShape(eTick));

    if (mode === "evolve") {
      if (rareModeRef.current.active) {
        rareModeRef.current.turnsLeft -= 1;
        if (rareModeRef.current.turnsLeft <= 0) {
          rareModeRef.current = { active:false, color:"", cssColor:"", turnsLeft:0 };
          setRareMode({ active:false, color:"", cssColor:"", turnsLeft:0 });
          toast$("🟣 Back to Purple!");
        } else { setRareMode({...rareModeRef.current}); }
      } else {
        const s1 = p1Ref.current.score;
        if (s1 >= 50 && s1 % 50 < 4 && Math.random() < 0.35) {
          const pick = RARE_COLORS[Math.floor(Math.random() * RARE_COLORS.length)];
          const newRare = { active:true, color:pick.color, cssColor:pick.cssColor, turnsLeft: 5 + Math.floor(Math.random() * 4) };
          rareModeRef.current = newRare; setRareMode(newRare);
          setRareSplash({ color:pick.color, cssColor:pick.cssColor });
          setTimeout(() => setRareSplash(null), 5000);
          toast$(`⚠️ Don't Touch ${pick.color.toUpperCase()}!`);
        }
      }
    }

    ([p1Ref, p2Ref] as const).forEach((ref, pi) => {
      if (!ref.current.alive || (pi === 1 && npRef.current === 1)) return;
      const curStage = ref.current.gridStage;
      const patIdx   = ref.current.patternIdx;
      const pat = mode === "evolve"
        ? (EVOLVE_PATTERNS[patIdx] ?? EVOLVE_PATTERNS[0])
        : { cols:3, rows:3, mask:null as number[]|null };
      if (!pat || pat.cols === 0) { console.error("[DTP-002]"); return; }
      const validSlots = new Set(pat.mask ?? Array.from({length: pat.cols * pat.rows}, (_,i) => i));
      const dangerColor = rareModeRef.current.active ? rareModeRef.current.color : "purple";
      ref.current.active.forEach(c => {
        if (!validSlots.has(c.idx) || c.clicked) return;
        const isPwr = ["medpack","shield","freeze","multiplier","ice","hold"].includes(c.type);
        const isBeingHeld = c._holding === true;
        if (c.type !== dangerColor && c.type !== "purple" && !isPwr && !isBeingHeld) {
          const dmg = mode === "evolve" ? 0.5 : 1;
          if (ref.current.shieldCount > 0) {
            ref.current.shieldCount -= 1; ref.current.shield = ref.current.shieldCount > 0;
          } else {
            ref.current.health = Math.max(0, ref.current.health - dmg);
            ref.current.shield = false;
            heartAnim((pi+1) as 1|2); triggerShake((pi+1) as 1|2);
            if (ref.current.health <= 0) {
              ref.current.alive = false;
              const other = npRef.current === 2 ? (pi===0 ? p2Ref.current.alive : p1Ref.current.alive) : false;
              gameOver(npRef.current === 1 ? null : other ? (pi===0?"p2":"p1") : "tie");
            }
          }
          ref.current.streak = 0;
        }
      });
      if (!ref.current.alive) return;
      const nextPatIdx = mode === "evolve" ? pickPattern(curStage, patIdx, ref.current.score) : 0;
      ref.current.patternIdx = nextPatIdx;
      const nextPat = mode === "evolve"
        ? (EVOLVE_PATTERNS[nextPatIdx] ?? EVOLVE_PATTERNS[0])
        : { cols:3, rows:3, mask:null as number[]|null };
      const rareColor = rareModeRef.current.active ? rareModeRef.current.color : undefined;
      const newActive = spawnActive(curStage, ref.current.health, nextPat, mode === "evolve", rareColor, tickRef.current);
      ref.current.active = newActive;
      ref.current.cells  = activeToCellsP(newActive, nextPat);
      if (newActive.length === 0) console.warn("[DTP-010]");
    });

    tickRef.current += 1;
    setEvolveTick(eTick);

    // Guard: gameOver() may have been called inside the forEach above; don't award bonus post-death
    if (screenRef.current === "playing" && tickRef.current > 60 && tickRef.current % 20 === 0) {
      if (p1Ref.current.alive) p1Ref.current.score += 2;
      if (npRef.current === 2 && p2Ref.current.alive) p2Ref.current.score += 2;
      toast$("🔥 Survival +2!");
    }

    sync();
    playSound("tick");

    const frozen = p1Ref.current.freezeEnd > now || (npRef.current===2 && p2Ref.current.freezeEnd > now);
    const interval = computeMs(tickRef.current, frozen ? 1.4 : 1) * iMultRef.current;
    loopRef.current = setTimeout(gameTick, interval);
  }, [sync, gameOver, heartAnim, triggerShake, toast$]);

  const pauseGame = useCallback(() => {
    if (screenRef.current !== "playing") return;
    if (loopRef.current) clearTimeout(loopRef.current);
    pausedRef.current = true; setPaused(true);
  }, []);

  const resumeGame = useCallback(() => {
    pausedRef.current = false; setPaused(false);
    const now = Date.now();
    const frozen = p1Ref.current.freezeEnd > now || (npRef.current===2 && p2Ref.current.freezeEnd > now);
    const interval = computeMs(tickRef.current, frozen ? 1.4 : 1) * iMultRef.current;
    loopRef.current = setTimeout(gameTick, interval);
  }, [gameTick]);

  // ── startGame — checks energy first ──
  const startGame = useCallback(() => {
    const ed = computeEnergy();
    if (ed.count <= 0) {
      toast$("⚡ No energy! Wait or spend 💜 dust to refill.");
      return;
    }
    if (!consumeEnergy()) {
      toast$("⚡ No energy!");
      return;
    }
    setEnergyData(computeEnergy());

    if (loopRef.current) clearTimeout(loopRef.current);
    p1Ref.current = makePS(); p2Ref.current = makePS();
    tickRef.current = 0; evolveTickRef.current = 0; iMultRef.current = 1;
    rareModeRef.current = { active:false, color:"", cssColor:"", turnsLeft:0 };
    pausedRef.current = false;
    setRareMode({ active:false, color:"", cssColor:"", turnsLeft:0 });
    setCellShape("square"); setEvolveTick(0); setSpinLevel(0);
    setGameSeed(makeGameSeed()); setWinner(null);
    // Pre-fill initials with player name
    setInitials(playerName || "");
    setIE(false);
    setPaused(false); setRareSplash(null); setLevelUpBadge(null);
    sync();
    screenRef.current = "playing"; setScreen("playing");
    loopRef.current = setTimeout(gameTick, computeMs(0));
  }, [gameTick, sync, toast$, playerName]);

  const goMenu = useCallback(() => {
    if (loopRef.current) clearTimeout(loopRef.current);
    pausedRef.current = false;
    p1Ref.current = makePS(); p2Ref.current = makePS();
    tickRef.current = 0;
    rareModeRef.current = { active:false, color:"", cssColor:"", turnsLeft:0 };
    setRareMode({ active:false, color:"", cssColor:"", turnsLeft:0 });
    setRareSplash(null); setSpinLevel(0); setPaused(false);
    sync(); setWinner(null);
    screenRef.current = "menu"; setScreen("menu");
  }, [sync]);

  // ── Keyboard handler ──
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.repeat || screenRef.current !== "playing" || imRef.current !== "keyboard") return;
      if (e.key === "Escape") { pauseGame(); return; }
      const k = e.key.toLowerCase();
      const checkKey = (player: 1|2) => {
        const keys = player === 1 ? p1KRef.current : p2KRef.current;
        const ref  = player === 1 ? p1Ref : p2Ref;
        const patIdx = ref.current.patternIdx;
        const sd = gmRef.current === "classic"
          ? { cols:3, rows:3, mask:null as number[]|null }
          : (EVOLVE_PATTERNS[patIdx] ?? { cols:3, rows:3, mask:null });
        const validSlots = sd.mask ?? Array.from({length: sd.cols * sd.rows}, (_,i) => i);
        for (const i of validSlots) {
          const row = Math.floor(i / sd.cols), col = i % sd.cols;
          if (keys[row * 4 + col] === k) return i;
        }
        return -1;
      };
      const i1 = checkKey(1);
      const i2 = npRef.current === 2 ? checkKey(2) : -1;
      if (i1 !== -1) {
        e.preventDefault();
        setPP1(s => new Set([...s, i1]));
        setTimeout(() => setPP1(s => { const n=new Set(s); n.delete(i1); return n; }), 150);
        handleTap(1, i1);
      } else if (i2 !== -1) {
        e.preventDefault();
        setPP2(s => new Set([...s, i2]));
        setTimeout(() => setPP2(s => { const n=new Set(s); n.delete(i2); return n; }), 150);
        handleTap(2, i2);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [handleTap, pauseGame]);

  // ── Dev events ──
  useEffect(() => {
    const onStage = (e: Event) => {
      const stage = (e as CustomEvent).detail as number;
      p1Ref.current.gridStage = stage; p1Ref.current.stageProgress = 0;
      p2Ref.current.gridStage = stage; p2Ref.current.stageProgress = 0;
      sync();
    };
    const onPattern = (e: Event) => {
      const idx = (e as CustomEvent).detail as number;
      p1Ref.current.patternIdx = idx; p2Ref.current.patternIdx = idx;
      sync();
    };
    const onRare = (e: Event) => {
      const r = (e as CustomEvent).detail;
      if (!r) {
        rareModeRef.current = { active:false, color:"", cssColor:"", turnsLeft:0 };
        setRareMode({ active:false, color:"", cssColor:"", turnsLeft:0 });
      } else {
        const newRare = { active:true, color:r.color, cssColor:r.cssColor, turnsLeft:10 };
        rareModeRef.current = newRare; setRareMode(newRare);
        setRareSplash({ color:r.color, cssColor:r.cssColor });
        setTimeout(() => setRareSplash(null), 5000);
      }
    };
    window.addEventListener("dtp-dev-stage", onStage);
    window.addEventListener("dtp-dev-pattern", onPattern);
    window.addEventListener("dtp-dev-rare", onRare);
    return () => {
      window.removeEventListener("dtp-dev-stage", onStage);
      window.removeEventListener("dtp-dev-pattern", onPattern);
      window.removeEventListener("dtp-dev-rare", onRare);
    };
  }, [sync]);

  // ── Submit score — uses playerName, posts to merged lb_global ──
  const submitScore = useCallback(async () => {
    const nameToUse = playerName || initials.trim() || "Player";
    const safeName  = sanitizeName(nameToUse);
    const lbKey     = gameMode === "classic" ? LS_LB_CLASSIC : LS_LB_EVOLVE;
    const score     = npRef.current === 1 ? p1Ref.current.score : Math.max(p1Ref.current.score, p2Ref.current.score);
    const entry     = { score, initials: safeName, date: new Date().toLocaleDateString(), mode: gameMode };
    addToLB(lbKey, score, safeName);
    setIE(true);
    try {
      await fbAddScoreGlobal(entry);
    } catch(_) {}
  }, [playerName, initials, gameMode]);

  const toggleFS = useCallback(() => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isMobile) { setIsFS(f => !f); return; }
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
        .then(() => setIsFS(true))
        .catch(() => { console.warn("[DTP-008]"); setIsFS(f => !f); });
    } else { document.exitFullscreen?.(); setIsFS(false); }
  }, []);

  // Energy refill via dust
  const handleEnergyRefill = useCallback(() => {
    const currentDust = loadDust();
    if (currentDust < DUST_PER_ENERGY) return;
    const newDust = currentDust - DUST_PER_ENERGY;
    saveDust(newDust);
    setDust(newDust);
    const ed = loadEnergy();
    const newEd = { count: Math.min(MAX_ENERGY, ed.count + 1), lastRegen: ed.count >= MAX_ENERGY - 1 ? Date.now() : ed.lastRegen };
    saveEnergy(newEd);
    setEnergyData(newEd);
    toast$("⚡ Energy refilled!");
  }, [toast$]);

  const cbFilter  = cbFilterStyle(colorblindMode);
  const cbActive  = colorblindMode !== "none";
  const is2P      = numPlayers === 2;
  const isKbd     = inputMode === "keyboard";
  const frozen    = p1.freezeEnd > Date.now() || p2.freezeEnd > Date.now();
  const isPlaying = screen === "playing" || screen === "gameover";
  const cellSizeVar = is2P
    ? "clamp(42px, 10.5vw, 60px)"
    : "clamp(52px, min(16vw,16vh), 80px)";

  const rareOrb = rareMode.active ? { background: `radial-gradient(circle, ${rareMode.cssColor}bb, ${rareMode.cssColor}22)` } : {};

  // Theme CSS vars from equipped theme
  const themeVars = {
    "--theme-purple":  equippedTheme.colors.purple,
    "--theme-accent":  equippedTheme.colors.accent,
  } as React.CSSProperties;

  return (
    <>
      <style>{CSS}</style>

      {/* Loading screen */}
      {!appReady && (
        <LoadingScreen
          progress={loadProgress}
          done={loadDone}
          showNameEntry={showNameEntry}
          onNameSubmit={handleNameSubmit}
        />
      )}

      {appReady && (
        <div
          className={`root${is2P ? " root--2p" : ""}${theme === "light" ? " light-theme" : ""}`}
          style={{ "--cell-1p": cellSizeVar, ...themeVars } as any}>

          <div className="bg-pulse" style={rareMode.active
            ? { background: `radial-gradient(ellipse at 50% 30%, ${rareMode.cssColor}44 0%, transparent 65%)`, opacity:1 }
            : {}} />
          <div className="orb orb-1" style={rareMode.active ? rareOrb : {}} />
          <div className="orb orb-2" />
          <div className="orb orb-3" />

          <ColorblindFilters />

          {toast && <div className="toast">{toast}</div>}

          {showPrivacy && (
            <PrivacyBanner onDismiss={() => {
              safeLS(() => localStorage.setItem(LS_PRIVACY_OK, "1"));
              setShowPrivacy(false);
            }} />
          )}

          {rareSplash && (
            <div className="rare-splash">
              <span className="rare-splash-text" style={{ color: rareSplash.cssColor, textShadow: `0 0 60px ${rareSplash.cssColor}, 0 0 120px ${rareSplash.cssColor}66` }}>
                DON'T<br/>TOUCH<br/>{rareSplash.color.toUpperCase()}!
              </span>
            </div>
          )}

          {showSettings && (
            <SettingsDrawer colorblindMode={colorblindMode} setColorblindMode={setColorblindMode}
              theme={theme} setTheme={setTheme}
              muted={muted} setMuted={setMuted}
              isFS={isFS} toggleFS={toggleFS}
              onClose={() => setShowSettings(false)} />
          )}

          {showDev && (
            <DevOverlay p1={p1} p2={p2} tick={tick} gameMode={gameMode} numPlayers={numPlayers}
              rareMode={rareMode} cellShape={cellShape} paused={paused} screen={screen}
              onClose={() => setShowDev(false)} />
          )}

          {paused && (
            <div className="pause-overlay">
              <div className="pause-card">
                <div className="pause-title">⏸ PAUSED</div>
                <div className="pause-score">Score: <strong>{p1.score}{is2P ? ` · ${p2.score}` : ""}</strong></div>
                <button className="btn-play" onClick={resumeGame}>▶ RESUME</button>
                <div className="pause-settings-row">
                  <button className="pause-setting-btn" onClick={() => setMuted(m => !m)} title="Sound">
                    {muted ? "🔇" : "🔊"}<span>{muted ? "Muted" : "Sound On"}</span>
                  </button>
                  <button className="pause-setting-btn" onClick={toggleFS} title="Fullscreen">
                    {isFS ? "⊡" : "⊞"}<span>{isFS ? "Exit FS" : "Fullscreen"}</span>
                  </button>
                  <button className="pause-setting-btn" onClick={() => { resumeGame(); setTimeout(() => setShowSettings(true), 100); }} title="Settings">
                    ⚙<span>Settings</span>
                  </button>
                </div>
                <button className="btn-ghost" style={{width:"100%",textAlign:"center"}} onClick={goMenu}>🏠 Exit to Menu</button>
                <div style={{fontSize:11,color:"var(--muted)",textAlign:"center",fontFamily:"var(--font-ui)"}}>Exiting will end your current game</div>
              </div>
            </div>
          )}

          {/* Header */}
          <header className={`hdr${isFS ? " hdr--hidden" : ""}`}>
            <span className="logo">
              Don't Touch the{" "}
              <span className="txt-p" style={rareMode.active
                ? { color: rareMode.cssColor, textShadow: `0 0 20px ${rareMode.cssColor}99`, transition:"color 0.5s, text-shadow 0.5s" }
                : {}}>
                {rareMode.active ? rareMode.color.charAt(0).toUpperCase() + rareMode.color.slice(1) : "Purple"}
              </span>
            </span>
            <div className="hdr-right" style={{display:"flex",alignItems:"center",gap:8}}>
              {/* Dust widget — always visible */}
              <DustWidget dust={dust} />
              {isPlaying && screen === "playing"
                ? <button className="btn-icon btn-icon--pause" onClick={pauseGame} title="Pause">⏸</button>
                : <button className="btn-icon" onClick={() => setShowSettings(s => !s)} title="Settings">⚙</button>
              }
            </div>
          </header>

          {isFS && (
            <div className="fs-pulldown" onClick={toggleFS} title="Exit fullscreen">
              <span className="fs-pulldown-chevron">⌄</span>
            </div>
          )}

          {isFS && isPlaying && (
            <div className="fs-controls">
              {screen === "playing" && <button className="btn-icon btn-icon--pause" onClick={pauseGame}>⏸</button>}
            </div>
          )}

          {screen === "leaderboard" && <LeaderboardPanel mode={lbMode} onClose={() => setScreen("menu")} />}
          {screen === "howto"       && <HowToPlay onClose={() => setScreen("menu")} />}
          {screen === "keybind"     && (
            <KeyBinder initP1={p1Keys} initP2={p2Keys} numPlayers={numPlayers}
              onSave={(k1,k2) => { safeLS(() => { saveKeys(LS_P1_KEYS,k1); saveKeys(LS_P2_KEYS,k2); }); setP1Keys(k1); setP2Keys(k2); setScreen("menu"); }}
              onCancel={() => setScreen("menu")} />
          )}

          {/* Shop screen */}
          {screen === "shop" && (
            <ShopPanel
              dust={dust}
              onDustChange={d => { setDust(d); setShopDataState(loadShopData()); }}
              onClose={() => setScreen("menu")} />
          )}

          {/* Menu */}
          {screen === "menu" && (
            <div className="menu-card screen-slide">
              {/* Compact top row: player pill (clickable) + energy pips inline */}
              <div className="menu-top-row">
                <button className="player-pill" onClick={() => setShowSwitchPlayer(true)}>
                  <span className="player-pill-icon">👤</span>
                  <span className="player-pill-name">{playerName || "Guest"}</span>
                  <span className="player-pill-edit">✎</span>
                </button>
                <div className="energy-inline">
                  {Array.from({length: MAX_ENERGY}, (_,i) => (
                    <span key={i} className={`energy-pip${i < energyCount ? " energy-pip--full" : ""}`}>⚡</span>
                  ))}
                  {energyCount < MAX_ENERGY && (
                    <span className="energy-inline-timer">
                      {(() => { const ms = getNextRegenMs(); return `${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,"0")}`; })()}
                    </span>
                  )}
                  {energyCount < MAX_ENERGY && dust >= DUST_PER_ENERGY && (
                    <button className="energy-refill-btn" onClick={handleEnergyRefill} title="Refill 1 energy">💜</button>
                  )}
                </div>
              </div>

              {showSwitchPlayer && (
                <SwitchModal
                  playerName={playerName}
                  onSave={name => { setPlayerName(name); setShowSwitchPlayer(false); }}
                  onClose={() => setShowSwitchPlayer(false)}
                />
              )}

              <div className="menu-header">
                <h1 className="menu-title">Don't Touch the <span className="txt-p">Purple</span></h1>
                <p className="menu-sub">⚡ Tap fast. Avoid purple. Survive.</p>
              </div>
              <div className="opt-grid">
                <div className="opt-section">
                  <div className="opt-label">🎮 Game Mode</div>
                  <PillRow<GameMode> options={[{value:"classic",label:"⊞ Classic"},{value:"evolve",label:"∞ Evolve"}]} value={gameMode} onChange={setGameMode} />
                </div>
                <div className="opt-section">
                  <div className="opt-label">👥 Players</div>
                  <PillRow<NumPlayers> options={[{value:1,label:"Solo"},{value:2,label:"Duo"}] as {value:NumPlayers;label:string}[]} value={numPlayers} onChange={setNumPlayers} />
                </div>
                <div className="opt-section">
                  <div className="opt-label">🕹 Input</div>
                  <PillRow<InputMode> options={[{value:"touch",label:"👆 Touch"},{value:"keyboard",label:"⌨ Keys"}]} value={inputMode} onChange={setInputMode} />
                </div>
              </div>

              {/* Play button — shows countdown if no energy */}
              {energyCount > 0 ? (
                <button className="btn-play" onClick={startGame}>▶ PLAY!</button>
              ) : (
                <div className="no-energy-block">
                  <div className="no-energy-txt">⚡ No energy</div>
                  <EnergyCountdown nextRegenMs={getNextRegenMs()} />
                  {dust >= DUST_PER_ENERGY && (
                    <button className="btn-ghost" style={{marginTop:8,fontSize:13}} onClick={handleEnergyRefill}>
                      💜 Spend {DUST_PER_ENERGY} dust to refill
                    </button>
                  )}
                </div>
              )}

              <div className="menu-links">
                <button className="btn-link" onClick={() => setScreen("howto")}>❓ How to Play</button>
                <button className="btn-link" onClick={() => { setLbMode(gameMode); setScreen("leaderboard"); }}>🏆 Leaderboard</button>
                <button className="btn-link" onClick={() => setScreen("shop")}>🛒 Shop</button>
                {isKbd && <button className="btn-link" onClick={() => setScreen("keybind")}>⌨ Keys</button>}
              </div>
            </div>
          )}

          {/* Playing */}
          {isPlaying && (
            <>
              {!is2P && (
                <div className="hud">
                  <div className="hud-card hud-card--score">
                    <div className="hud-lbl">Score</div>
                    <div className="hud-score-row">
                      <div className="hud-val">{p1.score}</div>
                      {p1.streak >= 3 && <div className="combo-wrap">×{p1.streak}</div>}
                    </div>
                  </div>
                  <div className="hud-card">
                    <div className="hud-lbl">Best</div>
                    <div className="hud-val">{best1}</div>
                  </div>
                  <div className="hud-card">
                    <div className="hud-lbl">Speed</div>
                    <div className="hud-val hud-val--sm">{speedLabel(tick, frozen)}</div>
                  </div>
                  <div className="hud-card hud-card--hearts">
                    <Hearts health={p1.health} anim={heartAnimP1} shieldCount={p1.shieldCount} />
                  </div>
                </div>
              )}

              <div className="spd-wrap">
                <div className="spd-track"><div className="spd-fill" style={{width: speedPct(tick) + "%"}} /></div>
              </div>

              {!is2P && (
                <>
                  <div className="pwr-zone pwr-zone--1p">
                    <PwrBadges shield={p1.shield} freezeEnd={p1.freezeEnd} multiplierEnd={p1.multiplierEnd} freezeTotal={15000} multTotal={24000} />
                    {levelUpBadge && <div className="levelup-badge">🔥 {levelUpBadge}</div>}
                  </div>
                  {/* Stored powerup activation buttons — outside pwr-zone, before game-area */}
                  {(p1.storedFreezeCharges > 0 || p1.storedShieldCharges > 0) && screen === "playing" && (
                    <div className="stored-pwr-row">
                      {p1.storedFreezeCharges > 0 && (
                        <button className="stored-pwr-btn stored-pwr-btn--freeze" onClick={() => {
                          p1Ref.current.freezeEnd = Date.now() + 15000;
                          p1Ref.current.storedFreezeCharges = Math.max(0, (p1Ref.current.storedFreezeCharges ?? 1) - 1);
                          setP1({...p1Ref.current});
                          toast$("❄ Freeze activated!");
                          playSound("powerup");
                        }}>❄ ×{p1.storedFreezeCharges}</button>
                      )}
                      {p1.storedShieldCharges > 0 && (
                        <button className="stored-pwr-btn stored-pwr-btn--shield" onClick={() => {
                          p1Ref.current.shieldCount += p1Ref.current.storedShieldCharges ?? 0;
                          p1Ref.current.shield = true;
                          p1Ref.current.storedShieldCharges = 0;
                          setP1({...p1Ref.current});
                          toast$(`🛡 Shield ×${p1Ref.current.shieldCount} activated!`);
                          playSound("powerup");
                        }}>◈ ×{p1.storedShieldCharges}</button>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="game-area">
                {screen === "gameover" && (
                  <div className="go-overlay">
                    {showShare ? (
                      <ShareCard score={p1.score} mode={gameMode} onClose={() => setShowShare(false)} />
                    ) : (
                      <>
                        <div className="go-eyebrow">{is2P ? "ROUND OVER" : "GAME OVER"}</div>
                        {is2P ? (
                          <>
                            <div className="go-winner">{winner==="p1" ? "🏆 P1 Wins!" : winner==="p2" ? "🏆 P2 Wins!" : "🤝 Tie!"}</div>
                            <div className="go-pair">
                              <div className="go-col"><div className="go-plbl" style={{color:"#60a5fa"}}>P1</div><div className="go-score">{p1.score}</div></div>
                              <div className="go-sep" />
                              <div className="go-col"><div className="go-plbl" style={{color:"#f472b6"}}>P2</div><div className="go-score">{p2.score}</div></div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="go-num">{p1.score}</div>
                            <div className="go-best">Best: {best1}</div>
                            <div className="go-msg">"{shareMsg}"</div>
                            {/* Dust earned banner */}
                            {p1.score > 0 && (
                              <div className="go-dust-earned">+{p1.score} 💜 dust earned!</div>
                            )}
                            {/* Auto-submit with player name */}
                            {!initialsEntered ? (
                              <div className="go-lb-form">
                                <input className="go-input" maxLength={8} placeholder="Your name"
                                  value={initials}
                                  onChange={e => setInitials(e.target.value.replace(/[^a-zA-Z0-9_ ]/g,"").slice(0,8))}
                                  onKeyDown={e => e.key === "Enter" && submitScore()} />
                                <button className="btn-primary btn-sm" onClick={submitScore}>Save</button>
                              </div>
                            ) : <div className="go-lb-saved">✓ Saved!</div>}
                          </>
                        )}
                        <div className="go-btns">
                          <button className="btn-primary" onClick={startGame}>▶ Again</button>
                          <button className="btn-ghost" onClick={() => setShowShare(true)}>📤 Share</button>
                          <button className="btn-ghost" onClick={goMenu}>🏠 Menu</button>
                        </div>
                        <a className="go-bug-btn"
                          href={`mailto:info@mscarabia.com?subject=${encodeURIComponent(`DTP Bug Report (Seed: ${gameSeed})`)}&body=${encodeURIComponent(
                            `GAME STATE\n-----------\nScore: ${p1.score}\nMode: ${gameMode}\nSeed: ${gameSeed}\nTick: ${tick}\nGrid Stage: ${p1.gridStage}\nPattern Idx: ${p1.patternIdx}\nHealth: ${p1.health}\nSpin Level: ${spinLevel}\nStreak: ${p1.streak}\nAlive: ${p1.alive}\n\nDEVICE\n------\nUA: ${navigator.userAgent}\nURL: ${window.location.href}\nScreen: ${window.innerWidth}×${window.innerHeight}\n\nBUG DESCRIPTION\n---------------\n(describe what happened)\n`
                          )}`}
                          target="_blank" rel="noopener">
                          🐛 Report a Bug
                        </a>
                      </>
                    )}
                  </div>
                )}

                <PlayerPanel ps={p1} anim={p1.anim} onTap={i => handleTap(1,i)}
                  onHoldStart={i => handleHoldStart(1,i)} onHoldEnd={i => handleHoldEnd(1,i)}
                  keyLabels={p1Keys} showKeys={isKbd} pressing={pressP1}
                  label={is2P ? "P1" : null} heartAnim={heartAnimP1} mode={gameMode}
                  colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={shakeGrid1}
                  cellShape={cellShape} rareMode={rareMode}
                  onPause={pauseGame} isFS={isFS} spinLevel={spinLevel} gameSeed={gameSeed} />
                {is2P && (
                  <PlayerPanel ps={p2} anim={p2.anim} onTap={i => handleTap(2,i)}
                    onHoldStart={i => handleHoldStart(2,i)} onHoldEnd={i => handleHoldEnd(2,i)}
                    keyLabels={p2Keys} showKeys={isKbd} pressing={pressP2}
                    label="P2" heartAnim={heartAnimP2} mode={gameMode}
                    colorblind={cbActive} cbFilter={cbFilter} is2P={is2P} shakeGrid={shakeGrid2}
                    cellShape={cellShape} rareMode={rareMode}
                    onPause={pauseGame} isFS={isFS} spinLevel={spinLevel} gameSeed={gameSeed} />
                )}
              </div>
            </>
          )}

          {screen === "menu" && (
            <footer className="credit">
              <span>By Mohammed Ahmed Siddiqui · <a href="https://mscarabia.com" target="_blank" rel="noopener noreferrer" className="credit-link">mscarabia.com</a></span>
              <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="credit-link" style={{marginLeft:6}}>Privacy</a>
            </footer>
          )}
        </div>
      )}
    </>
  );
}

// ─── Energy countdown helper component ───────────────────────────
function EnergyCountdown({ nextRegenMs }: { nextRegenMs: number }) {
  const [ms, setMs] = useState(nextRegenMs);
  useEffect(() => {
    const id = setInterval(() => setMs(getNextRegenMs()), 1000);
    return () => clearInterval(id);
  }, []);
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return <div className="no-energy-timer">Next energy in {mins}:{String(secs).padStart(2,"0")}</div>;
}

// ─── CSS ──────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0d0820;
  --bg2: rgba(255,255,255,0.06);
  --bg3: rgba(255,255,255,0.11);
  --glass: rgba(255,255,255,0.05);
  --glass-border: rgba(255,255,255,0.12);
  --text: #f0eaff;
  --muted: rgba(240,234,255,0.45);
  --purple: #c026d3;
  --purple-dark: #7e22ce;
  --accent: #f0abfc;
  --cell-1p: min(clamp(52px, 14vw, 88px), clamp(52px, 12vh, 88px));
  --cell-2p: min(clamp(38px, 9vw, 62px), clamp(38px, 9vh, 62px));
  --cell: var(--cell-1p);
  --gap: 8px;
  --r: 14px;
  --panel-blur: 18px;
  --font-game: 'Fredoka One', 'Nunito', system-ui, sans-serif;
  --font-ui: 'Nunito', system-ui, sans-serif;
}

.light-theme {
  --bg: #f5f0ff;
  --bg2: rgba(100,60,180,0.08);
  --bg3: rgba(100,60,180,0.14);
  --glass: rgba(255,255,255,0.7);
  --glass-border: rgba(140,90,210,0.22);
  --text: #1a0a2e;
  --muted: rgba(60,20,100,0.55);
  --purple: #7c3aed;
  --purple-dark: #5b21b6;
  --accent: #a855f7;
}

/* Light theme body overrides */
.light-theme body,
.light-theme .root {
  background: none;
}
.light-theme body {
  background: radial-gradient(ellipse at 20% 10%, #d8c8ff 0%, #f5f0ff 55%),
              radial-gradient(ellipse at 80% 90%, #e8d4ff 0%, transparent 55%);
}

/* Cards/panels in light mode */
.light-theme .menu-card {
  background: rgba(255,255,255,0.75);
  border-color: rgba(140,90,210,0.25);
}
.light-theme .hud-card {
  background: rgba(255,255,255,0.75);
  border-color: rgba(140,90,210,0.22);
}
.light-theme .hud-val {
  background: linear-gradient(135deg, #2d0a5e 0%, #7c3aed 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.light-theme .hud-card--score .hud-val {
  background: linear-gradient(135deg, #1a0a2e 0%, #7c3aed 50%, #a855f7 100%);
  -webkit-background-clip: text; background-clip: text;
}
.light-theme .go-overlay {
  background: rgba(240,230,255,0.96);
}
.light-theme .go-num {
  background: linear-gradient(135deg, #1a0a2e 0%, #7c3aed 50%, #a855f7 100%);
  -webkit-background-clip: text; background-clip: text;
}
.light-theme .gpanel {
  background: rgba(255,255,255,0.55);
  border-color: rgba(140,90,210,0.2);
  box-shadow: 0 0 0 1px rgba(140,90,210,0.06) inset, 0 20px 40px rgba(100,60,180,0.15);
}
.light-theme .cell.inactive {
  background: rgba(140,90,210,0.08);
  border-color: rgba(140,90,210,0.15);
}
.light-theme .pause-card {
  background: rgba(255,255,255,0.95);
  border-color: rgba(140,90,210,0.3);
}
.light-theme .pause-score { color: var(--muted); }
.light-theme .btn-ghost {
  background: rgba(140,90,210,0.1);
  border-color: rgba(140,90,210,0.2);
  color: var(--text);
}
.light-theme .btn-ghost:hover { background: rgba(140,90,210,0.18); }
.light-theme .btn-icon { color: var(--text); background: rgba(140,90,210,0.1); border-color: rgba(140,90,210,0.2); }
.light-theme .btn-link { color: var(--muted); }
.light-theme .btn-link:hover { color: var(--text); }
.light-theme .opt-btn { background: rgba(140,90,210,0.08); border-color: rgba(140,90,210,0.18); color: var(--muted); }
.light-theme .pill-row { background: rgba(140,90,210,0.08); border-color: rgba(140,90,210,0.18); }
.light-theme .pill-opt { color: var(--muted); }
.light-theme .pill-opt--on { color: #fff; }
.light-theme .toast { background: rgba(240,230,255,0.97); border-color: rgba(124,58,237,0.4); color: var(--text); }
.light-theme .go-msg,
.light-theme .go-best { color: var(--muted); }
.light-theme .spd-track { background: rgba(140,90,210,0.12); }
.light-theme .logo { color: var(--text); }
.light-theme .pwr-zone { background: rgba(255,255,255,0.4); border-color: rgba(140,90,210,0.12); }
.light-theme .phud-score {
  background: linear-gradient(135deg, #1a0a2e 0%, #7c3aed 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.light-theme .lb-row { background: rgba(255,255,255,0.7); }
.light-theme .how-row { background: rgba(255,255,255,0.7); }
.light-theme .go-input { background: rgba(255,255,255,0.8); color: var(--text); }
.light-theme .share-inner { background: rgba(255,255,255,0.8); }
.light-theme .share-url { color: var(--muted); }
.light-theme .share-social--copy { background: rgba(140,90,210,0.1); color: var(--text); border-color: rgba(140,90,210,0.2); }
.light-theme .kb-panel { background: #f5f0ff; color: var(--text); }
.light-theme .kb-cell { background: rgba(140,90,210,0.1); border-color: rgba(140,90,210,0.2); color: var(--text); }
.light-theme .kb-cell--on { background: var(--purple); color: #fff; border-color: var(--purple); }
.light-theme .pwr-chip--shield { background: linear-gradient(135deg,#0e7490,#06b6d4); }
.light-theme .pwr-chip--freeze { background: linear-gradient(135deg,#1d4ed8,#60a5fa); }
.light-theme .pwr-chip--mult   { background: linear-gradient(135deg,#c2410c,#f97316); }
.light-theme .pause-settings-row .pause-setting-btn { background: rgba(140,90,210,0.1); border-color: rgba(140,90,210,0.2); color: var(--text); }
.light-theme .pause-settings-row .pause-setting-btn:hover { background: rgba(140,90,210,0.2); }

html, body { height: 100%; background: var(--bg); overflow: hidden; touch-action: none; }
body {
  font-family: var(--font-ui);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  background: radial-gradient(ellipse at 20% 10%, #2d1060 0%, #0d0820 55%),
              radial-gradient(ellipse at 80% 90%, #1a0a3e 0%, transparent 55%);
  user-select: none;
}

/* ── Root layout ── */
.root {
  display: flex; flex-direction: column; align-items: center;
  width: 100%; max-width: 520px; margin: 0 auto;
  padding: 8px 10px 12px; min-height: 100dvh; gap: 8px;
  position: relative; z-index: 10; overflow: hidden;
}
.root--2p { --cell: var(--cell-2p); }

/* ── Background orbs ── */
.bg-pulse {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background: radial-gradient(circle at 50% 50%, var(--purple) 0%, transparent 60%);
  opacity: 0.04; transition: opacity 0.8s, background 1s;
}
.orb {
  position: fixed; border-radius: 50%; filter: blur(80px);
  z-index: -2; pointer-events: none;
}
.orb-1 {
  width: 480px; height: 480px; opacity: 0.20;
  background: radial-gradient(circle at 35% 35%, #e879f9, #7c3aed 55%, #4c1d95);
  top: calc(50% - 240px); left: calc(50% - 240px);
  animation: orbFloat1 20s ease-in-out infinite;
  transition: background 1s;
}
.orb-2 {
  width: 320px; height: 320px; opacity: 0.12;
  background: radial-gradient(circle at 60% 40%, #60a5fa, #2563eb);
  top: calc(50% - 160px); left: calc(50% - 160px);
  animation: orbFloat2 14s ease-in-out infinite;
}
.orb-3 {
  width: 240px; height: 240px; opacity: 0.10;
  background: radial-gradient(circle at 50% 30%, #f9a8d4, #be185d);
  top: calc(50% - 120px); left: calc(50% - 120px);
  animation: orbFloat3 10s ease-in-out infinite;
}
@keyframes orbFloat1 {
  0%,100% { transform: translate(-140px,-160px) scale(1); }
  25%  { transform: translate(160px,-120px) scale(1.08); }
  50%  { transform: translate(120px,160px) scale(0.96); }
  75%  { transform: translate(-160px,120px) scale(1.04); }
}
@keyframes orbFloat2 {
  0%,100% { transform: translate(160px,80px) scale(1); }
  33%  { transform: translate(-80px,140px) scale(1.1); }
  66%  { transform: translate(-140px,-80px) scale(0.9); }
}
@keyframes orbFloat3 {
  0%,100% { transform: translate(60px,-120px) scale(1); }
  50%  { transform: translate(-120px,80px) scale(1.15); }
}

/* ── Rare color splash ── */
.rare-splash {
  position: fixed; inset: 0; z-index: 999; pointer-events: none;
  display: flex; align-items: center; justify-content: center;
  animation: rareSplashAnim 5s cubic-bezier(0.22,1,0.36,1) forwards;
}
.rare-splash-text {
  font-family: var(--font-game);
  font-size: clamp(36px, 12vw, 72px);
  font-weight: 900; text-align: center; line-height: 1.1;
  text-transform: uppercase; letter-spacing: 2px;
  animation: rareSplashText 5s cubic-bezier(0.22,1,0.36,1) forwards;
}
@keyframes rareSplashAnim {
  0%   { background: rgba(0,0,0,0.75); }
  15%  { background: rgba(0,0,0,0.6); }
  60%  { background: rgba(0,0,0,0.35); }
  85%  { background: rgba(0,0,0,0.1); }
  100% { background: rgba(0,0,0,0); opacity: 0; }
}
@keyframes rareSplashText {
  0%   { transform: scale(0.1) rotate(-10deg); opacity: 0; }
  12%  { transform: scale(1.15) rotate(2deg);  opacity: 1; }
  25%  { transform: scale(1) rotate(0deg); }
  70%  { transform: scale(1) rotate(0deg); opacity: 1; }
  100% { transform: scale(1.6) rotate(5deg); opacity: 0; }
}

/* ── Screen shake ── */
.shake-screen { animation: screenShake 0.45s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes screenShake {
  0%,100% { transform: translate(0,0) rotate(0deg); }
  15%  { transform: translate(-6px, 4px) rotate(-0.4deg); }
  30%  { transform: translate(6px,-4px) rotate(0.4deg); }
  45%  { transform: translate(-8px, 5px) rotate(-0.5deg); }
  60%  { transform: translate(8px,-5px) rotate(0.5deg); }
  75%  { transform: translate(4px,-3px) rotate(0.2deg); }
  90%  { transform: translate(-3px, 2px) rotate(-0.1deg); }
}

/* ── Toast ── */
.toast {
  position: fixed; top: 158px; bottom: auto;
  left: 50%; transform: translateX(-50%);
  background: rgba(15,8,35,0.97); border: 2px solid rgba(192,38,211,0.5);
  backdrop-filter: blur(20px); border-radius: 99px;
  padding: 9px 24px; font-family: var(--font-game); font-size: 15px;
  color: var(--text); z-index: 500; white-space: nowrap;
  animation: toastIn 0.3s cubic-bezier(0.22,1,0.36,1);
  pointer-events: none;
  box-shadow: 0 4px 24px rgba(192,38,211,0.35);
}
@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(-10px) scale(0.9); } }

/* ── Header ── */
.hdr {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  transition: height 0.3s, opacity 0.3s; min-height: 44px;
}
.hdr--hidden { height: 0 !important; overflow: hidden; opacity: 0; pointer-events: none; min-height: 0; }
.logo {
  font-family: var(--font-game); font-size: 16px; letter-spacing: 0.3px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.txt-p {
  color: var(--purple); text-shadow: 0 0 20px rgba(192,38,211,0.6);
  transition: color 0.5s, text-shadow 0.5s;
}
.hdr-right { display: flex; gap: 6px; }

/* ── Fullscreen floating controls ── */
.fs-controls {
  position: fixed; top: 10px; right: 10px; z-index: 600;
  display: flex; gap: 6px; flex-direction: column;
}

/* ── Fullscreen pull-down tab — tap to restore header ── */
.fs-pulldown {
  position: fixed; top: 0; left: auto; right: 16px; transform: none;
  z-index: 601; cursor: pointer;
  background: linear-gradient(180deg, rgba(45,16,96,0.92), rgba(13,8,32,0.85));
  border: 2px solid rgba(192,38,211,0.35); border-top: none;
  border-radius: 0 0 18px 18px;
  padding: 2px 22px 6px;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(192,38,211,0.15);
  transition: padding-bottom 0.2s, box-shadow 0.2s;
  animation: pulldownIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
.fs-pulldown:hover { padding-bottom: 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.5), 0 0 18px rgba(192,38,211,0.3); }
.fs-pulldown:active { transform: scale(0.96); }
@keyframes pulldownIn { from { transform: translateY(-100%); } to { transform: translateY(0); } }
.fs-pulldown-chevron {
  font-size: 20px; color: var(--accent); line-height: 1;
  animation: chevronBounce 1.8s ease-in-out infinite;
  display: block;
}
@keyframes chevronBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }

/* ── Icon buttons ── */
.btn-icon {
  background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.15);
  border-radius: 12px; width: 38px; height: 38px; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text); transition: all 0.15s ease;
  backdrop-filter: blur(10px); box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.btn-icon:hover, .btn-icon:active { background: rgba(192,38,211,0.25); border-color: var(--purple); transform: scale(0.95); }

/* ── Pause inline button (in HUD / 2P panel) ── */
.btn-pause-inline {
  background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.15);
  border-radius: 10px; width: 34px; height: 34px; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text); transition: all 0.15s; flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.btn-pause-inline:active { transform: scale(0.9); background: rgba(192,38,211,0.3); }

/* ── Pause overlay ── */
.pause-overlay {
  position: fixed; inset: 0; z-index: 800;
  background: rgba(5,2,18,0.85); backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: fadeIn 0.25s ease;
}
.pause-card {
  background: linear-gradient(145deg, rgba(45,16,96,0.9), rgba(13,8,32,0.95));
  border: 2px solid rgba(192,38,211,0.4); border-radius: 28px;
  padding: 32px 28px; width: 100%; max-width: 340px;
  display: flex; flex-direction: column; gap: 16px; align-items: center;
  box-shadow: 0 0 60px rgba(192,38,211,0.2), 0 32px 64px rgba(0,0,0,0.5);
}
.pause-title {
  font-family: var(--font-game); font-size: 32px; letter-spacing: 2px;
  background: linear-gradient(135deg, #f0abfc, #c026d3);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.pause-score { font-family: var(--font-ui); font-size: 14px; color: var(--muted); }

/* ── Settings Drawer ── */
.drawer-overlay {
  position: fixed; inset: 0; z-index: 700;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: flex-end;
}
.drawer-panel {
  width: 290px; height: 100%; max-height: 100dvh; overflow-y: auto;
  background: linear-gradient(180deg, #1a0a3e 0%, #0d0820 100%);
  border-left: 2px solid rgba(192,38,211,0.3);
  padding: 24px 18px; display: flex; flex-direction: column; gap: 22px;
  box-shadow: -20px 0 60px rgba(0,0,0,0.6);
  animation: slideInRight 0.28s cubic-bezier(0.22,1,0.36,1);
}
.light-theme .drawer-panel { background: linear-gradient(180deg, #f0e8ff, #e8d8ff); border-left-color: rgba(124,58,237,0.3); }
@keyframes slideInRight { from { transform: translateX(100%); } }
.drawer-header { display: flex; align-items: center; justify-content: space-between; }
.drawer-title { font-family: var(--font-game); font-size: 18px; color: var(--accent); }

/* ── Menu card ── */
.menu-card {
  width: 100%;
  background: linear-gradient(145deg, rgba(45,16,96,0.7), rgba(13,8,32,0.8));
  border: 2px solid rgba(192,38,211,0.25); border-radius: 28px; padding: 24px;
  backdrop-filter: blur(var(--panel-blur)) saturate(160%);
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.5), 0 0 40px rgba(192,38,211,0.08);
}
.menu-header { display: flex; flex-direction: column; gap: 4px; }
.menu-title {
  font-family: var(--font-game); font-size: clamp(26px, 8vw, 42px);
  line-height: 1.05; letter-spacing: 0.5px;
  text-shadow: 0 3px 12px rgba(0,0,0,0.5), 0 0 30px rgba(192,38,211,0.2);
}
.menu-sub { font-size: 13px; color: var(--muted); font-weight: 700; letter-spacing: 0.3px; }
.menu-links { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

/* ── Buttons ── */
.btn-play {
  width: 100%;
  background: linear-gradient(135deg, #a21caf, #c026d3, #7c3aed);
  color: #fff; border: none; border-radius: 16px; padding: 16px;
  font-family: var(--font-game); font-size: 18px; letter-spacing: 1px;
  cursor: pointer; transition: all 0.18s;
  box-shadow: 0 6px 0 #6b21a8, 0 8px 24px rgba(192,38,211,0.4);
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.btn-play:hover { transform: translateY(-2px); box-shadow: 0 8px 0 #6b21a8, 0 12px 32px rgba(192,38,211,0.5); }
.btn-play:active { transform: translateY(3px); box-shadow: 0 3px 0 #6b21a8, 0 6px 16px rgba(192,38,211,0.3); }

.btn-primary {
  background: linear-gradient(135deg, #9333ea, #c026d3);
  color: #fff; border: none; border-radius: 14px; padding: 12px 20px;
  font-family: var(--font-game); font-size: 15px; cursor: pointer;
  box-shadow: 0 4px 0 #6b21a8, 0 6px 16px rgba(192,38,211,0.35);
  transition: all 0.15s;
}
.btn-primary:hover { transform: translateY(-1px); }
.btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #6b21a8; }
.btn-sm { padding: 9px 14px; font-size: 13px; }

.btn-ghost {
  background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.12);
  color: var(--text); padding: 10px 18px; border-radius: 14px;
  font-family: var(--font-game); font-size: 14px; cursor: pointer; transition: all 0.15s;
  box-shadow: 0 3px 0 rgba(0,0,0,0.3);
}
.btn-ghost:hover { background: rgba(255,255,255,0.12); transform: translateY(-1px); }
.btn-ghost:active { transform: translateY(2px); box-shadow: none; }

.btn-link {
  background: none; border: none; color: var(--muted); font-family: var(--font-ui);
  font-size: 13px; font-weight: 800; cursor: pointer; padding: 4px 10px;
  border-radius: 8px; transition: color 0.15s;
}
.btn-link:hover { color: var(--text); }

/* ── Options ── */
.opt-grid { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.opt-section { display: flex; flex-direction: column; gap: 6px; }
.opt-label { font-family: var(--font-ui); font-size: 10px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
.opt-row { display: flex; gap: 6px; }
.opt-btn {
  flex: 1; padding: 9px 6px; background: var(--bg2); border: 2px solid var(--glass-border);
  border-radius: 10px; color: var(--muted); font-family: var(--font-ui); font-size: 13px;
  font-weight: 800; cursor: pointer; transition: all 0.15s;
}
.opt-btn--on { background: var(--purple); color: #fff; border-color: var(--purple); box-shadow: 0 3px 0 var(--purple-dark); }

/* ── Pill toggle ── */
.pill-row { position: relative; display: flex; background: var(--bg2); border: 2px solid var(--glass-border); border-radius: 14px; padding: 3px; }
.pill-thumb {
  position: absolute; top: 3px; bottom: 3px;
  background: linear-gradient(135deg, var(--purple), var(--purple-dark));
  border-radius: 11px; box-shadow: 0 3px 0 var(--purple-dark), 0 4px 12px rgba(192,38,211,0.4);
  transition: left 0.2s cubic-bezier(0.34,1.56,0.64,1), width 0.2s; pointer-events: none; z-index: 0;
}
.pill-opt {
  flex: 1; position: relative; z-index: 1; padding: 8px 4px;
  border: none; background: transparent; font-family: var(--font-ui); font-size: 12px;
  font-weight: 800; cursor: pointer; border-radius: 11px; color: var(--muted);
  transition: color 0.18s; text-align: center; white-space: nowrap;
}
.pill-opt--on { color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }

/* ── HUD ── */
.hud {
  width: 100%; display: flex; gap: 7px; align-items: stretch;
}
.hud-card {
  flex: 1; background: linear-gradient(145deg, rgba(45,16,96,0.6), rgba(13,8,32,0.7));
  border: 2px solid rgba(192,38,211,0.2); border-radius: 14px; padding: 8px 10px;
  display: flex; flex-direction: column; gap: 1px;
  box-shadow: 0 3px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2);
  transition: border-color 0.3s;
}
.hud-card--hearts { display: flex; flex-direction: column; justify-content: center; gap: 3px; flex: none; }
.hud-lbl { font-family: var(--font-ui); font-size: 8px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
.hud-val {
  font-family: var(--font-game); font-size: 24px; line-height: 1; letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #f0eaff 0%, #c084fc 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hud-val--sm { font-size: 18px; }
.hud-card--score .hud-val {
  background: linear-gradient(135deg, #fff 0%, #f0abfc 50%, #c026d3 100%);
  -webkit-background-clip: text; background-clip: text;
}

/* ── HUD score row — combo inline ── */
.hud-score-row { display: flex; align-items: center; gap: 6px; line-height: 1; flex-wrap: nowrap; }
.hud-card--score { gap: 2px; min-width: 80px; }
.hud-card--score .hud-val { font-size: 26px; }
.combo-wrap { flex-shrink: 0; }

/* ── Speed bar ── */
.spd-wrap { width: 100%; padding: 0 2px; }
.spd-track { width: 100%; height: 5px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; }
.spd-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, #c026d3, #f0abfc, #fbbf24);
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 10px rgba(192,38,211,0.7);
}

/* ── Game area ── */
.game-area {
  position: relative; width: 100%;
  display: flex; justify-content: center; align-items: center;
  gap: 16px; flex: 1; min-height: 0;
  /* Extra top padding so a spinning evolve grid never clips the HUD/speed bar */
  padding-top: 8px;
}

/* Duo mode side-by-side layout is handled above */

/* gpanel gets overflow-visible so spin doesn't clip to panel bounds */
.gpanel { overflow: visible; }

/* Wrapper that keeps the rotating gpanel from affecting document flow */
.ppanel { overflow: visible; }

/* ── Game Over overlay ── */
.go-overlay {
  position: absolute; inset: 0; z-index: 50; border-radius: 22px;
  background: rgba(5,2,18,0.92); backdrop-filter: blur(16px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 20px; text-align: center; animation: fadeIn 0.4s ease;
}
@keyframes fadeIn { from { opacity: 0; } }
.go-eyebrow { font-family: var(--font-ui); font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); }
.go-num {
  font-family: var(--font-game); font-size: clamp(52px, 18vw, 76px); line-height: 1;
  letter-spacing: -2px; font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #fff 0%, #f0abfc 50%, #c026d3 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.go-best { font-family: var(--font-ui); font-size: 13px; color: var(--muted); font-weight: 700; }
.go-msg { font-family: var(--font-ui); font-size: 12px; color: var(--muted); font-style: italic; max-width: 240px; }
.go-winner { font-family: var(--font-game); font-size: 22px; }
.go-pair { display: flex; align-items: center; gap: 16px; }
.go-col { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.go-plbl { font-family: var(--font-ui); font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
.go-score { font-family: var(--font-game); font-size: 38px; }
.go-sep { width: 1px; height: 50px; background: var(--glass-border); }
.go-btns { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; }
.go-lb-form { display: flex; gap: 8px; width: 100%; max-width: 300px; flex-wrap: wrap; justify-content: center; }
.go-input {
  flex: 1 1 80px; background: rgba(255,255,255,0.08); border: 2px solid rgba(192,38,211,0.3);
  border-radius: 12px; padding: 10px 12px; color: var(--text);
  font-family: var(--font-game); font-size: 18px;
  text-align: center; letter-spacing: 3px; outline: none;
}
.go-input:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(192,38,211,0.2); }
.go-lb-saved { font-family: var(--font-ui); font-size: 13px; font-weight: 900; color: #4ade80; }
.go-bug-btn {
  font-family: var(--font-ui); font-size: 11px; font-weight: 800; color: var(--muted);
  text-decoration: none; opacity: 0.55; transition: opacity 0.15s; letter-spacing: 0.3px;
  padding: 4px 10px; border-radius: 8px;
}
.go-bug-btn:hover { opacity: 1; color: var(--text); }

/* ── Player panel ── */
.ppanel { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ppanel--dead { opacity: 0.4; pointer-events: none; filter: grayscale(0.6); }
.plabel-row { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 4px; }
.plabel { font-family: var(--font-game); font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }

/* ── 2P in-panel HUD ── */
.phud { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 0 4px; min-height: 36px; }
.phud-score {
  font-family: var(--font-game); font-size: 26px; line-height: 1; letter-spacing: -0.5px; font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #fff 0%, #f0abfc 50%, #c026d3 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* ── Hearts ── */
.hearts { display: flex; gap: 3px; }
.heart { font-size: 18px; transition: all 0.2s; line-height: 1; }
.heart--full  { color: #c026d3; filter: drop-shadow(0 0 7px rgba(192,38,211,0.7)); }
.heart--shield{ color: #60a5fa; filter: drop-shadow(0 0 8px rgba(96,165,250,0.8)); animation: shieldPulse 1s ease-in-out infinite; }
.heart--empty { color: var(--muted); opacity: 0.22; }
.heart--loss  { animation: heartPop 0.4s cubic-bezier(0.22,1,0.36,1); }
@keyframes heartPop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.6)} }
@keyframes shieldPulse { 0%,100%{filter:drop-shadow(0 0 6px rgba(96,165,250,0.7))} 50%{filter:drop-shadow(0 0 12px rgba(96,165,250,1))} }

/* ── Combo — sits inside score hud-card ── */
.combo-wrap {
  font-family: var(--font-game); font-size: 11px; letter-spacing: 0.5px;
  color: #fff; background: linear-gradient(135deg, var(--purple), var(--purple-dark));
  border-radius: 20px; padding: 1px 8px; align-self: flex-start;
  box-shadow: 0 2px 0 var(--purple-dark), 0 3px 8px rgba(192,38,211,0.4);
  animation: comboPop 0.25s cubic-bezier(0.22,1,0.36,1);
}
@keyframes comboPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }

/* ── Power-up chips (match level-up badge style) ── */
.pwr-pills { display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; justify-content: center; min-height: 26px; }
.pwr-chip {
  display: inline-flex; align-items: center; gap: 5px;
  border-radius: 99px; padding: 4px 10px 4px 7px;
  font-family: var(--font-game); font-size: 13px; font-weight: 800;
  box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.2);
  animation: chipPop 0.25s cubic-bezier(0.22,1,0.36,1);
}
@keyframes chipPop { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
.pwr-chip--shield { background: linear-gradient(135deg,#0e7490,#06b6d4); color:#fff; box-shadow: 0 2px 0 #164e63, 0 4px 10px rgba(6,182,212,0.4); }
.pwr-chip--freeze { background: linear-gradient(135deg,#1d4ed8,#60a5fa); color:#fff; box-shadow: 0 2px 0 #1e3a8a, 0 4px 10px rgba(96,165,250,0.4); }
.pwr-chip--mult   { background: linear-gradient(135deg,#c2410c,#f97316); color:#fff; box-shadow: 0 2px 0 #7c2d12, 0 4px 10px rgba(249,115,22,0.4); }
.pwr-chip-icon { font-size: 15px; line-height: 1; }
.pwr-chip-bar-track { flex:1; height:6px; background:rgba(255,255,255,0.2); border-radius:99px; overflow:hidden; min-width:40px; }
.pwr-chip-bar { height:100%; border-radius:99px; transition:width 0.1s linear; }
.pwr-chip-bar--freeze { background:linear-gradient(90deg,#bfdbfe,#fff); }
.pwr-chip-bar--mult { background:linear-gradient(90deg,#fb923c,#fff); }

/* ── Level-up side badge ── */
.levelup-badge {
  display: inline-flex; align-items: center; gap: 4px;
  border-radius: 99px; padding: 4px 12px;
  background: linear-gradient(135deg, #a21caf, #c026d3);
  color: #fff; font-family: var(--font-game); font-size: 13px;
  box-shadow: 0 2px 0 #6b21a8, 0 4px 12px rgba(192,38,211,0.45);
  animation: chipPop 0.3s cubic-bezier(0.22,1,0.36,1);
}

/* ── Grid panel ── */
.gpanel {
  background: transparent; border: none; box-shadow: none;
  border-radius: 20px; padding: 6px; display: grid; gap: var(--gap);
  transform-origin: center center;
  overflow: visible;
  transition: grid-template-columns 0.35s cubic-bezier(0.34,1.56,0.64,1),
              grid-template-rows 0.35s cubic-bezier(0.34,1.56,0.64,1);
}
.gpanel.shake-grid { animation: gridShake 0.4s cubic-bezier(.36,.07,.19,.97) both; animation-fill-mode: none; }
@keyframes gridShake { 0%,100%{translate:0 0} 20%{translate:-5px 3px} 40%{translate:5px -3px} 60%{translate:-4px 2px} 80%{translate:3px -2px} }

/* ── Void cell ── */
.cell-void { width: var(--cell); height: var(--cell); background: transparent; border: none; pointer-events: none; opacity: 0; }

/* ── Cells ── */
.cell {
  width: var(--cell); height: var(--cell); border-radius: var(--r);
  border: none; cursor: pointer; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.08s cubic-bezier(0.4,0,0.2,1), box-shadow 0.1s;
  -webkit-tap-highlight-color: transparent;
}
.cell:active { transform: scale(0.9) !important; }
.cell.inactive { background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.07); cursor: default; }
.cell.inactive::before { display: none; }
.cell--press { transform: scale(0.88) !important; }

/* Cell glossy shine */
.cell::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(145deg, rgba(255,255,255,0.25) 0%, transparent 55%);
  pointer-events: none; z-index: 1;
}

/* Cell inner content wrapper */
.cell > span:first-child { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }

.sym { position: relative; z-index: 3; font-size: 22px; line-height: 1; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5)); }

/* Cell colors */
.cell { clip-path: none !important; }
.cell-tri-shape {
  position: absolute; inset: 0; border-radius: inherit;
  clip-path: polygon(50% 6%, 94% 92%, 6% 92%);
  pointer-events: none;
}
/* Triangle color overlays */
.cell.triangle-white .cell-tri-shape,
.cell.white.triangle .cell-tri-shape   { background: linear-gradient(145deg,#fff,#c7d2e8); }
.cell.triangle-blue .cell-tri-shape,
.cell.blue.triangle .cell-tri-shape    { background: linear-gradient(145deg,#60a5fa,#2563eb); }
.cell.triangle-red .cell-tri-shape,
.cell.red.triangle .cell-tri-shape     { background: linear-gradient(145deg,#f87171,#dc2626); }
.cell.triangle-orange .cell-tri-shape,
.cell.orange.triangle .cell-tri-shape  { background: linear-gradient(145deg,#fb923c,#ea580c); }
.cell.triangle-yellow .cell-tri-shape,
.cell.yellow.triangle .cell-tri-shape  { background: linear-gradient(145deg,#fde047,#ca8a04); }
.cell.triangle-green .cell-tri-shape,
.cell.green.triangle .cell-tri-shape   { background: linear-gradient(145deg,#4ade80,#16a34a); }
.cell.triangle-cyan .cell-tri-shape,
.cell.cyan.triangle .cell-tri-shape    { background: linear-gradient(145deg,#22d3ee,#0891b2); }
.cell.triangle-lime .cell-tri-shape,
.cell.lime.triangle .cell-tri-shape    { background: linear-gradient(145deg,#a3e635,#65a30d); }
.cell.triangle-teal .cell-tri-shape,
.cell.teal.triangle .cell-tri-shape    { background: linear-gradient(145deg,#2dd4bf,#0f766e); }
.cell.triangle-pink .cell-tri-shape,
.cell.pink.triangle .cell-tri-shape    { background: linear-gradient(145deg,#f472b6,#db2777); }
.cell.triangle-rose .cell-tri-shape,
.cell.rose.triangle .cell-tri-shape    { background: linear-gradient(145deg,#fb7185,#e11d48); }
.cell.triangle-magenta .cell-tri-shape,
.cell.magenta.triangle .cell-tri-shape { background: linear-gradient(145deg,#e879f9,#a21caf); }
.cell.triangle-purple .cell-tri-shape,
.cell.purple.triangle .cell-tri-shape  { background: linear-gradient(145deg,#d946ef,#7c3aed); }
.cell.white   { background: linear-gradient(145deg,#fff,#c7d2e8); box-shadow: 0 4px 0 #8fa0bb, 0 5px 14px rgba(200,210,230,0.4); }
.cell.blue    { background: linear-gradient(145deg,#60a5fa,#2563eb); box-shadow: 0 4px 0 #1e40af, 0 5px 14px rgba(59,130,246,0.5); }
.cell.red     { background: linear-gradient(145deg,#f87171,#dc2626); box-shadow: 0 4px 0 #991b1b, 0 5px 14px rgba(239,68,68,0.5); }
.cell.orange  { background: linear-gradient(145deg,#fb923c,#ea580c); box-shadow: 0 4px 0 #9a3412, 0 5px 14px rgba(249,115,22,0.5); }
.cell.yellow  { background: linear-gradient(145deg,#fde047,#ca8a04); box-shadow: 0 4px 0 #854d0e, 0 5px 14px rgba(234,179,8,0.5); }
.cell.green   { background: linear-gradient(145deg,#4ade80,#16a34a); box-shadow: 0 4px 0 #14532d, 0 5px 14px rgba(34,197,94,0.5); }
.cell.cyan    { background: linear-gradient(145deg,#22d3ee,#0891b2); box-shadow: 0 4px 0 #164e63, 0 5px 14px rgba(6,182,212,0.5); }
.cell.lime    { background: linear-gradient(145deg,#a3e635,#65a30d); box-shadow: 0 4px 0 #365314, 0 5px 14px rgba(132,204,22,0.5); }
.cell.teal    { background: linear-gradient(145deg,#2dd4bf,#0f766e); box-shadow: 0 4px 0 #134e4a, 0 5px 14px rgba(20,184,166,0.5); }
.cell.pink    { background: linear-gradient(145deg,#f472b6,#db2777); box-shadow: 0 4px 0 #831843, 0 5px 14px rgba(236,72,153,0.5); }
.cell.rose    { background: linear-gradient(145deg,#fb7185,#e11d48); box-shadow: 0 4px 0 #881337, 0 5px 14px rgba(244,63,94,0.5); }
.cell.magenta { background: linear-gradient(145deg,#e879f9,#a21caf); box-shadow: 0 4px 0 #701a75, 0 5px 14px rgba(217,70,239,0.5); }
.cell.purple  {
  background: linear-gradient(145deg,#d946ef,#7c3aed);
  box-shadow: 0 4px 0 #4c1d95, 0 5px 16px rgba(192,38,211,0.5);
  animation: purplePulse 1.5s ease-in-out infinite;
}
@keyframes purplePulse {
  0%,100% { box-shadow: 0 4px 0 #4c1d95, 0 5px 16px rgba(192,38,211,0.5); }
  50%      { box-shadow: 0 4px 0 #4c1d95, 0 5px 28px rgba(192,38,211,0.8), 0 0 0 3px rgba(192,38,211,0.2); }
}

/* Power-up cells */
.cell.medpack    { background: linear-gradient(145deg,#fcd34d,#d97706); box-shadow: 0 4px 0 #92400e, 0 5px 14px rgba(251,191,36,0.5); }
.cell.shield     { background: linear-gradient(145deg,#67e8f9,#0891b2); box-shadow: 0 4px 0 #164e63, 0 5px 14px rgba(6,182,212,0.5); }
.cell.freeze     { background: linear-gradient(145deg,#bfdbfe,#3b82f6); box-shadow: 0 4px 0 #1e3a8a, 0 5px 14px rgba(147,197,253,0.5); }
.cell.multiplier { background: linear-gradient(145deg,#fb923c,#ea580c); box-shadow: 0 4px 0 #9a3412, 0 5px 14px rgba(249,115,22,0.5); }

/* Ice, Hold, Slider cells */
.cell.ice {
  background: linear-gradient(145deg,#e0f2fe,#7dd3fc,#2563eb);
  box-shadow: 0 4px 0 #1e40af, 0 5px 14px rgba(96,165,250,0.6);
}
.cell.hold {
  background: radial-gradient(circle at 50% 35%, #ff6b6b, #cc0000);
  box-shadow: 0 5px 0 #7f0000, 0 6px 20px rgba(220,0,0,0.5);
}
/* ── Cell animations ── */
.cell.pop   { animation: pop   0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
.cell.shake { animation: shake 0.42s cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
@keyframes pop {
  0%   { transform: scale(1); opacity: 1; }
  40%  { transform: scale(1.3) rotate(var(--tilt,0deg)); }
  70%  { transform: scale(0.85) rotate(calc(var(--tilt,0deg)*-0.5)); opacity: 0.7; }
  100% { transform: scale(0) rotate(var(--tilt,0deg)); opacity: 0; }
}
@keyframes shake {
  0%,100% { transform: translateX(0) rotate(0deg); }
  20%     { transform: translateX(-10px) rotate(-1.5deg); }
  35%     { transform: translateX(9px)  rotate(1deg); }
  50%     { transform: translateX(-7px) rotate(-0.8deg); }
  65%     { transform: translateX(5px)  rotate(0.5deg); }
  80%     { transform: translateX(-3px) rotate(-0.3deg); }
}
@keyframes newcell { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.cell.newcell { animation: newcell 0.3s cubic-bezier(0.22,1,0.36,1); }

/* ── Ripple ── */
.ripple {
  position: absolute; width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.65); transform: translate(-50%,-50%) scale(0);
  animation: rippleAnim 0.5s ease-out forwards; pointer-events: none; z-index: 10;
}
@keyframes rippleAnim { to { transform: translate(-50%,-50%) scale(6); opacity: 0; } }

/* ── Shard ── */
.shard {
  position: absolute; width: 6px; height: 6px; border-radius: 2px;
  animation: shardFly 0.42s cubic-bezier(0.22,1,0.36,1) forwards;
  pointer-events: none; z-index: 20;
}
@keyframes shardFly {
  0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx,20px),var(--dy,-20px)) rotate(var(--dr,180deg)) scale(0); opacity: 0; }
}

/* ── Ice overlay ── */
.cell-overlay-ice {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-game); font-size: 16px; color: #fff; z-index: 4;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5); pointer-events: none; letter-spacing: -1px;
}

/* ── Hold button design ── */
.cell-overlay-hold {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px; z-index: 4; pointer-events: none;
}
.hold-btn-outer {
  width: 78%; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, #ff9999, #cc0000);
  border: 3px solid rgba(255,150,150,0.5);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 0 #7f0000, 0 0 12px rgba(255,0,0,0.4), inset 0 2px 4px rgba(255,200,200,0.3);
  transition: transform 0.1s, box-shadow 0.1s;
}
.hold-btn-inner {
  width: 72%; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, #ff4444, #990000);
  border: 2px solid rgba(255,100,100,0.4);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-game); font-size: 10px; color: #ffcccc;
  letter-spacing: 0.3px; text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}
.hold-btn-pressed .hold-btn-outer { transform: scaleY(0.88); box-shadow: 0 2px 0 #7f0000, 0 0 18px rgba(255,50,50,0.6); }
.hold-btn-pressed .hold-btn-inner { font-size: 12px; color: #fff; }
.hold-progress {
  position: absolute; bottom: 5px; left: 6px; right: 6px; height: 3px; border-radius: 99px;
  background: rgba(255,255,255,0.25); overflow: hidden;
}
.hold-progress-fill {
  display: block; height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, #ff6b6b, #fff);
  transition: width 0.05s linear;
}

/* ── Stage badge (removed per item 14, but kept for potential future use) ── */
.stage-badge { display: none; }

/* ── Share card ── */
.share-card { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.share-inner {
  width: 100%;
  background: linear-gradient(135deg, rgba(192,38,211,0.12), rgba(59,130,246,0.08));
  border: 2px solid rgba(192,38,211,0.2); border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.share-logo { font-family: var(--font-game); font-size: 11px; color: var(--muted); }
.share-score {
  font-family: var(--font-game); font-size: 52px; font-weight: 900; line-height: 1; letter-spacing: -2px;
  background: linear-gradient(135deg,#fff,#f0abfc,#c026d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.share-mode { font-family: var(--font-ui); font-size: 10px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: var(--purple); }
.share-invite { font-family: var(--font-game); font-size: 14px; color: var(--text); margin-top: 2px; }
.share-url { font-size: 10px; color: var(--muted); margin-top: 3px; }
.share-btns { display: flex; gap: 7px; width: 100%; flex-wrap: wrap; }
.share-social {
  flex: 1; min-width: 80px; display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 10px 6px; border-radius: 12px; font-family: var(--font-ui); font-size: 12px; font-weight: 800;
  cursor: pointer; border: none; text-decoration: none; transition: all 0.15s;
}
.share-social-icon { font-size: 13px; }
.share-social--x   { background: #000; color: #fff; }
.share-social--wa  { background: #25d366; color: #fff; }
.share-social--copy { background: var(--bg2); color: var(--text); border: 2px solid var(--glass-border); }
.share-social:hover { transform: translateY(-1px); }

/* ── Powerup zone — fixed height slot between top UI and grid ── */
.pwr-zone {
  width: 100%; min-height: 40px; display: flex; align-items: center;
  justify-content: center; gap: 6px; flex-wrap: wrap;
}
.pwr-zone--1p { margin-bottom: 2px; }

/* ── 2P phud score row with inline combo ── */
.phud-score-row { display: flex; align-items: center; gap: 6px; }
.combo-wrap--sm { font-size: 10px; padding: 1px 6px; }

/* ── Pause settings row ── */
.pause-settings-row {
  display: flex; gap: 8px; width: 100%; justify-content: center;
}
.pause-setting-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.12);
  border-radius: 14px; padding: 10px 8px; cursor: pointer; color: var(--text);
  font-family: var(--font-ui); font-size: 11px; font-weight: 800;
  transition: all 0.15s;
}
.pause-setting-btn:hover { background: rgba(192,38,211,0.18); border-color: rgba(192,38,211,0.4); transform: translateY(-2px); }
.pause-setting-btn > span { color: var(--muted); font-size: 10px; }

/* ── Keyboard cell vibrancy ── */
.kb-cell {
  padding: 10px 4px; background: var(--bg2); border: 2px solid var(--glass-border);
  border-radius: 9px; color: var(--text); font-family: var(--font-ui); font-size: 13px;
  font-weight: 800; cursor: pointer; transition: all 0.15s; text-align: center;
}
.kb-cell:not(.kb-cell--on):not(.kb-cell--empty) {
  background: linear-gradient(145deg, rgba(140,90,210,0.18), rgba(80,40,160,0.1));
  border-color: rgba(192,38,211,0.28);
  color: var(--text);
  box-shadow: 0 2px 0 rgba(0,0,0,0.3);
}
.kb-cell:not(.kb-cell--on):hover {
  background: linear-gradient(145deg, rgba(192,38,211,0.3), rgba(124,58,237,0.2));
  border-color: rgba(192,38,211,0.55);
  transform: translateY(-1px);
}
.kb-cell--on { background: linear-gradient(135deg, #a21caf, #c026d3); color: #fff; border-color: var(--purple); box-shadow: 0 3px 0 var(--purple-dark), 0 4px 12px rgba(192,38,211,0.4); }
.kb-cell--empty { color: var(--muted); opacity: 0.5; }

/* ── Hover gradient animations on UI cells/cards ── */
.hud-card, .menu-card, .btn-ghost, .btn-primary, .pill-opt, .opt-btn, .lb-row, .how-row {
  position: relative; overflow: hidden;
}
.hud-card::after, .menu-card::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(192,38,211,0.12) 0%, transparent 60%);
  opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 0;
}
.hud-card:hover::after, .menu-card:hover::after { opacity: 1; }

/* Cell hover — gradient shimmer */
.cell:not(.inactive):hover {
  filter: brightness(1.18) saturate(1.15);
  transform: scale(1.04) !important;
  transition: transform 0.1s, filter 0.1s, box-shadow 0.1s !important;
}

/* Btn-ghost hover gradient shift */
.btn-ghost::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(192,38,211,0.12), rgba(124,58,237,0.08));
  opacity: 0; transition: opacity 0.2s; pointer-events: none;
}
.btn-ghost:hover::after { opacity: 1; }

/* Pill option hover */
.pill-opt:not(.pill-opt--on):hover {
  color: var(--text);
  background: rgba(192,38,211,0.12);
}

/* LB row hover */
.lb-row { transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; }
.lb-row:hover { transform: translateX(3px); border-color: rgba(192,38,211,0.3); box-shadow: 0 4px 14px rgba(192,38,211,0.12); }

/* Btn-icon hover */
.btn-icon:hover {
  background: rgba(192,38,211,0.2) !important;
  border-color: rgba(192,38,211,0.45) !important;
  transform: scale(1.08);
}
.btn-icon--pause:hover {
  background: rgba(192,38,211,0.28) !important;
  box-shadow: 0 0 12px rgba(192,38,211,0.35);
}

/* ── Key badge ── */
.kbadge { position: absolute; bottom: 3px; right: 3px; font-size: 7px; font-weight: 900; background: rgba(0,0,0,0.4); color: #fff; padding: 1px 3px; border-radius: 4px; z-index: 5; letter-spacing: 0.5px; }

/* ── Screen slide ── */
.screen-slide { animation: screenSlide 0.3s cubic-bezier(0.22,1,0.36,1); }
@keyframes screenSlide { from { opacity:0; transform:translateX(18px); } }

/* ── Leaderboard ── */
.lb-wrap { width: 100%; display: flex; flex-direction: column; gap: 14px; }
.lb-header { display: flex; align-items: baseline; gap: 10px; }
.lb-title { font-family: var(--font-game); font-size: 22px; }
.lb-sub { font-family: var(--font-ui); font-size: 11px; color: var(--muted); font-weight: 700; }
.lb-empty { font-family: var(--font-ui); font-size: 14px; color: var(--muted); text-align: center; padding: 22px 0; }
.lb-list { display: flex; flex-direction: column; gap: 6px; }
.lb-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg2); border: 2px solid var(--glass-border); border-radius: 14px; }
.lb-row--gold   { border-color: rgba(250,204,21,0.4); background: rgba(250,204,21,0.06); }
.lb-row--silver { border-color: rgba(148,163,184,0.3); }
.lb-row--bronze { border-color: rgba(180,120,60,0.3); }
.lb-rank { font-size: 16px; width: 22px; text-align: center; }
.lb-ini  { font-family: var(--font-game); font-size: 15px; flex: 1; }
.lb-score { font-family: var(--font-game); font-size: 18px; color: var(--purple); }
.lb-date  { font-family: var(--font-ui); font-size: 10px; color: var(--muted); }

/* ── How to play ── */
.how-wrap { width: 100%; display: flex; flex-direction: column; gap: 14px; }
.how-title { font-family: var(--font-game); font-size: 22px; }
.how-grid { display: flex; flex-direction: column; gap: 8px; }
.how-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--bg2); border: 2px solid var(--glass-border); border-radius: 14px; }
.how-icon { font-size: 20px; flex-shrink: 0; }
.how-modes { display: flex; flex-direction: column; gap: 5px; }
.how-mode { font-family: var(--font-ui); font-size: 13px; color: var(--muted); }
.how-tip { font-family: var(--font-ui); font-size: 12px; color: var(--muted); background: var(--bg2); border-radius: 10px; padding: 8px 12px; }

/* ── Key binder ── */
.kb-overlay { position: fixed; inset: 0; z-index: 600; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.kb-panel { background: #0d0820; border: 2px solid rgba(192,38,211,0.3); border-radius: 22px; padding: 22px; width: 100%; max-width: 350px; display: flex; flex-direction: column; gap: 14px; }
.light-theme .kb-panel { background: #f0e8ff; }
.kb-title { font-family: var(--font-game); font-size: 18px; }
.kb-hint { font-family: var(--font-ui); font-size: 12px; color: var(--muted); }
.kb-tabs { display: flex; gap: 7px; }
.kb-tab { flex: 1; padding: 8px; background: var(--bg2); border: 2px solid var(--glass-border); border-radius: 10px; color: var(--muted); font-family: var(--font-ui); font-weight: 800; cursor: pointer; transition: all 0.15s; }
.kb-tab--on { background: var(--purple); color: #fff; border-color: var(--purple); }
.kb-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; }
.kb-footer { display: flex; justify-content: space-between; align-items: center; }

/* ── Credit footer ── */
.credit { position: fixed; bottom: 8px; left: 0; right: 0; display: flex; align-items: center; justify-content: center; font-family: var(--font-ui); font-size: 10px; color: var(--muted); opacity: 0.45; flex-wrap: wrap; pointer-events: none; gap: 4px; }
.credit-link { color: var(--muted); text-decoration: none; pointer-events: all; transition: opacity 0.15s; }
.credit-link:hover { opacity: 1; }

/* ── Privacy banner — bottom fixed ── */
.privacy-banner { position:fixed; bottom:0; left:0; right:0; z-index:600; background:rgba(13,8,32,0.92); backdrop-filter:blur(12px); border-top:1px solid rgba(192,38,211,0.2); padding:10px 16px; display:flex; align-items:center; justify-content:center; gap:6px; font-family:var(--font-ui); font-size:12px; color:var(--muted); text-align:center; animation:slideUp 0.3s ease; }
@keyframes slideUp { from { transform:translateY(100%); } }
.privacy-txt { display:inline; }
.privacy-link-inline { color:var(--accent); text-decoration:none; }
.privacy-dismiss-btn { background:rgba(255,255,255,0.1); border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:4px 8px; border-radius:4px; margin-left:8px; transition:background 0.15s; }
.privacy-dismiss-btn:hover { background:rgba(255,255,255,0.2); color:var(--text); }

/* ── Menu top row: player pill + inline energy ── */
.menu-top-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.player-pill { display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:99px; padding:5px 12px 5px 8px; cursor:pointer; transition:background 0.15s, border-color 0.15s; font-family:var(--font-ui); }
.player-pill:hover { background:rgba(192,38,211,0.15); border-color:rgba(192,38,211,0.35); }
.player-pill-icon { font-size:14px; }
.player-pill-name { font-size:13px; font-weight:800; color:var(--text); max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.player-pill-edit { font-size:11px; color:var(--muted); margin-left:2px; }
.energy-inline { display:flex; align-items:center; gap:3px; }
.energy-inline .energy-pip { font-size:14px; }
.energy-inline-timer { font-family:var(--font-ui); font-size:10px; color:var(--muted); margin-left:4px; }

/* ── Stored pwr row — below pwr-zone, no overlap ── */
.stored-pwr-row { display:flex; gap:8px; justify-content:center; padding:2px 0 4px; }

/* ── Overlay glass ── */
.overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.5); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.glass-panel { background: #0d0820; border: 2px solid rgba(192,38,211,0.25); border-radius: 26px; padding: 26px; width: 100%; max-width: 380px; box-shadow: 0 32px 64px rgba(0,0,0,0.4); }
.light-theme .glass-panel { background: #f0e8ff; }

/* ── Grid rotation wrapper ── */
.gpanel-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
}

/* ── Rotation direction arrows — UNO-card style, only flash on direction change ── */
.rot-arrows-container {
  position: absolute;
  inset: -60px;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rot-arrow {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.rot-arrow--cw {
  width: clamp(180px, 60vw, 300px);
  height: clamp(180px, 60vw, 300px);
  color: rgba(192,38,211,0.95);
  filter: drop-shadow(0 0 24px rgba(192,38,211,0.8));
}
.rot-arrow--ccw {
  width: clamp(180px, 60vw, 300px);
  height: clamp(180px, 60vw, 300px);
  color: rgba(96,165,250,0.95);
  filter: drop-shadow(0 0 24px rgba(96,165,250,0.8));
}
.rot-arrow--active {
  animation: unoArrowFlash 2.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
.rot-arrow--cw.rot-arrow--active {
  animation: unoArrowFlashCW 2.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
.rot-arrow--ccw.rot-arrow--active {
  animation: unoArrowFlashCCW 2.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
@keyframes unoArrowFlashCW {
  0%   { opacity: 0;    transform: scale(0.5) rotate(-30deg); }
  15%  { opacity: 0.75; transform: scale(1.12) rotate(8deg); }
  35%  { opacity: 0.55; transform: scale(1.0)  rotate(0deg); }
  60%  { opacity: 0.45; transform: scale(1.0)  rotate(0deg); }
  80%  { opacity: 0.25; transform: scale(1.0)  rotate(0deg); }
  100% { opacity: 0;    transform: scale(0.9)  rotate(-5deg); }
}
@keyframes unoArrowFlashCCW {
  0%   { opacity: 0;    transform: scale(0.5) rotate(30deg); }
  15%  { opacity: 0.75; transform: scale(1.12) rotate(-8deg); }
  35%  { opacity: 0.55; transform: scale(1.0)  rotate(0deg); }
  60%  { opacity: 0.45; transform: scale(1.0)  rotate(0deg); }
  80%  { opacity: 0.25; transform: scale(1.0)  rotate(0deg); }
  100% { opacity: 0;    transform: scale(0.9)  rotate(5deg); }
}

/* ── Continuous grid spin (CSS-only, duration set via inline style) ── */
@keyframes gpanelSpinContinuousCW  { to { transform: rotate(360deg);  } }
@keyframes gpanelSpinContinuousCCW { to { transform: rotate(-360deg); } }

/* ── Grid entry animations (one-shot, triggered on grid change) ── */
.gpanel--spin-cw    { animation: gpanelEntryCW    0.55s cubic-bezier(0.22,1,0.36,1); }
.gpanel--spin-ccw   { animation: gpanelEntryCCW   0.55s cubic-bezier(0.22,1,0.36,1); }
.gpanel--spin-jiggle{ animation: gpanelJiggle     0.55s cubic-bezier(0.22,1,0.36,1); }
@keyframes gpanelEntryCW   { 0%{transform:scale(0.82) rotate(-90deg);opacity:0.3} 60%{transform:scale(1.03) rotate(4deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes gpanelEntryCCW  { 0%{transform:scale(0.82) rotate(90deg);opacity:0.3}  60%{transform:scale(1.03) rotate(-4deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes gpanelJiggle    { 0%{transform:scale(0.86) rotate(-8deg);opacity:0.4} 20%{transform:scale(1.06) rotate(6deg);opacity:1} 40%{transform:scale(0.97) rotate(-3deg)} 60%{transform:scale(1.02) rotate(2deg)} 80%{transform:scale(0.99) rotate(-1deg)} 100%{transform:scale(1) rotate(0deg)} }

/* Cell counter-spin at high evolve stages */
@keyframes cellCounterSpin { to { transform: rotate(-360deg); } }

/* ── Duo mode: wide spacing so fingers don't overlap ── */
.root--2p .game-area {
  align-items: center;
  justify-content: space-around;
  gap: 0;
  padding: 8px 4px;
}
.root--2p .ppanel {
  flex: 1;
  align-items: center;
}

/* On narrow/phone screens: stack vertically with generous gap */
@media (max-width: 600px) {
  .root--2p .game-area {
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    gap: 0;
    padding: 4px 0 16px;
  }
  .root--2p .ppanel {
    width: 100%;
    max-width: 300px;
  }
  .root--2p {
    --cell: clamp(48px, 13vw, 66px);
  }
}

/* On wider screens keep side-by-side with max separation */
@media (min-width: 601px) {
  .root--2p { max-width: 740px; }
  .root--2p .game-area { gap: 24px; }
}

/* ── Screen transitions — scoped to UI panels only, not game cells ── */
.menu-card, .hud-card, .lb-row, .how-row, .btn-ghost, .btn-primary, .opt-btn, .pill-opt, .drawer-panel, .pause-card {
  transition: background-color 0.4s ease, border-color 0.3s ease, color 0.3s ease;
}
.root, .menu-card, .hud-card, .gpanel, .ppanel { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }

/* ── Loading screen ── */
.loading-screen {
  position: fixed; inset: 0; z-index: 9999;
  width: 100vw; height: 100dvh;
  background: linear-gradient(145deg, #0d0820, #1a0a3e);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
  transition: opacity 0.6s ease, transform 0.6s ease;
  text-align: center;
}
.loading-screen--out { opacity: 0; transform: scale(1.05); pointer-events: none; }
.loading-logo { font-family: 'Fredoka One', system-ui, sans-serif; font-size: clamp(26px,8vw,44px); color: #f0eaff; text-align: center; letter-spacing: 0.5px; }
.loading-purple { color: #c026d3; text-shadow: 0 0 24px rgba(192,38,211,0.7); }
.loading-sub { font-family: 'Nunito', system-ui, sans-serif; font-size: 13px; color: rgba(240,234,255,0.45); font-weight: 700; letter-spacing: 0.3px; }
.loading-bar-track { width: min(280px, 80vw); height: 10px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; border: 1px solid rgba(192,38,211,0.25); }
.loading-bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #7c3aed, #c026d3, #f0abfc); transition: width 0.25s ease; box-shadow: 0 0 14px rgba(192,38,211,0.6); }
.loading-pct { font-family: 'Fredoka One', system-ui, sans-serif; font-size: 13px; color: rgba(192,38,211,0.65); }

/* ── Dev overlay ── */
.dev-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); display: flex; align-items: stretch; justify-content: flex-end; }
.dev-panel { width: min(340px,95vw); height: 100%; overflow-y: auto; background: #050212; border-left: 1px solid rgba(192,38,211,0.3); padding: 16px; display: flex; flex-direction: column; gap: 3px; }
.dev-title { font-family: monospace; font-size: 11px; font-weight: 900; color: #f0abfc; margin-bottom: 8px; border-bottom: 1px solid rgba(192,38,211,0.2); padding-bottom: 6px; }
.dev-section { font-family: monospace; font-size: 9px; font-weight: 900; color: rgba(192,38,211,0.7); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 8px; margin-bottom: 2px; }
.dev-row { display: flex; justify-content: space-between; gap: 8px; font-family: monospace; font-size: 10px; color: #c0b8e0; padding: 1px 0; }
.dev-key { color: rgba(192,200,255,0.55); flex-shrink: 0; }
.dev-val { color: #88f0a0; word-break: break-all; text-align: right; }
.dev-btn { display: inline-block; background: rgba(192,38,211,0.12); border: 1px solid rgba(192,38,211,0.28); border-radius: 4px; padding: 2px 7px; margin: 2px; cursor: pointer; transition: background 0.12s; font-family: monospace; font-size: 10px; color: #c0b8e0; }
.dev-btn:hover { background: rgba(192,38,211,0.32); color: #fff; }

/* ── Dust widget ── */
.dust-widget { display:flex; align-items:center; gap:4px; background:rgba(192,38,211,0.12); border:1px solid rgba(192,38,211,0.25); border-radius:99px; padding:3px 10px; font-family:var(--font-ui); font-size:13px; font-weight:800; color:var(--accent); cursor:default; }
.dust-icon { font-size:14px; }
.dust-val { letter-spacing:0.3px; }

/* ── Energy bar (standalone, used in no-energy block) ── */
.energy-bar-wrap { display:flex; flex-direction:column; align-items:center; gap:4px; }
.energy-pips { display:flex; gap:4px; }
.energy-pip { font-size:14px; opacity:0.22; transition:opacity 0.25s; filter:grayscale(1); }
.energy-pip--full { opacity:1; filter:none; }
.energy-regen-row { display:flex; align-items:center; gap:8px; }
.energy-timer { font-family:var(--font-ui); font-size:11px; color:var(--muted); }
.energy-refill-btn { background:rgba(192,38,211,0.12); border:1px solid rgba(192,38,211,0.28); border-radius:99px; padding:2px 10px; font-family:var(--font-ui); font-size:11px; font-weight:800; color:var(--accent); cursor:pointer; transition:background 0.15s; }
.energy-refill-btn:hover { background:rgba(192,38,211,0.28); }

/* ── No energy block ── */
.no-energy-block { display:flex; flex-direction:column; align-items:center; gap:4px; padding:14px; background:rgba(255,255,255,0.04); border:1px dashed rgba(192,38,211,0.2); border-radius:16px; margin:4px 0; }
.no-energy-txt { font-family:var(--font-ui); font-size:15px; font-weight:800; color:var(--muted); }
.no-energy-timer { font-family:var(--font-ui); font-size:22px; font-weight:900; color:var(--accent); letter-spacing:1px; }

/* ── Shop ── */
.shop-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.shop-item { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:12px; display:flex; flex-direction:column; align-items:center; gap:6px; transition:border-color 0.2s; }
.shop-item--equipped { border-color:var(--theme-purple,var(--purple)); background:rgba(192,38,211,0.1); }
.shop-swatch { width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); }
.shop-name { font-family:var(--font-ui); font-size:13px; font-weight:800; color:var(--text); }

/* ── Loading orbs ── */
.loading-orb { position:absolute; border-radius:50%; filter:blur(60px); pointer-events:none; }
.loading-orb-1 { width:280px; height:280px; background:rgba(192,38,211,0.25); top:-60px; left:-80px; animation:orbFloat 7s ease-in-out infinite; }
.loading-orb-2 { width:200px; height:200px; background:rgba(124,58,237,0.2); bottom:-40px; right:-60px; animation:orbFloat 9s ease-in-out infinite reverse; }
.loading-orb-3 { width:140px; height:140px; background:rgba(240,171,252,0.15); top:50%; left:50%; transform:translate(-50%,-50%); animation:orbFloat 5s ease-in-out infinite; }

/* ── Loading name entry ── */
.loading-name-entry { display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:8px; }
.loading-name-label { font-family:var(--font-ui); font-size:14px; font-weight:800; color:rgba(240,234,255,0.7); }
.loading-name-row { display:flex; gap:8px; align-items:center; }

/* ── Leaderboard mode chip ── */
.lb-mode-chip { flex-shrink:0; }

/* ── Game over dust earned ── */
.go-dust-earned { font-family:var(--font-ui); font-size:14px; font-weight:800; color:var(--accent); background:rgba(192,38,211,0.12); border:1px solid rgba(192,38,211,0.2); border-radius:99px; padding:4px 14px; margin:4px 0; }

.shop-tabs { display:flex; gap:6px; margin-bottom:12px; }
.shop-tab { flex:1; padding:8px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); font-family:var(--font-ui); font-size:13px; font-weight:800; color:var(--muted); cursor:pointer; transition:all 0.15s; }
.shop-tab--on { background:rgba(192,38,211,0.2); border-color:rgba(192,38,211,0.4); color:var(--text); }
.shop-hint { font-size:11px; color:var(--muted); margin-bottom:10px; font-family:var(--font-ui); }
.shop-inventory { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(192,38,211,0.1); border-radius:10px; margin-bottom:10px; }
.shop-inv-lbl { font-size:11px; color:var(--muted); font-family:var(--font-ui); }
.shop-inv-chip { font-size:13px; font-weight:800; font-family:var(--font-ui); color:var(--accent); background:rgba(192,38,211,0.15); padding:2px 8px; border-radius:99px; }
.shop-pwr-list { display:flex; flex-direction:column; gap:8px; }
.shop-pwr-item { display:flex; align-items:center; gap:10px; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:14px; }
.shop-pwr-icon { font-size:20px; min-width:36px; text-align:center; }
.shop-pwr-info { flex:1; }
.shop-pwr-name { font-family:var(--font-ui); font-size:13px; font-weight:800; color:var(--text); }
.shop-pwr-desc { font-family:var(--font-ui); font-size:11px; color:var(--muted); }
.shop-item--bought { animation: shopBought 0.5s ease; }
@keyframes shopBought { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
.stored-pwr-btns { display:flex; gap:6px; justify-content:center; margin-top:4px; }
.stored-pwr-btn { border-radius:99px; border:none; padding:5px 14px; font-family:var(--font-ui); font-size:13px; font-weight:900; cursor:pointer; transition:transform 0.1s, box-shadow 0.1s; }
.stored-pwr-btn:active { transform:scale(0.94); }
.stored-pwr-btn--freeze { background:linear-gradient(135deg,#1d4ed8,#60a5fa); color:#fff; box-shadow:0 4px 14px rgba(96,165,250,0.4); }
.stored-pwr-btn--shield { background:linear-gradient(135deg,#0e7490,#22d3ee); color:#fff; box-shadow:0 4px 14px rgba(34,211,238,0.4); }
`;

