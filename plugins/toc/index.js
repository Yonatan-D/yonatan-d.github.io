{
  // ---------- 默认配置 ----------
  const DEFAULT_OPTIONS = {
    target: 'h2, h3, h4',
    maxDepth: 3,
    title: '大纲',
    collapseWidth: 1200,
    scrollOffset: 60,
    storageKey: 'docsify-toc-collapsed',
  };

  const STYLE_ID = 'docsify-toc-styles';

  // ---------- 工具函数 ----------
  const escapeHtml = (text) => {
    const el = document.createElement('div');
    el.textContent = text;
    return el.innerHTML;
  };

  const throttle = (fn, wait = 100) => {
    let last = 0;
    let timer = null;
    return (...args) => {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        last = now;
        fn(...args);
      } else if (timer === null) {
        timer = window.setTimeout(() => {
          last = Date.now();
          timer = null;
          fn(...args);
        }, remaining);
      }
    };
  };

  const slugify = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const ensureHeadingId = (heading, index) => {
    if (heading.id) return heading.id;
    const base = slugify(heading.textContent) || `heading-${index}`;
    let id = base;
    let n = 1;
    while (document.getElementById(id)) {
      id = `${base}-${n++}`;
    }
    heading.id = id;
    return id;
  };

  // ---------- 目录树构建 ----------
  const buildTree = (headings) => {
    const root = { level: 0, children: [] };
    const stack = [root];

    headings.forEach((heading, i) => {
      const level = Number.parseInt(heading.tagName.slice(1), 10);
      const node = {
        level,
        id: heading.id ?? ensureHeadingId(heading, i),
        text: heading.textContent.trim(),
        children: [],
      };

      while (stack.length > 1 && stack.at(-1).level >= level) {
        stack.pop();
      }
      stack.at(-1).children.push(node);
      stack.push(node);
    });

    return root.children;
  };

  // ---------- 目录树渲染 ----------
  const renderTree = (nodes, depth, maxDepth) => {
    if (!nodes.length) return '';

    const items = nodes
      .map((node) => {
        const link = `<a href="#${node.id}" class="docsify-toc-link">${escapeHtml(node.text)}</a>`;
        const sub =
          depth < maxDepth && node.children.length
            ? renderTree(node.children, depth + 1, maxDepth)
            : '';
        return `<li class="docsify-toc-item" data-target-id="${node.id}">${link}${sub}</li>`;
      })
      .join('');

    return `<ul class="docsify-toc-list">${items}</ul>`;
  };

  // ---------- 样式 ----------
  const TOC_STYLES = `
    .docsify-toc-container {
      position: fixed;
      left: 16px;
      top: 80px;
      width: 260px;
      max-height: calc(100vh - 120px);
      background: var(--sidebar-bg, #fff);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      z-index: 50;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.25s ease, left 0.25s ease, opacity 0.25s ease;
      font-size: 13px;
    }

    .docsify-toc-container.collapsed {
      width: 36px;
      left: -8px;
      opacity: 0.75;
    }
    .docsify-toc-container.collapsed .docsify-toc-title,
    .docsify-toc-container.collapsed .docsify-toc-content {
      display: none;
    }
    .docsify-toc-container.collapsed .docsify-toc-header {
      justify-content: center;
      padding: 8px 4px;
    }

    .docsify-toc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      flex-shrink: 0;
    }
    .docsify-toc-title {
      font-weight: 600;
      color: var(--text-color, #2c3e50);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .docsify-toc-toggle {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: #888;
      padding: 2px 6px;
      border-radius: 4px;
      line-height: 1;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .docsify-toc-toggle:hover {
      background: rgba(0, 0, 0, 0.06);
      color: #333;
    }

    .docsify-toc-content {
      overflow-y: auto;
      padding: 8px 0;
      flex: 1;
      scrollbar-width: thin;
    }

    .docsify-toc-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .docsify-toc-list .docsify-toc-list {
      padding-left: 16px;
    }

    .docsify-toc-item {
      line-height: 1.5;
    }
    .docsify-toc-link {
      display: block;
      padding: 5px 14px 5px 18px;
      color: var(--text-color, #555);
      text-decoration: none;
      border-left: 3px solid transparent;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .docsify-toc-link:hover {
      color: var(--theme-color, #42b983);
      background: rgba(66, 185, 131, 0.05);
    }

    .docsify-toc-item.active > .docsify-toc-link {
      color: var(--theme-color, #42b983);
      border-left-color: var(--theme-color, #42b983);
      font-weight: 600;
      background: rgba(66, 185, 131, 0.08);
    }

    @media (max-width: 900px) {
      .docsify-toc-container:not(.collapsed) {
        width: 220px;
      }
    }

    body.dark .docsify-toc-container,
    [data-theme="dark"] .docsify-toc-container {
      background: #1e1e2e;
      border-color: rgba(255, 255, 255, 0.08);
    }
    body.dark .docsify-toc-header,
    [data-theme="dark"] .docsify-toc-header {
      border-color: rgba(255, 255, 255, 0.06);
    }
    body.dark .docsify-toc-link,
    [data-theme="dark"] .docsify-toc-link {
      color: #b0b0c0;
    }
    body.dark .docsify-toc-toggle:hover,
    [data-theme="dark"] .docsify-toc-toggle:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  `;

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = TOC_STYLES;
    document.head.appendChild(style);
  };

  // ---------- 控制器 ----------
  class TocController {
    #options;
    #observer = null;
    #headings = [];
    #tocItems = [];
    #activeIndex = -1;
    #collapsed = false;
    #manualOverride = false;
    #scrollHandler = null;
    #resizeHandler = null;

    constructor(options) {
      this.#options = options;
    }

    // ---- 点击跳转（箭头函数字段，自动绑定 this）----
    #handleClick = (event) => {
      const link = event.target.closest('.docsify-toc-link');
      if (!link) return;

      event.preventDefault();
      const id = link.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        this.#options.scrollOffset;

      window.scrollTo({ top, behavior: 'smooth' });
      history.pushState?.(null, '', `#${id}`);
    };

    // ---- 构建面板骨架 ----
    buildPanel() {
      document.querySelector('.docsify-toc-container')?.remove();

      const container = document.createElement('aside');
      container.className = 'docsify-toc-container';
      container.innerHTML = `
        <div class="docsify-toc-header">
          <span class="docsify-toc-title">${escapeHtml(this.#options.title)}</span>
          <button class="docsify-toc-toggle" type="button" aria-label="折叠大纲">‹</button>
        </div>
        <nav class="docsify-toc-content"></nav>
      `;
      container.addEventListener('click', this.#handleClick);

      const anchor = document.querySelector('.content');
      if (anchor?.parentNode) {
        anchor.parentNode.insertBefore(container, anchor);
      } else {
        document.body.appendChild(container);
      }
    }

    // ---- 扫描标题并渲染目录 ----
    generate() {
      const container = document.querySelector('.docsify-toc-container');
      const content = container?.querySelector('.docsify-toc-content');
      const section = document.querySelector('.markdown-section');
      if (!container || !content || !section) return;

      const headings = [...section.querySelectorAll(this.#options.target)];

      if (headings.length < 2) {
        container.style.display = 'none';
        return;
      }
      container.style.display = '';

      headings.forEach(ensureHeadingId);
      this.#headings = headings;

      const tree = buildTree(headings);
      content.innerHTML = renderTree(tree, 0, this.#options.maxDepth);
      this.#tocItems = [...container.querySelectorAll('.docsify-toc-item')];

      this.#initScrollHighlight();
    }

    // ---- 滚动高亮：IntersectionObserver + scroll 兜底 ----
    #initScrollHighlight() {
      this.#observer?.disconnect();
      if (!this.#headings.length) return;

      const { scrollOffset } = this.#options;

      this.#observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .map((e) => e.target);
          if (!visible.length) return;

          const current = visible.reduce((a, b) =>
            a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b,
          );

          const idx = this.#headings.findIndex((h) => h.id === current.id);
          if (idx !== -1 && idx !== this.#activeIndex) {
            this.#activeIndex = idx;
            this.#updateHighlight(idx);
          }
        },
        {
          rootMargin: `-${scrollOffset}px 0px -60% 0px`,
          threshold: [0, 1],
        },
      );

      this.#headings.forEach((h) => this.#observer.observe(h));

      if (this.#scrollHandler) {
        window.removeEventListener('scroll', this.#scrollHandler);
      }
      this.#scrollHandler = throttle(() => {
        if (!this.#headings.length) return;
        const threshold = window.scrollY + scrollOffset + 10;
        let idx = 0;
        for (let i = this.#headings.length - 1; i >= 0; i -= 1) {
          if (this.#headings[i].offsetTop <= threshold) {
            idx = i;
            break;
          }
        }
        if (idx !== this.#activeIndex) {
          this.#activeIndex = idx;
          this.#updateHighlight(idx);
        }
      }, 100);
      window.addEventListener('scroll', this.#scrollHandler, { passive: true });
    }

    #updateHighlight(index) {
      const items = this.#tocItems;
      if (!items.length) return;

      items.forEach((item) => item.classList.remove('active'));

      const current = items[index];
      if (!current) return;
      current.classList.add('active');

      // 让高亮项保持在目录可视区域内
      const content = document.querySelector('.docsify-toc-content');
      if (!content) return;

      const cRect = content.getBoundingClientRect();
      const iRect = current.getBoundingClientRect();

      if (iRect.top < cRect.top) {
        content.scrollTop -= cRect.top - iRect.top;
      } else if (iRect.bottom > cRect.bottom) {
        content.scrollTop += iRect.bottom - cRect.bottom;
      }
    }

    // ---- 收起/展开 ----
    initCollapse() {
      const container = document.querySelector('.docsify-toc-container');
      const toggle = container?.querySelector('.docsify-toc-toggle');
      if (!container || !toggle) return;

      const { storageKey, collapseWidth } = this.#options;

      // 恢复持久化状态
      try {
        if (localStorage.getItem(storageKey) === 'true') {
          this.#collapsed = true;
          this.#manualOverride = true;
        }
      } catch {
        /* localStorage 不可用 */
      }

      // 首次自动收起
      if (!this.#manualOverride && window.innerWidth < collapseWidth) {
        this.#collapsed = true;
      }
      this.#applyCollapse();

      // 手动切换
      toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        this.#collapsed = !this.#collapsed;
        this.#manualOverride = true;
        this.#applyCollapse();
        try {
          localStorage.setItem(storageKey, String(this.#collapsed));
        } catch {
          /* ignore */
        }
      });

      // 响应式自动收起
      this.#resizeHandler = throttle(() => {
        if (this.#manualOverride) return;
        const shouldCollapse = window.innerWidth < collapseWidth;
        if (shouldCollapse !== this.#collapsed) {
          this.#collapsed = shouldCollapse;
          this.#applyCollapse();
        }
      }, 200);
      window.addEventListener('resize', this.#resizeHandler);
    }

    #applyCollapse() {
      const container = document.querySelector('.docsify-toc-container');
      const toggle = container?.querySelector('.docsify-toc-toggle');
      if (!container) return;

      container.classList.toggle('collapsed', this.#collapsed);

      if (toggle) {
        toggle.textContent = this.#collapsed ? '›' : '‹';
        toggle.setAttribute(
          'aria-label',
          this.#collapsed ? '展开大纲' : '折叠大纲',
        );
      }
    }

    // ---- 清理 ----
    cleanup() {
      this.#observer?.disconnect();
      this.#observer = null;

      if (this.#scrollHandler) {
        window.removeEventListener('scroll', this.#scrollHandler);
        this.#scrollHandler = null;
      }

      this.#headings = [];
      this.#tocItems = [];
      this.#activeIndex = -1;
    }

    destroy() {
      this.cleanup();
      if (this.#resizeHandler) {
        window.removeEventListener('resize', this.#resizeHandler);
        this.#resizeHandler = null;
      }
      document.querySelector('.docsify-toc-container')?.remove();
    }
  }

  // ---------- 插件入口 ----------
  const tocPlugin = (hook, vm) => {
    const options = { ...DEFAULT_OPTIONS, ...vm.config.toc };
    let controller = null;

    hook.beforeEach(() => {
      controller?.cleanup();
    });

    hook.doneEach(() => {
      // 懒初始化：首次进入时构建面板、注入样式、绑定收起
      if (!controller) {
        injectStyles();
        controller = new TocController(options);
        controller.buildPanel();
        controller.initCollapse();
      }
      controller.cleanup();
      controller.generate();
    });
  };

  window.$docsify = window.$docsify || {};
  $docsify.plugins = [...($docsify.plugins || []), tocPlugin];
}