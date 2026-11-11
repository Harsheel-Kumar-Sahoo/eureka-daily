import { ImageResponse } from "next/og";

// iOS home-screen icon (generated at build time as a PNG).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#6D5DF4" }}>
        <svg width="130" height="130" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(0 3)" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M32 13a15 15 0 0 0-8.6 27.3c1.4 1 2.1 2.3 2.1 3.7v1h13v-1c0-1.4.7-2.7 2.1-3.7A15 15 0 0 0 32 13z" />
            <path d="M28 37v-5l4-4 4 4v5" strokeWidth="2.4" />
            <path d="M27.5 50h9M29.5 54.5h5" />
          </g>
          <path d="M51 8l1.7 4.6L57.3 14l-4.6 1.7L51 20.3l-1.7-4.6L44.7 14l4.6-1.4z" fill="#fff" />
        </svg>
      </div>
    ),
    { ...size }
  );
}