import type { ModelId, SearchResponse } from "../types";

/**
 * We always ask the API for its maximum page (top 50) and slice on the client.
 * That way changing "Top K", filtering or sorting never costs a round-trip.
 */
const FETCH_K = 50;
const MAX_ENTRIES = 150;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface Entry {
  promise: Promise<SearchResponse>;
  value?: SearchResponse;
  error?: ApiError;
  latencyMs?: number;
}

const cache = new Map<string, Entry>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  listeners.forEach((fn) => fn());
}

export function normalizeQuery(q: string) {
  return q.trim().replace(/\s+/g, " ").toLowerCase();
}

const keyOf = (query: string, model: ModelId) => `${model}::${normalizeQuery(query)}`;

async function readError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") message = body.detail;
    else if (Array.isArray(body?.detail) && body.detail[0]?.msg) message = body.detail[0].msg;
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(message, res.status);
}

/** Deduplicated, cached search. Concurrent callers share one in-flight request. */
export function search(query: string, model: ModelId): Promise<SearchResponse> {
  const key = keyOf(query, model);
  const hit = cache.get(key);
  if (hit) {
    // LRU touch
    cache.delete(key);
    cache.set(key, hit);
    return hit.promise;
  }

  const started = performance.now();
  const entry = {} as Entry;
  entry.promise = fetch("/api/v1/recommendations/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: query.trim(), model, top_k: FETCH_K }),
  })
    .catch(() => {
      throw new ApiError("Can't reach the recommendation API. Is the server running?", 0);
    })
    .then(async (res) => {
      if (!res.ok) throw await readError(res);
      return (await res.json()) as SearchResponse;
    })
    .then(
      (value) => {
        entry.value = value;
        entry.latencyMs = Math.round(performance.now() - started);
        emit();
        return value;
      },
      (error: ApiError) => {
        // Validation errors are deterministic and worth caching; network/server errors are not.
        if (error.status === 422) entry.error = error;
        else cache.delete(key);
        emit();
        throw error;
      },
    );

  cache.set(key, entry);
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  return entry.promise;
}

/** Synchronous read of an already-settled result, so cached data renders on the same frame. */
export function peek(query: string, model: ModelId) {
  const entry = cache.get(keyOf(query, model));
  return entry && { value: entry.value, error: entry.error, latencyMs: entry.latencyMs };
}

const idle: (cb: () => void) => void =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (cb) => window.requestIdleCallback(cb, { timeout: 1200 })
    : (cb) => setTimeout(cb, 200);

/** Warm the cache in the background; errors are swallowed. */
export function prefetch(query: string, models: ModelId[]) {
  if (normalizeQuery(query).length < 2) return;
  idle(() => models.forEach((m) => search(query, m).catch(() => {})));
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getVersion = () => version;
