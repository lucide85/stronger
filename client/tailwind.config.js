/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0D10",
        panel: "#12161B",
        raised: "#171C23",
        hair: "#232A32",
        "hair-bright": "#333C46",
        primary: "#ECEFF3",
        secondary: "#8A94A3",
        tertiary: "#5B6472",
        amber: { DEFAULT: "#FF8C42", dim: "#2E2013" },
        cyan: { DEFAULT: "#3DDAD7", dim: "#13282A" },
        lime: { DEFAULT: "#B7FF3C", dim: "#202B12" },
        gold: "#FFD166",
        danger: "#FF5D5D",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(#232A32 1px, transparent 1px), linear-gradient(90deg, #232A32 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
    },
  },
  plugins: [],
};
