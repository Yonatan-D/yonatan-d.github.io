function plugin(hook, vm) {

  hook.beforeEach(function (content) {

    let author = vm.config.name

    // Match regex every time you start parsing .md
    let wordsCount = content.match(/([\u4e00-\u9fa5]+?|[a-zA-Z0-9]+)/g).length
    // let wordsStr = wordsCount + " words"
    let readTime = Math.ceil(wordsCount / 400) + " min read"

    // let text2 = `<p style="color:#808080;font-size:14px;">${author} · {docsify-updated} · ${wordsStr} · ${readTime}</p>`
    let text2 = `<p style="color:#808080;font-size:14px;">${author} · {docsify-updated} · ${readTime}</p>`

    let copyright = `\n<p style="color:#808080;font-size:14px;margin-top:40px;">本文作者为 <a href="https://yonatan.cn">Yonatan</a>，转载请注明出处：${window.location.href}</p>`
    let isMatched = /{docsify-my-updater}/g.test(content);

    return content.replace(/{docsify-my-updater}/g, text2) + (isMatched ? copyright : "")
  })

}

window.$docsify = (window.$docsify || {})
window.$docsify.plugins = (window.$docsify.plugins || []).concat(plugin)
