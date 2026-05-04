import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Bookbrush brand palette extracted from the official logo
        bb: {
          purple: '#5b1f9e',     // primary deep purple (left side of logo)
          'purple-dark': '#3e1671',
          'purple-light': '#8a4cd0',
          magenta: '#d12a72',    // accent magenta (right side of logo)
          'magenta-dark': '#a4205a',
          pink: '#e93e6e',       // brighter pink (gradient endpoint)
          ink: '#1a1330',        // headings on light bg
          mist: '#f6f3fb',       // soft lavender background
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      backgroundImage: {
        'bb-gradient': 'linear-gradient(90deg, #5b1f9e 0%, #d12a72 100%)',
        'bb-gradient-soft': 'linear-gradient(135deg, #f6f3fb 0%, #ffffff 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
