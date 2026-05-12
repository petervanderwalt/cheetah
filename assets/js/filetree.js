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
    this.setupContextMenu();
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
          lookup[noExt.toLowerCase()] = { htmlPath: noExt + '.html' };
          const nameOnly = item.name.replace(/\.md$/, '').replace(/^\d+-/, '');
          lookup[nameOnly.toLowerCase()] = { htmlPath: noExt + '.html' };
        }
        if (item.children) walk(item.children);
      }
    };
    walk(this.tree);
    return lookup;
  }

  render() {
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
        header.textContent = item.name;
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
        header.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showContextMenu(e, item);
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

        const displayName = item.name.replace(/\.md$/, '');
        div.appendChild(document.createTextNode(displayName));

        div.addEventListener('click', () => {
          this.select(item.path);
        });
        div.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showContextMenu(e, item);
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

  setupContextMenu() {
    this.menu = document.getElementById('contextMenu');
    if (!this.menu) return;
    this.menuItem = null;
    this.menuType = null;

    document.addEventListener('click', () => this.hideContextMenu());
    document.addEventListener('contextmenu', () => this.hideContextMenu());

    this.menu.addEventListener('click', (e) => e.stopPropagation());
    this.menu.addEventListener('contextmenu', (e) => e.stopPropagation());

    document.getElementById('ctxRename').addEventListener('click', () => {
      if (this.menuItem) this.renameItem(this.menuItem);
      this.hideContextMenu();
    });
    document.getElementById('ctxDelete').addEventListener('click', () => {
      if (this.menuItem) this.deleteItem(this.menuItem);
      this.hideContextMenu();
    });
    document.getElementById('ctxMove').addEventListener('click', () => {
      if (this.menuItem) this.moveItem(this.menuItem);
      this.hideContextMenu();
    });
  }

  showContextMenu(e, item) {
    this.menuItem = item;
    this.menuType = item.type;

    document.getElementById('ctxRename').style.display = '';
    document.getElementById('ctxMove').style.display = '';
    document.getElementById('ctxDelete').style.display = '';

    if (item.type === 'directory') {
      document.getElementById('ctxRename').textContent = 'Rename folder';
      document.getElementById('ctxMove').textContent = 'Move to folder';
      document.getElementById('ctxDelete').textContent = 'Delete folder';
    } else {
      document.getElementById('ctxRename').textContent = 'Rename';
      document.getElementById('ctxMove').textContent = 'Move to folder';
      document.getElementById('ctxDelete').textContent = 'Delete';
    }

    this.menu.style.left = e.clientX + 'px';
    this.menu.style.top = e.clientY + 'px';
    this.menu.style.display = 'block';
  }

  hideContextMenu() {
    if (this.menu) this.menu.style.display = 'none';
  }

  async renameItem(item) {
    const oldName = item.name;
    if (typeof window.showPromptModal !== 'function') {
      const newName = prompt('Rename:', oldName);
      if (!newName || newName === oldName) return;
      this.doRename(item, newName);
      return;
    }
    window.showPromptModal('Rename', oldName, (newName) => {
      if (!newName || newName === oldName) return;
      this.doRename(item, newName);
    });
  }

  async doRename(item, newName) {
    try {
      const res = await fetch('/api/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path, newName })
      });
      if (!res.ok) { const err = await res.json(); (window.showAlertModal || alert)(err.error || 'Rename failed'); return; }
      const data = await res.json();
      await this.load();
      this.select(data.path);
    } catch (e) { alert('Rename failed'); }
  }

  async deleteItem(item) {
    const label = item.type === 'directory' ? 'folder' : 'file';
    const msg = `Move ${label} "${item.name}" to trash?`;
    if (typeof window.showConfirmModal === 'function') {
      window.showConfirmModal(msg, (confirmed) => {
        if (!confirmed) return;
        this.doDelete(item);
      });
    } else {
      if (!confirm(msg)) return;
      this.doDelete(item);
    }
  }

  async doDelete(item) {
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path })
      });
      if (!res.ok) { const err = await res.json(); (window.showAlertModal || alert)(err.error || 'Delete failed'); return; }
      if (item.path === this.currentPath) {
        this.currentPath = null;
        if (this.onSelect) this.onSelect('');
      }
      await this.load();
    } catch (e) { alert('Delete failed'); }
  }

  async moveItem(item) {
    try {
      const res = await fetch('/api/folders');
      const folders = await res.json();
      const currentDir = item.type === 'directory' ? item.path : item.path.split('/').slice(0, -1).join('/');
      const available = folders.filter(f => f !== item.path && !f.startsWith(item.path + '/'));
      this.showFolderPicker(available, currentDir, async (destination) => {
        try {
          const r = await fetch('/api/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: item.path, destination })
          });
          if (!r.ok) { const err = await r.json(); alert(err.error || 'Move failed'); return; }
          const data = await r.json();
          await this.load();
          this.select(data.path);
        } catch (e) { alert('Move failed'); }
      });
    } catch (e) { alert('Failed to load folders'); }
  }

  showFolderPicker(folders, currentDir, callback) {
    const overlay = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const body = document.querySelector('.modal-body');
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    const nameInput = document.getElementById('modalName');
    const orderInput = document.getElementById('modalOrder');
    const hint = document.getElementById('modalHint');

    title.textContent = 'Move to folder';
    nameInput.style.display = 'none';
    orderInput.style.display = 'none';
    hint.style.display = 'none';

    let select = body.querySelector('.folder-select');
    if (!select) {
      select = document.createElement('select');
      select.className = 'folder-select';
      select.style.cssText = 'width:100%;padding:8px 12px;margin-top:8px;background:var(--bg-alt);color:var(--text);border:1px solid var(--border);border-radius:6px;font-size:0.9rem;outline:none;font-family:var(--font-sans)';
      body.appendChild(select);
    }
    select.style.display = '';
    select.innerHTML = '';
    for (const f of folders) {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f || '(root)';
      select.appendChild(opt);
    }

    overlay.style.display = 'flex';

    const cleanup = () => {
      overlay.style.display = 'none';
      select.style.display = 'none';
      nameInput.style.display = '';
      orderInput.style.display = '';
      hint.style.display = '';
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    confirmBtn.onclick = () => {
      const dest = select.value;
      cleanup();
      callback(dest);
    };
    cancelBtn.onclick = cleanup;
  }
}
