// Bundles index.html + src/ into one self-contained file: dist/bitforge8.html
// Usage: node tools/build.mjs   (or: npm run build)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
let html = read('index.html');

// Inline the stylesheet
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/, (_, href) => `<style>\n${read(href)}</style>`);

// Inline every local script, in order
let count = 0;
html = html.replace(/<script src="(src\/[^"]+)"><\/script>/g, (_, src) => {
  const code = read(src);
  if (code.includes('</script')) throw new Error(`${src} contains "</script" and cannot be inlined`);
  count++;
  return `<script>\n${code}</script>`;
});

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'bitforge8.html'), html);
console.log(`Built dist/bitforge8.html (${count} scripts inlined, ${(html.length / 1024).toFixed(1)} KB)`);
