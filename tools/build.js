const path = require('path');
const fs = require('fs');
const { marked } = require('marked');
const hljs = require('highlight.js');
const grayMatter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_ROOT = path.join(ROOT, 'content');
const CONTENT = path.join(CONTENT_ROOT, 'markdown');
const BUILD = path.join(ROOT, 'build');

marked.setOptions({
  breaks: false,
  gfm: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; }
      catch (_) {}
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
      return {
        type: 'admonition',
        raw: match[0],
        kind: match[1].toLowerCase(),
        title: match[2] || '',
        text: match[3]
      };
    }
  },
  renderer(token) {
    const kind = token.kind;
    const icons = { note: '📝', tip: '💡', warning: '⚠️', danger: '🔥', info: 'ℹ️' };
    const icon = icons[kind] || '';
    const titleHtml = token.title ? `<span class="admonition-title">${token.title}</span>` : '';
    const bodyHtml = marked.parse(token.text);
    return `<div class="admonition admonition-${kind}">\n<div class="admonition-heading">${icon} ${titleHtml || kind.charAt(0).toUpperCase() + kind.slice(1)}</div>\n<div class="admonition-body">${bodyHtml}</div>\n</div>\n`;
  }
};
let wikiLookup = {};
const wikiLinkExtension = {
  name: 'wikiLink',
  level: 'inline',
  start(src) { return src.indexOf('[['); },
  tokenizer(src) {
    const match = src.match(/^\[\[([^\]]+?)(?:\|([^\]]+))?\]\]/);
    if (match) {
      return {
        type: 'wikiLink', raw: match[0],
        target: match[1].trim(), text: (match[2] || match[1]).trim()
      };
    }
  },
  renderer(token) {
    const key = token.target.toLowerCase();
    const resolved = wikiLookup[key];
    if (resolved) {
      return `<a href="/${resolved.htmlPath}">${token.text}</a>`;
    }
    return `<a class="wiki-broken" href="#">${token.text}</a>`;
  }
};
marked.use({ extensions: [admonitionExtension, wikiLinkExtension] });

const tocRenderer = new marked.Renderer();

tocRenderer.heading = function(text, level) {
  const id = slugify(text.replace(/<[^>]*>/g, ''));
  return `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true"></a>${text}</h${level}>`;
};

function extractToc(md) {
  const headings = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let m;
  while ((m = regex.exec(md)) !== null) {
    const level = m[1].length;
    if (level !== 2) continue;
    const text = m[2].replace(/[#*`\[\]]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    const textPlain = text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const id = slugify(textPlain);
    headings.push({ text: textPlain, level, id });
  }
  return headings;
}

function renderToc(headings) {
  if (headings.length === 0) return '';
  let html = '<nav class="toc"><h3>On this page</h3><ul class="toc-list">';
  for (const h of headings) {
    html += `<li class="toc-h${h.level}"><a href="#${h.id}">${h.text}</a></li>`;
  }
  html += '</ul></nav>';
  return html;
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/&/g, '-and-')
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function getSortKey(name, order) {
  if (order != null) return order;
  const m = name.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 999;
}

function sortEntries(arr) {
  arr.sort((a, b) => {
    const ka = a._sortKey != null ? a._sortKey : getSortKey(a.name || a.title, a.order);
    const kb = b._sortKey != null ? b._sortKey : getSortKey(b.name || b.title, b.order);
    if (ka !== kb) return ka - kb;
    return (a.name || a.title || '').localeCompare(b.name || b.title || '');
  });
  arr.forEach(item => delete item._sortKey);
}

function scanFiles(dir, relativePath) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'tools' || entry.name === 'build' || entry.name === 'README.md') continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...scanFiles(fullPath, relPath));
    } else if (entry.name.endsWith('.md')) {
      results.push({ path: relPath, fullPath });
    }
  }
  return results;
}

function buildNavTree(dir, relativePath, currentPath) {
  const items = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return items; }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'tools' || entry.name === 'build' || entry.name === 'README.md') continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      const children = buildNavTree(fullPath, relPath, currentPath);
      const dirTitle = entry.name.replace(/^\d+-/, '').replace(/[-_]/g, ' ').toUpperCase();
      if (children.length > 0) {
        const numMatch = entry.name.match(/^(\d+)/);
        items.push({ name: entry.name, title: dirTitle, path: relPath, type: 'directory', children, _sortKey: numMatch ? parseInt(numMatch[1], 10) : 999 });
      }
    } else if (entry.name.endsWith('.md')) {
      let title = entry.name.replace(/\.md$/, '').replace(/^\d+-/, '').replace(/[-_]/g, ' ').toUpperCase();
      let order = null;
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const parsed = grayMatter(content);
        if (parsed.data.order != null) order = parseInt(parsed.data.order, 10);
      } catch {}
      const htmlPath = relPath.replace(/\.md$/, '.html');
      items.push({ title, path: relPath, htmlPath, type: 'file', active: relPath === currentPath, order, _sortKey: getSortKey(entry.name, order) });
    }
  }
  sortEntries(items);
  return items;
}

function buildSearchIndex(files) {
  const index = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(file.fullPath, 'utf-8');
      const parsed = grayMatter(content);
      const text = (parsed.content || content).replace(/[#*`\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
      const title = file.path.replace(/\.md$/, '').replace(/(^|\/)\d+-/g, '$1').replace(/\//g, ': ').replace(/[-_]/g, ' ').toUpperCase();
      index.push({
        title,
        path: file.path,
        url: '/' + file.path.replace(/\.md$/, '.html'),
        excerpt: text.substring(0, 200),
        text: text.substring(0, 1000)
      });
    } catch {}
  }
  return index;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyAssets() {
  const src = path.join(CONTENT_ROOT, 'images');
  const dst = path.join(BUILD, 'images');
  if (fs.existsSync(src)) copyRecursive(src, dst);
  const logo = path.join(ROOT, 'assets', 'logo.svg');
  if (fs.existsSync(logo)) {
    ensureDir(path.join(BUILD, 'assets'));
    fs.copyFileSync(logo, path.join(BUILD, 'assets', 'logo.svg'));
  }
}
function copyRecursive(src, dst) {
  ensureDir(dst);
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}


const SITE_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fbfffe;--bg-alt:#f5f4f6;--text:#1b1b1e;--text-light:#6d676e;--border:#ddd8dc;--accent:#f90000;--accent-hover:#d00000;--code-bg:#f0f0f4;--sidebar-width:280px}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;color:var(--text);line-height:1.7;background:var(--bg);display:flex;min-height:100vh}
.sidebar{width:var(--sidebar-width);background:var(--bg-alt);border-right:1px solid var(--border);padding:1.5rem;position:fixed;top:0;left:0;bottom:0;overflow-y:auto;flex-shrink:0}
.sidebar-logo{text-align:center;margin-bottom:1rem}
.sidebar-logo img{max-width:120px;height:auto;display:inline-block}
.sidebar h2{font-size:1.1rem;margin-bottom:1rem;color:var(--accent)}
.sidebar .nav-tree{list-style:none;font-size:0.9rem}
.sidebar .nav-tree li{margin:2px 0}
.sidebar .nav-tree a{display:block;padding:4px 8px;color:var(--text);text-decoration:none;border-radius:4px;transition:background .15s}
.sidebar .nav-tree a:hover{background:var(--border)}
.sidebar .nav-tree a.active{background:var(--accent);color:#fff}
.sidebar .nav-tree .folder-label{padding:4px 8px;font-weight:700;color:var(--text);font-size:0.85rem;text-transform:uppercase;letter-spacing:.5px}
.sidebar .nav-tree .nested{padding-left:1rem;list-style:none}
.main{margin-left:var(--sidebar-width);flex:1;padding:2rem 3rem;min-width:0}
.main h1{margin-bottom:0.5rem;color:var(--text)}
.main .meta{color:var(--text-light);font-size:0.9rem;margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px solid var(--border)}
.main h2{margin-top:2rem;margin-bottom:0.75rem;padding-bottom:0.3rem;border-bottom:1px solid var(--border)}
.main h3{margin-top:1.5rem;margin-bottom:0.5rem}
.main p,.main li{color:var(--text)}
.main p{margin-bottom:1rem}
.main ul,.main ol{margin-bottom:1rem;padding-left:1.5rem}
.main li{margin-bottom:0.25rem}
.main a{color:var(--accent);text-decoration:none}
.main a:hover{text-decoration:underline}
.main a.wiki-broken{color:#e63946;text-decoration:underline dashed #e63946}
.main .anchor{float:left;margin-left:-1.2rem;font-size:0.85rem;line-height:inherit;color:var(--accent);text-decoration:none;opacity:0;transition:opacity 0.15s}
.main h2:hover .anchor,.main h3:hover .anchor,.main h4:hover .anchor,.main h5:hover .anchor,.main h6:hover .anchor{opacity:1}
.main .anchor::before{content:"#"}
.main pre{background:var(--code-bg);border-radius:6px;padding:1rem;overflow-x:auto;margin-bottom:1rem;font-size:0.9rem;line-height:1.5}
.main code{background:var(--code-bg);padding:2px 6px;border-radius:3px;font-size:0.9em}
.main pre code{background:none;padding:0;border-radius:0}
.main table{width:100%;border-collapse:collapse;margin-bottom:1rem}
.main th,.main td{padding:8px 12px;border:1px solid var(--border);text-align:left}
.main th{background:var(--bg-alt);font-weight:600}
.main hr{margin:2rem 0;border:none;border-top:1px solid var(--border)}
.main blockquote{border-left:4px solid var(--accent);padding:0.5rem 1rem;margin-bottom:1rem;background:var(--bg-alt);border-radius:0 6px 6px 0}
.main blockquote p{margin-bottom:0}
.admonition{margin-bottom:1rem;border-radius:8px;overflow:hidden;border-left:5px solid;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
.admonition-heading{padding:10px 16px;font-weight:700;font-size:0.85rem;letter-spacing:0.2px}
.admonition-body{padding:12px 16px 14px;background:#fcfcfc}
.admonition-body p:last-child{margin-bottom:0}
.admonition-body code{background:#eef0f2}
.admonition-note{border-color:#d48a00}.admonition-note .admonition-heading{background:#fef3d6;color:#7a4f00}
.admonition-tip{border-color:#2b8a5e}.admonition-tip .admonition-heading{background:#e6f5ee;color:#145237}
.admonition-warning{border-color:#d99f0a}.admonition-warning .admonition-heading{background:#fff8e0;color:#7a5a00}
.admonition-danger{border-color:#96031a}.admonition-danger .admonition-heading{background:#fde8ea;color:#96031a}
.admonition-info{border-color:#5b8db8}.admonition-info .admonition-heading{background:#e8f0f8;color:#2a5a7a}
.search-box{margin-bottom:1rem}
.search-box input{width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:0.9rem;outline:none;transition:border-color .15s}
.search-box input:focus{border-color:var(--accent)}
.search-results{position:absolute;background:var(--bg);border:1px solid var(--border);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-height:300px;overflow-y:auto;width:calc(var(--sidebar-width) - 3rem);display:none;z-index:100}
.search-results.show{display:block}
.search-results a{display:block;padding:8px 12px;border-bottom:1px solid var(--border);text-decoration:none;color:var(--text)}
.search-results a:hover{background:var(--bg-alt)}
.search-results a .search-title{font-weight:600}
.search-results a .search-excerpt{font-size:0.8rem;color:var(--text-light)}
.content-wrap{display:flex;gap:2.5rem;align-items:flex-start}
.content-wrap article{flex:1;min-width:0}
.toc{width:300px;flex-shrink:0;position:sticky;top:2rem;font-size:0.82rem;max-height:calc(100vh - 4rem);overflow-y:auto;align-self:start}
.toc h3{font-size:0.75rem;margin-bottom:0.75rem;color:var(--text-light);text-transform:uppercase;letter-spacing:0.8px;font-weight:700}
.toc-list{list-style:none;border-left:2px solid var(--border)}
.toc-list li{margin:0}
.toc-list a{display:block;padding:4px 0 4px 12px;color:var(--text-light);text-decoration:none;border-left:2px solid transparent;margin-left:-2px;transition:all 0.15s;line-height:1.4}
.toc-list a:hover{color:var(--accent);border-left-color:var(--accent)}
.toc-h3 a{padding-left:24px}
@media(max-width:1024px){.toc{display:none}}
@media(max-width:768px){
  body{flex-direction:column}
  .sidebar{position:static;width:100%;border-right:none;border-bottom:1px solid var(--border);max-height:300px;overflow-y:auto}
  .main{margin-left:0;padding:1rem}
  .content-wrap{flex-direction:column;gap:1rem}
}
`;

function renderPage(title, contentHtml, navTree, currentPath, searchIndex, tocHtml) {
  const searchJson = JSON.stringify(searchIndex);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="stylesheet" href="/assets/css/site.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
</head>
<body>
<aside class="sidebar">
    <div class="sidebar-logo"><img src="/assets/logo.svg" alt="Logo"></div>
    <h2>Documentation</h2>
  <div class="search-box">
    <input type="text" id="searchInput" placeholder="Search docs..." autocomplete="off">
    <div class="search-results" id="searchResults"></div>
  </div>
  <nav>${renderNav(navTree, currentPath)}</nav>
</aside>
<main class="main">
  <div class="content-wrap">
    <article>
      ${contentHtml}
    </article>
    ${tocHtml}
  </div>
</main>
<script>
const searchIndex = ${searchJson};
document.getElementById('searchInput').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  const results = document.getElementById('searchResults');
  if (!q) { results.classList.remove('show'); return; }
  const matches = searchIndex.filter(item =>
    item.title.toLowerCase().includes(q) || item.text.toLowerCase().includes(q)
  ).slice(0, 20);
  if (matches.length === 0) { results.classList.remove('show'); return; }
  results.innerHTML = matches.map(m =>
    '<a href="' + m.url + '"><div class="search-title">' + m.title + '</div><div class="search-excerpt">' + m.excerpt + '</div></a>'
  ).join('');
  results.classList.add('show');
});
document.addEventListener('click', function(e) {
  if (!e.target.closest('.search-box')) document.getElementById('searchResults').classList.remove('show');
});
// Copy buttons for code blocks
document.querySelectorAll('.main pre').forEach(function(pre) {
  var btn = document.createElement('button');
  btn.textContent = 'Copy';
  btn.style.cssText = 'position:absolute;top:4px;right:4px;padding:2px 8px;font-size:0.7rem;background:#eef0ff;border:1px solid #dee2e6;border-radius:4px;cursor:pointer;opacity:0;transition:opacity 0.15s;z-index:5';
  pre.style.position = 'relative';
  pre.appendChild(btn);
  pre.addEventListener('mouseenter', function(){ btn.style.opacity = '1'; });
  pre.addEventListener('mouseleave', function(){ btn.style.opacity = '0'; });
  btn.addEventListener('click', function() {
    var code = pre.querySelector('code') || pre;
    var text = code.textContent;
    navigator.clipboard.writeText(text).then(function(){ btn.textContent='Copied!'; setTimeout(function(){ btn.textContent='Copy'; }, 1500); });
  });
});
</script>
</body>
</html>`;
}

function renderNavList(items, currentPath) {
  let html = '';
  for (const item of items) {
    if (item.type === 'directory') {
      html += `<li><div class="folder-label">${item.title}</div>`;
      if (item.children.length > 0) {
        html += '<ul class="nested">';
        html += renderNavList(item.children, currentPath);
        html += '</ul>';
      }
      html += '</li>';
    } else {
      const active = item.path === currentPath ? ' class="active"' : '';
      html += `<li><a${active} href="/${item.htmlPath}">${item.title}</a></li>`;
    }
  }
  return html;
}

function renderNav(items, currentPath) {
  return '<ul class="nav-tree">' + renderNavList(items, currentPath) + '</ul>';
}

function generateSite() {
  console.log('  🔨 Generating static site...\n');

  if (fs.existsSync(path.join(BUILD, 'assets'))) {
    try { fs.rmSync(BUILD, { recursive: true, force: true }); }
    catch (e) {
      console.log('  ⚠️  Build folder locked, overwriting files in-place');
    }
  }
  if (!fs.existsSync(BUILD)) {
    fs.mkdirSync(BUILD, { recursive: true });
  }
  ensureDir(BUILD);
  ensureDir(path.join(BUILD, 'assets', 'css'));
  ensureDir(path.join(BUILD, 'assets', 'js'));

  fs.writeFileSync(path.join(BUILD, 'assets', 'css', 'site.css'), SITE_CSS.trim());

  const files = scanFiles(CONTENT, '');
  console.log(`  📄 Found ${files.length} markdown files`);

  const allNav = buildNavTree(CONTENT, '', null);

  const searchIndex = buildSearchIndex(files);
  fs.writeFileSync(path.join(BUILD, 'search-index.json'), JSON.stringify(searchIndex, null, 2));
  console.log(`  🔍 Search index built (${searchIndex.length} entries)`);

  if (files.length === 0) {
    console.log('  ⚠️  No markdown files found');
    return;
  }

  wikiLookup = {};
  for (const f of files) {
    const noExt = f.path.replace(/\.md$/, '');
    const htmlPath = noExt + '.html';
    wikiLookup[noExt.toLowerCase()] = { htmlPath };
    const nameOnly = f.path.split('/').pop().replace(/\.md$/, '').replace(/^\d+-/, '');
    wikiLookup[nameOnly.toLowerCase()] = { htmlPath };
  }

  let firstFile = null;
  for (const file of files) {
    try {
      const content = fs.readFileSync(file.fullPath, 'utf-8');
      const parsed = grayMatter(content);
      const title = file.path.replace(/\.md$/, '').replace(/(^|\/)\d+-/g, '$1').replace(/\//g, ': ').replace(/[-_]/g, ' ').toUpperCase();
      const toc = extractToc(parsed.content);
      const tocHtml = renderToc(toc);
      const htmlContent = marked.parse(parsed.content, { renderer: tocRenderer });
      const htmlPath = file.path.replace(/\.md$/, '.html');
      const outPath = path.join(BUILD, htmlPath);
      ensureDir(path.dirname(outPath));

      const nav = buildNavTree(CONTENT, '', file.path);
      const pageHtml = renderPage(title, htmlContent, nav, file.path, searchIndex, tocHtml);
      fs.writeFileSync(outPath, pageHtml, 'utf-8');
      if (!firstFile) firstFile = { path: htmlPath, title };
    } catch (e) {
      console.error(`  ❌ Error processing ${file.path}: ${e.message}`);
    }
  }

  if (firstFile) {
    const redirect = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/${firstFile.path}"></head><body></body></html>`;
    fs.writeFileSync(path.join(BUILD, 'index.html'), redirect);
  }

  copyAssets();

  console.log(`\n  ✅ Site built in ./build/`);
  console.log(`  📂 Open ./build/index.html or serve with any static server\n`);
}

generateSite();
