{  
  const { loadStyle } = window.__PLUGIN_UTILS__ || {};

  function customFooterPlugin(hook, vm) {
    loadStyle('/plugins/footer/index.css');

    const defaultConfig = {
      beian: {
        ICP: "",
      },
      createdAt: new Date().getFullYear(),
      author: ''
    };
    const config = { ...defaultConfig, ...vm.config.customFooter };

    hook.afterEach((html) => {
      const { beian, createdAt, author } = config;

      return html + `
        <footer>
          <p>
            <span><a href="https://beian.miit.gov.cn" target="_blank">${beian.ICP}</a> © ${createdAt}-PRESENT • ${author}</span>
            <span>Powered by docsify@${Docsify.version}</span>
          </p>
        </footer>
      `;
    });
  }

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), customFooterPlugin];
}