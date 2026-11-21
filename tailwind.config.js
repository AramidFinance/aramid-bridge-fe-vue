import plugin from 'tailwindcss/plugin'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bottom-right-green': '#00110D',
        'top-left-green': '#072821',
        'border-green': '#AEEFE1',
        'white-rgba': 'rgba(255, 255, 255, 0.08)',
        'green-rgba': 'rgba(0, 97, 0, 0.08)',
        'green-rgba-2': 'rgba(0, 205, 100, 0.3)',
        'dark-green-1': '#072821',
        'red-rgba': 'rgba(97, 0, 0, 0.08)',
        'red-rgba-2': 'rgba(150, 0, 0, 0.3)',
        'black-rgba': 'rgba(0, 0, 0, 0.08)',
        'black-rgba-2': 'rgba(0, 0, 0, 0.5)',
        'white-rgba-0.3': 'rgba(255, 255, 255, 0.3)',
        'white-rgba-0.15': 'rgba(255, 255, 255, 0.15)',
        'white-rgba-0.17': 'rgba(255, 255, 255, 0.17)',
        'white-rgba-3': 'rgba(255, 255, 255, 0.7)',
        'white-0': 'rgba(255, 255, 255, 0)',
        'white-0.2': 'rgba(255, 255, 255, 0.2)',
        'white-0.25': 'rgba(255, 255, 255, 0.25)',
        'white-0.4': 'rgba(255, 255, 255, 0.4)',
        'white-0.5': 'rgba(255, 255, 255, 0.5)',
        'white-0.6': 'rgba(255, 255, 255, 0.6)',
        'white-0.7': 'rgba(255, 255, 255, 0.7)',
        'white-0.8': 'rgba(255, 255, 255, 0.8)',
        'fun-teal': '#AEEFE1',
        'weird-green': '#021813',
        'topleft-purple': 'rgba(35, 0, 87, 0.9)',
        'network-type': 'rgba(246, 246, 246, 0.7)',
        'bottomright-purple': 'rgba(35, 16, 69, 0.9)',
        'std-button-tl-purple': 'rgba(48, 0, 74, 0.9)',
        'std-button-br-purple': 'rgba(35, 0, 54, 0.9)',
        'network-btn-tl': 'rgba(116, 7, 176, 0.8)',
        'network-btn-br': 'rgba(67, 7, 165, 0.8)',
        'network-img-tl': 'rgba(116, 7, 176, 0.2)',
        'network-img-br': 'rgba(67, 7, 165, 0.2)',
        'confirm-btn-grey': 'rgba(22, 14, 37, 0.9)',
        'confirm-btn-grey-hover': 'rgba(31, 20, 52, 0.7)',
        'left-pink': 'rgba(252, 212, 255, 0.6)',
        'middle-pink': 'rgba(251, 126, 255, 0.3)',
        'right-purple': 'rgba(116, 0, 255, 0.7)',
        'connect-purple': 'rgba(15, 0, 40, 0.8)',
        'connect-purple-hover': 'rgba(60, 20, 160, 0.8)',
        'kinda-dark-pink': 'rgba(251, 160, 255, 1)',
        'nav-not-selected': 'rgba(246, 246, 246, 0.5)',
        'connect-text': 'rgba(246, 246, 246, 0.7)',
        'connect-border': 'rgba(140, 140, 140, 0.3)',
        'main-border': 'rgba(143, 143, 143, 0.3)',
        'token-tl-purple': 'rgba(116, 7, 176, 0.9)',
        'token-br-purple': 'rgba(67, 7, 165, 0.9)',
        'amount-purple': 'rgba(15, 0, 40, 0.9);',
        'amount-purple-hover': 'rgba(60, 20, 160, 0.9)',
        'amount-border-l': 'rgba(252, 212, 255, 0.3)',
        'amount-border-c': 'rgba(251, 126, 255, 0.3)',
        'amount-border-r': 'rgba(116, 0, 255, 0.3)',
        'approve-left': 'rgba(144, 180, 254, 0.6)',
        'approve-right': 'rgba(104, 98, 255, 0.4)',
        'approve-middle': 'rgba(201, 95, 255, 0.6)',
        'send-left': 'rgba(157, 246, 252, 0.5)',
        'send-middle': 'rgba(118, 125, 255, 0.5)',
        'send-right': 'rgba(60, 9, 201, 0.9)',
        'placeholder-purple': 'rgb(23, 13, 40)',
        'blockexplorer-default': 'rgb(149, 213, 253)',
        'blockexplorer-hover': 'rgb(116, 132, 255)',
        'claim-left': 'rgba(144, 180, 254, 0.6)',
        'claim-middle': 'rgba(60, 9, 201, 0.9)',
        'claim-right': 'rgba(118, 125, 255, 0.5)',
        'search-blue': 'rgba(132, 76, 255, 0.5)',
        'search-blue-hover': 'rgba(132, 76, 255, 1)',
        'reset-left': 'rgba(195, 91, 254, 0.8)', // pink
        'reset-right': 'rgba(151, 225, 254, 0.8)', // light blue

        // aramid color palette
        'primary-pink-light': 'rgba(252, 212, 255, 1)',
        'primary-pink': 'rgba(251, 126, 255, 1)',
        'primary-purple': 'rgba(116, 0, 255, 1)',
        // 'primary-gradient': 'linear-gradient(91.11deg, #FCD4FF 5.02%, #FB7EFF 66.64%, #7400FF 124.21%)',
        'dark-label': 'rgba(246, 246, 246, 1)',
        'dark-caption': 'rgba(246, 246, 246, 0.7)',
        'dark-placeholder': 'rgba(246, 246, 246, 0.4)',
        'dark-elevation': 'rgba(246, 246, 246, 0.08)',
        'dark-low-elevation': 'rgba(246, 246, 246, 0.02)',
        'feedback-success': 'rgba(25, 255, 137, 1)',
        'feedback-warning': 'rgba(255, 149, 25, 1)',
        'feedback-error': 'rgba(255, 66, 25, 1)',

        // background main
        'bg-main-first': 'rgba(21, 0, 46, 1)',
        'bg-main-second': 'rgba(14, 0, 31, 1)',

        // background secondary
        'bg-secondary-pink': 'rgba(116, 7, 176, 0.9)',
        'bg-secondary-purple': 'rgba(67, 7, 165, 0.9)',

        'background-secondary': 'rgba(14, 0, 31, 1)',

        'button-bg-hover': 'rgba(14, 0, 31, 0.7)',
        'background-card': 'rgba(22, 14, 37, 0.7)'
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
