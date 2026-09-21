{
  const { loadStyle } = window.__PLUGIN_UTILS__ || {};

  function darkModePlugin(hook, vm) {
    loadStyle('/plugins/dark-mode/index.css');

    const setColor = ({ background, toggleBtnBg, textColor }) => {
      document.documentElement.style.setProperty(
        '--docsify_dark_mode_bg',
        background
      )
      document.documentElement.style.setProperty(
        '--docsify_dark_mode_btn',
        toggleBtnBg
      )
      document.documentElement.style.setProperty('--text_color', textColor)
    }
    const setClass = (isDark) => {
      const html = document.querySelector('html');
      if (isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
    const setMode = (isDark) => {
      if (isDark) {
        setColor(config.dark)
        setClass(true)
        localStorage.setItem('DOCSIFY_DARK_MODE', 'dark')
        currColor = 'dark'
      } else {
        setColor(config.light)
        setClass(false)
        localStorage.setItem('DOCSIFY_DARK_MODE', 'light')
        currColor = 'light'
      }
    }
    const toggle = (event) => {
      let isDark = (localStorage.getItem('DOCSIFY_DARK_MODE') === 'dark');
      if (!isAppearanceTransition) {
        setMode(isDark = !isDark);
        return
      }

      // add appearance transition
      var x, y;
      x = event.clientX
      y = event.clientY
      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      )

      const transition = document.startViewTransition(() => {
        setMode(isDark = !isDark);
      })
      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ]
        document.documentElement.animate(
          {
            clipPath: isDark ? clipPath : [...clipPath].reverse(),
          },
          {
            duration: 400,
            easing: 'ease-in',
            pseudoElement: isDark ? '::view-transition-new(root)' : '::view-transition-old(root)',
          },
        )
      })
    }
    const isAppearanceTransition = document.startViewTransition &&
      !window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;

    const defaultConfig = {
      dark: {
        background: "#050505",
        toggleBtnBg: "#34495e",
        textColor: "white"
      },
      light: {
        background: "white",
        toggleBtnBg: "var(--theme-color)",
        textColor: "var(--theme-color)"
      }
    };
    const config = { ...defaultConfig, ...vm.config.customDarkMode };

    hook.doneEach(_ => {
      if (localStorage.getItem('DOCSIFY_DARK_MODE')) {
        let currColor = localStorage.getItem('DOCSIFY_DARK_MODE');
        let isDark = (currColor === 'dark');
        setMode(isDark);
      } else {
        setMode(false);
      }

      var checkbox = document.querySelector('input[name=mode]')
      
      if (!checkbox) {
        return
      }

      checkbox.addEventListener('click', toggle)
    });
  }

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), darkModePlugin];
}