{  
  const { loadScript, loadStyle  } = window.__PLUGIN_UTILS__ || {};

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

      window.markmap?.autoLoader?.render(markmapContainer);
    }
  }

  const markMapPlugin = (hook, vm) => {
    loadScript('//cdn.jsdelivr.net/npm/markmap-autoloader@0.14.4');
    loadStyle('/plugins/markmap/index.css');

    hook.doneEach(() => {
      renderMarkmap();
    });
  }

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), markMapPlugin];
}