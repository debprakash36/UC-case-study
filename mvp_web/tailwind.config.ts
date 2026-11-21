import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        uc: {
          dark: "#111827",
          purple: "#7c3aed",
          accent: "#2563eb",
          emerald: "#059669"
        }
      },
    },
  },
  plugins: [],
};
export default config;
