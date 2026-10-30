import { useCallback, useRef, useState } from "react";
import { useDismiss } from "../hooks";
import { PRICE_BUCKETS, SORTS, colorHex, type Facets } from "../lib/catalog";
import type { Filters, SortId } from "../types";
import { CheckIcon, ChevronDown } from "./Icons";

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

interface PanelProps {
  facets: Facets;
  filters: Filters;
  onChange: (f: Filters) => void;
  onClear: () => void;
}

export function FilterPanel({ facets, filters, onChange, onClear }: PanelProps) {
  const [showAllColors, setShowAllColors] = useState(false);
  const colors = showAllColors ? facets.colors : facets.colors.slice(0, 8);

  return (
    <div className="filters">
      <div className="filters-head">
        <h2>Filters</h2>
        <button className="link-btn" onClick={onClear}>Clear all</button>
      </div>

      <section className="filter-group">
        <h3>Match score</h3>
        <div className="range">
          <input
            type="range" min={0} max={95} step={5}
            value={filters.minMatch}
            onChange={(e) => onChange({ ...filters, minMatch: Number(e.target.value) })}
            style={{ "--fill": `${(filters.minMatch / 95) * 100}%` } as React.CSSProperties}
            aria-label="Minimum match score"
          />
          <span className="range-value">{filters.minMatch > 0 ? `≥ ${filters.minMatch}%` : "Any"}</span>
        </div>
      </section>

      {facets.genders.length > 0 && (
        <section className="filter-group">
          <h3>Gender</h3>
          <div className="pill-row">
            {facets.genders.map((g) => (
              <button
                key={g.value}
                className={`pill${filters.genders.includes(g.value) ? " is-on" : ""}`}
                aria-pressed={filters.genders.includes(g.value)}
                onClick={() => onChange({ ...filters, genders: toggle(filters.genders, g.value) })}
              >
                {g.value} <span>{g.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {facets.prices.length > 0 && (
        <section className="filter-group">
          <h3>Price</h3>
          {facets.prices.map((p) => {
            const on = filters.prices.includes(p.value);
            return (
              <label key={p.value} className={`check${on ? " is-on" : ""}`}>
                <input type="checkbox" checked={on} onChange={() => onChange({ ...filters, prices: toggle(filters.prices, p.value) })} />
                <span className="check-box"><CheckIcon size={12} /></span>
                {PRICE_BUCKETS.find((b) => b.id === p.value)!.label}
                <span className="count">({p.count})</span>
              </label>
            );
          })}
        </section>
      )}

      {facets.colors.length > 0 && (
        <section className="filter-group">
          <h3>Color</h3>
          {colors.map((c) => {
            const on = filters.colors.includes(c.value);
            return (
              <label key={c.value} className={`check${on ? " is-on" : ""}`}>
                <input type="checkbox" checked={on} onChange={() => onChange({ ...filters, colors: toggle(filters.colors, c.value) })} />
                <span className="check-box"><CheckIcon size={12} /></span>
                <span className="color-dot" style={{ background: colorHex(c.value) }} />
                {c.value}
                <span className="count">({c.count})</span>
              </label>
            );
          })}
          {facets.colors.length > 8 && (
            <button className="link-btn more" onClick={() => setShowAllColors((s) => !s)}>
              {showAllColors ? "Show less" : `+ ${facets.colors.length - 8} more`}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

export function SortMenu({ value, onChange }: { value: SortId; onChange: (s: SortId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  return (
    <div className="sort" ref={ref}>
      <button className="sort-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Sort by: <b>{SORTS.find((s) => s.id === value)!.label}</b>
        <ChevronDown />
      </button>
      {open && (
        <ul className="sort-menu" role="listbox">
          {SORTS.map((s) => (
            <li key={s.id}>
              <button
                role="option"
                aria-selected={s.id === value}
                className={s.id === value ? "is-on" : ""}
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SortList({ value, onChange }: { value: SortId; onChange: (s: SortId) => void }) {
  return (
    <ul className="sort-list" role="listbox">
      {SORTS.map((s) => (
        <li key={s.id}>
          <button role="option" aria-selected={s.id === value} className={s.id === value ? "is-on" : ""} onClick={() => onChange(s.id)}>
            {s.label}
            {s.id === value && <CheckIcon />}
          </button>
        </li>
      ))}
    </ul>
  );
}

export const TOP_K_OPTIONS = [10, 20, 30, 50];

export function TopKControl({ value, onChange }: { value: number; onChange: (k: number) => void }) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Number of recommendations">
      <span className="segmented-label">Top</span>
      {TOP_K_OPTIONS.map((k) => (
        <button key={k} role="radio" aria-checked={k === value} className={k === value ? "is-on" : ""} onClick={() => onChange(k)}>
          {k}
        </button>
      ))}
    </div>
  );
}
