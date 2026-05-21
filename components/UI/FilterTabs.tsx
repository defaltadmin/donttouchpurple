import React from "react";

interface FilterOption {
  key: string;
  label: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function FilterTabs({
  options,
  active,
  onChange,
  className = "",
}: FilterTabsProps) {
  return (
    <div className={`dtp-filter-container ${className}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt.key}
          className={`dtp-filter-btn${opt.key === active ? " dtp-filter-btn--active" : ""}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
