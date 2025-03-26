import { randomBytes } from 'crypto';

export type ReplaceableVariables = { varName: string; varValue: string };

export type PluginSettings = {
  port: number;
  defaultFile: string;
  hostname: string;
  startOnLoad: boolean;
  useRibbonButons: boolean;
  indexHtml: string;
  htmlReplaceableVariables: ReplaceableVariables[];
  showAdvancedOptions: boolean;
  useSimpleAuth: boolean;
  simpleAuthUsername: string;
  simpleAuthPassword: string;
};

export const DEFAULT_SETTINGS: PluginSettings = {
  port: 8080,
  hostname: '0.0.0.0',
  defaultFile: '',
  startOnLoad: false,
  useRibbonButons: true,
  indexHtml: `<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>#VAR{HTML_TITLE}</title>
  <link rel="shortcut icon" href="#VAR{FAVICON_URL}">
  <link href="#VAR{CSS_FILE_URL}" type="text/css" rel="stylesheet">
  <base href="/">
  <style>
    .app-container {
      height: auto;
    }

    .file-explorer {
      width: 350px;
      height: 100%;
      overflow-y: auto;
      border-right: 1px solid black;
      background-color: var(--background-secondary);
      padding: 10px;
      padding-top: 30px;
      transition: transform 0.3s ease;
    }

    .main-content {
      flex-grow: 1;
      overflow-y: auto;
    }

    .file-tree {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }

    .file-tree ul {
      list-style: none;
      padding-left: 5px;
      margin: 0;
    }

    .file-tree li {
      padding: 2px 0;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
      cursor: pointer;
      color: var(--text-normal);
      text-decoration: none;
    }

    .file-item:hover {
      background-color: var(--background-modifier-hover);
    }

    .folder-name {
      font-weight: bold;
    }

    .toggle-explorer {
      display: none;
      position: fixed;
      top: 10px;
      left: 10px;
      z-index: 1000;
      padding: 8px;
      background: var(--background-secondary);
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      cursor: pointer;
    }

    @media (max-width: 600px) {
      .toggle-explorer {
        display: block;
      }

      .file-explorer {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 999;
        transform: translateX(-100%);
      }

      .file-explorer.show {
        transform: translateX(0);
      }

      .app-container {
        width: 100%;
      }
    }
  </style>
</head>
<body
  class="#VAR{THEME_MODE} mod-windows is-frameless is-maximized is-hidden-frameless obsidian-app show-inline-title show-view-header"
  style="--zoom-factor:1; --font-text-size:16px;">

<button class="toggle-explorer" aria-label="Toggle File Explorer">Список файлов</button>

<div style="display: flex; flex-direction: row-reverse; height: 100%">
  <div class="app-container">
    <div class="horizontal-main-container">
      <div class="workspace">
        <div class="workspace-split mod-vertical mod-root">
          <div class="workspace-tabs mod-top mod-top-left-space mod-top-right-space">
            <div class="workspace-tab-container">
              <div class="workspace-leaf">
                <div class="workspace-leaf-content" data-type="markdown" data-mode="preview">
                  <div class="view-content">
                    <div class="markdown-reading-view" style="width: 100%; height: 100%;">
                      <div
                        class="markdown-preview-view markdown-rendered node-insert-event is-readable-line-width allow-fold-headings show-indentation-guide allow-fold-lists"
                        tabindex="-1" style="tab-size: 4;">
                        <div class="markdown-preview-sizer markdown-preview-section"
                             style="padding-bottom: 369px; min-height: 1158px;">
                          <div class="markdown-preview-pusher"
                               style="width: 1px; height: 0.1px; margin-bottom: 0px;"></div>
                          <div class="mod-header">
                            <div class="inline-title" contenteditable="true" spellcheck="false" tabindex="-1"
                                 enterkeyhint="done">#VAR{RENDERED_CONTENT_FILE_NAME}
                            </div>
                            #VAR{RENDERED_CONTENT}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="file-explorer">
    <div id="file-tree"></div>
  </div>
</div>
<script>
  // Функция для построения дерева файлов
  function createFileTree(files) {
    const ul = document.createElement('ul');
    ul.className = 'file-tree';

    files.forEach(item => {
      const li = document.createElement('li');
      
      if (item.type === 'folder') {
        // Для папок создаем div-контейнер
        const folderDiv = document.createElement('details');
        folderDiv.className = 'file-item folder';
        folderDiv.innerHTML = \`
          <summary>📁 \${item.name}</summary>
        \`;
        li.appendChild(folderDiv);
        
        // Добавляем вложенные файлы/папки
        if (item.children && item.children.length > 0) {
          const ul_c = createFileTree(item.children);
          folderDiv.appendChild(ul_c);
          li.appendChild(folderDiv);
        }
      } else {
        // Для файлов создаем ссылку на весь элемент
        const fileLink = document.createElement('a');
        fileLink.href = \`/\${item.path}\`;
        fileLink.className = 'file-item file';
        fileLink.innerHTML = \`
          <span class="file-name">📄 \${item.name}</span>
        \`;
        li.appendChild(fileLink);
      }

      ul.appendChild(li);
    });

    return ul;
  }

  // Загрузка файлов при загрузке страницы
  window.addEventListener('DOMContentLoaded', () => {
    fetch('/api/files')
      .then(response => response.json())
      .then(files => {
        const fileTreeContainer = document.getElementById('file-tree');
        fileTreeContainer.appendChild(createFileTree(files));

        // Добавляем обработчик для кнопки переключения файлового explorer
        const toggleButton = document.querySelector('.toggle-explorer');
        const fileExplorer = document.querySelector('.file-explorer');

        toggleButton.addEventListener('click', () => {
          fileExplorer.classList.toggle('show');
        });

        // Закрываем explorer при клике на ссылку (для мобильных устройств)
        fileExplorer.addEventListener('click', (e) => {
          if (e.target.closest('.file-item.file') && window.innerWidth <= 600) {
            fileExplorer.classList.remove('show');
          }
        });
      })
      .catch(error => {
        console.error('Error fetching files:', error);
      });
  });
</script>

</body>
</html>
`,
  htmlReplaceableVariables: [
    {
      varName: 'HTML_TITLE',
      varValue: 'Obsidian Html Server',
    },
    {
      varName: 'FAVICON_URL',
      varValue: '//obsidian.md/favicon.ico',
    },
    {
      varName: 'CSS_FILE_URL',
      varValue: '/.obsidian/plugins/obsidian-http-server/app.css',
    },
  ],
  showAdvancedOptions: false,
  useSimpleAuth: false,
  simpleAuthUsername: 'obsidian',
  simpleAuthPassword: randomBytes(8).toString('hex'),
};
