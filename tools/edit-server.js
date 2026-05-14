const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const { marked } = require('marked');
const hljs = require('highlight.js');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '.cheetah-path');
const PORT = parseInt(process.env.PORT, 10) || 3000;

let CONTENT_ROOT = null;
let DOCS_ROOT = null;
let PROJECT_ROOT = null;
let BUILD_OUT = null;

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    const p = fs.readFileSync(CONFIG_PATH, 'utf-8').trim();
    if (p && fs.existsSync(path.join(p, 'content', 'markdown'))) {
      PROJECT_ROOT = p;
      CONTENT_ROOT = path.join(p, 'content');
      DOCS_ROOT = path.join(CONTENT_ROOT, 'markdown');
      BUILD_OUT = path.join(p, 'docs');
      return true;
    }
  }
  return false;
}
const configured = loadConfig();

marked.setOptions({
  breaks: false,
  gfm: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; }
      catch (_) { /* fallthrough */ }
    }
    return hljs.highlightAuto(code).value;
  }
});

const admonitionExtension = {
  name: 'admonition',
  level: 'block',
  start(src) { return src.match(/^:::/)?.index; },
  tokenizer(src) {
    const rule = /^:::(\w+)(?:\[([^\]]*)\])?\s*\n([\s\S]*?)\n:::/;
    const match = src.match(rule);
    if (match) {
      const token = {
        type: 'admonition',
        raw: match[0],
        kind: match[1].toLowerCase(),
        title: match[2] || '',
        text: match[3],
        tokens: []
      };
      token.tokens = this.lexer.blockTokens(match[3]);
      return token;
    }
  },
  renderer(token) {
    const kind = token.kind;
    const icons = { note: '📝', tip: '💡', warning: '⚠️', danger: '🔥', info: 'ℹ️' };
    const icon = icons[kind] || '';
    const titleHtml = token.title ? `<span class="admonition-title">${token.title}</span>` : '';
    const bodyHtml = this.parser.parse(token.tokens);
    return `<div class="admonition admonition-${kind}">\n<div class="admonition-heading">${icon} ${titleHtml || kind.charAt(0).toUpperCase() + kind.slice(1)}</div>\n<div class="admonition-body">${bodyHtml}</div>\n</div>\n`;
  }
};

marked.use({ extensions: [admonitionExtension] });

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/assets', express.static(path.join(ROOT, 'assets')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'assets', 'index.html'));
});

// Setup API: check if content path is configured
app.get('/api/check-setup', (req, res) => {
  res.json({ configured: !!PROJECT_ROOT, path: PROJECT_ROOT || null });
});

// Setup API: save content path
app.post('/api/setup-path', (req, res) => {
  const p = req.body && req.body.path;
  if (!p) return res.status(400).json({ error: 'path required' });
  const testDir = path.join(p, 'content', 'markdown');
  if (!fs.existsSync(testDir)) return res.status(400).json({ error: 'path must contain content/markdown/' });
  try {
    fs.writeFileSync(CONFIG_PATH, p, 'utf-8');
    PROJECT_ROOT = p;
    CONTENT_ROOT = path.join(p, 'content');
    DOCS_ROOT = path.join(CONTENT_ROOT, 'markdown');
    BUILD_OUT = path.join(p, 'docs');
    setupContentRoutes();
    setupWatcher();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Setup API: get content path for logo serving
app.get('/api/content-logo', (req, res) => {
  if (!PROJECT_ROOT) return res.status(404).end();
  const logoPath = path.join(CONTENT_ROOT, 'images', 'logo.svg');
  if (fs.existsSync(logoPath)) res.sendFile(logoPath);
  else res.status(404).end();
});

function setupContentRoutes() {
  if (!CONTENT_ROOT) return;
  app.use('/images', express.static(path.join(CONTENT_ROOT, 'images')));
  app.use('/videos', express.static(path.join(CONTENT_ROOT, 'videos')));
  app.use('/misc', express.static(path.join(CONTENT_ROOT, 'misc')));
  app.use('/docs', express.static(DOCS_ROOT, { index: false }));
}

function setupWatcher() {
  if (!DOCS_ROOT) return;
  if (global._watcher) global._watcher.close();
  global._watcher = chokidar.watch(DOCS_ROOT, {
    ignored: /(node_modules|\.git|build|tools|\.(?!md))/,
    persistent: true,
    ignoreInitial: true
  });
  global._watcher.on('all', (event, filePath) => {
    const relPath = path.relative(DOCS_ROOT, filePath).replace(/\\/g, '/');
    const msg = JSON.stringify({ type: 'filechange', event, path: relPath });
    for (const client of clients) {
      client.write(`data: ${msg}\n\n`);
    }
  });
}

if (configured) {
  setupContentRoutes();
  setupWatcher();
}

function requireContent(req, res, next) {
  if (!DOCS_ROOT) return res.status(400).json({ error: 'no content path configured' });
  next();
}

// All /api/* routes except setup need content configured
app.use(/^\/api\/(?!check-setup|setup-path|content-logo|events).*/, requireContent);

app.get('/api/tree', (req, res) => {
  const tree = buildFileTree(DOCS_ROOT, '');
  res.json(tree);
});

app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  const fullPath = path.resolve(DOCS_ROOT, filePath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ content, path: filePath });
  } catch (e) {
    res.status(404).json({ error: 'file not found' });
  }
});

app.put('/api/file', (req, res) => {
  const filePath = req.query.path || req.body.path;
  const { content } = req.body;
  if (!filePath || content === undefined) return res.status(400).json({ error: 'path and content required' });
  const fullPath = path.resolve(DOCS_ROOT, filePath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  try {
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf-8');
    res.json({ ok: true, path: filePath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/create-file', (req, res) => {
  const { path: filePath, order } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  const fullPath = path.resolve(DOCS_ROOT, filePath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  if (fs.existsSync(fullPath)) return res.status(409).json({ error: 'file exists' });
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const name = filePath.replace(/\.md$/, '').split('/').pop().replace(/^\d+-/, '');
  const content = `# ${name}

## Overview

Brief description of what this page covers.

---

> 💡 **Tip**
> Callouts use blockquotes with emoji markers. Supported types:
> 📝 Note · 💡 Tip · ⚠️ Warning · 🔥 Danger · ℹ️ Info

---

## Section

Content with **bold**, *italic*, \`inline code\`, and a [link](https://example.com).

### Subsection

- List item with \`code\`
- **Bold item** with description
- Nested
  - Indented item

1. Ordered step one
2. Ordered step two

| Header 1 | Header 2 |
|----------|----------|
| Cell     | Cell     |

\`\`\`js
// Code block with syntax highlighting
function hello() {
  console.log("Hello, world!");
}
\`\`\`

---
`;
  try {
    fs.writeFileSync(fullPath, content, 'utf-8');
    res.json({ ok: true, path: filePath });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/create-folder', (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'path required' });
  const fullPath = path.resolve(DOCS_ROOT, folderPath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  if (fs.existsSync(fullPath)) return res.status(409).json({ error: 'folder exists' });
  try {
    fs.mkdirSync(fullPath, { recursive: true });
    res.json({ ok: true, path: folderPath });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/preview', (req, res) => {
  const { content } = req.body;
  if (content === undefined) return res.status(400).json({ error: 'content required' });
  try {
    const html = marked.parse(content);
    res.json({ html });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/upload', (req, res) => {
  const { name, data } = req.body;
  if (!name || !data) return res.status(400).json({ error: 'name and data required' });
  const imgDir = path.join(CONTENT_ROOT, 'images');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
  const safeName = path.basename(name);
  const fullPath = path.join(imgDir, safeName);
  try {
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(fullPath, buffer);
    res.json({ url: `/images/${safeName}`, path: `images/${safeName}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ast-edit', (req, res) => {
  const { filePath, lineStart, lineEnd, newContent, type } = req.body;
  if (!filePath || lineStart === undefined || newContent === undefined) {
    return res.status(400).json({ error: 'filePath, lineStart, newContent required' });
  }
  const fullPath = path.resolve(DOCS_ROOT, filePath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  try {
    let content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    if (lineEnd && lineEnd < lines.length) {
      lines.splice(lineStart, lineEnd - lineStart + 1, newContent);
    } else {
      lines.splice(lineStart, 1, newContent);
    }
    const result = lines.join('\n');
    fs.writeFileSync(fullPath, result, 'utf-8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/folders', (req, res) => {
  try {
    const folders = [];
    const walk = (dir, relPath) => {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        const rel = relPath ? `${relPath}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          folders.push(rel);
          walk(full, rel);
        }
      }
    };
    walk(DOCS_ROOT, '');
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/rename', (req, res) => {
  const { path: itemPath, newName } = req.body;
  if (!itemPath || !newName) return res.status(400).json({ error: 'path and newName required' });
  const fullPath = path.resolve(DOCS_ROOT, itemPath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  const parent = path.dirname(fullPath);
  const newFullPath = path.join(parent, newName);
  if (fs.existsSync(newFullPath)) return res.status(409).json({ error: 'already exists' });
  try {
    fs.renameSync(fullPath, newFullPath);
    const newRelPath = path.join(path.dirname(itemPath), newName).replace(/\\/g, '/');
    res.json({ ok: true, path: newRelPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/move', (req, res) => {
  const { path: itemPath, destination } = req.body;
  if (!itemPath || !destination) return res.status(400).json({ error: 'path and destination required' });
  const fullPath = path.resolve(DOCS_ROOT, itemPath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  const destPath = path.resolve(DOCS_ROOT, destination);
  if (!destPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  const newFullPath = path.join(destPath, path.basename(itemPath));
  if (fs.existsSync(newFullPath)) return res.status(409).json({ error: 'already exists' });
  try {
    fs.mkdirSync(destPath, { recursive: true });
    fs.renameSync(fullPath, newFullPath);
    const newRelPath = path.join(destination, path.basename(itemPath)).replace(/\\/g, '/');
    res.json({ ok: true, path: newRelPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const getTrash = () => CONTENT_ROOT ? path.join(CONTENT_ROOT, 'trash') : null;
app.post('/api/delete', (req, res) => {
  const { path: itemPath } = req.body;
  if (!itemPath) return res.status(400).json({ error: 'path required' });
  const fullPath = path.resolve(DOCS_ROOT, itemPath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'not found' });
  // Only allow deleting empty folders (skip hidden entries)
  try {
    if (fs.statSync(fullPath).isDirectory()) {
      const visible = fs.readdirSync(fullPath).filter(e => !e.startsWith('.'));
      if (visible.length > 0) {
        return res.status(400).json({ error: 'folder not empty' });
      }
    }
  } catch (e) { return res.status(500).json({ error: e.message }); }
  try {
    const trash = getTrash();
    if (!trash) return res.status(400).json({ error: 'no content path' });
    if (!fs.existsSync(trash)) fs.mkdirSync(trash, { recursive: true });
    const ts = Date.now();
    const trashName = path.basename(itemPath) + '.' + ts;
    const trashPath = path.join(trash, trashName);
    fs.renameSync(fullPath, trashPath);
    res.json({ ok: true, trash: trashName });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/deploy', (req, res) => {
  if (!PROJECT_ROOT) return res.status(400).json({ error: 'no content path configured' });
  const buildScript = path.join(ROOT, 'tools', 'build.js');
  try {
    const { execSync } = require('child_process');
    const prefix = req.body && req.body.prefix ? ` --prefix=${req.body.prefix}` : '';
    execSync(`node "${buildScript}" --content="${PROJECT_ROOT}"${prefix}`, { cwd: ROOT, stdio: 'pipe', timeout: 30000 });
    res.json({ ok: true, output: BUILD_OUT });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Build failed' });
  }
});

const clients = [];
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.write('data: {"type":"connected"}\n\n');
  clients.push(res);
  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx >= 0) clients.splice(idx, 1);
  });
});

const { execSync } = require('child_process');

app.listen(PORT, () => {
  console.log(`\n  📝 Docs Editor running at http://localhost:${PORT}`);
  console.log(`  📂 Edit your documentation files\n`);
  const url = `http://localhost:${PORT}`;
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore', shell: true });
    } else if (platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
    console.log(`  🚀 Opened ${url} in your browser\n`);
  } catch (_) {
    // Browser open not critical
  }
});
