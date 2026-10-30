import { memo, useState } from "react";
import { categoryOf, displayName, formatPrice, tileStyle } from "../lib/catalog";
import type { Product, RankedProduct } from "../types";
import { CategoryIcon, HeartIcon } from "./Icons";
import { MatchChip, ScoreBar } from "./Score";

export function ProductTile({ product, compact }: { product: Product; compact?: boolean }) {
  const { background, ink } = tileStyle(product.primary_color);
  return (
    <div className={`tile${compact ? " tile-compact" : ""}`} style={{ background, color: ink }}>
      <span className="tile-halo" />
      <CategoryIcon category={categoryOf(product.product_name)} className="tile-icon" />
      {!compact && <span className="tile-brand">{product.brand}</span>}
    </div>
  );
}

/**
 * The real product photo, layered over the illustrated colour tile. The tile stays
 * underneath as the loading state and as the permanent fallback if the photo 404s
 * or the catalog has no image for this item.
 */
export function ProductMedia({ product, compact }: { product: Product; compact?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showPhoto = !!product.image_url && !failed;

  const photo = showPhoto && (
    <img
      className={`media-photo${loaded ? " is-loaded" : ""}`}
      src={product.image_url!}
      alt={product.product_name}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );

  // card-media / detail-media (the grid & sheet layouts) are already position:relative
  // wrappers around this component, so the photo can sit directly over the tile. The
  // compact wishlist row has no such wrapper, so it needs its own positioning context.
  if (compact) {
    return (
      <div className="media-compact">
        <ProductTile product={product} compact />
        {photo}
      </div>
    );
  }

  return (
    <>
      <ProductTile product={product} />
      {photo}
    </>
  );
}

interface Props {
  product: RankedProduct;
  index: number;
  wished: boolean;
  onOpen: (p: RankedProduct) => void;
  onWish: (p: Product) => void;
}

export const ProductCard = memo(function ProductCard({ product, index, wished, onOpen, onWish }: Props) {
  return (
    <article className="card" style={{ "--i": Math.min(index, 12) } as React.CSSProperties}>
      <div className="card-media">
        <ProductMedia product={product} />
        <span className="card-rank">#{product.rank}</span>
        <MatchChip score={product.score} />
      </div>

      <div className="card-body">
        <h3 className="card-brand">{product.brand}</h3>
        <p className="card-name">{displayName(product)}</p>
        <div className="card-price">
          <b>{formatPrice(product.price_inr)}</b>
          <span className="card-meta">
            {product.primary_color && (
              <span className="swatch" style={{ background: tileStyle(product.primary_color).ink }} />
            )}
            {product.gender}
          </span>
        </div>
        <ScoreBar score={product.score} />
      </div>

      <button className="card-open" onClick={() => onOpen(product)} aria-label={`View ${product.product_name}`} />
      <button
        className={`card-wish${wished ? " is-on" : ""}`}
        aria-pressed={wished}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => onWish(product)}
      >
        <HeartIcon size={18} filled={wished} />
      </button>
    </article>
  );
});

export function SkeletonCard() {
  return (
    <div className="card card-skeleton" aria-hidden>
      <div className="card-media shimmer" />
      <div className="card-body">
        <span className="shimmer line w60" />
        <span className="shimmer line w90" />
        <span className="shimmer line w40" />
      </div>
    </div>
  );
}
