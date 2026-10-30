import type { ModelId } from "../types";

export interface ModelInfo {
  id: ModelId;
  name: string;
  glyph: string;
  tagline: string;
  description: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "tfidf",
    name: "TF-IDF",
    glyph: "Tf",
    tagline: "Keyword precision",
    description: "Weights exact terms by rarity. Best for brands and specific product names.",
  },
  {
    id: "word2vec",
    name: "Word2Vec",
    glyph: "W2",
    tagline: "Semantic context",
    description: "Learns meaning from context, so it finds related styles even with different words.",
  },
  {
    id: "fasttext",
    name: "FastText",
    glyph: "Ft",
    tagline: "Typo-tolerant",
    description: "Sub-word embeddings that cope with misspellings and rare words.",
  },
];

export const MODEL_BY_ID = Object.fromEntries(MODELS.map((m) => [m.id, m])) as Record<ModelId, ModelInfo>;

export const isModelId = (v: unknown): v is ModelId => typeof v === "string" && v in MODEL_BY_ID;
