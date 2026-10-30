import type { Filters, Product, RankedProduct, SortId } from "../types";

/* ---------- Colour ---------- */

const COLOR_HEX: Record<string, string> = {
  blue: "#3b6fd8", black: "#2b2b2e", red: "#d94040", green: "#2f9e6a", white: "#f1f1f3",
  grey: "#9a9ca3", brown: "#8b5a3c", yellow: "#efc030", pink: "#f07aa0", beige: "#d9c4a3",
  gold: "#c9a23f", maroon: "#800f2f", orange: "#f08a32", silver: "#b8bcc4", purple: "#7b4bb7",
  burgundy: "#7a1f3d", khaki: "#b5a76c", navy: "#24305e", lavender: "#b9a6e3", matte: "#6b6b70",
  mustard: "#d8a31f", magenta: "#c2185b", charcoal: "#3c3f44", rose: "#e8a0a8",
  platinum: "#d9d9d6", bronze: "#a8703a", peach: "#f6b39a",
};
const FALLBACK_HEX = "#b0b3bb";

export const colorHex = (color: string | null | undefined) =>
  COLOR_HEX[(color ?? "").trim().toLowerCase()] ?? FALLBACK_HEX;

function mix(hex: string, withHex: string, amount: number) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(withHex.slice(1), 16);
  const ch = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * amount);
  };
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

const tileCache = new Map<string, { background: string; ink: string }>();

/** Soft, editorial tile styling derived from a product's primary colour. */
export function tileStyle(color: string | null | undefined) {
  const hex = colorHex(color);
  let style = tileCache.get(hex);
  if (!style) {
    const light = luminance(hex) > 0.82;
    const top = light ? "#f7f7f8" : mix(hex, "#ffffff", 0.9);
    const bottom = light ? "#e7e8eb" : mix(hex, "#ffffff", 0.72);
    style = {
      background: `radial-gradient(120% 90% at 30% 15%, ${top} 0%, ${bottom} 100%)`,
      ink: light ? "#6b6e78" : luminance(hex) > 0.6 ? mix(hex, "#000000", 0.35) : hex,
    };
    tileCache.set(hex, style);
  }
  return style;
}

/* ---------- Category (drives the tile illustration) ---------- */

export type Category =
  | "top" | "bottom" | "dress" | "ethnic" | "footwear" | "bag"
  | "jewellery" | "watch" | "eyewear" | "beauty" | "home" | "accessory";

const CATEGORY_WORDS: Record<Exclude<Category, "accessory">, string[]> = {
  top: ["shirt", "t-shirt", "tshirt", "top", "tops", "sweatshirt", "sweater", "jacket", "blazer", "hoodie",
    "shrug", "cardigan", "tunic", "coat", "polo", "tee", "camisole", "waistcoat", "pullover", "bra", "vest"],
  bottom: ["jeans", "trousers", "pants", "chinos", "joggers", "shorts", "palazzos", "leggings", "tights",
    "skirt", "pyjamas", "churidar", "capris", "jeggings", "trackpants", "salwar", "dhoti", "boxers", "briefs"],
  dress: ["dress", "jumpsuit", "gown", "playsuit", "dungarees"],
  ethnic: ["kurta", "kurti", "kurtas", "saree", "sari", "dupatta", "lehenga", "sherwani", "anarkali", "choli"],
  footwear: ["shoes", "sneakers", "flats", "sandals", "heels", "derbys", "loafers", "flip-flops", "pumps",
    "slip-ons", "boots", "mules", "wedges", "oxfords", "brogues", "slippers", "sliders", "clogs", "mojaris", "juttis"],
  bag: ["bag", "backpack", "wallet", "clutch", "handbag", "tote", "sling", "duffel", "trolley", "purse", "pouch"],
  jewellery: ["earrings", "necklace", "jhumkas", "ring", "bracelet", "bangles", "bangle", "pendant",
    "cufflinks", "anklet", "studs", "chain", "jewellery", "maang", "nosepin", "mangalsutra"],
  watch: ["watch", "smartwatch"],
  eyewear: ["sunglasses", "eyeglasses", "frames", "glasses"],
  beauty: ["perfume", "deodorant", "lipstick", "ml", "g", "cream", "serum", "shampoo", "kajal",
    "foundation", "nail", "fragrance", "eau", "mascara", "lotion", "gel", "conditioner"],
  home: ["curtains", "curtain", "carpet", "covers", "cushion", "bedsheet", "mug", "placemats", "shade",
    "pot", "holder", "towel", "towels", "rug", "lamp", "quilt", "dohar", "pillow", "blanket", "comforter"],
};

const WORD_TO_CATEGORY = new Map<string, Category>();
for (const [cat, words] of Object.entries(CATEGORY_WORDS)) {
  words.forEach((w) => WORD_TO_CATEGORY.set(w, cat as Category));
}

/** The noun at the end of a product name is the most reliable signal, so scan right-to-left. */
export function categoryOf(name: string): Category {
  const words = name.toLowerCase().replace(/[^a-z0-9\- ]/g, " ").split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    const cat = WORD_TO_CATEGORY.get(words[i]);
    if (cat) return cat;
  }
  return "accessory";
}

/* ---------- Formatting ---------- */

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
export const formatPrice = (value: number) => `Rs. ${inr.format(value)}`;

/** Catalog names repeat the brand ("DKNY Unisex …"); Myntra-style cards show it once. */
export function displayName(p: Pick<Product, "product_name" | "brand">) {
  const { product_name: name, brand } = p;
  return name.toLowerCase().startsWith(brand.toLowerCase())
    ? name.slice(brand.length).trim() || name
    : name;
}

/* ---------- Similarity score ---------- */

export interface ScoreTier {
  label: string;
  tone: "excellent" | "strong" | "good" | "fair";
}

export function scoreTier(score: number): ScoreTier {
  if (score >= 0.8) return { label: "Excellent match", tone: "excellent" };
  if (score >= 0.6) return { label: "Strong match", tone: "strong" };
  if (score >= 0.35) return { label: "Good match", tone: "good" };
  return { label: "Partial match", tone: "fair" };
}

export const toPercent = (score: number) => Math.round(score * 100);

/* ---------- Filtering & sorting ---------- */

export const PRICE_BUCKETS = [
  { id: "lt500", label: "Under Rs. 500", min: 0, max: 499 },
  { id: "500", label: "Rs. 500 – 999", min: 500, max: 999 },
  { id: "1000", label: "Rs. 1,000 – 1,999", min: 1000, max: 1999 },
  { id: "2000", label: "Rs. 2,000 – 4,999", min: 2000, max: 4999 },
  { id: "5000", label: "Rs. 5,000 & above", min: 5000, max: Infinity },
] as const;

export const SORTS: { id: SortId; label: string }[] = [
  { id: "relevance", label: "Best match" },
  { id: "price_asc", label: "Price: Low to High" },
  { id: "price_desc", label: "Price: High to Low" },
  { id: "brand", label: "Brand: A to Z" },
];

const bucketOf = (price: number) => PRICE_BUCKETS.find((b) => price >= b.min && price <= b.max)!.id;

export interface Facet {
  value: string;
  count: number;
}

export interface Facets {
  genders: Facet[];
  colors: Facet[];
  prices: Facet[];
}

function countBy(items: RankedProduct[], key: (p: RankedProduct) => string): Facet[] {
  const counts = new Map<string, number>();
  items.forEach((p) => counts.set(key(p), (counts.get(key(p)) ?? 0) + 1));
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

export function computeFacets(items: RankedProduct[]): Facets {
  const prices = countBy(items, (p) => bucketOf(p.price_inr));
  return {
    genders: countBy(items, (p) => p.gender),
    colors: countBy(items.filter((p) => p.primary_color), (p) => p.primary_color!),
    prices: PRICE_BUCKETS.map((b) => ({ value: b.id, count: prices.find((f) => f.value === b.id)?.count ?? 0 }))
      .filter((f) => f.count > 0),
  };
}

export function applyFilters(items: RankedProduct[], f: Filters) {
  return items.filter(
    (p) =>
      (!f.genders.length || f.genders.includes(p.gender)) &&
      (!f.colors.length || (p.primary_color != null && f.colors.includes(p.primary_color))) &&
      (!f.prices.length || f.prices.includes(bucketOf(p.price_inr))) &&
      toPercent(p.score) >= f.minMatch,
  );
}

export function sortItems(items: RankedProduct[], sort: SortId) {
  const out = [...items];
  switch (sort) {
    case "price_asc":
      return out.sort((a, b) => a.price_inr - b.price_inr);
    case "price_desc":
      return out.sort((a, b) => b.price_inr - a.price_inr);
    case "brand":
      return out.sort((a, b) => a.brand.localeCompare(b.brand) || a.rank - b.rank);
    default:
      return out.sort((a, b) => a.rank - b.rank);
  }
}

export const activeFilterCount = (f: Filters) =>
  f.genders.length + f.colors.length + f.prices.length + (f.minMatch > 0 ? 1 : 0);
