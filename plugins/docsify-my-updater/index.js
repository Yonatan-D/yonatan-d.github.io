function plugin(hook, vm) {

  hook.beforeEach(function (content) {
    
    let isMatched = /{docsify-my-updater}/g.test(content);
    if (isMatched) {
      let author = vm.config.name
      let copyright = `\n<p style="color:#808080;font-size:14px;margin-top:40px;">本文作者为 <a href="https://yonatan.cn">Yonatan</a>，转载请注明出处：${window.location.href}</p>`

      // Match regex every time you start parsing .md
      let wordsCount = content.match(/([\u4e00-\u9fa5]+?|[a-zA-Z0-9]+)/g).length
      // let wordsStr = wordsCount + " words"
      let readTime = Math.ceil(wordsCount / 400) + " min read"

      // 使用 GitHub API 获取文件提交时间
      let isGithubFilePath = /raw.githubusercontent.com/g.test(vm.route.file)
      if (isGithubFilePath) {
        // +4 是跳过了匹配项, owner, repo, branch(sha)
        let pathIndex = vm.route.file.split('/').findIndex(a => a == 'raw.githubusercontent.com') + 4
        let filePath = isGithubFilePath ? vm.route.file.split('/').slice(pathIndex).join('/') : vm.route.file
        let owner = vm.route.file.split('/')[pathIndex - 3]
        let repo = vm.route.file.split('/')[pathIndex - 2]
        let date_url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1&path=${filePath}`
        fetch(date_url)
          .then((response) => {
            return response.json()
          })
          .then((commits) => {
            let date = commits[0]['commit']['committer']['date'];
            let commitDate = window.$docsify.formatUpdated(date);
            let text = `<p style="color:#808080;font-size:14px;">${author} · ${commitDate} · ${readTime}</p>`
            document.getElementById('last-modified').textContent = text
          })
      } else {
        // let text = `<p style="color:#808080;font-size:14px;">${author} · {docsify-updated} · ${wordsStr} · ${readTime}</p>`
        let text = `<p style="color:#808080;font-size:14px;">${author} · {docsify-updated} · ${readTime}</p>`
        document.getElementById('last-modified').textContent = text
      }

      return content.replace(/{docsify-my-updater}/g, '<span id="last-modified"></span>') + copyright
    }
  })

}

window.$docsify = (window.$docsify || {})
window.$docsify.plugins = (window.$docsify.plugins || []).concat(plugin)
