import express, { Handler, Request } from 'express';
import expressSession from 'express-session';

import { IncomingMessage, Server, ServerResponse } from 'http';
import HtmlServerPlugin from '../main';
import { CustomMarkdownRenderer } from '../markdownRenderer/customMarkdownRenderer';
import { ObsidianMarkdownRenderer } from '../markdownRenderer/obsidianMarkdownRenderer';
import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { randomBytes } from 'crypto';
import { INTERNAL_LOGIN_ENPOINT, tryResolveFilePath } from './pathResolver';
import { contentResolver } from './contentResolver';
import { TFile, TFolder } from 'obsidian';

interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeItem[];
}

export class ServerController {
  app: express.Application;
  server?: Server<typeof IncomingMessage, typeof ServerResponse>;
  markdownRenderer: CustomMarkdownRenderer;

  private buildFileTree(folder: TFolder): FileTreeItem[] {
    const items: FileTreeItem[] = [];

    folder.children.forEach((item) => {
      if (item instanceof TFolder) {
        items.push({
          name: item.name,
          path: item.path,
          type: 'folder',
          children: this.buildFileTree(item)
        });
      } else if (item instanceof TFile && item.extension === 'md') {
        items.push({
          name: item.basename,
          path: item.path,
          type: 'file'
        });
      }
    });

    return items.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'folder' ? -1 : 1;
    });
  }

  constructor(private plugin: HtmlServerPlugin) {
    this.app = express();

    // Добавляем обработку JSON
    this.app.use(express.json());

    this.app.use(expressSession({ secret: randomBytes(16).toString('base64') }));
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser(function (username, done) {
      done(null, { username });
    });

    this.markdownRenderer = new ObsidianMarkdownRenderer(plugin, plugin.app);

    // Настройка аутентификации
    passport.use(
      new LocalStrategy((username, password, done) => {
        if (username === this.plugin.settings.simpleAuthUsername &&
          password === this.plugin.settings.simpleAuthPassword) {
          done(null, { username });
          return;
        }
        done('Wrong Credentials');
      })
    );

    this.app.use(express.urlencoded({ extended: true }));

    // Обработчик для получения списка файлов
    this.app.get('/api/files', this.authenticateIfNeeded, async (req, res) => {
      try {
        console.log('Получен запрос на /api/files');
        const vault = this.plugin.app.vault;
        const rootFolder = vault.getRoot();
        const fileTree = this.buildFileTree(rootFolder);
        console.log('Отправка дерева файлов:', JSON.stringify(fileTree, null, 2));
        res.json(fileTree);
      } catch (error) {
        console.error('Error getting file tree:', error);
        res.status(500).json({ error: 'Failed to get file tree' });
      }
    });

    this.app.post('/login', passport.authenticate('local', {}), (req, res) => {
      res.redirect(req.body.redirectUrl || '/');
    });

    // Основной обработчик для файлов должен быть последним
    this.app.use('/', this.authenticateIfNeeded, async (req, res) => {
      let path = decodeURI(req.path);
      if (!path || path === '/') {
        path = '/' + plugin.settings.defaultFile;
      }

      const resolveFromPath = getResolveFromPath(req);
      const resolvedPath = tryResolveFilePath(path, resolveFromPath, this.plugin.app);

      if (!resolvedPath) {
        res.status(404).write(`Couldn't resolve file at path '${req.path}'`);
        res.end();
        return;
      }

      if (!('/' + resolvedPath === path || resolvedPath === path)) {
        res.redirect('/' + resolvedPath);
        res.end();
        return;
      }

      const r = await contentResolver(path, resolveFromPath, this.plugin, this.markdownRenderer);

      if (!r) {
        res.status(404).write(`Error reading file at path '${req.path}'`);
        res.end();
        return;
      }

      res.contentType(r.contentType);
      res.write(r.payload);
      res.end();
    });
  }


  async start() {
    if (!this.server || !this.server.listening) {
      this.server = await new Promise<Server<typeof IncomingMessage, typeof ServerResponse> | undefined>((resolve) => {
        try {
          if (this.server?.listening) return resolve(this.server);
          const server = this.app.listen(this.plugin.settings.port, this.plugin.settings.hostname, () => {
            resolve(server);
          });
        } catch (error) {
          console.error('error trying to start the server', error);
          resolve(undefined);
        }
      });
    }
  }

  async stop() {
    if (this.server && this.server.listening) {
      await new Promise<void>((resolve) => {
        this.server?.close((err) => {
          err && console.error(err);
          resolve();
        });
      });
    }
  }

  async reload() {
    if (!this.isRunning()) return;
    await this.stop();
    await this.start();
  }

  isRunning() {
    return this.server?.listening;
  }

  authenticateIfNeeded: Handler = async (req, res, next) => {
    if (!this.plugin.settings.useSimpleAuth) return next();

    if (req.user) return next();

    const resolveFromPath = getResolveFromPath(req);

    const path = tryResolveFilePath(req.path, resolveFromPath, this.plugin.app);

    if (path && [`.css`, `.ico`].find((ext) => path.endsWith(ext))) return next();

    const nonce = randomBytes(32).toString('base64');

    res.contentType('text/html; charset=UTF-8');
    res.setHeader('Content-Security-Policy', `script-src 'nonce-${nonce}'`);

    const content = await contentResolver(INTERNAL_LOGIN_ENPOINT, '/', this.plugin, this.markdownRenderer, [
      {
        varName: 'REDIRECT_URL',
        varValue: req.url,
      },
      {
        varName: 'NONCE',
        varValue: nonce,
      },
    ]);

    res.send(content?.payload);
  };


}

const getResolveFromPath = (req: Request) => {
  const url = new URL(req.headers?.referer || 'http://localhost/');
  const fromPath = decodeURIComponent(url.pathname || '/');
  return fromPath.substring(1);
};
