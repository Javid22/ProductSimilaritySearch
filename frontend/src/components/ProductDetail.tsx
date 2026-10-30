import { useEffect } from "react";
import { useCacheVersion } from "../hooks";
import { peek, prefetch } from "../lib/api";
import { categoryOf, displayName, formatPrice, scoreTier, toPercent } from "../lib/catalog";
import { MODELS, MODEL_BY_ID } from "../lib/models";
import type { ModelId, Product, RankedProduct } from "../types";
import { HeartIcon } from "./Icons";
import { ProductMedia } from "./ProductCard";
import { ScoreRing } from "./Score";
import { Sheet } from "./Sheet";

interface Props {
  product: RankedProduct | null;
  query: string;
  model: ModelId;
  wished: boolean;
  onWish: (p: Product) => void;
  onClose: () => void;
  onSwitchModel: (m: ModelId) => void;
}

export function ProductDetail({ product, query, model, wished, onWish, onClose, onSwitchModel }: Props) {
  useCacheVersion();

  useEffect(() => {
    if (product) prefetch(query, MODELS.map((m) => m.id));
  }, [product, query]);

  if (!product) return null;
  const tier = scoreTier(product.score);

  return (
    <Sheet
      open
      onClose={onClose}
      title={<span className="detail-title-sm">{product.brand}</span>}
      footer={
        <button className={`btn btn-primary btn-block${wished ? " is-wished" : ""}`} onClick={() => onWish(product)}>
          <HeartIcon size={18} filled={wished} />
          {wished ? "Wishlisted" : "Wishlist"}
        </button>
      }
    >
      <div className="detail">
        <div className="detail-media">
          <ProductMedia product={product} />
          <span className="card-rank">#{product.rank} for “{query}”</span>
        </div>

        <div className="detail-info">
          <h1 className="detail-brand">{product.brand}</h1>
          <p className="detail-name">{displayName(product)}</p>
          <div className="detail-price">{formatPrice(product.price_inr)}</div>
          <div className="detail-tags">
            <span className="tag">{product.gender}</span>
            {product.primary_color && <span className="tag">{product.primary_color}</span>}
            <span className="tag">{categoryOf(product.product_name)}</span>
            <span className="tag tag-muted">ID {product.product_id}</span>
          </div>

          <section className={`similarity-card tone-${tier.tone}`}>
            <ScoreRing score={product.score} />
            <div>
              <h3>{tier.label}</h3>
              <p>
                Cosine similarity <code>{product.score.toFixed(4)}</code> between your query and this product,
                ranked by <b>{MODEL_BY_ID[model].name}</b>.
              </p>
            </div>
          </section>

          <section className="xmodel">
            <h3>Across models</h3>
            <div className="xmodel-rows">
              {MODELS.map((m) => {
                const res = peek(query, m.id);
                const idx = res?.value?.results.findIndex((r) => r.product_id === product.product_id) ?? -1;
                const hit = idx >= 0 ? res!.value!.results[idx] : null;
                return (
                  <button
                    key={m.id}
                    className={`xmodel-row${m.id === model ? " is-current" : ""}`}
                    onClick={() => onSwitchModel(m.id)}
                    disabled={m.id === model}
                    title={m.id === model ? "Current model" : `Switch to ${m.name}`}
                  >
                    <span className={`model-glyph glyph-${m.id}`}>{m.glyph}</span>
                    <span className="xmodel-name">{m.name}</span>
                    {hit ? (
                      <>
                        <span className="meter"><span style={{ width: `${toPercent(hit.score)}%` }} /></span>
                        <span className="xmodel-val">{toPercent(hit.score)}%</span>
                        <span className="xmodel-rank">#{idx + 1}</span>
                      </>
                    ) : res?.value || res?.error ? (
                      <span className="xmodel-miss">Not in top 50</span>
                    ) : (
                      <span className="meter is-loading"><span /></span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {product.description && (
            <section className="detail-desc">
              <h3>Product details</h3>
              <p>{product.description}</p>
            </section>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export function WishlistSheet({
  open, items, onClose, onRemove,
}: { open: boolean; items: Product[]; onClose: () => void; onRemove: (p: Product) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={<>Wishlist <span className="count">{items.length} items</span></>}>
      {items.length === 0 ? (
        <div className="state state-compact">
          <HeartIcon size={40} />
          <h3>Your wishlist is empty</h3>
          <p>Tap the heart on any product to save it here.</p>
        </div>
      ) : (
        <ul className="wish-list">
          {items.map((p) => (
            <li key={p.product_id} className="wish-row">
              <ProductMedia product={p} compact />
              <div className="wish-info">
                <b>{p.brand}</b>
                <span>{displayName(p)}</span>
                <strong>{formatPrice(p.price_inr)}</strong>
              </div>
              <button className="link-btn" onClick={() => onRemove(p)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
