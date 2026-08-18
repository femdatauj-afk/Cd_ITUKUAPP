import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { ituku: { green: "#0A7A33", gold: "#F4B400", ink: "#222222", mist: "#F5F5F5" } },
      boxShadow: { soft: "0 12px 32px rgba(20, 39, 28, 0.10)" },
    },
  },
  plugins: [],
};

export default config;
