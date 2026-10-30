import { useCallback, useId, useRef, useState } from "react";
import { useCacheVersion, useDismiss } from "../hooks";
import { peek, prefetch } from "../lib/api";
import { toPercent } from "../lib/catalog";
import { MODELS, MODEL_BY_ID } from "../lib/models";
import type { ModelId } from "../types";
import { CheckIcon, ChevronDown } from "./Icons";

interface Props {
  value: ModelId;
  query: string;
  onChange: (model: ModelId) => void;
}

/** Accessible listbox that also previews how well each model matched the current query. */
export function ModelSelect({ value, query, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  useCacheVersion();

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef);

  const current = MODEL_BY_ID[value];

  const openMenu = () => {
    setCursor(MODELS.findIndex((m) => m.id === value));
    setOpen(true);
    prefetch(query, MODELS.map((m) => m.id));
  };

  const choose = (id: ModelId) => {
    onChange(id);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") setCursor((c) => (c + 1) % MODELS.length);
    else if (e.key === "ArrowUp") setCursor((c) => (c - 1 + MODELS.length) % MODELS.length);
    else if (e.key === "Enter" || e.key === " ") choose(MODELS[cursor].id);
    else if (e.key === "Tab") setOpen(false);
    else return;
    e.preventDefault();
  };

  return (
    <div className="model-select" ref={rootRef}>
      <button
        type="button"
        className={`model-trigger${open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className={`model-glyph glyph-${current.id}`}>{current.glyph}</span>
        <span className="model-trigger-text">
          <span className="model-trigger-label">Model</span>
          <span className="model-trigger-name">{current.name}</span>
        </span>
        <ChevronDown className="model-chevron" />
      </button>

      {open && (
        <div className="model-menu" role="listbox" id={listId} aria-label="Similarity model" aria-activedescendant={`${listId}-${cursor}`}>
          <div className="model-menu-head">
            <span>Similarity model</span>
            {query && <span className="model-menu-q">top match for “{query}”</span>}
          </div>
          {MODELS.map((m, i) => {
            const preview = query ? peek(query, m.id) : undefined;
            const top = preview?.value?.results[0]?.score;
            const selected = m.id === value;
            return (
              <div
                key={m.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                className={`model-option${selected ? " is-selected" : ""}${i === cursor ? " is-cursor" : ""}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => choose(m.id)}
              >
                <span className={`model-glyph glyph-${m.id}`}>{m.glyph}</span>
                <span className="model-option-body">
                  <span className="model-option-title">
                    {m.name}
                    <span className="model-option-tag">{m.tagline}</span>
                  </span>
                  <span className="model-option-desc">{m.description}</span>
                  {query && (
                    <span className="model-option-meter">
                      {top !== undefined ? (
                        <>
                          <span className="meter"><span style={{ width: `${toPercent(top)}%` }} /></span>
                          <span className="meter-value">{toPercent(top)}%</span>
                        </>
                      ) : preview?.error ? (
                        <span className="meter-note">No vocabulary match</span>
                      ) : (
                        <span className="meter is-loading"><span /></span>
                      )}
                    </span>
                  )}
                </span>
                {selected && <CheckIcon className="model-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
