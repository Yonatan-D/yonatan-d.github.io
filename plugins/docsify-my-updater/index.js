function plugin(hook, vm) {

  hook.beforeEach(function (content) {
    
    let isMatched = /{docsify-my-updater}/g.test(content);
    if (isMatched) {
      let author = vm.config.name
      let copyright = `\n<p style="color:#808080;font-size:14px;margin-top:40px;">本文作者为 <a style="display:inline;" href="https://yonatan.cn">Yonatan</a>，转载请注明出处</p>`
      let goBack = `> <a style="display:inline;color:#808080;" href="../">cd ..</a>`
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
      let readTime = Math.ceil(wordsCount / 400) + " min read"

      // 使用 GitHub API 获取文件提交时间
      let isGithubFilePath = /raw.githubusercontent.com/g.test(vm.route.file)
      if (isGithubFilePath) {
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
        // let text = `<p style="color:#808080;font-size:14px;">${author} · {docsify-updated} · ${wordsStr} · ${readTime}</p>`
        let text = `<p style="color:#808080;font-size:14px;">${author} · {docsify-updated} · ${readTime}</p>`
        return content.replace(/{docsify-my-updater}/g, text) + copyright + goBack + gitcus
      }

      return content.replace(/{docsify-my-updater}/g, '<p id="last-modified" style="color:#808080;font-size:14px;"></p>') + copyright + goBack + gitcus
    }
  })

}

window.$docsify = (window.$docsify || {})
window.$docsify.plugins = (window.$docsify.plugins || []).concat(plugin)
