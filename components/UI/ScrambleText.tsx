import { useEffect, useState, useRef } from "react";

const SYMBOLS = "■□◆◇▲△▼▽●○★☆✦✧!@#$%&*<>?";
const SCRAMBLE_DURATION = 500;

interface ScrambleTextProps {
  text: string;
  duration?: number;
  className?: string;
}

export function ScrambleText({ text, duration = SCRAMBLE_DURATION, className = "" }: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = elapsed / duration;

      if (progress >= 1) {
        setDisplay(text);
        clearInterval(interval);
        return;
      }

      const scrambled = text.split("").map((char, i) => {
        const charProgress = Math.max(0, (progress - i * 0.1) / (1 - i * 0.1));
        if (charProgress > 0.8 || char === " ") return char;
        return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      }).join("");

      setDisplay(scrambled);
    }, 30);

    return () => clearInterval(interval);
  }, [text, duration]);

  return <span className={className}>{display}</span>;
}