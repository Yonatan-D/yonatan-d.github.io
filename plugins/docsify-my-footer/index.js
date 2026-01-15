function style() {
  const code = `
    footer {
      width: 100%;
      height: 60px;
      display: flex;
      align-items: center;
    }

    footer p {
      font-size: 0;
      color: #858585;
      max-width: 80%;
      width: 90%;
      margin: 0 auto;
      padding-left: 38px;
    }

    footer span {
      padding: 0 10px;
      font-size: 12px;
    }

    footer span:first-child {
      padding-left: 0;
    }

    footer span:not(:last-child) {
      border-right: 1px solid;
    }

    footer p span a {
      color: #858585;
    }
  `

  Docsify.dom.style(code);
}

function tpl({ beian, createdAt, author }) {
  const startDate = new Date(createdAt).getFullYear();

  const html = `
    <p>
      <span>
        <a href="https://beian.miit.gov.cn" target="_blank">${beian.ICP}</a> ${startDate}-PRESENT © ${author}</span>
      <!-- <span>Powered by docsify@${Docsify.version}</span> -->
    </p>
  `
  const el = Docsify.dom.create('footer', html);
  const section = Docsify.dom.find('section');

  Docsify.dom.toggleClass(el, 'app-footer');
  Docsify.dom.appendTo(section, el);
}

function init(opts, vm) {

  const defaultConfig = {
    beian: {
      ICP: "",
    },
    createdAt: new Date(),
    author: ''
  }

  const footer = { ...defaultConfig, ...vm.config.customFooter };
  
  style();
  tpl(footer);
}

var install = function (hook, vm) {
  const opts = vm.config.customFooter || [];

  hook.mounted(_ => {
    init(opts, vm);
  })
}

$docsify.plugins = [].concat(install, $docsify.plugins);