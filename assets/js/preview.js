class Preview {
  constructor(containerId, parser) {
    this.container = document.getElementById(containerId);
    this.parser = parser;
    this.currentContent = '';
    this.container.addEventListener('scroll', () => {
      if (this.onScroll) this.onScroll(this.getScrollPct());
    });
  }

  update(markdown) {
    this.currentContent = markdown || '';
    if (!markdown) {
      this.showEmpty();
      return;
    }
    try {
      const html = this.parser.parse(markdown);
      this.container.innerHTML = html;
      this.highlightCode();
    } catch (e) {
      this.container.innerHTML = `<div style="color:var(--error)">Render error: ${e.message}</div>`;
    }
  }

  updateWithBlocks(markdown) {
    this.currentContent = markdown || '';
    if (!markdown) {
      this.showEmpty();
      return;
    }
    try {
      const html = this.parser.parseWithBlocks(markdown);
      this.container.innerHTML = html;
      this.highlightCode();
      if (this.onBlockRendered) this.onBlockRendered();
    } catch (e) {
      this.container.innerHTML = `<div style="color:var(--error)">Render error: ${e.message}</div>`;
    }
  }

  showEmpty() {
    this.container.innerHTML = `
      <div class="empty-state">
        <div class="icon">\u{1f4d6}</div>
        <div class="text">Select a file to preview</div>
        <div class="hint">Your rendered documentation will appear here</div>
      </div>`;
  }

  highlightCode() {
    if (typeof hljs !== 'undefined') {
      this.container.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }

  getScrollPct() {
    const el = this.container;
    const maxScroll = el.scrollHeight - el.clientHeight;
    return maxScroll > 0 ? el.scrollTop / maxScroll : 0;
  }

  scrollToPct(pct) {
    const el = this.container;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = pct * maxScroll;
  }

  getBlockAtLine(lineNum) {
    const blocks = this.container.querySelectorAll('.editable-block');
    for (const block of blocks) {
      const start = parseInt(block.dataset.mdLineStart, 10);
      const end = parseInt(block.dataset.mdLineEnd, 10);
      if (lineNum >= start && lineNum <= end) return block;
    }
    return null;
  }

  getBlockElement(element) {
    return element.closest('.editable-block');
  }
}
