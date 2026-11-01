/* BitForge 8 editor: Save/open/new project and Package Game export */
'use strict';
// ---------------------------------------------------------------- file ops
function slug() { return (proj.name || 'game').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'game'; }
function download(name, text, type) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function saveProject() {
  try { localStorage.setItem(STORE, JSON.stringify(proj)); } catch (e) {}
  download(slug() + '.bitforge.json', JSON.stringify(proj, null, 1), 'application/json');
  $('#savestate').textContent = '✓ saved'; logMsg('Project saved to ' + slug() + '.bitforge.json');
}
function buildStandalone() {
  const rt = '(' + BitForgeRuntime.toString() + ')(window);';
  const data = JSON.stringify(proj).replace(/</g, '\\u003c');
  const crt = proj.settings.crt ? '.s::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(to bottom,#0000 0 2px,#0004 2px 3px),radial-gradient(ellipse at center,#0000 60%,#0007 100%)}' : '';
  const S_ = 'script';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${(proj.name || 'Game').replace(/</g, '')}</title>
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}body{display:flex;align-items:center;justify-content:center}.s{position:relative}canvas{display:block;image-rendering:pixelated;width:min(100vw,calc(100vh * 16 / 9));height:auto}${crt}</style>
</head><body><div class="s"><canvas id="game"></canvas></div>
<${S_}>${rt}</${S_}>
<${S_}>PixelRuntime.create(document.getElementById('game'), ${data}, { title: true });</${S_}>
</body></html>`;
}
function exportGame() { download(slug() + '.html', buildStandalone(), 'text/html'); logMsg('📦 Packaged game → ' + slug() + '.html (open it in any browser)'); }
$('#file-open').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => {
    try {
      const p = JSON.parse(t);
      if (!p.sprites || !p.levels || !p.levels.length) throw new Error('not a BitForge project');
      pushUndo(); proj = p; ensureProject();
      S.levelIdx = 0; S.sel = null; afterRestore(); logMsg('Opened ' + f.name);
    } catch (err) { alert('Could not open file: ' + err.message); }
  });
  e.target.value = '';
});
function newProject() {
  if (!confirm('Start a new project from the sample game? Unsaved changes will be lost (you can still Undo).')) return;
  pushUndo(); proj = makeDefaultProject(); S.levelIdx = 0; S.sel = null; ensureProject(); S.brush = (proj.sprites.find(s => s.solid) || proj.sprites[0]).id; afterRestore(); logMsg('New project created');
}
function showHelp() {
  const rows = [['Alt+P', 'Play In Editor'], ['Esc', 'Stop playing / cancel placement'], ['Q / B / E', 'Select · Paint · Erase tool'], ['G', 'Toggle grid'],
    ['Ctrl+Z / Ctrl+Y', 'Undo / Redo'], ['Ctrl+D', 'Duplicate actor'], ['Del', 'Delete actor'], ['F', 'Focus selected actor'], ['Ctrl+S', 'Save project (.json)'],
    ['F9', 'Open the Database'], ['Mouse wheel', 'Zoom viewport'], ['Right/middle drag, Space+drag', 'Pan viewport'],
    ['RPG: move / attack', 'Arrows or WASD · Z or Space swings your weapon'], ['RPG: skills', '1 2 3 4 hotbar · Q quick potion'], ['RPG: interact', 'E talk, shop, open chests'],
    ['RPG: Enter', 'Command window (Dragon Warrior style): Talk, Spell, Status, Item, Equip, Search, Quests, Map, Save, System'],
    ['RPG: I/B · C · K · L · M', 'Backpack · Character · Spellbook · Quest log · World map (WoW / MU style)'],
    ['RPG: Esc', 'Game menu: settings, controls, save/load, quit (Shift+Esc stops play test)'], ['Platformer', 'Arrows/WASD move · Space/Z/Up jump']];
  $('#modal-box').innerHTML = '';
  $('#modal-box').append(h('h2', null, 'BITFORGE 8 — QUICK START'),
    h('p', null, 'An 8-bit game engine laid out like a modern AAA editor: paint tiles, place actors, give them components and Blueprint logic, then hit Play.'),
    h('ol', null, h('li', null, 'Pick a tile in the Sprites drawer and paint in the Viewport.'), h('li', null, 'Choose a Place Actors entry and click the level to drop it.'),
      h('li', null, 'Select an actor → Details → toggle components (Physics, Platformer, Patrol…).'), h('li', null, 'Open its Blueprint: add Events, drag ▶ pins to chain Actions.'),
      h('li', null, 'Open 🗃 Database (F9) to define heroes, classes, skills, items, weapons, armor, monsters, shops and quests — like RPG Maker.'),
      h('li', null, 'Place RPG actors (Monster, NPC, Shopkeeper, Quest Giver, Chest, Door) and pick their Database entry in Details.'),
      h('li', null, 'Press ▶ Play. When happy, File → Package Game for a single shareable .html.')),
    h('table', null, rows.map(([k, v]) => h('tr', null, h('td', null, k), h('td', null, v)))),
    h('p', { style: 'text-align:right;margin:14px 0 0' }, h('button', { class: 'on', onclick: () => $('#modal').classList.remove('on') }, 'Got it')));
  $('#modal').classList.add('on');
}
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').classList.remove('on'); });
