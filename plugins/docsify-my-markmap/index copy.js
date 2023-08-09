function appendScript() {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://cdn.jsdelivr.net/npm/markmap-autoloader@0.14.4';
  document.body.appendChild(script);
}

function replaceContent(content) {
  const regex = /<code class="lang-markmap">([\s\S]*?)<\/code>/;
  return content.replace(regex, (matched, optionsStr, code) => {
    window.isRenderNote = true;
    // window.isShowNote = false;
    return `
      <div class="markmap">
        <script type="text/template">
          ${optionsStr}
        </script>
      </div>
    `
  });
}

// function matchContent(content) {
//   const regex = /<code class="lang-markmap">([\s\S]*?)<\/code>/;
//   return regex.exec(content)[1]
// }

const myMarkMapPlugin = (hook, vm) => {

  hook.init(_ => {
    window.isRenderNote = false;
    appendScript();
  });

  hook.afterEach((html, next) => {

    window.markmapHTML = html;
    next(replaceContent(html));
    window.isShowNote = true;

    // 添加一个重置按钮
    // const reloadBtnHtml = `
    //   <button id="markmap_reload_btn">reload</button>
    // `;
    // const reloadBtnEl = Docsify.dom.create('div', reloadBtnHtml);
    // reloadBtnEl.addEventListener('click', _ => {
    //   markmap.autoLoader.renderAll();
    // })
    // const markmapEl = Docsify.dom.find('pre[data-lang=markmap]');
    // Docsify.dom.before(markmapEl, reloadBtnEl);

  });

  hook.doneEach(_ => {
    if (window.isRenderNote
        // && !window.isShowNote
        && Docsify.dom.find('pre[data-lang=markmap]'
    )) {
      window.markmap.autoLoader.renderAll();
    }
  })
}

window.$docsify.plugins = [].concat(myMarkMapPlugin, window.$docsify.plugins)