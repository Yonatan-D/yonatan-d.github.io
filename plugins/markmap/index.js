function appendScript() {
  const script = document.createElement('script');
  script.async = true;
  script.src = '//cdn.jsdelivr.net/npm/markmap-autoloader@0.14.4';
  document.body.appendChild(script);
}

function appendStyle() {
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/plugins/docsify-my-markmap/index.css';
  document.head.appendChild(style);
}

function renderMarkmap() {
  const codeBlocks = document.querySelectorAll('code.lang-markmap');
  for (const block of codeBlocks) {
    const parentPre = block.parentNode;
    if (!parentPre) continue;
    const markmapContainer = document.createElement('div');
    markmapContainer.className = 'markmap';
    const scriptTag = document.createElement('script');
    scriptTag.type = 'text/template';
    scriptTag.textContent = block.textContent.trim();
    // debugger
    markmapContainer.appendChild(scriptTag);
    parentPre.parentNode.replaceChild(markmapContainer, parentPre);
  }
}

const myMarkMapPlugin = (hook, vm) => {
  appendStyle();
  appendScript();

  hook.doneEach(() => {
    renderMarkmap();
  });
}

window.$docsify.plugins = [].concat(myMarkMapPlugin, window.$docsify.plugins)