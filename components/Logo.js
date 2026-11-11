// Eureka Daily mark: a lightbulb (the "eureka" moment) with a spark, on an indigo-violet tile.
export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="Eureka Daily logo">
      <defs>
        <linearGradient id="eureka-grad" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#eureka-grad)" />
      <g transform="translate(0 3)" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 13a15 15 0 0 0-8.6 27.3c1.4 1 2.1 2.3 2.1 3.7v1h13v-1c0-1.4.7-2.7 2.1-3.7A15 15 0 0 0 32 13z" />
        <path d="M28 37v-5l4-4 4 4v5" strokeWidth="2.4" />
        <path d="M27.5 50h9M29.5 54.5h5" />
      </g>
      <path d="M51 8l1.7 4.6L57.3 14l-4.6 1.7L51 20.3l-1.7-4.6L44.7 14l4.6-1.4z" fill="#fff" />
    </svg>
  );
}