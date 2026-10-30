import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, getVersion, peek, prefetch, search, subscribe } from "./lib/api";
import { MODELS } from "./lib/models";
import type { ModelId, Product, SearchResponse } from "./types";

export interface SearchState {
  data: SearchResponse | null;
  error: ApiError | null;
  loading: boolean;
  latencyMs: number | null;
  fromCache: boolean;
}

/**
 * Stale-while-revalidate search: cached results render synchronously, otherwise the
 * previous results stay on screen (dimmed) until the new ones arrive. Once a model
 * answers, the other models are warmed in the background so switching is instant.
 */
export function useSearch(query: string, model: ModelId, attempt = 0): SearchState {
  const [state, setState] = useState<SearchState>(() => {
    const hit = query ? peek(query, model) : undefined;
    return {
      data: hit?.value ?? null,
      error: hit?.error ?? null,
      loading: !!query && !hit?.value && !hit?.error,
      latencyMs: hit?.latencyMs ?? null,
      fromCache: !!hit?.value,
    };
  });

  useEffect(() => {
    if (!query) return;
    const hit = peek(query, model);
    if (hit?.value || hit?.error) {
      setState({ data: hit.value ?? null, error: hit.error ?? null, loading: false, latencyMs: hit.latencyMs ?? null, fromCache: true });
      prefetch(query, MODELS.map((m) => m.id).filter((m) => m !== model));
      return;
    }

    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    search(query, model).then(
      (data) => {
        if (!active) return;
        setState({ data, error: null, loading: false, latencyMs: peek(query, model)?.latencyMs ?? null, fromCache: false });
        prefetch(query, MODELS.map((m) => m.id).filter((m) => m !== model));
      },
      (error: ApiError) => {
        if (active) setState((s) => ({ ...s, data: null, error, loading: false }));
      },
    );
    return () => {
      active = false;
    };
  }, [query, model, attempt]);

  return state;
}

/** Re-renders whenever any cached search settles (used for cross-model previews). */
export function useCacheVersion() {
  return useSyncExternalStore(subscribe, getVersion);
}

export function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
  );
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode) — keep in memory only */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export function useWishlist() {
  const [items, setItems] = useStoredState<Product[]>("stylesense:wishlist", []);
  const toggle = useCallback(
    (p: Product) =>
      setItems((list) =>
        list.some((x) => x.product_id === p.product_id)
          ? list.filter((x) => x.product_id !== p.product_id)
          : [p, ...list],
      ),
    [setItems],
  );
  return { items, ids: new Set(items.map((p) => p.product_id)), toggle };
}

export function useRecentSearches() {
  const [recent, setRecent] = useStoredState<string[]>("stylesense:recent", []);
  const add = useCallback(
    (q: string) => {
      const clean = q.trim();
      if (clean.length < 2) return;
      setRecent((list) => [clean, ...list.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 6));
    },
    [setRecent],
  );
  const clear = useCallback(() => setRecent([]), [setRecent]);
  return { recent, add, clear };
}

/** Close on outside click / Escape. */
export function useDismiss(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, ref]);
}
