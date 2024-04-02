import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "scrolling-banner": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-50% - var(--gap)/2))" },
        },
        "scrolling-banner-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-50% - var(--gap)/2))" },
        },
      },
      animation: {
        "scrolling-banner": "scrolling-banner var(--duration) linear infinite",
        "scrolling-banner-vertical": "scrolling-banner-vertical var(--duration) linear infinite",
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui(
      {
        themes: {
          light: {
            layout: {},
            colors: {
              background: {
                DEFAULT: "#4fafc1",
                400: "#4fafc1",
                50: "#f0fafb",
                100: "#d9f0f4",
                200: "#b8e3e9",
                300: "#87cdd9",
                500: "#3393a7",
                600: "#2e788c",
                700: "#2b6273",
                800: "#2a5260",
                900: "#274552",
              },
              primary: {
                foreground: "#ffffff",
                DEFAULT: "#ffffff",
                50: "#ffffff",
                100: "#ffffff",
                200: "#ffffff",
                300: "#ffffff",
                400: "#ffffff",
                500: "#ffffff",
                600: "#ffffff",
                700: "#ffffff",
                800: "#ffffff",
                900: "#ffffff",
              },
              secondary: 
              {
                DEFAULT: "#e0c72f",
                50: "#fcfbea",
                100: "#f7f7ca",
                200: "#f1eb97",
                300: "#ebde6c",
                400: "#e0c72f",
                500: "#d1b021",
                600: "#b48b1a",
                700: "#906618",
                800: "#78511b",
                900: "#66441d",
              },
              default: {
                foreground: "#ffffff",
                DEFAULT: "#ffffff",
                50: "#ffffff",
                100: "#ffffff",
                200: "#ffffff",
                300: "#ffffff",
                400: "#ffffff",
                500: "#ffffff",
                600: "#ffffff",
                700: "#ffffff",
                800: "#ffffff",
                900: "#ffffff",
              },
            }
          }
        }
      }
    )
  ]
} satisfies Config;
