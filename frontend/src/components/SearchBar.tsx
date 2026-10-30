import { forwardRef, useCallback, useRef, useState } from "react";
import { useDismiss } from "../hooks";
import { CloseIcon, ClockIcon, SearchIcon, TrendIcon } from "./Icons";

export const TRENDING = [
  "black trolley bag",
  "white sneakers",
  "floral summer dress",
  "men slim fit jeans",
  "silk saree",
  "leather wallet",
  "gold jhumkas",
  "running shoes",
  "cotton kurta",
  "denim jacket",
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onHover: (value: string) => void;
  recent: string[];
  onClearRecent: () => void;
  busy: boolean;
}

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange, onSubmit, onHover, recent, onClearRecent, busy },
  inputRef,
) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, rootRef);

  const pick = (q: string) => {
    onChange(q);
    onSubmit(q);
    setOpen(false);
    (inputRef as React.RefObject<HTMLInputElement>).current?.blur();
  };

  const typed = value.trim().toLowerCase();
  const trending = TRENDING.filter((t) => !typed || t.includes(typed)).slice(0, 6);

  return (
    <form
      ref={rootRef}
      className={`search${open ? " is-open" : ""}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) pick(value);
      }}
    >
      <SearchIcon className="search-icon" />
      <input
        ref={inputRef}
        className="search-input"
        type="search"
        value={value}
        placeholder="Search for products, brands and more"
        aria-label="Search products"
        autoComplete="off"
        enterKeyHint="search"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {busy && <span className="search-spinner" aria-hidden />}
      {value && (
        <button type="button" className="search-clear" aria-label="Clear search" onClick={() => onChange("")}>
          <CloseIcon size={16} />
        </button>
      )}
      <kbd className="search-kbd" aria-hidden>/</kbd>

      {open && (recent.length > 0 || trending.length > 0) && (
        <div className="suggest" role="listbox">
          {recent.length > 0 && !typed && (
            <section>
              <header>
                Recent searches
                <button type="button" onClick={onClearRecent}>Clear</button>
              </header>
              <div className="suggest-chips">
                {recent.map((q) => (
                  <button type="button" key={q} className="suggest-chip" onMouseEnter={() => onHover(q)} onClick={() => pick(q)}>
                    <ClockIcon size={14} /> {q}
                  </button>
                ))}
              </div>
            </section>
          )}
          {trending.length > 0 && (
            <section>
              <header>Trending searches</header>
              <ul>
                {trending.map((q) => (
                  <li key={q}>
                    <button type="button" role="option" onMouseEnter={() => onHover(q)} onClick={() => pick(q)}>
                      <TrendIcon size={15} />
                      <span>{q}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </form>
  );
});
