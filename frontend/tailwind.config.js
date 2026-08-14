/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          dark: "#232f3e",      // AWS Nav Bar Dark
          lightdark: "#1e293b", // Slate-800
          bg: "#f2f3f3",        // AWS main background (light gray)
          text: "#16191f",      // AWS body text
          blue: "#0066cc",      // AWS link/primary action blue
          hoverblue: "#004d99",
          orange: "#ec7211",    // AWS orange CTA accent
          border: "#eaeded",    // AWS divider gray
          graytext: "#545b64",  // AWS secondary text
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Helvetica Neue", "Roboto", "Arial", "sans-serif"],
      }
    },
  },
  plugins: [],
}
