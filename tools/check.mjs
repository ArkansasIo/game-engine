// Syntax-checks every source file. Usage: node tools/check.mjs  (or: npm run check)
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let bad = 0;
for (const dir of ['src/runtime', 'src/editor']) {
  for (const f of readdirSync(join(root, dir)).filter(n => n.endsWith('.js'))) {
    try { new vm.Script(readFileSync(join(root, dir, f), 'utf8'), { filename: `${dir}/${f}` }); }
    catch (e) { bad++; console.error(`✗ ${dir}/${f}: ${e.message}`); }
  }
}
console.log(bad ? `${bad} file(s) failed` : 'All source files parse OK');
process.exit(bad ? 1 : 0);
