export type ModelId = "tfidf" | "word2vec" | "fasttext";

/** One item from POST /api/v1/recommendations/search. */
export interface Product {
  product_id: number;
  product_name: string;
  brand: string;
  gender: string;
  price_inr: number;
  primary_color: string | null;
  description?: string | null;
  image_url?: string | null;
  score: number;
}

export interface SearchResponse {
  query: string;
  model: ModelId;
  total_results: number;
  results: Product[];
}

/** A product with its 1-based position in the model's ranking. */
export interface RankedProduct extends Product {
  rank: number;
}

export type SortId = "relevance" | "price_asc" | "price_desc" | "brand";

export interface Filters {
  genders: string[];
  colors: string[];
  prices: string[];
  minMatch: number; // 0–100
}

export const EMPTY_FILTERS: Filters = { genders: [], colors: [], prices: [], minMatch: 0 };
