import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#07090D",
        card: "#0E1218",
        card2: "#121821",
        line: "#1F2937",
        text: "#F8FAFC",
        sub: "#94A3B8",
        primary: "#C6FF00",
        accent: "#00FFA3",
        warning: "#FFC857",
        success: "#34D399",
        danger: "#FB7185"
      },
      boxShadow: {
        neon: "0 0 30px rgba(198,255,0,0.15)"
      },
      borderRadius: {
        xl2: "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;