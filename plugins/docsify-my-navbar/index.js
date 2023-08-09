var plugin = (hook, vm) => {
  var customNavbar = {
    list: [
      // example:
      // { title: 'home', href: '/' },
      // { title: 'about', icon: 'icon-github', href: '/about' },
      // { icon: 'icon-github-line', href: 'http://github.com/yonatan-d', target: '_blank' },
    ]
  };
  var defaultConfig = { 
    list: [],
  };
  customNavbar = { ...defaultConfig, ...vm.config.customNavbar };

  hook.mounted(_ => {
    const navList = customNavbar.list;

    var navEl = navList.map(li => {
      let defaultLi = { title: '', icon: '', href: '', target: '_self' };
      li = { ...defaultLi, ...li };

      return `<li><a href=${li.href} target=${li.target}>
                    ${li.icon ? '<Icon class='+ li.icon +'></Icon>' : ''}
                    ${li.title}
                  </a>
              </li>`;
    }).join('');
    var html = ` <ul>${navEl}</ul>`;

    const el = Docsify.dom.create('nav', html);
    Docsify.dom.toggleClass(el, 'app-nav');
    
    if (!vm.config.repo) {
      Docsify.dom.toggleClass(el, 'no-badge');
    }

    const section = Docsify.dom.find('section');
    Docsify.dom.before(section, el);
  });

  // 每次打开都 auto2top
  hook.doneEach(_ => {
    Docsify.dom.find('.content').scrollTo(0, 0);
    window.scrollTo(0, 0);
  });
}

window.$docsify.plugins = [].concat(plugin, window.$docsify.plugins)