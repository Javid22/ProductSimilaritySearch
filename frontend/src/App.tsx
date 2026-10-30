import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { FilterPanel, SortList, SortMenu, TOP_K_OPTIONS, TopKControl } from "./components/Filters";
import { BoltIcon, FilterIcon, HeartIcon, Logo, SortIcon } from "./components/Icons";
import { ModelSelect } from "./components/ModelSelect";
import { ProductCard, SkeletonCard } from "./components/ProductCard";
import { ProductDetail, WishlistSheet } from "./components/ProductDetail";
import { SearchBar, TRENDING } from "./components/SearchBar";
import { Sheet } from "./components/Sheet";
import { MessageState } from "./components/States";
import { useDebounced, useMediaQuery, useRecentSearches, useSearch, useWishlist } from "./hooks";
import { normalizeQuery, prefetch } from "./lib/api";
import { PRICE_BUCKETS, activeFilterCount, applyFilters, computeFacets, sortItems } from "./lib/catalog";
import { MODEL_BY_ID, isModelId } from "./lib/models";
import { EMPTY_FILTERS, type Filters, type ModelId, type RankedProduct, type SortId } from "./types";

const DEFAULT_QUERY = "black trolley bag";

function readUrl() {
  const p = new URLSearchParams(window.location.search);
  const model = p.get("model");
  const k = Number(p.get("k"));
  return {
    q: p.get("q")?.trim() || DEFAULT_QUERY,
    model: isModelId(model) ? model : ("tfidf" as ModelId),
    k: TOP_K_OPTIONS.includes(k) ? k : 20,
  };
}

const initial = readUrl();

export default function App() {
  const [input, setInput] = useState(initial.q);
  const [query, setQuery] = useState(initial.q);
  const [model, setModel] = useState<ModelId>(initial.model);
  const [topK, setTopK] = useState(initial.k);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortId>("relevance");
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState<RankedProduct | null>(null);
  const [sheet, setSheet] = useState<null | "filters" | "sort" | "wishlist">(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 960px)");
  const wishlist = useWishlist();
  const { recent, add: addRecent, clear: clearRecent } = useRecentSearches();

  const { data, error, loading, latencyMs, fromCache } = useSearch(query, model, attempt);

  // Search-as-you-type: commit the debounced input once it's meaningful.
  const debounced = useDebounced(input, 320);
  useEffect(() => {
    if (normalizeQuery(debounced).length >= 2) setQuery(debounced.trim());
  }, [debounced]);

  // New query → fresh filters (facets change completely).
  useEffect(() => setFilters(EMPTY_FILTERS), [query]);

  // Keep the URL shareable.
  useEffect(() => {
    const params = new URLSearchParams({ q: query, model, k: String(topK) });
    window.history.replaceState(null, "", `?${params}`);
  }, [query, model, topK]);

  // "/" focuses search, like most commerce sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = useCallback(
    (q: string) => {
      const clean = q.trim();
      if (!clean) return;
      setQuery(clean);
      addRecent(clean);
    },
    [addRecent],
  );

  const hoverPrefetch = useCallback((q: string) => prefetch(q, [model]), [model]);

  const ranked = useMemo<RankedProduct[]>(
    () => (data?.results ?? []).slice(0, topK).map((p, i) => ({ ...p, rank: i + 1 })),
    [data, topK],
  );
  const facets = useMemo(() => computeFacets(ranked), [ranked]);
  const deferredFilters = useDeferredValue(filters);
  const visible = useMemo(() => sortItems(applyFilters(ranked, deferredFilters), sort), [ranked, deferredFilters, sort]);
  const filterCount = activeFilterCount(filters);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const openProduct = useCallback((p: RankedProduct) => setActive(p), []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const closeDetail = useCallback(() => setActive(null), []);

  const switchModel = useCallback((m: ModelId) => {
    setModel(m);
    setActive(null);
  }, []);

  const modelInfo = MODEL_BY_ID[model];
  const refreshing = loading && !!data;

  let content: React.ReactNode;
  if (error) {
    content =
      error.status === 422 ? (
        <MessageState
          title="We couldn't match that"
          message={`${error.message} Semantic models understand related words — or try a different phrasing.`}
          model={model}
          onSwitchModel={switchModel}
        />
      ) : (
        <MessageState title="Something went wrong" message={error.message} model={model} onRetry={() => setAttempt((a) => a + 1)} />
      );
  } else if (!data) {
    content = (
      <div className="grid">
        {Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  } else if (ranked.length === 0) {
    content = (
      <MessageState
        title={`No products found for “${data.query}”`}
        message={`${modelInfo.name} found no overlap with the catalogue. A semantic model may find related products.`}
        model={model}
        onSwitchModel={switchModel}
      />
    );
  } else if (visible.length === 0) {
    content = (
      <div className="state">
        <h3>No products match these filters</h3>
        <p>Loosen a filter or lower the minimum match score.</p>
        <div className="state-actions">
          <button className="btn btn-primary" onClick={clearFilters}>Clear filters</button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className={`grid${refreshing ? " is-refreshing" : ""}`} key={`${data.query}|${data.model}`}>
        {visible.map((p, i) => (
          <ProductCard
            key={p.product_id}
            product={p}
            index={i}
            wished={wishlist.ids.has(p.product_id)}
            onOpen={openProduct}
            onWish={wishlist.toggle}
          />
        ))}
      </div>
    );
  }

  const appliedChips = [
    ...filters.genders.map((v) => ({ label: v, remove: () => setFilters((f) => ({ ...f, genders: f.genders.filter((x) => x !== v) })) })),
    ...filters.prices.map((v) => ({
      label: PRICE_BUCKETS.find((b) => b.id === v)!.label,
      remove: () => setFilters((f) => ({ ...f, prices: f.prices.filter((x) => x !== v) })),
    })),
    ...filters.colors.map((v) => ({ label: v, remove: () => setFilters((f) => ({ ...f, colors: f.colors.filter((x) => x !== v) })) })),
    ...(filters.minMatch > 0 ? [{ label: `Match ≥ ${filters.minMatch}%`, remove: () => setFilters((f) => ({ ...f, minMatch: 0 })) }] : []),
  ];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand-link" href="/" aria-label="StyleSense home">
            <Logo />
          </a>
          <SearchBar
            ref={searchRef}
            value={input}
            onChange={setInput}
            onSubmit={submit}
            onHover={hoverPrefetch}
            recent={recent}
            onClearRecent={clearRecent}
            busy={loading}
          />
          <ModelSelect value={model} query={query} onChange={switchModel} />
          <button className="icon-action" onClick={() => setSheet("wishlist")} aria-label="Open wishlist">
            <HeartIcon size={20} />
            <span>Wishlist</span>
            {wishlist.items.length > 0 && <em className="badge">{wishlist.items.length}</em>}
          </button>
        </div>
        <div className={`progress${loading ? " is-active" : ""}`} aria-hidden />
      </header>

      <nav className="rail" aria-label="Trending searches">
        <div className="rail-inner">
          {TRENDING.map((t) => (
            <button
              key={t}
              className={`rail-chip${normalizeQuery(t) === normalizeQuery(query) ? " is-on" : ""}`}
              onMouseEnter={() => hoverPrefetch(t)}
              onFocus={() => hoverPrefetch(t)}
              onClick={() => {
                setInput(t);
                submit(t);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      <main className="page">
        <div className="crumbs">
          Home <span>/</span> Search <span>/</span> <b>{query}</b>
        </div>

        <div className="results-head">
          <h1>
            {query}
            {data && <span className="results-count"> - {ranked.length} items</span>}
          </h1>
          <div className="insight">
            <span className={`model-glyph glyph-${model}`}>{modelInfo.glyph}</span>
            <span>
              Ranked by <b>{modelInfo.name}</b> · cosine similarity
            </span>
            {data && !loading && (
              <span className="insight-speed">
                <BoltIcon />
                {fromCache ? "instant · cached" : latencyMs != null ? `${latencyMs} ms` : ""}
              </span>
            )}
          </div>
        </div>

        <div className="layout">
          {isDesktop && (
            <aside className="sidebar">
              <FilterPanel facets={facets} filters={filters} onChange={setFilters} onClear={clearFilters} />
            </aside>
          )}

          <section className="content" aria-live="polite" aria-busy={loading}>
            <div className="toolbar">
              <div className="applied">
                {appliedChips.map((c) => (
                  <button key={c.label} className="applied-chip" onClick={c.remove}>
                    {c.label} <span aria-hidden>×</span>
                  </button>
                ))}
                {appliedChips.length === 0 && data && (
                  <span className="toolbar-hint">
                    Showing <b>{visible.length}</b> of top {topK} recommendations
                  </span>
                )}
              </div>
              <div className="toolbar-right">
                <TopKControl value={topK} onChange={setTopK} />
                {isDesktop && <SortMenu value={sort} onChange={setSort} />}
              </div>
            </div>
            {content}
          </section>
        </div>
      </main>

      <footer className="footer">
        <Logo />
        <p>Product recommendations powered by TF-IDF, Word2Vec &amp; FastText similarity search.</p>
      </footer>

      {!isDesktop && (
        <div className="mobile-bar">
          <button onClick={() => setSheet("sort")}>
            <SortIcon /> Sort
          </button>
          <span className="mobile-bar-sep" />
          <button onClick={() => setSheet("filters")}>
            <FilterIcon /> Filter {filterCount > 0 && <em className="badge">{filterCount}</em>}
          </button>
        </div>
      )}

      <Sheet open={sheet === "sort"} onClose={closeSheet} title="Sort by" variant="bottom">
        <SortList value={sort} onChange={(s) => { setSort(s); closeSheet(); }} />
      </Sheet>

      <Sheet
        open={sheet === "filters"}
        onClose={closeSheet}
        title="Filters"
        variant="bottom"
        footer={
          <>
            <button className="btn btn-outline" onClick={clearFilters}>Clear all</button>
            <button className="btn btn-primary" onClick={closeSheet}>Show {visible.length} items</button>
          </>
        }
      >
        <FilterPanel facets={facets} filters={filters} onChange={setFilters} onClear={clearFilters} />
      </Sheet>

      <WishlistSheet open={sheet === "wishlist"} items={wishlist.items} onClose={closeSheet} onRemove={wishlist.toggle} />

      <ProductDetail
        product={active}
        query={query}
        model={model}
        wished={!!active && wishlist.ids.has(active.product_id)}
        onWish={wishlist.toggle}
        onClose={closeDetail}
        onSwitchModel={switchModel}
      />
    </>
  );
}
