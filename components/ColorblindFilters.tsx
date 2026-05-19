type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia" | "monochrome";

export function ColorblindFilters() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <filter id="deuteranopia"><feColorMatrix values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0" /></filter>
      <filter id="protanopia"><feColorMatrix values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" /></filter>
      <filter id="tritanopia"><feColorMatrix values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0" /></filter>
      <filter id="monochrome"><feColorMatrix values="0.33,0.33,0.33,0,0 0.33,0.33,0.33,0,0 0.33,0.33,0.33,0,0 0,0,0,1,0" /></filter>
    </svg>
  );
}

export function getCBFilterStyle(mode: ColorblindMode): string {
  if (mode === "none") return "";
  return `url(#${mode})`;
}
