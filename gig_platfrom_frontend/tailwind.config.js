/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#5b8ea7',
        // primary: {
        //   50: "#eff6ff",
        //   100: "#dbeafe",
        //   200: "#bfdbfe",
        //   300: "#93c5fd",
        //   400: "#60a5fa",
        //   500: "#3b82f6",
        //   600: "#2563eb",
        //   700: "#1d4ed8",
        //   800: "#1e40af",
        //   900: "#1e3a8a",
        // },
              primary: {
        50: "#f0f6f9",
        100: "#e0edf3",
        200: "#c5dce7",
        300: "#a1c6da",
        400: "#79aec7", // Your base color
        500: "#5994b0",
        600: "#457993",
        700: "#3a6279",
        800: "#325366",
        900: "#2d4757",
        950: "#1a2b36",
      }
      },
    },
  },
  plugins: [],
};
