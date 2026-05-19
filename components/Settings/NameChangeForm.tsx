import React from "react";

export function NameChangeForm({ current, onSubmit, onDevTrigger }: { current: string; onSubmit: (name: string) => void; onDevTrigger?: () => void }) {
  const [val, setVal] = React.useState(current);
  const sanitize = (n: string) => n.replace(/[^a-zA-Z0-9_ /]/g, "").trim().slice(0, 8);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.includes("//dev//") && onDevTrigger) { onDevTrigger(); setVal(""); return; }
    setVal(raw);
  };
  return (
    <div style={{ padding: "12px 0 4px" }}>
      <input
        className="name-input"
        value={val}
        onChange={handleChange}
        onKeyDown={(e) => { if (e.key === "Enter" && sanitize(val)) onSubmit(sanitize(val)); }}
        maxLength={8}
        autoFocus={!('ontouchstart' in window)}
        style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }}
        placeholder="Your name..."
      />
      <button
        className="btn-primary"
        style={{ width: "100%" }}
        disabled={!sanitize(val)}
        onClick={() => { if (sanitize(val)) onSubmit(sanitize(val)); }}
      >
        Save
      </button>
    </div>
  );
}
