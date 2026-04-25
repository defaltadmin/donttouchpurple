import React, { useEffect, useRef, useState } from "react";
import { DEFAULT_P1_KEYS, DEFAULT_P2_KEYS, toLabel } from "../../config/keybindings";
import type { NumPlayers } from "../../engine/types";

interface KeyBinderProps {
  initP1: string[];
  initP2: string[];
  numPlayers: NumPlayers;
  onSave: (p1: string[], p2: string[]) => void;
  onCancel: () => void;
}

export function KeyBinder({ initP1, initP2, numPlayers, onSave, onCancel }: KeyBinderProps) {
  const [ap, setAP] = useState<1 | 2>(1);
  const [d1, setD1] = useState([...initP1]);
  const [d2, setD2] = useState([...initP2]);
  const [sel, setSel] = useState<number | null>(null);
  const selRef = useRef<number | null>(null);

  selRef.current = sel;

  const draft = ap === 1 ? d1 : d2;
  const setDraft = ap === 1 ? setD1 : setD2;

  useEffect(() => {
    const blocked = new Set(["control", "alt", "meta", "shift", "tab", "capslock", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"]);
    const fn = (e: KeyboardEvent) => {
      if (selRef.current === null) return;
      const k = e.key.toLowerCase();
      if (blocked.has(k)) return;
      e.preventDefault();
      if (k === "escape") {
        setSel(null);
        return;
      }
      setDraft((prev) => {
        const next = [...prev];
        const dup = next.indexOf(k);
        if (dup !== -1 && dup !== selRef.current) next[dup] = "";
        next[selRef.current!] = k;
        return next;
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
            {([1, 2] as const).map((player) => (
              <button
                key={player}
                className={`kb-tab ${ap === player ? "kb-tab--on" : ""}`}
                onClick={() => {
                  setAP(player);
                  setSel(null);
                }}
              >
                Player {player}
              </button>
            ))}
          </div>
        )}
        <p className="kb-hint">
          {sel !== null
            ? `Press a key for Row ${Math.floor(sel / 4) + 1}, Col ${(sel % 4) + 1} (Esc = cancel)`
            : "Tap a cell to select it, then press the key you want"}
        </p>
        <div className="kb-grid">
          {draft.map((key, i) => (
            <button
              key={i}
              className={["kb-cell", sel === i ? "kb-cell--on" : "", !key ? "kb-cell--empty" : ""].filter(Boolean).join(" ")}
              onClick={() => setSel((prev) => (prev === i ? null : i))}
            >
              {toLabel(key) || "—"}
            </button>
          ))}
        </div>
        <div className="kb-footer">
          <button
            className="btn-ghost"
            onClick={() => {
              ap === 1 ? setD1([...DEFAULT_P1_KEYS]) : setD2([...DEFAULT_P2_KEYS]);
              setSel(null);
            }}
          >
            Reset
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={() => onSave(d1, d2)}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
