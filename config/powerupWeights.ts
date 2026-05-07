// ─── Powerup spawn weights ────────────────────────────────────────
export interface PowerupWeight {
  type:   string;
  weight: number;
}

export const POWERUP_TABLE: PowerupWeight[] = [
  { type: "medpack",    weight: 7 },
  { type: "shield",     weight: 5 },
  { type: "freeze",     weight: 4 },
  { type: "multiplier", weight: 5 },
];

// ─── Shop items — themes ──────────────────────────────────────────
export interface ShopTheme {
  id:     string;
  name:   string;
  cost:   number;
  colors: { bg: string; purple: string; accent: string; text: string; textMuted?: string };
}

export const SHOP_THEMES: ShopTheme[] = [
  { id:"default",  name:"Default",  cost:0,    colors:{bg:"#0d0820",purple:"#c026d3",accent:"#f0abfc",text:"#f0eaff"} },
  { id:"neon",     name:"Neon",     cost:400,  colors:{bg:"#001a1a",purple:"#00ffe0",accent:"#00ffa0",text:"#e0fff8"} },
  { id:"midnight", name:"Midnight", cost:300,  colors:{bg:"#060614",purple:"#818cf8",accent:"#c7d2fe",text:"#e0e7ff"} },
  { id:"pastel",   name:"Pastel",   cost:150,  colors:{bg:"#f5e6ff",purple:"#c026d3",accent:"#f9a8d4",text:"#2d0a4e",textMuted:"rgba(45,10,78,0.65)"} },
  { id:"toxic",    name:"Toxic",    cost:200,  colors:{bg:"#021a0a",purple:"#22c55e",accent:"#4ade80",text:"#d1fae5",textMuted:"rgba(209,250,229,0.6)"} },
  { id:"inferno",  name:"Inferno",  cost:250,  colors:{bg:"#1a0500",purple:"#ef4444",accent:"#fca5a5",text:"#fee2e2",textMuted:"rgba(254,226,226,0.6)"} },
  { id:"ocean",    name:"Ocean",    cost:200,  colors:{bg:"#020d1a",purple:"#0ea5e9",accent:"#7dd3fc",text:"#e0f2fe",textMuted:"rgba(224,242,254,0.6)"} },
  { id:"gold",     name:"Gold Rush",cost:300,  colors:{bg:"#1a1200",purple:"#f59e0b",accent:"#fbbf24",text:"#fef3c7",textMuted:"rgba(254,243,199,0.6)"} },
];

// ─── Shop items — badges ──────────────────────────────────────────
export interface ShopBadge {
  id:   string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
}

export const SHOP_BADGES: ShopBadge[] = [
  { id:"fire",    name:"On Fire",    icon:"🔥", cost:200, desc:"For the relentless grinder" },
  { id:"crown",   name:"Royalty",    icon:"👑", cost:500, desc:"Flex that crown" },
  { id:"ghost",   name:"Ghost Mode", icon:"👻", cost:150, desc:"Haunt the leaderboard" },
  { id:"diamond", name:"Diamond",    icon:"💎", cost:600, desc:"Top-tier status" },
  { id:"star",    name:"Star",       icon:"⭐", cost:250, desc:"You're a star" },
  { id:"alien",   name:"Alien",      icon:"👽", cost:300, desc:"Not from this world" },
  { id:"robot",   name:"Robot",      icon:"🤖", cost:350, desc:"Machine precision" },
  { id:"ninja",   name:"Ninja",      icon:"🥷", cost:400, desc:"Silent but deadly" },
];

// ─── Shop items — one-time-use powerup charges ────────────────────
export interface ShopPowerup {
  id:   string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
}

export const SHOP_POWERUPS: ShopPowerup[] = [
  { id:"freeze1", name:"Freeze ×1",    icon:"❄",   cost:120, desc:"Save for use mid-game" },
  { id:"freeze2", name:"Freeze ×2",    icon:"❄❄",  cost:220, desc:"Two freeze charges" },
  { id:"shield1", name:"Shield ×1",    icon:"◈",   cost:150, desc:"Save for use mid-game" },
  { id:"shield2", name:"Shield ×2",    icon:"◈◈",  cost:280, desc:"Two shield charges" },
  { id:"mult1",   name:"2× Boost ×1",  icon:"⚡",  cost:180, desc:"Start next game with 2× score active" },
  { id:"heart1",  name:"+1 Heart ×1",  icon:"♥",   cost:100, desc:"Start next game with an extra heart" },
  { id:"heart2",  name:"+2 Hearts",    icon:"♥♥",  cost:180, desc:"Start with two extra hearts" },
];

// ─── Shop items — cell skins ──────────────────────────────────────
export interface ShopSkin {
  id:      string;
  name:    string;
  icon:    string;
  cost:    number;
  desc:    string;
  preview: string;
}

export const SHOP_SKINS: ShopSkin[] = [
  { id:"default", name:"Default",   icon:"⬜", cost:0,   desc:"Classic flat cells",       preview:"linear-gradient(145deg,#fff,#c7d2e8)" },
  { id:"neon",    name:"Neon Glow", icon:"🟦", cost:300, desc:"Bright neon cell borders",  preview:"linear-gradient(145deg,#00ffe0,#00aaa0)" },
  { id:"pastel",  name:"Pastel",    icon:"🟪", cost:250, desc:"Soft pastel cell tones",    preview:"linear-gradient(145deg,#f9c6ff,#d8a0ff)" },
  { id:"dark",    name:"Obsidian",  icon:"⬛", cost:350, desc:"Deep dark cell style",      preview:"linear-gradient(145deg,#444,#111)" },
  { id:"gold",    name:"Gold Rush", icon:"🟨", cost:500, desc:"Premium gold shimmer",      preview:"linear-gradient(145deg,#fde68a,#d97706)" },
  { id:"ice",     name:"Frozen",    icon:"🧊", cost:400, desc:"Frosty ice texture cells",  preview:"linear-gradient(145deg,#e0f2fe,#7dd3fc)" },
];

// ─── Shop items — backgrounds (animated) ──────────────────
export interface ShopBackground {
  id: string;
  name: string;
  icon: string;
  cost: number;
  desc: string;
  component: "VoidTunnel" | "StarWarp" | "GridPulse" | "PurpleCascade" | "BlockOrbit" | "DataStream" | "CellBreath" | "WarpGate" | "none";
}

export const SHOP_BACKGROUNDS: ShopBackground[] = [
  { id: "default",        name: "Default",          icon: "🌑", cost: 0,   desc: "Static dark void",                  component: "none" },
  { id: "void-tunnel",    name: "Void Tunnel",       icon: "🌀", cost: 400, desc: "Thick purple shapes spiral inward", component: "VoidTunnel" },
  { id: "star-warp",      name: "Star Warp",         icon: "✨", cost: 350, desc: "DTP shapes accelerating outward",   component: "StarWarp" },
  { id: "grid-pulse",     name: "Grid Pulse",        icon: "⬛", cost: 300, desc: "5×5 grid of cells breathing",     component: "GridPulse" },
  { id: "purple-cascade", name: "Purple Cascade",    icon: "🟣", cost: 200, desc: "Columns of purple shapes falling", component: "PurpleCascade" },
  { id: "block-orbit",    name: "Lightning",          icon: "🌀", cost: 350, desc: "Electric bolts tear through the dark", component: "BlockOrbit" },
  { id: "data-stream",    name: "Matrix Rain",       icon: "📊", cost: 300, desc: "Game symbols cascade in green", component: "DataStream" },
  { id: "cell-breath",    name: "Neon Pulse",        icon: "🫁", cost: 250, desc: "Cyan scanlines sweep the dark", component: "CellBreath" },
  { id: "warp-gate",      name: "Hex Grid",          icon: "⭕", cost: 400, desc: "Honeycomb pulses in shifting color", component: "WarpGate" },
];
