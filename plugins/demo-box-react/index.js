{
  const { loadScript, loadStyle } = window.__PLUGIN_UTILS__ || {};

  // 默认配置
  const defaultConfig = {
    react: 'https://cdn.bootcdn.net/ajax/libs/react/16.14.0/umd/react.production.min.js',
    reactDOM: 'https://cdn.bootcdn.net/ajax/libs/react-dom/16.14.0/umd/react-dom.production.min.js',
    babel: 'https://unpkg.com/babel-standalone@6/babel.min.js',
  };

  // ---------- 提取 desc 和 script ----------
  function extractParts(raw) {
    const descMatch = raw.match(/<desc>([\s\S]*?)<\/desc>/);
    const desc = descMatch ? descMatch[1].trim() : '';
    const scriptMatch = raw.match(/<script>([\s\S]*?)<\/script>/);
    const script = scriptMatch ? scriptMatch[1].trim() : '';
    return { desc, script };
  }

  // ---------- 渲染单个 Demo Box ----------
  function renderDemoBox(codeElement, vm) {
    const rawCode = codeElement.textContent;
    const { desc, script } = extractParts(rawCode);

    if (!script) {
      const container = document.createElement('div');
      container.className = 'react-demo-box';
      container.innerHTML = `<div class="error-container">未找到 <code>&lt;script&gt;</code> 标签</div>`;
      codeElement.parentNode.parentNode.replaceChild(container, codeElement.parentNode);
      return;
    }

    const box = document.createElement('div');
    box.className = 'react-demo-box';

    // 预览区 [previewDiv]
    const previewDiv = document.createElement('div');
    previewDiv.className = 'preview';
    const previewId = `preview-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    previewDiv.id = previewId;
    
    // 添加loading动画
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'react-demo-loading';
    loadingDiv.innerHTML = '<div class="react-demo-loading-spinner"></div><span>加载中...</span>';
    previewDiv.appendChild(loadingDiv);
    
    box.appendChild(previewDiv);

    // 描述区（渲染 markdown）[descDiv]
    if (desc) {
      const descDiv = document.createElement('div');
      descDiv.className = 'desc';
      // 提取第一个标题作为border边框线的标题
      const firstH1 = desc.match(/^(#+)\s+(.*)/);
      if (firstH1) {
        // desc去掉第一个标题
        descDiv.innerHTML = window.marked.parse(desc.replace(/^(#+)\s+(.*)/, ''));
        const borderTitle = document.createElement('div');
        borderTitle.className = 'demo-box-title';
        borderTitle.textContent = firstH1[2];
        descDiv.insertBefore(borderTitle, descDiv.firstChild);
      } else {
        descDiv.innerHTML = window.marked.parse(desc);
      }
      box.appendChild(descDiv);
    }

    // 切换按钮 [toggleBtn]
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'source-toggle';
    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'arrow';
    arrowSpan.textContent = '▶';
    toggleBtn.appendChild(arrowSpan);
    const labelSpan = document.createElement('span');
    labelSpan.textContent = ' 查看源码';
    toggleBtn.appendChild(labelSpan);
    box.appendChild(toggleBtn);

    // 源码区 [sourceDiv]
    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'source-code';
    sourceDiv.style.display = 'none';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-jsx';     // 指定语言
    code.textContent = script;
    Prism.highlightElement(code);
    pre.appendChild(code);
    sourceDiv.appendChild(pre);
    box.appendChild(sourceDiv);

    // 替换原代码块
    const preElement = codeElement.parentNode;
    preElement.parentNode.replaceChild(box, preElement);

    // ---------- 编译 & 渲染 React ----------
    async function compileAndRender() {
      // 移除loading动画
      const removeLoading = () => {
        const loadingElement = previewDiv.querySelector('.react-demo-loading');
        if (loadingElement) loadingElement.remove();
      };
      try {
        const config = { ...defaultConfig, ...vm?.config?.reactDemo };
        await loadScript(config.react);
        await loadScript(config.reactDOM);
        await loadScript(config.babel);

        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined' || typeof Babel === 'undefined') {
          previewDiv.innerHTML = `<div class="react-demo-error">依赖加载失败</div>`;
          return;
        }

        let processedScript = script;
        const exportMatch = processedScript.match(/export\s+default\s+class\s+(\w+)/);
        if (exportMatch) {
          const componentName = exportMatch[1];
          processedScript = processedScript.replace(/export\s+default\s+class\s+/, 'class ');
          processedScript += `; ReactDOM.render(React.createElement(${componentName}), document.getElementById('${previewId}'));`;
        } else {
          if (!processedScript.includes('ReactDOM.render')) {
            let match = processedScript.match(/class\s+(\w+)\s+extends\s+React\.Component/);
            if (!match) match = processedScript.match(/function\s+(\w+)\s*\(/);
            if (match) {
              const name = match[1];
              processedScript += `; ReactDOM.render(React.createElement(${name}), document.getElementById('${previewId}'));`;
            }
          }
        }

        const compiled = Babel.transform(processedScript, {
          presets: ['react', 'stage-2']
        }).code;

        const func = new Function('React', 'ReactDOM', compiled);
        func(React, ReactDOM);
        removeLoading();
      } catch (err) {
        removeLoading();
        previewDiv.innerHTML = `<pre class="react-demo-error">${err.message}</pre>`;
        console.error('[react-demo] Render error:', err);
      }
    }

    compileAndRender();

    // ---------- 切换源码显示 ----------
    toggleBtn.addEventListener('click', () => {
      const isHidden = sourceDiv.style.display === 'none';
      sourceDiv.style.display = isHidden ? 'block' : 'none';
      arrowSpan.classList.toggle('open', isHidden);
      labelSpan.textContent = isHidden ? ' 收起源码' : ' 查看源码';
    });
  }


  // ---------- 插件入口 ----------
  function demoBoxReactPlugin(hook, vm) {
    loadStyle('/plugins/demo-box-react/index.css');

    function renderDemos() {
      const codeBlocks = document.querySelectorAll('.markdown-section pre code');
      for (const block of codeBlocks) {
        const parentPre = block.parentNode;
        if (!parentPre) continue;
        if (parentPre.dataset.reactProcessed) continue;
        if (block.textContent.includes('/*react*/')) {
          parentPre.dataset.reactProcessed = 'true';
          renderDemoBox(block, vm);
        }
      }
    }

    hook.doneEach(() => {
      renderDemos();
    });
  }

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), demoBoxReactPlugin];
}