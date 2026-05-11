# ![](https://img.shields.io/badge/state-bleeding--edge-orange) ![](https://img.shields.io/badge/dependencies-5-green) ![](https://img.shields.io/badge/frameworks-zero-brightgreen)

# cheetah — fastest on the savanna

> The cheetah *(Acinonyx jubatus)* — 0 to 60 in three seconds.  
> Not a fighter. A hunter. Built for speed, efficiency, and knowing exactly when to strike.  
> Your documentation tool should be the same.

---

**cheetah** eats Docusaurus for breakfast. Wiki.js is still resolving dependencies. GitBook got declawed somewhere around the first bend.

Not by fighting. By being faster, leaner, and built for the terrain you actually run on. The internet loves cats — and this one does the work.

cheetah is a lightweight, filesystem-native Markdown documentation editor and static site generator. It runs on your laptop, edits files on your disk, builds to HTML you can FTP to a potato — and it does it without a single line of React, Vue, Angular, Docker, or database. Five dependencies. Zero frameworks. One purpose: get out of your way.

---

## Why cheetah outpaces everything else

### vs Docusaurus
- Docusaurus needs Node 18+, a React build pipeline, npm packages, and a team of priests to exorcise the dependency tree when something breaks  
- **cheetah** needs `npm install` (5 deps) and `npm run edit`. That's it.  
- Docusaurus converts your entire workflow into a proprietary React black box. Good luck diffing those JSX templates  
- **cheetah** keeps every `.md` file pristine. Your git history stays readable. AI agents can edit files directly  
- Docusaurus forces a specific folder convention. cheetah doesn't care — your structure, your rules  

### vs Wiki.js
- Wiki.js requires a PostgreSQL/MySQL/SQLite database. You're running a wiki platform just to edit text files  
- **cheetah** has zero database. The filesystem *is* the database  
- Wiki.js is a full web application that needs to be deployed, secured, backed up, and maintained  
- **cheetah** is a folder with a build script. Deploy to any dumb FTP server, GitHub Pages, nginx, or Apache  
- Wiki.js has a proprietary editor that stores content in a database. Try diffing that in git  
- **cheetah** edits `.md` files on disk. `git diff` works perfectly. AI edits work perfectly  

### vs GitBook / ReadTheDocs
- GitBook is SaaS. Your docs live on someone else's server. You pay monthly to edit text  
- **cheetah** lives on your machine. Free. Offline. Yours  
- ReadTheDocs requires Sphinx/RST. RST is a dead language walking  
- **cheetah** uses Markdown. Everyone knows Markdown. Every AI knows Markdown  

### vs VuePress / Nextra / etc
- Every single one of these requires a JS framework build pipeline. Hours of config. Breaking changes with every major version  
- **cheetah** is vanilla HTML + CSS + JS on the frontend. Node.js only for local tooling. No framework lock-in. Zero build steps for the editor  

---

## What you get

| Feature | **[cheetah]** | Docusaurus | Wiki.js |
|---------|------|-----------|---------|
| Files are the source of truth | **Yes** | No (rendered output) | No (database) |
| AI-editable files | **Yes** | No | No |
| Git-friendly diffs | **Yes** | Mostly | No |
| Zero database | **Yes** | Yes | No |
| Live preview editor | **Yes** | Yes | Yes |
| Editable rendered blocks | **Yes** | No | No |
| Wiki links [[like this]] | **Yes** | Plugin | Yes |
| Markdown callout blocks (pure markdown) | **Yes** | Plugin | Plugin |
| Click-to-copy code | **Yes** | Yes | Yes |
| TOC with anchors | **Yes** | Yes | Yes |
| Image/video insertion | **Yes** | Yes | Yes |
| File ordering (frontmatter) | **Yes** | Filename only | Sort UI |
| Offline | **Yes** | Yes | No |
| FTP deploy | **Yes** | Yes | No |
| npm dependencies | **5** | 1000+ | 500+ |
| Tax on a 2015 laptop | None | Yes | Yes |

---

## Quick start



```bash
# In your docs folder:
npm install
npm run edit
# Opens editor at http://localhost:3000
```

```bash
# Build static site:
npm run deploy
# Output in ./build — ready to FTP
```

---

## The philosophy

**Markdown files on disk are the only source of truth.**

Everything operates directly on `.md` files. The editor reads and writes files. The static site generator reads files and outputs HTML. There is no database, no CMS, no hidden state. Your documentation is a folder with text files — the way it should be.

This means:
- **AI agents** can edit files directly without knowing anything about cheetah
- **git diff** shows exactly what changed
- **No vendor lock-in** — your docs are plain Markdown, portable anywhere
- **Offline-first** — works without internet

The editor gives you:
- A file tree
- A Markdown source pane with syntax highlighting
- A live rendered preview pane that updates as you type
- Double-click any rendered block to edit it in WYSIWYG mode
- Drag-and-drop images
- Formatting toolbar (Bold, Italic, Heading, Link, Image, Video)
- Create new pages and sections with ordering
- Keyboard shortcuts

The build gives you:
- Static HTML pages with navigation
- Table of contents with heading anchors
- Search index
- Click-to-copy on code blocks
- Admonition/callout styling
- CSS that works on any hosting

---

## Project structure

```
docs/
├── 01-Getting-Started/     # Your content (numbered for ordering)
├── assets/                 # Editor frontend
│   ├── index.html
│   ├── css/editor.css
│   ├── css/highlight.css
│   └── js/
│       ├── app.js          # Main orchestrator
│       ├── editor.js       # Textarea + syntax highlighting
│       ├── filetree.js     # File tree
│       ├── markdown-parser.js  # Marked + wiki links
│       ├── preview.js      # Live preview
│       └── ast-editor.js   # WYSIWYG block editing
├── tools/
│   ├── edit-server.js      # Local Express server
│   ├── build.js            # Static site generator
│   └── convert-admonitions.js  # One-time ::-converter
├── build/                  # Generated site
└── package.json
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `npm run edit` | Start the local editor at localhost:3000 |
| `npm run deploy` | Build static site to ./build |

---

## ## The name

**cheetah** — because the internet runs on cat pictures, and your documentation should move like one.

---

Built with

- [marked](https://marked.js.org/) — Markdown parser (the only real dependency)
- [Express](https://expressjs.com/) — Local dev server
- [chokidar](https://github.com/paulmillr/chokidar) — File watching
- [gray-matter](https://github.com/jonschlinkert/gray-matter) — Frontmatter parsing
- [highlight.js](https://highlightjs.org/) — Code syntax highlighting
- Vanilla JS, CSS, HTML — no frameworks

---

## License

Do what you want. It's documentation.
