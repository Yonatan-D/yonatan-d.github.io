function plugin(hook, vm) {

  hook.beforeEach(function (markdown) {
    // 处理日期、作者、版权信息、返回上一级、giscus、阅读时间
    // 匹配规则：{docsify-my-updater date:2025-01-08}
    const reg = /{docsify-my-updater date:(\d{4}-\d{2}-\d{2})}/g;
    const match = reg.exec(markdown);
    
    if (match) {
      const date = match[1];
      let publishedDate = `<span title=${date}>${window.$docsify.formatUpdated(date)}</span>`;
      // let author = vm.config.name;
      let lastModifiedDate = `<p id="last-modified" style="margin-top:40px;"></p>`;
      let copyright = `<p style="color:#808080;font-size:14px;">本文作者为 <a style="display:inline;" href="https://yonatan.cn">Yonatan</a>，转载请注明出处</p>`;
      let goBack = `<p>> <a style="color:#808080;" href="../">cd ..</a></p>`;
      // 检测当前主题并设置对应的 giscus 主题
      const isDarkMode = document.documentElement.classList.contains('dark');
      const giscusTheme = isDarkMode ? 'noborder_dark' : 'noborder_light';
      let giscus = `
        <giscus-widget
          id="comments"
          repo="yonatan-d/yonatan-d"
          repo-id="R_kgDOJ0TPCg"
          category="Announcement"
          category-id="DIC_kwDOJ0TPCs4C0vpw"
          mapping="og:title"
          strict="0"
          inputposition="top"
          theme="${giscusTheme}"
          lang="zh-CN"
        ></giscus-widget>
      `;
      let wordsCount = markdown.match(/([\u4e00-\u9fa5]+?|[a-zA-Z0-9]+)/g).length;
      let readTime = `<span title="${wordsCount} words">${Math.ceil(wordsCount / 400)} min</span>`;

      // 移除旧的 meta 标签
      let metaOld = document.querySelector('meta[property="og:title"]');
      if (metaOld) {
        metaOld.remove();
      }
      // 设置标题meta，供 giscus 使用
      let title = markdown.match(/# (.+)/)[1];
      let meta = `<meta property="og:title" content="${title}">`;
      document.head.insertAdjacentHTML('beforeend', meta);

      // 使用 GitHub API 获取文件提交时间
      let isGithubFilePath = /raw.githubusercontent.com/g.test(vm.route.file);
      if (isGithubFilePath) {
        let pathIndex = vm.route.file.split('/').findIndex(i => i === 'blog');
        let filePath = isGithubFilePath ? vm.route.file.split('/').slice(pathIndex).join('/') : vm.route.file;
        let owner = 'yonatan-d';
        let repo = 'yonatan-d';
        let date_url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1&path=${filePath}`;
        fetch(date_url)
          .then((response) => {
            return response.json();
          })
          .then((commits) => {
            let modified = commits[0]['commit']['committer']['date'].slice(0, 10);
            document.getElementById('last-modified').textContent = 'Updated: ' + modified;
          })
      }

      let text = `${goBack} <p style="color:#808080;font-size:14px;">${publishedDate} · ${readTime}</p>`;
      
      // 监听主题变化并更新 giscus
      const setupGiscusThemeWatcher = () => {
        const giscusWidget = document.querySelector('giscus-widget');
        if (!giscusWidget) return;
        
        const updateGiscusTheme = () => {
          const isDarkMode = document.documentElement.classList.contains('dark');
          const giscusTheme = isDarkMode ? 'noborder_dark' : 'noborder_light';
          
          if (giscusWidget) {
            giscusWidget.setAttribute('theme', giscusTheme);
          }
        };
        
        // 监听主题切换
        const observer = new MutationObserver(updateGiscusTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      };
      
      // 使用 MutationObserver 等待 giscus-widget 出现
      const widgetObserver = new MutationObserver((mutations, obs) => {
        if (document.querySelector('giscus-widget')) {
          setupGiscusThemeWatcher();
          obs.disconnect(); // 停止观察，已经找到元素
        }
      });
      
      widgetObserver.observe(document.body, { childList: true, subtree: true });
      
      return markdown.replace(reg, text) + lastModifiedDate + copyright + goBack + giscus;
    }
  })

}

window.$docsify = (window.$docsify || {})
window.$docsify.plugins = (window.$docsify.plugins || []).concat(plugin)
