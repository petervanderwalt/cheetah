class Editor {
  constructor(textareaId, highlightId, statusId, filePathId, tabsId) {
    this.textarea = document.getElementById(textareaId);
    this.highlight = document.getElementById(highlightId);
    this.statusEl = document.getElementById(statusId);
    this.filePathEl = document.getElementById(filePathId);
    this.tabsEl = document.getElementById(tabsId);

    this.currentFile = null;
    this.content = '';
    this.savedContent = '';
    this.dirty = false;
    this.autosaveTimer = null;
    this.tabs = [];
    this.activeTab = null;

    this.setupEvents();
  }

  setupEvents() {
    this.textarea.addEventListener('scroll', () => {
      this.highlight.scrollTop = this.textarea.scrollTop;
      this.highlight.scrollLeft = this.textarea.scrollLeft;
      if (this.onScroll) this.onScroll(this.getScrollPct());
    });

    this.textarea.addEventListener('input', () => {
      this.content = this.textarea.value;
      this.dirty = this.content !== this.savedContent;
      this.updateHighlight();
      this.updateStatus();
      this.scheduleAutosave();
      if (this.onChange) this.onChange(this.content);
    });

    this.textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.save();
      }
      // Ctrl+F: browser native find
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        this.textarea.value = this.textarea.value.substring(0, start) + '    ' + this.textarea.value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
        this.textarea.dispatchEvent(new Event('input'));
      }
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const val = this.textarea.value;
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        if (val.substring(lineStart, lineStart + 4) === '    ') {
          this.textarea.value = val.substring(0, lineStart) + val.substring(lineStart + 4);
          this.textarea.selectionStart = this.textarea.selectionEnd = start - 4;
          this.textarea.dispatchEvent(new Event('input'));
        }
      }
    });

    document.getElementById('btnSave').addEventListener('click', () => this.save());
  }

  async open(path) {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      this.currentFile = path;
      this.content = data.content;
      this.savedContent = data.content;
      this.dirty = false;
      this.textarea.value = this.content;
      this.textarea.disabled = false;
      this.filePathEl.textContent = path;
      this.updateHighlight();
      this.updateStatus();
      this.setStatus('saved', 'File loaded');
      this.addTab(path);
      if (this.onChange) this.onChange(this.content);
      this.textarea.focus({preventScroll: true});
      requestAnimationFrame(() => {
        this.textarea.scrollTop = 0;
        this.textarea.selectionStart = 0;
        this.textarea.selectionEnd = 0;
        requestAnimationFrame(() => {
          this.textarea.scrollTop = 0;
          this.textarea.selectionStart = 0;
          this.textarea.selectionEnd = 0;
        });
      });
    } catch (e) {
      this.setStatus('error', 'Failed to load file');
    }
  }

  async save() {
    if (!this.currentFile) return;
    this.setStatus('saving', 'Saving...');
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(this.currentFile)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: this.textarea.value })
      });
      if (!res.ok) throw new Error('Save failed');
      this.savedContent = this.textarea.value;
      this.content = this.textarea.value;
      this.dirty = false;
      this.setStatus('saved', 'Saved');
      this.updateStatus();
    } catch (e) {
      this.setStatus('error', 'Save failed');
    }
  }

  scheduleAutosave() {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      if (this.dirty) this.save();
    }, 3000);
  }

  setStatus(type, msg) {
    this.statusEl.className = `status ${type}`;
    this.statusEl.textContent = msg;
  }

  updateStatus() {
    if (this.statusEl.className.includes('saving') || this.statusEl.className.includes('error')) return;
    if (this.dirty) {
      this.statusEl.className = 'status saving';
      this.statusEl.textContent = 'Unsaved changes';
    } else {
      this.statusEl.className = 'status saved';
      this.statusEl.textContent = 'Saved';
    }
  }

  updateHighlight() {
    const md = this.textarea.value;
    this.highlight.innerHTML = this.highlightSyntax(md);
  }

  getScrollPct() {
    const el = this.textarea;
    const maxScroll = el.scrollHeight - el.clientHeight;
    return maxScroll > 0 ? el.scrollTop / maxScroll : 0;
  }

  scrollToPct(pct) {
    const el = this.textarea;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = pct * maxScroll;
  }

  highlightSyntax(text) {
    if (!text) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let html = '';
    let i = 0;
    const rules = [
      { pattern: /^(---[\s\S]*?---)\n?/gm, repl: (m) => `<span class="hl-frontmatter">${m}</span>` },
      { pattern: /(^#{1,6}\s+.*$)/gm, repl: (m) => `<span class="hl-heading">${m}</span>` },
      { pattern: /(\*\*.*?\*\*)/g, repl: (m) => `<span class="hl-bold">${m}</span>` },
      { pattern: /(\*.*?\*)/g, repl: (m) => `<span class="hl-italic">${m}</span>` },
      { pattern: /(`[^`]+`)/g, repl: (m) => `<span class="hl-code">${m}</span>` },
      { pattern: /(\[.*?\]\(.*?\))/g, repl: (m) => `<span class="hl-link">${m}</span>` },
      { pattern: /(!\[.*?\]\(.*?\))/g, repl: (m) => `<span class="hl-image">${m}</span>` },
      { pattern: /^(\s*[-*+]\s)/gm, repl: (m) => `<span class="hl-list">${m}</span>` },
      { pattern: /^(\s*\d+\.\s)/gm, repl: (m) => `<span class="hl-list">${m}</span>` },
      { pattern: /^(>.*)$/gm, repl: (m) => `<span class="hl-blockquote">${m}</span>` },
      { pattern: /^(---|\*\*\*)$/gm, repl: (m) => `<span class="hl-hr">${m}</span>` },
      { pattern: /(```[\s\S]*?```)/g, repl: (m) => `<span class="hl-code">${m}</span>` },
    ];

    let result = escaped;
    for (const rule of rules) {
      result = result.replace(rule.pattern, rule.repl);
    }
    return result.replace(/\n/g, '<br>');
  }

  addTab(path) {
    const name = path.split('/').pop().replace(/\.md$/, '');
    if (!this.tabs.includes(path)) {
      this.tabs.push(path);
    }
    this.activeTab = path;
    this.renderTabs();
  }

  closeTab(path) {
    const idx = this.tabs.indexOf(path);
    if (idx >= 0) {
      this.tabs.splice(idx, 1);
      if (this.activeTab === path) {
        if (this.tabs.length > 0) {
          const nextTab = this.tabs[Math.min(idx, this.tabs.length - 1)];
          this.activeTab = nextTab;
          if (this.onTabSelect) this.onTabSelect(nextTab);
          this.open(nextTab);
        } else {
          this.activeTab = null;
          this.clear();
        }
      }
    }
    this.renderTabs();
  }

  renderTabs() {
    this.tabsEl.innerHTML = '';
    for (const tab of this.tabs) {
      const div = document.createElement('div');
      div.className = `tab${tab === this.activeTab ? ' active' : ''}`;
      const name = tab.split('/').pop().replace(/\.md$/, '');
      div.textContent = name;
      const close = document.createElement('span');
      close.className = 'close-tab';
      close.textContent = '\u00d7';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeTab(tab);
      });
      div.appendChild(close);
      div.addEventListener('click', () => {
        if (tab !== this.activeTab) {
          this.activeTab = tab;
          if (this.onTabSelect) this.onTabSelect(tab);
          this.open(tab);
        }
      });
      this.tabsEl.appendChild(div);
    }
  }

  clear() {
    this.currentFile = null;
    this.content = '';
    this.savedContent = '';
    this.dirty = false;
    this.textarea.value = '';
    this.textarea.disabled = true;
    this.highlight.innerHTML = '';
    this.filePathEl.textContent = 'No file open';
    this.setStatus('saved', '');
    if (this.onChange) this.onChange('');
  }

  insertAtCursor(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    this.textarea.value = this.textarea.value.substring(0, start) + text + this.textarea.value.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
    this.textarea.dispatchEvent(new Event('input'));
  }
}
