const fs = require('fs');
const path = require('path');

const fp = path.resolve(__dirname, '..', 'content', 'markdown', '01-Getting-Started', '03-controller-support.md');
let content = fs.readFileSync(fp, 'utf-8');

// Extract all rows from the mangled content
const rows = [];
// Match: | [name](url) possibly-more-text | image | [driver](url) | [builder](url) |
const re = /\|\s*\[([^\]]+)\]\(([^)]+)\)(?:[^|]*?)\|\s*(?:!\[[^\]]*\]\([^)]*\))?\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|/g;
let m;
while ((m = re.exec(content)) !== null) {
  rows.push({
    name: m[1], nameUrl: m[2],
    driver: m[3], driverUrl: m[4],
    builder: m[5], builderUrl: m[6]
  });
}
console.log('Extracted ' + rows.length + ' rows');

const imageMap = {
  '6-Pack CNC Controller': '6pack.jpg',
  'Arduino CNC shield': 'arduinocncshield.webp',
  'Arduino Due': 'due.webp',
  'Bigtreetech Octopus MAX EZ': 'octopus_max_ez.webp',
  'Bigtreetech Octopus': 'octopus.webp',
  'Bigtreetech Rodent': 'rodent.webp',
  'Bigtreetech Scylla': 'schylla.webp',
  'Bigtreetech SKR 3': 'bttskr3.webp',
  'Bigtreetech SKR MINI E3 V2.0': 'mini_e3.webp',
  'Bigtreetech SKR PICO': 'pico.webp',
  'Bigtreetech SKR V1.4 Turbo': 'skr1.4.webp',
  'BlackBox X32': 'blackboxx32.jpg',
  'WeAct Blackpill': 'blackpill.jpg',
  'DLC32': 'dlc32.png',
  'Flexi-HAL': 'flexihal.webp',
  'Fysetc E4': 'fysetce4.png',
  'Fysetc S6': 'fysetcs6.webp',
  'MKS SBASE': 'MKS-SBASE-V1.3.jpg',
  'MSP430F5529': 'MSP430F5529 LaunchPad.png',
  'Nucleo F411RE': 'Nucleo F411RE.avif',
  'PicoBOB G540': 'picobob.webp',
  'PicoCNC': 'picocnc.jpg',
  'Protoneer': 'protoneer.webp',
  'Smoothieboard': 'smoothieboard.jpg',
  'SLB EXT': 'slbext.jpg',
  'SLB': 'slb.jpg',
  'TinyBee': 'tinybee.jpg',
  'TM4C123G': 'TM4C123G.png',
  'WeAct MiniSTM32H7': 'weact ministm32h7.jpg',
  'xPro V5': 'xprov5.webp',
  'GRBLHAL2000': 'grblhal2000.jpeg'
};

function findImg(name) {
  let best = null;
  for (const [k, v] of Object.entries(imageMap)) {
    if (name.includes(k)) { if (!best || k.length > best.length) best = v; }
  }
  // Direct key lookup
  if (imageMap[name]) return imageMap[name];
  return best;
}

// Reconstruct the full name cell from the original content for rows with 'with'
function getOriginalNameCell(row, origContent) {
  // Try to find the row in the original content
  const safe = row.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re2 = new RegExp('\\|\\s*\\[?' + safe + '[^|]*\\|');
  const match = re2.exec(origContent);
  if (match) return match[0].replace(/^\|\s*/, '').replace(/\s*\|$/, '');
  return '[' + row.name + '](' + row.nameUrl + ')';
}

// Build output
let out = '---\ntitle: "Hardware Selection"\n---\n\n';
out += '# Controller Support\n\n';
out += 'This page provides a list of grblHAL-supported controllers, links to the appropriate drivers, and the Web Builer tool for building the firmware\n\n';
out += '| Controller | Product Image | Driver | WebBuilder |\n';
out += '| :--- | :--- | :--- | :--- |\n';

for (const row of rows) {
  const imgFile = findImg(row.name) || '';
  const imgCell = imgFile ? '![](/images/controllers/' + imgFile + ')' : '';
  const nameCell = getOriginalNameCell(row, content);
  out += '| ' + nameCell + ' | ' + imgCell + ' | [' + row.driver + '](' + row.driverUrl + ') | [' + row.builder + '](' + row.builderUrl + ') |\n';
}

fs.writeFileSync(fp, out, 'utf-8');
console.log('Written ' + rows.length + ' rows');
