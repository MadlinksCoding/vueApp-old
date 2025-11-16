      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
           
            colors: {
              'primary-text': '#221f1f',
              'primary-bg': '#f9fafb',
              'border-light': '#d0d5dd',
              'secondary-bg': '#edeff3',
              'dark-text': '#0c111d',
              'secondary-text': '#98A2B3',
              'white': '#ffffff',
              'gray-text': '#667085',
              'black': '#000',
              'medium-text': '#344054',
              'light-border': '#dee5ec',
              'light-bg': '#eff3f8',
              'error': '#ff4405',
              'error-light': '#ff692e',
              'success': '#07f468',
              'error-dark': '#ff561d',
              'dark-gray': '#475467',
              'darker-text': '#101828',
              'beige-text': '#b1aaa0',
              'light-beige': '#d6d3cd',
              'medium-beige': '#bdb7af',
              'almost-black': '#303437',
              'lightest-bg': '#f5f7fa',
              'medium-border': '#d1d5db',
              'medium-gray': '#9ca3af',
              'light-gray': '#a3a3a3',
              'dark-bg': '#20262c',
              'darker-bg': '#0b0f12',
              'dark-border': '#2f343b',
              'darker-border': '#1c1f22',
              'light-divider': '#eaecf0',
              'dark-gray-2': '#353a3c',
              'timberwolf': '#dbd8d3',
              'american-silver': '#d3d0ca',
              'independence': '#4a5568',
              'raisin-black-2': '#202325',
              'vodka': '#bdb7ef',
              'platinum': '#e8e6e3',

              // Dark mode colors
              'dark-primary-bg': '#1b1d1e',
              'darker-bg-alt': '#181a1b',
              'dark-border-aresenic': '#3b4043',
              'darkest-bg': '#0a0e17',
              'dark-beige-text': '#afa99e',
              'dark-medium-beige': '#9e9589',
              'dark-light-bg': '#e8e6e3',
              'dark-blue-bg': '#2b3b4b',
              'dark-gray-bg': '#232627',
              'dark-gray-bg-alt': '#222526',
              'dark-gray-bg-2': '#1e2122',
              'dark-beige': '#c7c3bb',
              'dark-light-purple': '#dbd8e3',
              'dark-brown': '#857c6d',
              'dark-gray-border': '#303436',
              'dark-light-text': '#dbd8d3',

              // accent colors
              'blue-accent': '#004EEB',
              'blue-accent-light': '#3f9dff',
              'tag-bg': '#D1E0FF',
              'radio-border': '#d0d5dd',
              'tooltip-bg': 'rgba(16,24,40,0.7)',
              'dark-tooltip-bg': 'rgba(14,19,32,0.9)',
              'preview-bg': '#f2f6fc',
              'dark-preview-bg': '#1d1f20',
              'upload-bg': 'rgba(255,68,5,0.1)',
              'dark-upload-bg': 'rgba(201,51,0,0.1)',
            },
            fontFamily: {
              sans: ['Poppins', 'Inter', 'Montserrat', 'Open Sans', 'arial', 'sans-serif'],
            },
            boxShadow: {
              'sh1': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
              'sh1-dark': '0 1px 2px 0 rgba(13, 19, 32, 0.05)'
            },
            backgroundImage: {
              'gradient-warning': `
                linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 100%),
                linear-gradient(0deg, rgba(255, 68, 5, 0.1) 0%, rgba(255, 68, 5, 0.1) 100%),
                linear-gradient(0deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9))
              `,
              'dark-gradient-warning': `
                linear-gradient(90deg, rgba(24, 26, 27, 0) 0%, rgba(24, 26, 27, 0.9) 100%),
                linear-gradient(0deg, rgba(201, 51, 0, 0.1) 0%, rgba(201, 51, 0, 0.1) 100%)
              `
            },
           
            
          },
        },
      }