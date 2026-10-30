import type { Category } from "../lib/catalog";

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const SearchIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
);
export const CloseIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const ChevronDown = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M6 9l6 6 6-6" /></svg>
);
export const CheckIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const HeartIcon = ({ size = 18, className, filled }: IconProps & { filled?: boolean }) => (
  <svg {...base(size)} className={className} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.5 2.7C19.5 15.4 12 20 12 20z" />
  </svg>
);
export const SortIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" /></svg>
);
export const FilterIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M4 6h16M7 12h10M10 18h4" /></svg>
);
export const ClockIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></svg>
);
export const TrendIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></svg>
);
export const SparkIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" /></svg>
);
export const BoltIcon = ({ size = 14, className }: IconProps) => (
  <svg {...base(size)} className={className}><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" /></svg>
);

/* Category line illustrations for the product tiles (the catalogue has no photos). */
const CATEGORY_PATHS: Record<Category, JSX.Element> = {
  top: <path d="M8.5 3.5L3.5 6.3l1.8 4.4 2.7-1.2V20.5h8V9.5l2.7 1.2 1.8-4.4-5-2.8c-.4 1.6-1.8 2.7-3.5 2.7s-3.1-1.1-3.5-2.7z" />,
  bottom: <><path d="M6.5 3.5h11l1.2 17h-5L12 10.5l-1.7 10H5.3z" /><path d="M6.4 6.5h11.2M12 6.5v4" /></>,
  dress: <><path d="M9.5 3.5h5l-.8 4.8 5.3 12.2H5l5.3-12.2z" /><path d="M10.3 8.3h3.4" /></>,
  ethnic: <><path d="M9 3.5l3 2.5 3-2.5 3.8 2.6-1.6 3.6-1.7-.8v12.1H8.5V8.9l-1.7.8-1.6-3.6z" /><path d="M12 6v5M10.5 16.5h3" /></>,
  footwear: <><path d="M2.5 17V10.8l5 1.1 2.4-3 3.3 4.3 5.3 1.5a2.9 2.9 0 0 1 2 2.8v.5z" /><path d="M2.5 19.5h19M9.6 12.8l1.3-.9M11.3 14.5l1.3-.9" /></>,
  bag: <><path d="M5 8.5h14l-1.2 12H6.2z" /><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" /></>,
  jewellery: <><path d="M6.5 4.5h11l3 4.5-9 11-9-11z" /><path d="M3.5 9h17M9.5 4.5L12 20M14.5 4.5L12 20" /></>,
  watch: <><circle cx="12" cy="12" r="5.5" /><path d="M9 7l.8-3.5h4.4L15 7M9 17l.8 3.5h4.4L15 17M12 9.5V12l1.7 1.2" /></>,
  eyewear: <><circle cx="7" cy="13.5" r="3.5" /><circle cx="17" cy="13.5" r="3.5" /><path d="M10.5 13.5h3M3.5 13.5L2.3 8.5M20.5 13.5l1.2-5" /></>,
  beauty: <><path d="M9.5 3.5h5v3h-5z" /><rect x="7" y="6.5" width="10" height="14" rx="2" /><path d="M7 11.5h10" /></>,
  home: <><path d="M3.5 11L12 4.5l8.5 6.5" /><path d="M5.5 9.5v11h13v-11M10 20.5v-5h4v5" /></>,
  accessory: <><path d="M3.5 12.2V4.5h7.7l9.3 9.3-7.7 7.7z" /><circle cx="7.8" cy="8.8" r="1.4" /></>,
};

export function CategoryIcon({ category, size = 64, className }: IconProps & { category: Category }) {
  return (
    <svg {...base(size)} strokeWidth={1.1} className={className}>
      {CATEGORY_PATHS[category]}
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff3f6c" />
            <stop offset="1" stopColor="#ff8a3d" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#lg)" />
        <path
          d="M21 11.5c-1-1.6-2.8-2.5-5-2.5-3 0-5 1.6-5 3.8 0 4.9 10 2.9 10 7.6 0 2.1-2.1 3.6-5 3.6-2.4 0-4.3-1-5.3-2.7"
          stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round"
        />
      </svg>
      <span className="logo-word">style<b>sense</b></span>
    </span>
  );
}
