/**
 * Forked From https://github.com/Plugin-contrib/docsify-plugin/tree/master/packages/docsify-dark-mode
 * Date 2023/5/9
 * 
 * Need to be used with my plugin: docsify-my-navbar
 * 
 * ChangeLog:
 * 1. Modify button style and position;
 * 2. Modify dark theme styles;
 * 3. Add transition animation;
 */
 const myDarkModePlugin = (hook, vm) => {
  var setColor = ({ background, toggleBtnBg, textColor }) => {
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
    const html = Docsify.dom.find('html');
    if (isDark) {
      Docsify.dom.toggleClass(html, 'add', 'dark');
    } else {
      Docsify.dom.toggleClass(html, 'remove', 'dark');
    }
  }
  const setMode = (isDark) => {
    if (isDark) {
      setColor(theme.dark)
      setClass(true)
      localStorage.setItem('DOCSIFY_DARK_MODE', 'dark')
      currColor = 'dark'
    } else {
      setColor(theme.light)
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
    !window.matchMedia(`(prefers-reduced-motion: reduce)`).matches

  var theme = { dark: {}, light: {} }
  var defaultConfig = {
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
  }

  theme = { ...defaultConfig, ...vm.config.customDarkMode }

  hook.afterEach((html, next) => {
    if (!Docsify.dom.find('#dark_mode')) {
      var darkEl = ` <div id="dark_mode">
              <input class="container_toggle" type="checkbox" id="switch" name="mode" />
              <label for="switch">Toggle Color Scheme</label>
            </div>`
  
      const el = Docsify.dom.create('li', darkEl);
      
      const nav = Docsify.dom.find('nav ul');
      Docsify.dom.appendTo(nav, el);
    }
    next(html);
  });

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

  hook
}

window.$docsify.plugins = [].concat(myDarkModePlugin, window.$docsify.plugins)