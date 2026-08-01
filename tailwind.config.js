/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        /**
         * Figma specifies SF Pro for thread/row/bubble text. SF Pro is not
         * redistributable, so the stack resolves to the genuine face on Apple
         * platforms and falls back to Inter elsewhere. Documented substitution —
         * see docs/figma-implementation-map.md.
         */
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
        /** Buttons/labels — same SF Pro → Inter stack as `sans`. */
        ui: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      /**
       * Full 0–100 opacity scale. The default scale only ships 5-step values,
       * so a modifier like `text-white/92` silently compiles to nothing and the
       * element falls back to the inherited colour — which reads as dark text
       * on the dark travel canvas. Defining every step makes the tokens below
       * usable at the exact values the design calls for.
       */
      opacity: Object.fromEntries(
        Array.from({ length: 101 }, (_, step) => [step, String(step / 100)]),
      ),
      colors: {
        // Neutral scale. 900/800 are the "ink" surfaces; 500/400 carry
        // secondary and metadata text and both clear 4.5:1 on white.
        ink: {
          950: "#05080F",
          900: "#090D16",
          800: "#172033",
          700: "#293448",
          600: "#3D485C",
          500: "#5C667A",
          400: "#6D7787",
          300: "#8791A3",
          200: "#C7CEDA",
          100: "#E2E7EF",
          50: "#F1F4F8",
        },
        canvas: {
          DEFAULT: "#F6F8FB",
          card: "#FFFFFF",
          well: "#F1F4F8",
        },
        /**
         * Night surfaces — the assistant dock and every control floating over
         * the satellite map. `DEFAULT` is the dock body, `raised` a card inside
         * it, `line` its hairlines. Kept near-opaque so text over a bright
         * satellite tile still resolves to a predictable contrast ratio.
         */
        night: {
          DEFAULT: "#070B12",
          raised: "#0E1520",
          line: "#1C2634",
        },
        // Travel canvas — deep night sky behind the route (offline fallback).
        sky: {
          deep: "#070B12",
          night: "#0B1524",
          mid: "#102D52",
        },
        // Route illumination. `blue`/`cyan` are for strokes and glows on night
        // surfaces only; `accent` is the text/action blue that passes AA on white.
        route: {
          blue: "#2688FF",
          cyan: "#42D6FF",
        },
        ai: {
          lavender: "#9C8CFF",
        },
        /**
         * Status tones for night surfaces. Each clears 4.5:1 against `night`,
         * which the light-surface `ok`/`warn`/`danger` tokens do not — they are
         * tuned for white and would read as mud on the dock.
         */
        signal: {
          ok: "#28B887",
          warn: "#E29A2D",
          danger: "#E0525E",
        },
        /**
         * Figma tokens, read from the file's local variables via MCP.
         * These are the authoritative values for every screen designed in
         * `Gift Card Styling Update` — see docs/figma-implementation-map.md.
         */
        fig: {
          // Interaction blue. `DEFAULT` is the button/link blue; `ios` is the
          // slightly cooler iOS message-bubble and footer-CTA blue.
          blue: "#0088FF",
          "blue-ios": "#0078FF",
          "blue-arrow": "#007AFF",
          "blue-400": "#528BFF",
          // Text scale.
          900: "#101828",
          600: "#475467",
          400: "#98A2B3",
          tertiary: "#909093",
          note: "#666666",
          // Surfaces.
          bubble: "#E9E9EB",
          line: "#E9E9EB",
          // Semantic.
          "ok-50": "#F6FEF9",
          "ok-200": "#A6F4C5",
          "ok-500": "#12B76A",
          "ok-600": "#039855",
          "warn-50": "#FFFAEB",
          "warn-200": "#FEDF89",
          "warn-600": "#B54708",
          "danger-50": "#FEF3F2",
          "danger-200": "#FECDCA",
          "danger-600": "#B42318",
        },
        accent: {
          DEFAULT: "#3A6DF0",
          700: "#2450C8",
          50: "#EEF3FF",
        },
        ok: {
          DEFAULT: "#0E7A54",
          600: "#10855D",
          50: "#E7F6EF",
        },
        warn: {
          // Darkened from #A96500 so 11-13px warning text clears 4.5:1 on
          // both the page background and warn-50.
          DEFAULT: "#8F5600",
          50: "#FFF3DB",
        },
        danger: {
          DEFAULT: "#BA3540",
          50: "#FDECEF",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(9, 13, 22, 0.05), 0 1px 1px rgba(9, 13, 22, 0.03)",
        raised:
          "0 8px 24px -12px rgba(9, 13, 22, 0.18), 0 1px 2px rgba(9, 13, 22, 0.05)",
        sheet: "0 -12px 32px -12px rgba(9, 13, 22, 0.22)",
        dock: "0 -18px 44px -14px rgba(0, 0, 0, 0.62)",
        // Figma effects, exact values from the file's local styles.
        "fig-xs": "0 1px 2px rgba(16, 24, 40, 0.05)",
        "fig-3xl": "0 32px 64px -12px rgba(16, 24, 40, 0.14)",
        "fig-sheet": "0 4px 32px rgba(0, 0, 0, 0.16)",
        "fig-circle": "0 4px 32px rgba(0, 0, 0, 0.08)",
        "fig-route-pill": "0 10px 12px rgba(16, 24, 40, 0.04)",
        "fig-status-pill": "0 6px 8px rgba(16, 24, 40, 0.05)",
        "fig-device": "0 40px 80px -20px rgba(16, 24, 40, 0.28), 0 8px 24px rgba(16, 24, 40, 0.10)",
        ticket:
          "0 12px 32px -16px rgba(9, 13, 22, 0.28), 0 2px 4px rgba(9, 13, 22, 0.06)",
      },
      borderRadius: {
        xl2: "20px",
        xl3: "26px",
        // Figma radius scale.
        "fig-sheet": "24px",
        "fig-card": "16px",
        "fig-tile": "14px",
        "fig-cta": "12px",
        "fig-pill": "20px",
        "fig-chip": "32px",
        "fig-circle": "24px",
        "fig-device": "40px",
      },
      borderWidth: {
        /** The desktop device frame border. */
        10: "10px",
      },
      transitionTimingFunction: {
        journey: "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
