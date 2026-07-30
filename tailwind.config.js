export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {

        paper: "#F5F1E6",
        surface: "#FFFFFF",
        line: "#14110D",
        fg: "#14110D",
        muted: "#6B6558",
        brutBlue: "#2B5FFF",
        brutPink: "#FF3EA5",
        brutYellow: "#FFE347",
        brutGreen: "#1FAE6E",
        brutRed: "#FF3B30",
      },
      fontFamily: {

        mono: [
          '"Cascadia Code"',
          '"JetBrains Mono"',
          '"SF Mono"',
          "Consolas",
          "ui-monospace",
          "monospace",
        ],

        sans: ['"Space Grotesk"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],

        display: [
          '"Noto Sans Bengali"',
          '"Vrinda"',
          '"Nirmala UI"',
          '"Space Grotesk"',
          "sans-serif",
        ],
      },
      borderRadius: {

        none: "0px",
        DEFAULT: "10px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      boxShadow: {

        brut: "5px 5px 0 0 #14110D",
        "brut-sm": "3px 3px 0 0 #14110D",
        "brut-blue": "5px 5px 0 0 #14110D",
        "brut-pink": "5px 5px 0 0 #14110D",
      },
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
