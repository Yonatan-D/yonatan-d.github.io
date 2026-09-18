{
  function renderGiscus(config) {
    import('https://esm.sh/giscus');

    let themeObserver = null;
    let widgetObserver = null;

    const isDarkMode = document.documentElement.classList.contains('dark');
    const giscusTheme = isDarkMode ? 'noborder_dark' : 'noborder_light';

    const giscusHtml = `
      <giscus-widget
        id="comments"
        repo="${config.owner}/${config.repo}"
        repo-id="${config.repoId}"
        category="${config.category}"
        category-id="${config.categoryId}"
        mapping="${config.mapping}"
        strict="${config.strict}"
        inputposition="top"
        theme="${giscusTheme}"
        lang="${config.lang}"
      ></giscus-widget>
    `;

    const setupGiscusThemeWatcher = () => {
      const giscusWidget = document.querySelector('giscus-widget');
      if (!giscusWidget) return;
      
      const updateGiscusTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        giscusWidget.setAttribute('theme', isDark ? 'noborder_dark' : 'noborder_light');
      };

      if (themeObserver) themeObserver.disconnect();

      themeObserver = new MutationObserver(updateGiscusTheme);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    };

    if (widgetObserver) widgetObserver.disconnect();
    
    widgetObserver = new MutationObserver((mutations, obs) => {
      if (document.querySelector('giscus-widget')) {
        setupGiscusThemeWatcher();
        obs.disconnect();
      }
    });
    
    widgetObserver.observe(document.body, { childList: true, subtree: true });

    return giscusHtml;
  }

  function updaterPlugin(hook, vm) {
    const config = window.$docsify.customUpdater || {};

    hook.beforeEach(function (markdown) {
      // 处理日期、作者、版权信息、返回上一级、giscus、阅读时间
      // 匹配规则：{docsify-my-updater date:2025-01-08}
      const reg = /{docsify-my-updater date:(\d{4}-\d{2}-\d{2})}/;
      const match = reg.exec(markdown);

      const formatUpdated = (time) => {
        return new Date(time).toLocaleDateString("en-US", {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      };
      
      if (match) {
        const date = match[1];
        const publishedDate = `<span title=${date}>${formatUpdated(date)}</span>`;
        const lastModifiedDate = `<p id="last-modified" style="margin-top:40px;"></p>`;
        const copyright = `<p style="color:#808080;font-size:14px;">本文作者为 <a style="display:inline;" href="${window.location.origin}">${window.$docsify.name}</a>，转载请注明出处</p>`;
        const goBack = `<p>> <a style="color:#808080;" href="../">cd ..</a></p>`;

        const wordsMatch = markdown.match(/([\u4e00-\u9fa5]+?|[a-zA-Z0-9]+)/g);
        const wordsCount = wordsMatch ? wordsMatch.length : 0;
        const readTime = `<span title="${wordsCount} words">${Math.ceil(wordsCount / 400)} min</span>`;

        const titleMatch = markdown.match(/# (.+)/);
        const title = titleMatch ? titleMatch[1] : document.title;
        
        let metaTag = document.querySelector('meta[property="og:title"]');
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', 'og:title');
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', title);

        // 使用 GitHub API 获取文件提交时间
        let isGithubFilePath = /raw.githubusercontent.com/g.test(vm.route.file);
        if (isGithubFilePath) {
          let pathIndex = vm.route.file.split('/').findIndex(i => i === 'blog');
          let filePath = vm.route.file.split('/').slice(pathIndex).join('/');
          let owner = config.owner;
          let repo = config.repo;
          let date_url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1&path=${filePath}`;
          
          fetch(date_url)
            .then((response) => response.json())
            .then((commits) => {
              if (commits && commits.length > 0 && commits[0].commit && commits[0].commit.committer) {
                const modified = commits[0].commit.committer.date.slice(0, 10);
                const el = document.getElementById('last-modified');
                if (el) el.textContent = 'Updated: ' + modified;
              }
            })
            .catch(err => {
              console.warn('Failed to fetch commit date:', err);
            });
        }

        const text = `${goBack} <p style="color:#808080;font-size:14px;">${publishedDate} · ${readTime}</p>`;
        
        const giscus = renderGiscus(config);
        
        return markdown.replace(reg, text) + lastModifiedDate + copyright + goBack + giscus;
      }
    });
  }

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), updaterPlugin];
}
