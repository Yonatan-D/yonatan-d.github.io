function appendScript() {
  const script = document.createElement('script');
  script.async = true;
  script.src = '//cdn.jsdelivr.net/npm/markmap-autoloader@0.14.4';
  document.body.appendChild(script);
}

function replaceContent(content) {
  const regex = /<code class="lang-markmap">([\s\S]*?)<\/code>/;
  return content.replace(regex, (matched, optionsStr, code) => {
    return `
      <div class="markmap">
        <script type="text/template">
          ${optionsStr}
        </script>
      </div>
    `
  });
}

const myMarkMapPlugin = (hook, vm) => {

  hook.init(_ => {
    appendScript();
  });

  hook.afterEach((html, next) => {

    window.markmapHTML = html;
    next(replaceContent(html));

  });

  hook.doneEach(_ => {

    if (!window.markmap?.autoLoader?.manual) {
      if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', () => {
          window.markmap?.autoLoader?.renderAll();
        });
      else window.markmap?.autoLoader?.renderAll();
    }
    
  })
}

window.$docsify.plugins = [].concat(myMarkMapPlugin, window.$docsify.plugins)