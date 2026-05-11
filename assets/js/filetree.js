class FileTree {
  constructor(containerId, onSelect, onNewFile) {
    this.container = document.getElementById(containerId);
    this.onSelect = onSelect;
    this.onNewFile = onNewFile;
    this.tree = [];
    this.currentPath = null;
    this.expandedDirs = new Set();
    this.currentDir = null;
    this.renderToolbar();
  }

  renderToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'file-tree-toolbar';
    const mkPage = document.createElement('button');
    mkPage.className = 'btn';
    mkPage.textContent = '+ Page';
    mkPage.title = 'New page in current folder';
    mkPage.addEventListener('click', () => this.onNewFile('page', this.currentDir));
    toolbar.appendChild(mkPage);
    const mkSection = document.createElement('button');
    mkSection.className = 'btn';
    mkSection.textContent = '+ Folder';
    mkSection.title = 'New section/folder';
    mkSection.addEventListener('click', () => this.onNewFile('folder', this.currentDir));
    toolbar.appendChild(mkSection);
    this.container.prepend(toolbar);
  }

  async load() {
    try {
      const res = await fetch('/api/tree');
      this.tree = await res.json();
      this.render();
      return this.tree;
    } catch (e) {
      this.container.innerHTML = '<div class="tree-item" style="color:var(--error)">Failed to load files</div>';
      return [];
    }
  }

  getWikiLookup() {
    const lookup = {};
    const walk = (items) => {
      for (const item of items) {
        if (item.type === 'file') {
          const noExt = item.path.replace(/\.md$/, '');
          lookup[noExt.toLowerCase()] = { htmlPath: noExt + '.html', title: item.title };
          const nameOnly = item.name.replace(/\.md$/, '').replace(/^\d+-/, '');
          lookup[nameOnly.toLowerCase()] = { htmlPath: noExt + '.html', title: item.title };
          if (item.title) lookup[item.title.toLowerCase()] = { htmlPath: noExt + '.html', title: item.title };
        }
        if (item.children) walk(item.children);
      }
    };
    walk(this.tree);
    return lookup;
  }

  render() {
    const treeEl = this.container.querySelector('.file-tree');
    const existing = this.container.querySelector('ul.file-tree');
    if (existing) existing.remove();
    const ul = document.createElement('ul');
    ul.className = 'file-tree';
    this.renderItems(this.tree, ul, 0);
    this.container.appendChild(ul);
  }

  renderItems(items, parentEl, depth) {
    for (const item of items) {
      const li = document.createElement('li');
      if (item.type === 'directory') {
        const isOpen = this.expandedDirs.has(item.path);
        const header = document.createElement('div');
        header.className = 'tree-item folder-label';
        header.style.paddingLeft = `${12 + depth * 12}px`;
        header.textContent = item.name.replace(/^\d+-/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        li.appendChild(header);

        const childUl = document.createElement('ul');
        childUl.className = 'nested';
        if (isOpen) childUl.classList.add('open');
        if (item.children) this.renderItems(item.children, childUl, depth + 1);
        li.appendChild(childUl);

        header.addEventListener('click', (e) => {
          e.stopPropagation();
          this.currentDir = item.path;
          if (this.expandedDirs.has(item.path)) {
            this.expandedDirs.delete(item.path);
          } else {
            this.expandedDirs.add(item.path);
          }
          this.render();
        });
        header.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          this.currentDir = item.path;
          this.onNewFile('page', item.path);
        });
      } else if (item.type === 'file') {
        const div = document.createElement('div');
        div.className = 'tree-item';
        if (item.path === this.currentPath) div.classList.add('active');
        div.style.paddingLeft = `${12 + depth * 12}px`;
        div.dataset.path = item.path;

        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = '\u{1f4c4}';
        div.appendChild(icon);

        const name = document.createElement('span');
        const displayName = item.title || item.name.replace(/\.md$/, '');
        name.textContent = displayName;
        div.appendChild(name);

        div.addEventListener('click', () => {
          this.select(item.path);
        });
        li.appendChild(div);
      }
      parentEl.appendChild(li);
    }
  }

  select(path) {
    this.currentPath = path;
    const parts = path.split('/');
    this.currentDir = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
    this.render();
    this.expandToPath(path);
    if (this.onSelect) this.onSelect(path);
  }

  expandToPath(path) {
    const parts = path.split('/');
    let accumulated = '';
    for (let i = 0; i < parts.length - 1; i++) {
      accumulated = accumulated ? `${accumulated}/${parts[i]}` : parts[i];
      this.expandedDirs.add(accumulated);
    }
    this.render();
    this.scrollToActive();
  }

  scrollToActive() {
    const active = this.container.querySelector('.tree-item.active');
    if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  refreshFile(path) {
    const current = this.currentPath;
    this.load().then(() => {
      if (current) {
        this.currentPath = current;
        this.render();
      }
    });
  }
}
