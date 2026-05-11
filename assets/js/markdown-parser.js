class MarkdownParser {
  constructor() {
    this.ready = false;
    this.wikiLookup = {};
    this.loadMarked();
  }

  setWikiLookup(data) {
    this.wikiLookup = data || {};
  }

  async loadMarked() {
    if (typeof marked !== 'undefined') {
      this.setup();
      return;
    }
    try {
      const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js');
      eval(await res.text());
      this.setup();
    } catch {
      this.fallbackParse = true;
      this.ready = true;
    }
  }

  setup() {
    const self = this;

    const wikiLinkExt = {
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
        const resolved = self.wikiLookup[key];
        if (resolved) {
          return `<a href="/${resolved.htmlPath}">${token.text}</a>`;
        }
        return `<a class="wiki-broken" href="#">${token.text}</a>`;
      }
    };

    try {
      marked.use({ extensions: [wikiLinkExt] });
    } catch (e) {
      console.warn('Wiki link extension failed:', e);
    }

    this.renderer = new marked.Renderer();
    this.ready = true;
  }

  parse(md) {
    if (!this.ready) return md;
    try {
      return marked.parse(md, { renderer: this.renderer });
    } catch (e) {
      console.warn('Markdown parse error:', e);
      return `<pre>${this.escape(md)}</pre>`;
    }
  }

  parseWithBlocks(md) {
    if (!this.ready) return this.parse(md);
    const tokens = marked.lexer(md);
    let html = '';
    let mdPos = 0;
    const mdLines = md.split('\n');

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.type === 'space') continue;

      const rawStart = md.indexOf(token.raw, mdPos);
      let lineStart = 0, lineEnd = 0;

      if (rawStart >= 0) {
        const beforeRaw = md.substring(0, rawStart);
        lineStart = beforeRaw.split('\n').length - 1;
        lineEnd = lineStart + token.raw.split('\n').length - 1;
        mdPos = rawStart + token.raw.length;
      } else {
        mdPos = md.indexOf(token.raw, mdPos + 1);
        if (mdPos < 0) mdPos = md.length;
        continue;
      }

      const tokenHtml = marked.Renderer.prototype[token.type]
        ? marked.Renderer.prototype[token.type].call(this.renderer, token)
        : this.parser.parse([token]);

      // Map known types to edit-friendly categories
      let editType = 'text';
      if (['heading', 'paragraph', 'list', 'blockquote'].includes(token.type)) editType = 'text';
      else if (token.type === 'code') editType = 'code';
      else if (token.type === 'table') editType = 'table';
      else if (token.type === 'admonition') editType = 'admonition';

      html += `<div class="editable-block" data-md-type="${editType}" data-md-line-start="${lineStart}" data-md-line-end="${lineEnd}" data-md-raw="${this.escapeAttr(token.raw)}">${tokenHtml}</div>\n`;
    }

    return html;
  }

  escape(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  escapeAttr(text) {
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
