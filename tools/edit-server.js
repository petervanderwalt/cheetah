const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const { marked } = require('marked');
const hljs = require('highlight.js');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_ROOT = path.join(ROOT, 'content');
const DOCS_ROOT = path.join(CONTENT_ROOT, 'markdown');
const PORT = parseInt(process.env.PORT, 10) || 3000;

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
app.use('/images', express.static(path.join(CONTENT_ROOT, 'images')));
app.use('/videos', express.static(path.join(CONTENT_ROOT, 'videos')));
app.use('/misc', express.static(path.join(CONTENT_ROOT, 'misc')));
app.use('/build', express.static(path.join(ROOT, 'build')));
app.use('/docs', express.static(DOCS_ROOT, { index: false }));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT, 'assets', 'index.html'));
});

function parseFrontmatter(content) {
  let title = null, order = null;
  if (!content) return { title, order };
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    const t = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (t) title = t[1];
    const o = fm.match(/^order:\s*(\d+)\s*$/m);
    if (o) order = parseInt(o[1], 10);
  }
  return { title, order };
}

function getSortKey(name, order) {
  if (order != null) return order;
  const m = name.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 999;
}

function sortEntries(arr) {
  arr.sort((a, b) => {
    const ka = a._sortKey != null ? a._sortKey : getSortKey(a.name, a.order);
    const kb = b._sortKey != null ? b._sortKey : getSortKey(b.name, b.order);
    if (ka !== kb) return ka - kb;
    return a.name.localeCompare(b.name);
  });
  arr.forEach(item => delete item._sortKey);
}

function buildFileTree(dir, relativePath) {
  const result = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return result; }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'tools' || entry.name === 'build' || entry.name === 'README.md') continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      const children = buildFileTree(fullPath, relPath);
      const item = { name: entry.name, path: relPath, type: 'directory', order: null, children };
      const numMatch = entry.name.match(/^(\d+)/);
      item._sortKey = numMatch ? parseInt(numMatch[1], 10) : 999;
      result.push(item);
    } else if (entry.name.endsWith('.md')) {
      let title = entry.name.replace(/\.md$/, '');
      let order = null;
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const fm = parseFrontmatter(content);
        if (fm.title) title = fm.title;
        order = fm.order;
      } catch {}
      result.push({ name: entry.name, path: relPath, type: 'file', title, order, _sortKey: getSortKey(entry.name, order) });
    }
  }
  sortEntries(result);
  return result;
}

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
  const { path: filePath, title, order } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path required' });
  const fullPath = path.resolve(DOCS_ROOT, filePath);
  if (!fullPath.startsWith(DOCS_ROOT)) return res.status(403).json({ error: 'forbidden' });
  if (fs.existsSync(fullPath)) return res.status(409).json({ error: 'file exists' });
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safeTitle = title || filePath.replace(/\.md$/, '').split('/').pop();
  const orderLine = order != null ? `order: ${order}\n` : '';
  const content = `---
title: "${safeTitle}"
${orderLine}---

# ${safeTitle}

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

## Related

- Internal link: [[Page Name]]
- Wiki link with text: [[page-path|Display Text]]
- Image: ![alt text](/images/example.png)
- Video embed: <iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
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

const watcher = chokidar.watch(DOCS_ROOT, {
  ignored: /(node_modules|\.git|build|tools|\.(?!md))/,
  persistent: true,
  ignoreInitial: true
});
watcher.on('all', (event, filePath) => {
  const relPath = path.relative(DOCS_ROOT, filePath).replace(/\\/g, '/');
  const msg = JSON.stringify({ type: 'filechange', event, path: relPath });
  for (const client of clients) {
    client.write(`data: ${msg}\n\n`);
  }
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
