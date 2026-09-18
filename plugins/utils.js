{
  const loadedScripts = new Set();
  const scriptLoading = new Map();
  function loadScript(url) {
    const pending = scriptLoading.get(url);
    if (pending) return pending;
    if (loadedScripts.has(url)) return Promise.resolve();

    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => {
        loadedScripts.add(url);
        scriptLoading.delete(url);
        resolve();
      };
      script.onerror = () => {
        scriptLoading.delete(url);
        reject(new Error(`Failed to load script: ${url}`));
      };
      document.head.appendChild(script);
    });
    scriptLoading.set(url, promise);
    return promise;
  }

  const loadedStyles = new Set();
  const styleLoading = new Map();
  function loadStyle(url) {
    const pending = styleLoading.get(url);
    if (pending) return pending;
    if (loadedStyles.has(url)) return Promise.resolve();

    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => {
        loadedStyles.add(url);
        styleLoading.delete(url);
        resolve();
      };
      link.onerror = () => {
        styleLoading.delete(url);
        reject(new Error(`Failed to load style: ${url}`));
      };
      document.head.appendChild(link);
    });
    styleLoading.set(url, promise);
    return promise;
  }

  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.json();
  }

  window.__PLUGIN_UTILS__ = {
    loadScript,
    loadStyle,
    fetchJSON,
  };
}