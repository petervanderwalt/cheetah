const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ICONS = { Note: '📝', Tip: '💡', Warning: '⚠️', Danger: '🔥', Info: 'ℹ️' };

function convertFile(md) {
  let result = md;

  // Pass 1: fix corrupted emoji on already-converted blockquotes
  // Matches: "> GARBAGE **Tip**"  but not "> 💡 **Tip**"
  result = result.replace(/^> (?!\s*[📝💡⚠️🔥ℹ️])\S.*?\*\*(Note|Tip|Warning|Danger|Info)\*\*/gm, (m, word) => {
    const proper = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    return `> ${ICONS[proper] || ''} **${proper}**`;
  });

  // Pass 2: strip only the specific admonition div/span structure from prev conversion
  result = result.replace(/<\/?(div|span)[^>]*>/g, '');
  // Also strip any leftover HTML entity artifact lines that are just whitespace+closing tags
  result = result.replace(/^\s*\/\/\s*$/gm, '');

  // Pass 3: detect orphaned "  Tip\n\n    body" lines and convert to blockquotes
  const lines = result.split('\n');
  const out = [];
  let i = 0;
  let inCode = false;

  while (i < lines.length) {
    const cur = lines[i];
    if (/^```/.test(cur.trimStart())) { inCode = !inCode; out.push(cur); i++; continue; }
    if (inCode) { out.push(cur); i++; continue; }

    // Pass 4a: try to match orphaned "Tip" / "Note" heading
    const typeMatch = cur.trim().match(/^(?:[^\w]*?)(Note|Tip|Warning|Danger|Info)$/i);
    if (typeMatch) {
      const word = typeMatch[1];
      const proper = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      const icon = ICONS[proper] || '';
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const bodyStart = j;
      while (j < lines.length) {
        if (lines[j].trim() === '' && (j + 1 >= lines.length || !lines[j + 1].startsWith('  '))) break;
        j++;
      }
      const body = lines.slice(bodyStart, j).map(l => l.trim()).filter(l => l !== '');
      if (body.length > 0) {
        out.push(`> ${icon} **${proper}**`);
        for (const bl of body) out.push(bl ? `> ${bl}` : '>');
        i = j;
        continue;
      }
    }

    out.push(cur);
    i++;
  }

  return out.join('\n');
}

function scanFiles(dir) {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return results; }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'assets' || entry.name === 'tools' || entry.name === 'build') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanFiles(fullPath));
    else if (entry.name.endsWith('.md')) results.push(fullPath);
  }
  return results;
}

let converted = 0, skipped = 0;
for (const file of scanFiles(ROOT)) {
  const before = fs.readFileSync(file, 'utf-8');
  const after = convertFile(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf-8');
    const bq = (after.match(/^> [📝💡⚠️🔥ℹ️]/gm) || []).length;
    console.log(`  ✓ ${path.relative(ROOT, file)}  (${bq} admonitions)`);
    converted++;
  } else { skipped++; }
}
console.log(`\n  Done. ${converted} modified, ${skipped} unchanged.`);
