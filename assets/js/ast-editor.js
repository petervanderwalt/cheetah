class AstEditor {
  constructor(preview, editor) {
    this.preview = preview;
    this.editor = editor;
    this.editingBlock = null;
    this.setup();
  }

  setup() {
    this.preview.onBlockRendered = () => this.attachBlockEvents();
  }

  attachBlockEvents() {
    const blocks = this.preview.container.querySelectorAll('.editable-block');
    for (const block of blocks) {
      block.removeEventListener('dblclick', this.handleDblClick);
      block.addEventListener('dblclick', this.handleDblClick.bind(this));
    }
  }

  handleDblClick(e) {
    const block = e.target.closest('.editable-block');
    if (!block || block.classList.contains('editing')) return;
    e.stopPropagation();
    this.startEditing(block);
  }

  startEditing(block) {
    if (this.editingBlock) this.cancelEditing();
    this.editingBlock = block;
    block.classList.add('editing');

    const type = block.dataset.mdType;
    if (type === 'code') { this.editCodeBlock(block); return; }

    // For text blocks: use contentEditable for real-time WYSIWYG
    const target = block.querySelector('p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th, .admonition-body') || block;
    target.contentEditable = true;
    target.focus();

    // Store original markdown raw
    const raw = block.dataset.mdRaw || '';
    const lineStart = parseInt(block.dataset.mdLineStart, 10);
    const lineEnd = parseInt(block.dataset.mdLineEnd, 10);

    // Real-time: on each input, update markdown in editor textarea
    const inputHandler = () => {
      if (!this.editor.currentFile) return;
      const newText = target.textContent || '';
      if (lineStart >= 0 && lineEnd >= 0) {
        const lines = this.editor.textarea.value.split('\n');
        if (type === 'heading') {
          // Preserve the # markers
          const oldLine = lines[lineStart] || '';
          const prefix = oldLine.match(/^#{1,6}\s+/);
          lines[lineStart] = (prefix ? prefix[0] : '') + newText;
        } else {
          // For simple blocks, replace the whole range with the new text
          lines.splice(lineStart, lineEnd - lineStart + 1, newText);
        }
        const updated = lines.join('\n');
        this.editor.textarea.value = updated;
        this.editor.content = updated;
        this.editor.dirty = true;
        this.editor.updateHighlight();
        this.editor.updateStatus();
      }
    };

    target.addEventListener('input', inputHandler);

    const finish = () => {
      target.contentEditable = false;
      target.removeEventListener('input', inputHandler);
      this.commitEdit(block, target.textContent || '');
      block.classList.remove('editing');
      this.editingBlock = null;
    };

    target.addEventListener('blur', finish, { once: true });
    target.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { target.blur(); this.cancelEditing(); }
    });
  }

  editCodeBlock(block) {
    const codeEl = block.querySelector('code');
    if (!codeEl) return;

    const lineStart = parseInt(block.dataset.mdLineStart, 10);
    const lineEnd = parseInt(block.dataset.mdLineEnd, 10);
    const originalText = codeEl.textContent;
    const lines = this.editor.textarea.value.split('\n');
    const originalMdLines = lines.slice(lineStart, lineEnd + 1).join('\n');

    const textarea = document.createElement('textarea');
    textarea.value = originalText;
    textarea.style.cssText = 'width:100%;min-height:100px;font-family:monospace;padding:8px;border:1px solid #faa916;border-radius:4px;background:#f5f4f6;color:#1b1b1e;font-size:13px;';
    codeEl.style.display = 'none';
    codeEl.parentNode.insertBefore(textarea, codeEl);
    textarea.focus();

    const finish = () => {
      const newText = textarea.value;
      textarea.remove();
      codeEl.style.display = '';
      if (newText !== originalText) {
        const allLines = this.editor.textarea.value.split('\n');
        allLines.splice(lineStart, lineEnd - lineStart + 1, '```', newText, '```');
        const updated = allLines.join('\n');
        this.editor.textarea.value = updated;
        this.editor.content = updated;
        this.editor.dirty = true;
        this.editor.updateHighlight();
        this.editor.updateStatus();
        this.editor.save();
      }
      block.classList.remove('editing');
      this.editingBlock = null;
    };

    textarea.addEventListener('blur', finish, { once: true });
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { textarea.blur(); this.cancelEditing(); }
    });
  }

  async commitEdit(block, newText) {
    const lineStart = parseInt(block.dataset.mdLineStart, 10);
    const lineEnd = parseInt(block.dataset.mdLineEnd, 10);
    if (isNaN(lineStart)) return;

    // Already updated in textarea via real-time handler, now save to server
    if (this.editor.dirty) {
      await this.editor.save();
    }
  }

  cancelEditing() {
    if (this.editingBlock) {
      const editable = this.editingBlock.querySelector('[contenteditable]');
      if (editable) editable.contentEditable = false;
      this.editingBlock.classList.remove('editing');
      this.editingBlock = null;
    }
  }
}
