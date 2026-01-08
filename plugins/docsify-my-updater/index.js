function plugin(hook, vm) {

  hook.beforeEach(function (content) {
    // 匹配规则：{docsify-my-updater date:2025-01-08}
    const reg = /{docsify-my-updater date:(\d{4}-\d{2}-\d{2})}/g;
    const match = reg.exec(content);
    
    if (match) {
      const date = match[1];
      let publishedDate = `<span title=${date}>${window.$docsify.formatUpdated(date)}</span>`;
      let author = vm.config.name
      let lastModifiedDate = `<p style="margin-top:40px;">Updated: {docsify-updated}</p>`;
      let copyright = `<p style="color:#808080;font-size:14px;">本文作者为 <a style="display:inline;" href="https://yonatan.cn">Yonatan</a>，转载请注明出处</p>`
      let goBack = `<p>> <a style="color:#808080;" href="../">cd ..</a></p>`
      let gitcus = `
        <giscus-widget
          id="comments"
          repo="yonatan-d/yonatan-d"
          repo-id="R_kgDOJ0TPCg"
          category="Comment"
          category-id="DIC_kwDOJ0TPCs4CXs2G"
          mapping="pathname"
          strict="0"
          inputposition="top"
          theme="light"
          lang="zh-CN"
        ></giscus-widget>
      `

      // Match regex every time you start parsing .md
      let wordsCount = content.match(/([\u4e00-\u9fa5]+?|[a-zA-Z0-9]+)/g).length
      // let wordsStr = wordsCount + " words"
      let readTime = `<span title="${wordsCount} words">${Math.ceil(wordsCount / 400)} min read</span>`

      // 2026-01-08 屏蔽用 GitHub API 获取最后修改时间
      // 使用 GitHub API 获取文件提交时间
      let isGithubFilePath = /raw.githubusercontent.com/g.test(vm.route.file)
      if (false && isGithubFilePath) {
        let pathIndex = vm.route.file.split('/').findIndex(i => i === 'blog')
        let filePath = isGithubFilePath ? vm.route.file.split('/').slice(pathIndex).join('/') : vm.route.file
        let owner = 'yonatan-d'
        let repo = 'yonatan-d'
        let date_url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1&path=${filePath}`
        fetch(date_url)
          .then((response) => {
            return response.json()
          })
          .then((commits) => {
            let date = commits[0]['commit']['committer']['date'];
            let commitDate = window.$docsify.formatUpdated(date);
            let text = `${author} · ${commitDate} · ${readTime}`
            document.getElementById('last-modified').textContent = text
          })
      } else {
        // let text = `<p style="color:#808080;font-size:14px;">${author} · ${publishedDate} · ${wordsStr} · ${readTime}</p>`
        let text = `<p style="color:#808080;font-size:14px;">${author} · ${publishedDate} · ${readTime}</p>`
        return content.replace(reg, text) + lastModifiedDate + copyright + goBack + gitcus
      }

      // return content.replace(/{docsify-my-updater}/g, '<p id="last-modified" style="color:#808080;font-size:14px;"></p>') + copyright + goBack + gitcus
    }
  })

}

window.$docsify = (window.$docsify || {})
window.$docsify.plugins = (window.$docsify.plugins || []).concat(plugin)
