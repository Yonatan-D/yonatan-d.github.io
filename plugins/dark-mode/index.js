{
  const { loadStyle } = window.__PLUGIN_UTILS__ || {};

  /**
   * 浅深主题切换插件
   * @param {Object} config - 配置项 { light: ['css_url1'], dark: ['css_url2'] }
   */
  function darkModePlugin(hook, vm) {
    loadStyle('/plugins/dark-mode/index.css');
    
    const STORAGE_KEY = 'DOCSIFY_DARK_MODE';

    hook.init(() => {
      const config = vm.config.darkMode || { light: [], dark: [] };
      const currentMode = localStorage.getItem(STORAGE_KEY) || 'light';

      const styles = config[currentMode] || [];
      styles.forEach((href, index) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.themeMode = currentMode;
        link.dataset.themeIndex = index;
        document.head.appendChild(link);
      });
    });

    hook.doneEach(() => {
      const checkbox = document.getElementById('dark-mode');
      if (!checkbox) return;

      const currentMode = localStorage.getItem(STORAGE_KEY) || 'light';
      checkbox.checked = currentMode === 'dark';

      checkbox.addEventListener('change', function (e) {
        const newMode = e.target.checked ? 'dark' : 'light';
        localStorage.setItem(STORAGE_KEY, newMode);
        applyTheme(newMode);
      });
    });
  }

  /**
   * 执行主题样式的启用与禁用
   * @param {string} mode - 'light' 或 'dark'
   */
  function applyTheme(mode) {
    const config = window.$docsify.darkMode || { light: [], dark: [] };
    const targetStyles = config[mode] || [];
    const oppositeMode = mode === 'light' ? 'dark' : 'light';

    document.querySelectorAll(`link[data-theme-mode="${oppositeMode}"]`).forEach((link) => {
      link.disabled = true;
    });

    targetStyles.forEach((href, index) => {
      let link = document.querySelector(
        `link[data-theme-mode="${mode}"][data-theme-index="${index}"]`
      );

      if (link) {
        link.disabled = false;
      } else {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.themeMode = mode;
        link.dataset.themeIndex = index;
        document.head.appendChild(link);
      }
    });
  }

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), darkModePlugin];
}