function plugin(hook, vm) {

  hook.beforeEach(async function (content) {

    let author = vm.config.name

    // Match regex every time you start parsing .md
    let wordsCount = content.match(/([\u4e00-\u9fa5]+?|[a-zA-Z0-9]+)/g).length
    // let wordsStr = wordsCount + " words"
    let readTime = Math.ceil(wordsCount / 400) + " min read"

    // 使用 GitHub API 获取文件提交时间
    let commitDate = '-'
    try {
      let isGithubBasePath = /raw.githubusercontent.com/g.test(vm.config.basePath)
      // +4 是跳过了匹配项, owner, repo, branch(sha)
      let pathIndex = vm.config.basePath.split('/').findIndex(a => a == 'raw.githubusercontent.com') + 4
      let filePath = isGithubBasePath ? vm.route.file.split('/').slice(pathIndex).join('/') : vm.route.file
      let owner = vm.config.basePath[pathIndex + 1]
      let repo = vm.config.basePath[pathIndex + 2]
      let date_url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1&path=${filePath}`
      let response = await fetch(date_url)
      let commits = await response.json()
      let date = commits[0]['commit']['committer']['date'];
      commitDate = window.$docsify.formatUpdated(date);
    } catch (error) {
      console.log(error);
    }

    // let text2 = `<p style="color:#808080;font-size:14px;">${author} · {docsify-updated} · ${wordsStr} · ${readTime}</p>`
    let text2 = `<p style="color:#808080;font-size:14px;">${author} · ${commitDate} · ${readTime}</p>`

    let copyright = `\n<p style="color:#808080;font-size:14px;margin-top:40px;">本文作者为 <a href="https://yonatan.cn">Yonatan</a>，转载请注明出处：${window.location.href}</p>`
    let isMatched = /{docsify-my-updater}/g.test(content);

    return content.replace(/{docsify-my-updater}/g, text2) + (isMatched ? copyright : "")
  })

}

window.$docsify = (window.$docsify || {})
window.$docsify.plugins = (window.$docsify.plugins || []).concat(plugin)
