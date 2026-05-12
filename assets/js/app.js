(function () {
  let currentFilePath = null;

  const parser = new MarkdownParser();
  const editor = new Editor('editorTextarea', 'editorHighlight', 'status', 'filePath', 'editorTabs');
  const preview = new Preview('previewContent', parser);
  const fileTree = new FileTree('fileTree', onFileSelect, showNewModal);
  const astEditor = new AstEditor(preview, editor);

  let modalCallback = null;

  editor.onChange = (md) => {
    preview.update(md);
  };

  let scrollSyncing = false;
  editor.onScroll = (pct) => {
    if (scrollSyncing) return;
    scrollSyncing = true;
    preview.scrollToPct(pct);
    requestAnimationFrame(() => { scrollSyncing = false; });
  };
  preview.onScroll = (pct) => {
    if (scrollSyncing) return;
    scrollSyncing = true;
    editor.scrollToPct(pct);
    requestAnimationFrame(() => { scrollSyncing = false; });
  };

  editor.onTabSelect = (path) => {
    currentFilePath = path;
    editor.open(path);
  };

  function onFileSelect(path) {
    currentFilePath = path;
    if (path) editor.open(path);
  }

  function showNewModal(type, parentDir) {
    const overlay = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');
    const nameInput = document.getElementById('modalName');
    const orderInput = document.getElementById('modalOrder');
    const confirmBtn = document.getElementById('modalConfirm');
    const cancelBtn = document.getElementById('modalCancel');
    const hint = document.getElementById('modalHint');

    title.textContent = type === 'page' ? 'New Page' : 'New Section/Folder';
    hint.textContent = type === 'page'
      ? 'Leave order empty for alphabetical sorting. The filename will be auto-generated from the name.'
      : 'The folder will use the name as-is. Order controls sorting position.';
    nameInput.value = '';
    orderInput.value = '';
    overlay.style.display = 'flex';
    setTimeout(() => nameInput.focus(), 100);

    modalCallback = async () => {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      const order = orderInput.value ? parseInt(orderInput.value, 10) : null;
      overlay.style.display = 'none';

      if (type === 'page') {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const prefix = order != null ? String(order).padStart(2, '0') + '-' : '';
        const filename = prefix + slug + '.md';
        const filePath = parentDir ? `${parentDir}/${filename}` : filename;
        try {
          const res = await fetch('/api/create-file', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath, order })
          });
          if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed'); return; }
          fileTree.load().then(() => parser.setWikiLookup(fileTree.getWikiLookup()));
          onFileSelect(filePath);
        } catch (e) { alert('Failed to create file'); }
      } else {
        const prefix = order != null ? String(order).padStart(2, '0') + '-' : '';
        const dirname = prefix + name;
        const dirPath = parentDir ? `${parentDir}/${dirname}` : dirname;
        try {
          const res = await fetch('/api/create-folder', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: dirPath })
          });
          if (!res.ok) { const err = await res.json(); alert(err.error || 'Failed'); return; }
          fileTree.load().then(() => parser.setWikiLookup(fileTree.getWikiLookup()));
        } catch (e) { alert('Failed to create folder'); }
      }
    };

    confirmBtn.onclick = modalCallback;
    cancelBtn.onclick = () => { overlay.style.display = 'none'; };
    nameInput.onkeydown = (e) => { if (e.key === 'Enter') modalCallback(); if (e.key === 'Escape') overlay.style.display = 'none'; };
    overlay.onclick = (e) => { if (e.target === overlay) overlay.style.display = 'none'; };
  }

  function dialogOverlay() {
    return document.getElementById('dialogOverlay');
  }
  function dialogEl(id) {
    return document.getElementById(id);
  }

  window.showConfirmModal = function (message, callback, btnText) {
    const overlay = dialogOverlay();
    dialogEl('dialogTitle').textContent = 'Confirm';
    dialogEl('dialogMessage').textContent = message;
    dialogEl('dialogMessage').style.display = '';
    dialogEl('dialogInput').style.display = 'none';
    dialogEl('dialogConfirm').textContent = btnText || 'Confirm';
    dialogEl('dialogConfirm').className = 'btn btn-primary';
    overlay.style.display = 'flex';
    dialogEl('dialogConfirm').onclick = () => { overlay.style.display = 'none'; callback(true); };
    dialogEl('dialogCancel').onclick = () => { overlay.style.display = 'none'; callback(false); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.style.display = 'none'; callback(false); } };
    dialogEl('dialogCancel').focus();
  };

  window.showPromptModal = function (title, defaultValue, callback, btnText) {
    const overlay = dialogOverlay();
    dialogEl('dialogTitle').textContent = title;
    dialogEl('dialogMessage').style.display = 'none';
    const input = dialogEl('dialogInput');
    input.style.display = '';
    input.value = defaultValue || '';
    dialogEl('dialogConfirm').textContent = btnText || 'Rename';
    dialogEl('dialogConfirm').className = 'btn btn-primary';
    overlay.style.display = 'flex';
    setTimeout(() => { input.focus(); input.select(); }, 100);
    const submit = () => { overlay.style.display = 'none'; callback(input.value); };
    dialogEl('dialogConfirm').onclick = submit;
    dialogEl('dialogCancel').onclick = () => { overlay.style.display = 'none'; callback(null); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.style.display = 'none'; callback(null); } };
    input.onkeydown = (e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { overlay.style.display = 'none'; callback(null); } };
  };

  window.showAlertModal = function (message, title) {
    const overlay = dialogOverlay();
    dialogEl('dialogTitle').textContent = title || 'Error';
    dialogEl('dialogMessage').textContent = message;
    dialogEl('dialogMessage').style.display = '';
    dialogEl('dialogInput').style.display = 'none';
    dialogEl('dialogConfirm').textContent = 'OK';
    dialogEl('dialogConfirm').className = 'btn btn-primary';
    dialogEl('dialogCancel').style.display = 'none';
    overlay.style.display = 'flex';
    dialogEl('dialogConfirm').onclick = () => { overlay.style.display = 'none'; dialogEl('dialogCancel').style.display = ''; };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.style.display = 'none'; dialogEl('dialogCancel').style.display = ''; } };
    dialogEl('dialogConfirm').focus();
  };

  fileTree.load().then(() => {
    parser.setWikiLookup(fileTree.getWikiLookup());
  });

  let eventSource = null;
  function connectSSE() {
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'filechange') {
            if (data.event === 'change' && currentFilePath === data.path) {
              editor.open(data.path);
            }
            fileTree.refreshFile(data.path);
          }
        } catch {}
      };
      eventSource.onerror = () => {
        setTimeout(connectSSE, 3000);
      };
    } catch {}
  }
  connectSSE();

  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    handleDrop(e);
  });

  function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    for (const file of files) {
      if (file.type.startsWith('image/')) uploadImage(file);
    }
  }

  async function uploadImage(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      try {
        const res = await fetch('/api/upload', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, data: base64 })
        });
        if (res.ok) {
          const data = await res.json();
          editor.insertAtCursor(`![${file.name}](${data.url})`);
        }
      } catch (err) { console.warn('Upload failed:', err); }
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) uploadImage(file);
    e.target.value = '';
  });

  // Admonition picker toggle
  const picker = document.getElementById('admonitionPicker');
  document.getElementById('btnAdmonition').addEventListener('click', () => {
    picker.style.display = picker.style.display === 'none' ? '' : 'none';
  });
  document.querySelectorAll('.tb-pick').forEach(el => {
    el.addEventListener('click', () => {
      const kind = el.dataset.kind;
      const icons = { note: '📝', tip: '💡', warning: '⚠️', danger: '🔥', info: 'ℹ️' };
      const label = kind.charAt(0).toUpperCase() + kind.slice(1);
      const lines = `> ${icons[kind]} **${label}**\n> Content here\n`;
      editor.insertAtCursor(lines);
      picker.style.display = 'none';
    });
    el.addEventListener('mouseenter', () => el.style.background = 'var(--bg-hover, #eeedf0)');
    el.addEventListener('mouseleave', () => el.style.background = '');
  });
  // Close picker on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#admonitionWrap')) picker.style.display = 'none';
  });

  function handleToolbar(cmd) {
    if (!editor.currentFile) return;
    const ta = document.getElementById('editorTextarea');
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = ta.value.substring(start, end);
    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
    const curLine = ta.value.substring(lineStart, ta.value.indexOf('\n', lineStart) >= 0 ? ta.value.indexOf('\n', lineStart) : ta.value.length);
    let insert = '';

    switch (cmd) {
      case 'bold': insert = sel ? `**${sel}**` : '**bold text**'; break;
      case 'italic': insert = sel ? `*${sel}*` : '*italic text*'; break;
      case 'strike': insert = sel ? `~~${sel}~~` : '~~strikethrough~~'; break;
      case 'code-inline': insert = sel ? `\`${sel}\`` : '`code`'; break;
      case 'h1': insert = `\n# Heading\n`; break;
      case 'h2': insert = `\n## Heading\n`; break;
      case 'h3': insert = `\n### Heading\n`; break;
      case 'ul': insert = `\n- Item\n- Item\n`; break;
      case 'ol': insert = `\n1. Item\n2. Item\n`; break;
      case 'blockquote': insert = `\n> Blockquote\n`; break;
      case 'code-fence': insert = `\n\`\`\`\ncode\n\`\`\`\n`; break;
      case 'hr': insert = `\n---\n`; break;
      case 'table':
        insert = '\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n';
        break;
      case 'link': {
        const url = prompt('Enter URL:');
        if (!url) return;
        insert = sel ? `[${sel}](${url})` : `[link text](${url})`;
        break;
      }
      case 'image':
        document.getElementById('imageInput').click();
        return;
      case 'video': {
        const vurl = prompt('Enter YouTube or Vimeo URL:');
        if (!vurl) return;
        const yt = vurl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const vim = vurl.match(/vimeo\.com\/(\d+)/);
        if (yt) insert = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allowfullscreen></iframe>\n`;
        else if (vim) insert = `<iframe src="https://player.vimeo.com/video/${vim[1]}" width="560" height="315" frameborder="0" allowfullscreen></iframe>\n`;
        else { alert('Could not recognize URL. Use YouTube or Vimeo.'); return; }
        break;
      }
    }
    if (insert) editor.insertAtCursor(insert);
  }

  document.querySelectorAll('.tb-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Don't handle the admonition button here (separate handler)
      if (btn.id === 'btnAdmonition') return;
      handleToolbar(btn.dataset.cmd);
    });
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); editor.save(); }
  });

  document.getElementById('btnDeploy').addEventListener('click', async () => {
    const btn = document.getElementById('btnDeploy');
    const orig = btn.textContent;
    if (typeof window.showPromptModal === 'function') {
      window.showPromptModal('Base URL (e.g. /repo-name)', '', (prefix) => {
        if (prefix === null) return;
        doDeploy(prefix);
      }, 'Deploy');
    } else {
      doDeploy('');
    }
  });

  async function doDeploy(prefix) {
    const btn = document.getElementById('btnDeploy');
    const orig = btn.textContent;
    btn.textContent = 'Building...';
    btn.disabled = true;
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix })
      });
      if (!res.ok) { const err = await res.json(); (window.showAlertModal || alert)(err.error || 'Build failed'); return; }
      (window.showAlertModal || alert)('Build complete. Transfer the contents of the BUILD directory to your server.');
    } catch (e) {
      (window.showAlertModal || alert)('Build failed');
    } finally {
      btn.textContent = orig;
      btn.disabled = false;
    }
  }

  function addCopyButtons() {
    document.querySelectorAll('.preview-content pre').forEach(pre => {
      if (pre.querySelector('.copy-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.style.cssText = 'position:absolute;top:4px;right:4px;padding:2px 8px;font-size:0.7rem;background:var(--bg-alt,#eef0ff);border:1px solid var(--border,#dee2e6);border-radius:4px;cursor:pointer;opacity:0;transition:opacity 0.15s;z-index:5';
      pre.style.position = 'relative';
      pre.appendChild(btn);
      pre.addEventListener('mouseenter', () => btn.style.opacity = '1');
      pre.addEventListener('mouseleave', () => btn.style.opacity = '0');
      btn.addEventListener('click', async () => {
        const code = pre.querySelector('code') || pre;
        try {
          await navigator.clipboard.writeText(code.textContent);
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        } catch { btn.textContent = 'Failed'; }
      });
    });
  }

  const origUpdate = preview.update.bind(preview);
  preview.update = function (md) { origUpdate(md); addCopyButtons(); };

  console.log('  Docs Editor initialized');
  console.log('  Ctrl+S to save | Use toolbar for formatting');
})();
