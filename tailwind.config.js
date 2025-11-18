import plugin from 'tailwindcss/plugin'
import primeui from 'tailwindcss-primeui'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}', './presets/**/*.{js,vue,ts}'],
  theme: {
    extend: {
      colors: {
        // ============================================
        // SEMANTIC DESIGN TOKENS (25 tokens)
        // ============================================

        // Brand Colors (4)
        'primary': '#FB7EFF',           // Main brand pink - use for primary actions, highlights
        'primary-light': '#FCD4FF',     // Light pink - use for text on dark backgrounds, subtle accents
        'primary-dark': '#7400FF',      // Deep purple - use for emphasis, gradients
        'accent': '#8217BD',            // Purple accent - use for borders, secondary highlights

        // Background Colors (6)
        'bg-main': '#15002E',           // Main dark purple background
        'bg-secondary': '#190B29',      // Darker purple - use for cards, elevated surfaces
        'bg-card': 'rgba(22, 14, 37, 0.7)',      // Card background with transparency
        'bg-hover': 'rgba(14, 0, 31, 0.7)',      // Hover state background
        'bg-overlay': 'rgba(0, 0, 0, 0.5)',      // Modal overlays, backdrops
        'bg-elevated': 'rgba(246, 246, 246, 0.08)', // Slightly elevated surfaces

        // Text Colors (5)
        'text-primary': 'rgba(246, 246, 246, 1)',    // Main text color
        'text-secondary': 'rgba(246, 246, 246, 0.7)', // Secondary text, labels
        'text-muted': 'rgba(246, 246, 246, 0.4)',     // Muted text, placeholders
        'text-accent': '#FB7EFF',                     // Accent text color
        'text-link': '#95D5FD',                       // Link color (block explorer links)

        // Border Colors (4)
        'border-primary': '#FB7EFF',                  // Primary borders
        'border-accent': 'rgba(251, 126, 255, 0.6)',  // Accent borders (60% opacity)
        'border-subtle': 'rgba(246, 246, 246, 0.16)', // Subtle dividers, light borders
        'border-muted': 'rgba(143, 143, 143, 0.3)',   // Muted borders

        // State Colors (3)
        'success': '#19FF89',           // Success state - completed actions, positive feedback
        'warning': '#FF9519',           // Warning state - caution, pending actions
        'error': '#FF4219',             // Error state - failures, critical alerts

        // Utility Colors (3)
        'divider': 'rgba(246, 246, 246, 0.16)',  // Horizontal rules, separators
        'shadow': 'rgba(0, 0, 0, 0.25)',         // Drop shadows
        'transparent': 'transparent',             // Transparent color for gradients

        // ============================================
        // LEGACY GRADIENTS (kept for specific use cases)
        // These are used in gradients and should be migrated gradually
        // ============================================
        'gradient-pink-start': 'rgba(116, 7, 176, 0.8)',  // Network button gradient start
        'gradient-pink-end': 'rgba(67, 7, 165, 0.8)',     // Network button gradient end

        // ============================================
        // DEPRECATED COLORS (To be removed in future)
        // These are kept temporarily for backwards compatibility
        // Migrate to semantic tokens above
        // ============================================
        'white-rgba': 'rgba(255, 255, 255, 0.08)',
        'white-0.2': 'rgba(255, 255, 255, 0.2)',
        'confirm-btn-grey': 'rgba(22, 14, 37, 0.9)',
        'confirm-btn-grey-hover': 'rgba(31, 20, 52, 0.7)',
        'network-btn-tl': 'rgba(116, 7, 176, 0.8)',
        'network-btn-br': 'rgba(67, 7, 165, 0.8)',
        'blockexplorer-default': 'rgb(149, 213, 253)',
        'blockexplorer-hover': 'rgb(116, 132, 255)',
        'search-blue': 'rgba(132, 76, 255, 0.5)',
        'search-blue-hover': 'rgba(132, 76, 255, 1)'
      },
      fontFamily: {
        satoshi: ['Satoshi']
      },
      boxShadow: {
        'confirm-default':
          'inset 0px 7.21262px 10.3566px -6.65781px rgba(96, 121, 255, 0.5), inset 0px 1.29457px 2.03433px -0.739756px #6C84FF, inset 0px -15.165px 12.5759px -11.8361px rgba(63, 79, 158, 0.3), inset 0px 18.124px 18.4939px -8.87708px rgba(137, 156, 255, 0.3), inset 0px 0.739756px 3.3289px rgba(64, 86, 201, 0.3), inset 0px 0.184939px 7.39756px rgba(179, 191, 255, 0.2);',
        'confirm-hover':
          'inset 0px 7.21262px 10.3566px -6.65781px rgba(96, 121, 255, 0.7), inset 0px 1.29457px 2.03433px -0.739756px #6C84FF, inset 0px -15.165px 12.5759px -11.8361px rgba(63, 79, 158, 0.5), inset 0px 18.124px 18.4939px -8.87708px rgba(137, 156, 255, 0.5), inset 0px 0.739756px 3.3289px rgba(64, 86, 201, 0.5), inset 0px 0.184939px 7.39756px rgba(179, 191, 255, 0.4);',
        'network-default':
          'inset 0px 7.21262px 10.3566px -6.65781px rgba(196, 159, 255, 0.5), inset 0px 1.29457px 2.03433px -0.739756px #C49FFF, inset 0px -15.165px 12.5759px -11.8361px rgba(103, 72, 154, 0.3), inset 0px 18.124px 18.4939px -8.87708px rgba(204, 172, 255, 0.3), inset 0px 0.739756px 3.3289px rgba(181, 156, 222, 0.3), inset 0px 0.184939px 7.39756px rgba(235, 223, 255, 0.2);',
        'network-hover':
          'inset 0px 7.21262px 10.3566px -6.65781px rgba(196, 159, 255, 0.7), inset 0px 1.29457px 2.03433px -0.739756px #C49FFF, inset 0px -15.165px 12.5759px -11.8361px rgba(103, 72, 154, 0.5), inset 0px 18.124px 18.4939px -8.87708px rgba(204, 172, 255, 0.5), inset 0px 0.739756px 3.3289px rgba(181, 156, 222, 0.3), inset 0px 0.184939px 7.39756px rgba(235, 223, 255, 0.4);',
        'network-img-default':
          'inset 0px 7.21262px 10.3566px -6.65781px rgba(157, 255, 235, 0.5), inset 0px 1.29457px 2.03433px -0.739756px #9DFFEB, inset 0px -15.165px 12.5759px -11.8361px rgba(71, 150, 133, 0.3), inset 0px 18.124px 18.4939px -8.87708px rgba(173, 255, 238, 0.3), inset 0px 0.739756px 3.3289px rgba(149, 215, 201, 0.3), inset 0px 0.184939px 7.39756px rgba(223, 255, 248, 0.2);',
        'network-img-hover':
          'inset 0px 7.21262px 10.3566px -6.65781px rgba(157, 255, 235, 0.7), inset 0px 1.29457px 2.03433px -0.739756px #9DFFEB, inset 0px -15.165px 12.5759px -11.8361px rgba(71, 150, 133, 0.5), inset 0px 18.124px 18.4939px -8.87708px rgba(173, 255, 238, 0.5), inset 0px 0.739756px 3.3289px rgba(149, 215, 201, 0.5), inset 0px 0.184939px 7.39756px rgba(223, 255, 248, 0.4);',
        'reverse-icon-default':
          'inset 0px 7.21262px 10.3566px -6.65781px rgba(196, 159, 255, 0.3), inset 0px 1.29457px 2.03433px -0.739756px #C49FFF, inset 0px -15.165px 12.5759px -11.8361px rgba(103, 72, 154, 0.1), inset 0px 18.124px 18.4939px -8.87708px rgba(204, 172, 255, 0.1), inset 0px 0.739756px 3.3289px rgba(181, 156, 222, 0.1), inset 0px 0.184939px 7.39756px rgba(235, 223, 255, 0.1)',
        'reverse-icon-hover':
          'inset 0px 7.21262px 10.3566px -6.65781px rgba(196, 159, 255, 0.5), inset 0px 1.29457px 2.03433px -0.739756px #C49FFF, inset 0px -15.165px 12.5759px -11.8361px rgba(103, 72, 154, 0.3), inset 0px 18.124px 18.4939px -8.87708px rgba(204, 172, 255, 0.3), inset 0px 0.739756px 3.3289px rgba(181, 156, 222, 0.3), inset 0px 0.184939px 7.39756px rgba(235, 223, 255, 0.3)',
        'token-default':
          '0px 4px 8px rgba(0, 0, 0, 0.25), inset 0px 7.21262px 10.3566px -6.65781px rgba(252, 159, 255, 0.5), inset 0px 1.29457px 2.03433px -0.739756px #FC9DFF, inset 0px -15.165px 12.5759px -11.8361px rgba(152, 73, 154, 0.3), inset 0px 18.124px 18.4939px -8.87708px rgba(252, 174, 255, 0.3), inset 0px 0.739756px 3.3289px rgba(212, 108, 216, 0.3), inset 0px 0.184939px 7.39756px rgba(254, 222, 255, 0.2);',
        'token-hover':
          '0px 4px 8px rgba(0, 0, 0, 0.25), inset 0px 7.21262px 10.3566px -6.65781px rgba(252, 159, 255, 0.7), inset 0px 1.29457px 2.03433px -0.739756px #FC9DFF, inset 0px -15.165px 12.5759px -11.8361px rgba(152, 73, 154, 0.5), inset 0px 18.124px 18.4939px -8.87708px rgba(252, 174, 255, 0.5), inset 0px 0.739756px 3.3289px rgba(212, 108, 216, 0.5), inset 0px 0.184939px 7.39756px rgba(254, 222, 255, 0.4);'
      },
      dropShadow: {
        'menu-default': '0px 0px 9px rgba(51, 0, 255, 0.6)',
        'menu-2': '0px 0px 16px rgba(252, 157, 255, 0.3) drop-shadow(0px 0px 9px rgba(51, 0, 255, 0.6))'
      },
      screens: {
        '3xl': '2150px', // 2xl * 1.4
        '4xl': '3011px' // 3xl * 1.4
        // multiply div sizes with hardcoded values with 1.4
      }
    }
  },
  plugins: [
    primeui,
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'bg-gradient': (angle) => ({
            'background-image': `linear-gradient(${angle}, var(--tw-gradient-stops))`
          })
        },
        {
          values: Object.assign(theme('bgGradientDeg', {}), {
            10: '10deg',
            15: '15deg',
            20: '20deg',
            25: '25deg',
            30: '30deg',
            45: '45deg',
            60: '60deg',
            90: '90deg',
            120: '120deg',
            135: '135deg',
            150: '150deg'
          })
        }
      )
    })
  ]
}
