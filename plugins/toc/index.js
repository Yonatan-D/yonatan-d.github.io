{
  const DEFAULT_OPTIONS = {
    target: 'h2, h3, h4',
    maxDepth: 3,
    title: '大纲',
    collapseWidth: 1200,
    scrollOffset: 60,
    storageKey: 'docsify-toc-collapsed',
  };

  const STYLE_ID = 'docsify-toc-styles';
  const PANEL_WIDTH = 260;
  const COLLAPSED_SIZE = 28;
  const PANEL_GAP = 16;
  const MIN_LEFT = 8;
  const FIXED_TOP = 20;

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

  const renderTree = (nodes, depth, maxDepth) => {
    if (!nodes.length) return '';

    const items = nodes
      .map((node) => {
        const safeId = escapeHtml(node.id);
        const link =
          `<a class="docsify-toc-link" ` +
          `data-target-id="${safeId}" ` +
          `role="button" tabindex="0">${escapeHtml(node.text)}</a>`;
        const sub =
          depth < maxDepth && node.children.length
            ? renderTree(node.children, depth + 1, maxDepth)
            : '';
        return (
          `<li class="docsify-toc-item" data-target-id="${safeId}">` +
          `${link}${sub}</li>`
        );
      })
      .join('');

    return `<ul class="docsify-toc-list">${items}</ul>`;
  };

  const TOC_STYLES = `
    /* 展开态：fixed 固定在视口，left 由 JS 按 section 位置计算 */
    .docsify-toc-container {
      position: fixed;
      top: ${FIXED_TOP}px;
      width: ${PANEL_WIDTH}px;
      max-height: calc(100vh - ${FIXED_TOP * 2}px);
      background: var(--sidebar-bg, #fff);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      z-index: 50;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.2s ease, opacity 0.2s ease;
      font-size: 13px;
    }

    /* 收起态：无边框无阴影方形按钮 */
    .docsify-toc-container.collapsed {
      width: ${COLLAPSED_SIZE}px;
      height: ${COLLAPSED_SIZE}px;
      top: auto;
      background: transparent;
      border: none;
      box-shadow: none;
      border-radius: 4px;
      max-height: none;
      overflow: visible;
      transition: opacity 0.2s ease, background 0.2s ease;
    }
    .docsify-toc-container.collapsed .docsify-toc-title,
    .docsify-toc-container.collapsed .docsify-toc-content {
      display: none;
    }
    .docsify-toc-container.collapsed .docsify-toc-header {
      padding: 0;
      border-bottom: none;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .docsify-toc-container.collapsed .docsify-toc-toggle {
      font-size: 16px;
      color: var(--sidebar-group-title-color);
      padding: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      opacity: 0.7;
    }
    .docsify-toc-container.collapsed .docsify-toc-toggle:hover {
      background: var(--sidebar-toggle-bg-hover);
      color: #fff;
      opacity: 1;
    }

    /* 收起且嵌在 h1 内部：流式布局，随标题滚动 */
    .docsify-toc-container.collapsed.inside-heading {
      position: static;
      top: auto;
      left: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      margin-right: 10px;
    }

    /* 收起且 h1 已滚出视口：固定到视口左上角 */
    .docsify-toc-container.collapsed.is-fixed {
      position: fixed;
      top: ${FIXED_TOP}px;
      left: ${FIXED_TOP}px;
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
      color: var(--sidebar-group-title-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .docsify-toc-toggle {
      background: var(--sidebar-toggle-bg);
      border: none;
      border-radius: 3px;
      padding: 3px 8px;
      font-size: 12px;
      cursor: pointer;
      color: var(--color-text);
    }
    .docsify-toc-toggle:hover {
      background: var(--sidebar-toggle-bg-hover);
      color: #fff;
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
      cursor: pointer;
      border-left: 3px solid transparent;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      outline: none;
    }
    .docsify-toc-link:hover {
      color: var(--theme-color, #42b983);
      background: rgba(66, 185, 131, 0.05);
    }
    .docsify-toc-link:focus-visible {
      background: rgba(66, 185, 131, 0.1);
    }

    .docsify-toc-item.active > .docsify-toc-link {
      color: var(--theme-color, #42b983);
      border-left-color: var(--theme-color, #42b983);
      font-weight: 600;
      background: rgba(66, 185, 131, 0.08);
    }

    body.dark .docsify-toc-container:not(.collapsed) {
      background: #1e1e2e;
      border-color: rgba(255, 255, 255, 0.08);
    }
    body.dark .docsify-toc-header {
      border-color: rgba(255, 255, 255, 0.06);
    }
    body.dark .docsify-toc-link {
      color: #b0b0c0;
    }
  `;

  const injectStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = TOC_STYLES;
    document.head.appendChild(style);
  };

  class TocController {
    #options;
    #observer = null;
    #headings = [];
    #activeIndex = -1;
    // 默认收起
    #collapsed = true;
    #manualOverride = false;
    #scrollHandler = null;
    #resizeHandler = null;

    constructor(options) {
      this.#options = options;
    }

    #handleClick = (event) => {
      const link = event.target.closest('.docsify-toc-link');
      if (!link) return;
      event.preventDefault();

      const id = link.dataset.targetId;
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        this.#options.scrollOffset;
      window.scrollTo({ top, behavior: 'smooth' });

      this.#updateUrl(id);
    };

    #handleKeydown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const link = event.target.closest('.docsify-toc-link');
      if (!link) return;
      event.preventDefault();
      link.click();
    };

    // 宽度不足（悬浮状态）时，点击面板外部收起面板
    #handleOutsideClick = (event) => {
      if (this.#collapsed) return;
      if (!this.#shouldAutoCollapse()) return;

      const container = document.querySelector('.docsify-toc-container');
      if (!container) return;
      if (container.contains(event.target)) return;

      this.#collapsed = true;
      this.#applyCollapse();
    };

    #updateUrl(id) {
      const { hash, pathname, search } = window.location;
      let url;
      if (hash.startsWith('/')) {
        const cleanHash = hash.split('?')[0] || '#/';
        url = `${pathname}${search}${cleanHash}?id=${encodeURIComponent(id)}`;
      } else if (hash.startsWith('#/')) {
        const cleanHash = hash.split('?')[0] || '#/';
        url = `${pathname}${search}${cleanHash}?id=${encodeURIComponent(id)}`;
      } else {
        const u = new URL(window.location.href);
        u.searchParams.set('id', id);
        url = u.pathname + u.search + u.hash;
      }
      history.replaceState(null, '', url);
    }

    buildPanel() {
      document.querySelector('.docsify-toc-container')?.remove();

      const container = document.createElement('aside');
      container.className = 'docsify-toc-container';
      container.innerHTML = `
        <div class="docsify-toc-header">
          <span class="docsify-toc-title">${escapeHtml(this.#options.title)}</span>
          <button class="docsify-toc-toggle">☰</button>
        </div>
        <nav class="docsify-toc-content"></nav>
      `;
      container.addEventListener('click', this.#handleClick);
      container.addEventListener('keydown', this.#handleKeydown);

      document.body.appendChild(container);
    }

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

      this.#initScrollHighlight();
      this.#positionPanel();
    }

    #positionPanel() {
      const container = document.querySelector('.docsify-toc-container');
      const section = document.querySelector('.markdown-section');
      if (!container || !section) return;

      if (this.#collapsed) {
        this.#positionCollapsed(container, section);
        return;
      }

      // 展开态：确保在 body 下，fixed 定位，left 依据 section 的视口位置
      if (container.parentNode !== document.body) {
        document.body.appendChild(container);
      }
      container.classList.remove('inside-heading', 'is-fixed');

      const rect = section.getBoundingClientRect();
      const left = Math.max(MIN_LEFT, rect.left - PANEL_WIDTH - PANEL_GAP);
      container.style.left = `${left}px`;
      container.style.top = `${FIXED_TOP}px`;
    }

    #positionCollapsed(container, section) {
      const h1 = section.querySelector('h1');
      if (!h1) {
        this.#moveToFixed(container);
        return;
      }

      const h1Rect = h1.getBoundingClientRect();
      const h1Visible = h1Rect.bottom > 0 && h1Rect.top < window.innerHeight;

      if (h1Visible) {
        this.#moveInsideHeading(container, h1);
      } else {
        this.#moveToFixed(container);
      }
    }

    // 收起态：嵌入 h1 内部左侧（h1 的第一个子节点，不在 a 标签内）
    #moveInsideHeading(container, h1) {
      container.classList.remove('is-fixed');
      container.classList.add('inside-heading');
      container.style.left = '';
      container.style.top = '';

      if (container.parentNode !== h1) {
        h1.insertBefore(container, h1.firstChild);
      }
    }

    // 收起态：h1 滚出视口后固定到左上角
    #moveToFixed(container) {
      container.classList.remove('inside-heading');
      container.classList.add('is-fixed');
      container.style.left = '';
      container.style.top = '';

      if (container.parentNode !== document.body) {
        document.body.appendChild(container);
      }
    }

    #shouldAutoCollapse() {
      if (window.innerWidth < this.#options.collapseWidth) return true;
      const section = document.querySelector('.markdown-section');
      if (!section) return false;
      return (
        section.getBoundingClientRect().left <
        PANEL_WIDTH + PANEL_GAP + MIN_LEFT
      );
    }

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

        // 收起态：随 h1 可见性切换「嵌在 h1 内」/「固定左上角」
        if (this.#collapsed) this.#positionPanel();
      }, 100);
      window.addEventListener('scroll', this.#scrollHandler, { passive: true });
    }

    #updateHighlight(index) {
      const heading = this.#headings[index];
      if (!heading) return;

      const container = document.querySelector('.docsify-toc-container');
      if (!container) return;

      let current = null;
      container.querySelectorAll('.docsify-toc-item').forEach((item) => {
        const isActive = item.dataset.targetId === heading.id;
        item.classList.toggle('active', isActive);
        if (isActive) current = item;
      });

      if (!current) return;

      const content = container.querySelector('.docsify-toc-content');
      if (!content) return;

      const cRect = content.getBoundingClientRect();
      const iRect = current.getBoundingClientRect();

      if (iRect.top < cRect.top) {
        content.scrollTop -= cRect.top - iRect.top;
      } else if (iRect.bottom > cRect.bottom) {
        content.scrollTop += iRect.bottom - cRect.bottom;
      }
    }

    initCollapse() {
      const container = document.querySelector('.docsify-toc-container');
      const toggle = container?.querySelector('.docsify-toc-toggle');
      if (!container || !toggle) return;

      const { storageKey } = this.#options;

      // 恢复用户上次的选择；无记录则保持默认收起
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) {
          this.#collapsed = saved === 'true';
          this.#manualOverride = true;
        }
      } catch {
        /* localStorage 不可用 */
      }

      this.#applyCollapse();

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

      this.#resizeHandler = throttle(() => {
        // 窗口不够宽且当前展开 → 自动收起；窗口变宽不自动展开
        if (!this.#collapsed && this.#shouldAutoCollapse()) {
          this.#collapsed = true;
          this.#applyCollapse();
          return;
        }
        this.#positionPanel();
      }, 200);
      window.addEventListener('resize', this.#resizeHandler);

      // 点击面板外部收起（仅宽度不足的悬浮态）；用 capture 阶段避免被内部 stopPropagation 拦截
      document.addEventListener('click', this.#handleOutsideClick, true);
    }

    #applyCollapse() {
      const container = document.querySelector('.docsify-toc-container');
      const toggle = container?.querySelector('.docsify-toc-toggle');
      if (!container) return;

      container.classList.toggle('collapsed', this.#collapsed);

      if (this.#collapsed) {
        const section = document.querySelector('.markdown-section');
        if (section) this.#positionCollapsed(container, section);
      } else {
        container.classList.remove('inside-heading', 'is-fixed');
        if (container.parentNode !== document.body) {
          document.body.appendChild(container);
        }
        container.style.left = '';
        container.style.top = '';
        this.#positionPanel();
      }

      if (toggle) {
        toggle.textContent = this.#collapsed ? '☰' : 'hide';
        toggle.setAttribute(
          'aria-label',
          this.#collapsed ? '展开大纲' : '折叠大纲',
        );
      }
    }

    cleanup() {
      this.#observer?.disconnect();
      this.#observer = null;

      if (this.#scrollHandler) {
        window.removeEventListener('scroll', this.#scrollHandler);
        this.#scrollHandler = null;
      }

      this.#headings = [];
      this.#activeIndex = -1;
    }

    destroy() {
      this.cleanup();
      if (this.#resizeHandler) {
        window.removeEventListener('resize', this.#resizeHandler);
        this.#resizeHandler = null;
      }
      document.removeEventListener('click', this.#handleOutsideClick, true);
      document.querySelector('.docsify-toc-container')?.remove();
    }
  }

  const tocPlugin = (hook, vm) => {
    const options = { ...DEFAULT_OPTIONS, ...vm.config.toc };
    let controller = null;

    hook.beforeEach(() => {
      controller?.cleanup();

      // 切页前把嵌在 h1 内的 container 移回 body，避免随 h1 一起被销毁
      const container = document.querySelector('.docsify-toc-container');
      if (container && container.parentNode && container.parentNode !== document.body) {
        document.body.appendChild(container);
        container.classList.remove('inside-heading', 'is-fixed');
      }
    });

    hook.doneEach(() => {
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