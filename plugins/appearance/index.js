{
  const appearancePlugin = (hook, vm) => {
    // 默认状态
    const defaultState = {
      textSize: 'standard', // small, standard, large
      width: 'standard',    // standard, wide
      isCollapsed: false    // 是否收缩
    };

    // 读取本地存储
    let state = { ...defaultState };
    const savedState = localStorage.getItem('docsify-appearance-settings');
    if (savedState) {
      try {
        state = { ...state, ...JSON.parse(savedState) };
      } catch (e) {
        console.warn('Failed to parse appearance settings');
      }
    } else {
      if (window.innerWidth <= 768) {
        state.isCollapsed = true;
      }
    }

    // 核心逻辑：应用状态
    const applyState = () => {
      const root = document.documentElement;

      const isSmallScreen = window.innerWidth <= 1200;
      // 如果是小屏，且当前状态是 wide，强制回退到 standard
      if (isSmallScreen && state.width === 'wide') {
        state.width = 'standard';
      }
      
      // 1. 设置 CSS 变量（作为备用）
      const fontSizeMap = { small: '12px', standard: '16px', large: '20px' };
      const widthMap = { standard: '800px', wide: '90%' };
      root.style.setProperty('--base-font-size', fontSizeMap[state.textSize]);
      root.style.setProperty('--content-max-width', widthMap[state.width]);

      // 2. 动态注入 CSS 规则，强制覆盖 (解决字体不生效的核心)
      let dynamicStyle = document.getElementById('docsify-appearance-dynamic-style');
      if (!dynamicStyle) {
        dynamicStyle = document.createElement('style');
        dynamicStyle.id = 'docsify-appearance-dynamic-style';
        document.head.appendChild(dynamicStyle);
      }
      
      // 针对 Docsify 的内容容器强制设置字体和宽度
      dynamicStyle.innerHTML = `
        .markdown-section {
          font-size: ${fontSizeMap[state.textSize]} !important;
        }
        .content {
          max-width: ${widthMap[state.width]} !important;
          margin: 0 auto !important;
        }
      `;

      // 3. 控制面板与触发图标的显隐 (解决无法再次打开的核心)
      const widget = document.getElementById('docsify-appearance-widget');
      const trigger = document.getElementById('docsify-appearance-trigger');
      
      if (widget && trigger) {
        if (state.isCollapsed) {
          widget.style.display = 'none';
          trigger.style.display = 'flex';
        } else {
          widget.style.display = 'block';
          trigger.style.display = 'none';
        }

        // 更新 Radio 选中状态
        widget.querySelectorAll('input[name="textSize"]').forEach(radio => {
          radio.checked = radio.value === state.textSize;
        });
        widget.querySelectorAll('input[name="width"]').forEach(radio => {
          radio.checked = radio.value === state.width;

          if (radio.value === 'wide' && isSmallScreen) {
            radio.disabled = true;
            radio.parentElement.style.opacity = '0.5'; // 视觉上变灰
            radio.parentElement.style.cursor = 'not-allowed';
          } else {
            radio.disabled = false;
            radio.parentElement.style.opacity = '1';
            radio.parentElement.style.cursor = 'pointer';
          }
        });
      }

      // 保存状态
      localStorage.setItem('docsify-appearance-settings', JSON.stringify(state));
    };

    // 注入基础 CSS 样式
    hook.init(() => {
      const style = document.createElement('style');
      style.textContent = `
        /* 悬浮触发图标 (折叠时显示) */
        #docsify-appearance-trigger {
          position: fixed;
          top: 70px; /* 避开 Docsify 顶部导航栏 */
          right: 20px;
          z-index: 2000; /* 提升层级，防止被遮挡 */
          background: var(--sidebar-toggle-bg);
          border-radius: var(--border-radius);
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          font-size: 20px;
          color: var(--color-text);
          transition-duration: var(--duration-medium);
          transition-property: background, translate;
          display: none; /* 默认隐藏 */
        }
        #docsify-appearance-trigger:hover {
          background: var(--sidebar-toggle-bg-hover);
          transform: scale(1.05);
        }

        /* 主面板 */
        #docsify-appearance-widget {
          position: fixed;
          top: 70px;
          right: 20px;
          z-index: 2000;
          background: var(--sidebar-bg);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          width: 240px;
          padding: 15px;
          font-family: sans-serif;
          font-size: 14px;
          color: var(--color-text);
          transition: opacity 0.3s ease;
          display: block; /* 默认显示 */
        }

        .appearance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .appearance-hide-btn {
          background: var(--sidebar-toggle-bg);
          border: none;
          border-radius: 3px;
          padding: 3px 8px;
          font-size: 12px;
          cursor: pointer;
          color: var(--color-text);
        }
        .appearance-hide-btn:hover {
          background: var(--sidebar-toggle-bg-hover);
          color: #fff;
        }
        .appearance-section {
          color: var(--color-text);
          font-size: 13px;
          margin: 12px 0 6px 0;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 4px;
        }
        .appearance-radio {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          cursor: pointer;
        }
        .appearance-radio input {
          margin-right: 8px;
          accent-color: #3366cc;
          cursor: pointer;
        }

        /* 移动端适配：小屏下变底部面板 */
        @media (max-width: 768px) {
          #docsify-appearance-widget {
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 8px 8px 0 0;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          }
          #docsify-appearance-trigger {
            top: auto;
            bottom: 20px;
            right: 20px;
          }
        }
      `;
      document.head.appendChild(style);
    });

    // 挂载 DOM 节点
    hook.mounted(() => {
      // 1. 先创建面板并挂载
      const widget = document.createElement('div');
      widget.id = 'docsify-appearance-widget';
      widget.innerHTML = `
        <div class="appearance-header">
          <span>Appearance</span>
          <button class="appearance-hide-btn" id="appearance-hide-btn">hide</button>
        </div>
        <div class="appearance-section">Text</div>
        <label class="appearance-radio"><input type="radio" name="textSize" value="small"> Small</label>
        <label class="appearance-radio"><input type="radio" name="textSize" value="standard"> Standard</label>
        <label class="appearance-radio"><input type="radio" name="textSize" value="large"> Large</label>
        <div class="appearance-section">Width</div>
        <label class="appearance-radio"><input type="radio" name="width" value="standard"> Standard</label>
        <label class="appearance-radio"><input type="radio" name="width" value="wide"> Wide</label>
      `;
      document.body.appendChild(widget);

      // 2. 后创建触发图标并挂载
      const trigger = document.createElement('div');
      trigger.id = 'docsify-appearance-trigger';
      trigger.innerHTML = '👓';
      trigger.title = '阅读视图调整';
      document.body.appendChild(trigger);

      // 3. 绑定事件
      document.getElementById('appearance-hide-btn').addEventListener('click', () => {
        state.isCollapsed = true;
        applyState();
      });

      trigger.addEventListener('click', () => {
        state.isCollapsed = false;
        applyState();
      });

      widget.addEventListener('change', (e) => {
        if (e.target.name === 'textSize') {
          state.textSize = e.target.value;
        } else if (e.target.name === 'width') {
          state.width = e.target.value;
        }
        applyState();
      });

      // 初始化应用状态
      applyState();
    });
  };
  
  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), appearancePlugin];
}