/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Charcoal/Deep gray colors requested by user
        bgDark: "#121214",      # Deep dark canvas
        bgCard: "#1e1e24",      # Lighter charcoal card
        borderGrey: "#2d2d34",  # Subtle border gray
        
        // Sentry brand colors
        sentry: {
          primary: "#150f23",
          lime: "#c2ef4e",
          pink: "#fa7faa",
          violet: "#6a5fc1",
          violetDeep: "#422082",
          violetMid: "#79628c",
        },
        
        // Risk status colors
        risk: {
          blocked: "#f43f5e",   # Bright red/pink for critical fraud
          suspicion: "#f59e0b", # Soft yellow/orange for medium risk
          approved: "#10b981",  # Soft green for approved
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'Monaco', 'Menlo', 'monospace'],
        sans: ['Rubik', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
