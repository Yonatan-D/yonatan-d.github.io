{
  const { loadStyle } = window.__PLUGIN_UTILS__ || {};

  const STORAGE_KEY = 'DOCSIFY_DARK_MODE';
  const TRANSITION_DURATION = 520;
  const DEFAULT_CONFIG = { light: [], dark: [] };

  /** 最近一次指针位置，作为圆形扩散的圆心 */
  let lastPointer = null;

  /** 已预热过的样式地址，避免重复插入 */
  const preloaded = new Set();

  /** 指针监听只绑定一次 */
  let pointerTracked = false;

  /**
   * 读取主题配置
   */
  function getConfig(vm) {
    return (
      (vm && vm.config && vm.config.darkMode) ||
      (window.$docsify && window.$docsify.darkMode) ||
      DEFAULT_CONFIG
    );
  }

  /**
   * 读取当前模式
   * @returns {'light' | 'dark'}
   */
  function readMode() {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  }

  /**
   * 只注入一次：接管 view transition 快照的层叠关系与默认动画
   */
  function injectViewTransitionStyle() {
    if (document.getElementById('dark-mode-view-transition-style')) return;

    const style = document.createElement('style');
    style.id = 'dark-mode-view-transition-style';
    style.textContent = `
      /* 关掉默认的交叉淡入淡出，交给 clip-path 控制 */
      ::view-transition-old(root),
      ::view-transition-new(root) {
        animation: none;
        mix-blend-mode: normal;
      }

      /* 切到暗色：新快照（暗色）在上层，从光标处收缩 */
      html.vt-to-dark::view-transition-old(root) { z-index: 2; }
      html.vt-to-dark::view-transition-new(root) { z-index: 1; }

      /* 切到亮色：旧快照（暗色）在上层，向光标处扩散 */
      html.vt-to-light::view-transition-new(root) { z-index: 2; }
      html.vt-to-light::view-transition-old(root) { z-index: 1; }
    `;
    document.head.appendChild(style);
  }

  /**
   * 执行主题样式的启用与禁用
   * @param {string} mode - 'light' 或 'dark'
   */
  function applyTheme(mode) {
    const config = getConfig();
    const targetStyles = config[mode] || [];
    const oppositeMode = mode === 'light' ? 'dark' : 'light';
    document.body.classList.add(mode);
    document.body.classList.remove(oppositeMode);

    document
      .querySelectorAll(`link[data-theme-mode="${oppositeMode}"]`)
      .forEach((link) => {
        link.disabled = true;
      });

    targetStyles.forEach((href, index) => {
      let link = document.querySelector(
        `link[data-theme-mode="${mode}"][data-theme-index="${index}"]`
      );

      if (link) {
        link.disabled = false;
        return;
      }

      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset.themeMode = mode;
      link.dataset.themeIndex = index;
      document.head.appendChild(link);
    });
  }

  /**
   * 带圆形扩散过渡的主题切换
   * @param {string} mode - 'light' 或 'dark'
   */
  function switchTheme(mode) {
    const isDark = mode === 'dark';

    // 移动端 / 触屏设备直接切换，不做 View Transition 动画
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (isTouch) {
      applyTheme(mode);
      return;
    }

    const canTransition =
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 不支持 View Transition（Safari / Firefox 旧版本）或用户关闭动效时直接切换
    if (!canTransition) {
      applyTheme(mode);
      return;
    }

    const { x, y } = lastPointer || {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const transition = document.startViewTransition(() => {
      applyTheme(mode);
    });

    transition.ready
      .then(() => {
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];

        const root = document.documentElement;

        // 切暗色时让新快照盖在上面；切亮色时让旧快照（暗色）盖在上面
        root.classList.add(isDark ? 'vt-to-dark' : 'vt-to-light');

        const animation = root.animate(
          {
            clipPath: isDark ? [...clipPath].reverse() : clipPath,
          },
          {
            duration: TRANSITION_DURATION,
            easing: 'cubic-bezier(0.33, 0, 0.2, 1)',
            pseudoElement: isDark
              ? '::view-transition-old(root)'
              : '::view-transition-new(root)',
          }
        );

        animation.finished
          .catch(() => {})
          .then(() => {
            root.classList.remove('vt-to-dark', 'vt-to-light');
          });
      })
      .catch(() => {
        // 过渡被跳过（例如用户快速连点）时忽略
      });
  }

  /**
   * 浅深主题切换插件
   * @param {Object} hook
   * @param {Object} vm
   */
  function darkModePlugin(hook, vm) {
    loadStyle('/plugins/dark-mode/index.css');

    hook.init(() => {
      injectViewTransitionStyle();

      // 记录指针位置，作为扩散动画的圆心（键盘操作时回退到视口中心）
      if (!pointerTracked) {
        pointerTracked = true;
        document.addEventListener(
          'pointerdown',
          (e) => {
            if (e.clientX || e.clientY) {
              lastPointer = { x: e.clientX, y: e.clientY };
            }
          },
          true
        );
      }

      const config = getConfig(vm);
      const currentMode = readMode();

      // 首屏应用当前主题
      applyTheme(currentMode);

      // 预热另一套主题的样式表，避免切换瞬间出现无样式闪烁
      const oppositeMode = currentMode === 'light' ? 'dark' : 'light';
      (config[oppositeMode] || []).forEach((href) => {
        if (preloaded.has(href)) return;
        preloaded.add(href);

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        document.head.appendChild(link);
      });
    });

    hook.doneEach(() => {
      const checkbox = document.getElementById('dark-mode');
      if (!checkbox) return;

      checkbox.checked = readMode() === 'dark';

      // 避免 doneEach 多次执行导致重复绑定
      if (checkbox.dataset.darkModeBound === '1') return;
      checkbox.dataset.darkModeBound = '1';

      checkbox.addEventListener('change', function (e) {
        const newMode = e.target.checked ? 'dark' : 'light';
        localStorage.setItem(STORAGE_KEY, newMode);
        switchTheme(newMode);
      });
    });
  }

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), darkModePlugin];
}