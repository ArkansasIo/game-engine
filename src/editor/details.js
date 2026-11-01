/* BitForge 8 editor: Details panel, components and World Settings */
'use strict';
// ---------------------------------------------------------------- details
function row(label, ...ctrl) { return h('div', { class: 'det-row' }, h('label', null, label), ...ctrl); }
function inp(type, val, onchange, attrs) {
  const e = h('input', Object.assign({ type, value: val == null ? '' : val }, attrs || {}));
  if (type === 'checkbox') { e.checked = !!val; e.addEventListener('change', () => onchange(e.checked)); }
  else e.addEventListener('change', () => onchange(type === 'number' ? (e.value === '' ? '' : +e.value) : e.value));
  return e;
}
function selectEl(opts, val, onchange) {
  const e = h('select', null, opts.map(([v, l]) => h('option', { value: v }, l)));
  e.value = val == null ? '' : val;
  e.addEventListener('change', () => onchange(e.value));
  return e;
}
const spriteOpts = (blank) => (blank ? [['', '— none —']] : []).concat(proj.sprites.map(s => [s.id, s.name]));
const soundOpts = () => [['', '— none —']].concat(proj.sounds.map(s => [s.id, s.name]));
function swatches(val, onpick) {
  return h('div', { class: 'swatches' }, PAL.map((c, i) => h('div', { class: 'sw' + (+val === i ? ' on' : ''), title: RT.PALETTE_NAMES[i], style: 'background:' + c, onclick: () => onpick(i) })));
}
const COMP_DEFS = {
  physics: { title: 'Physics', desc: 'gravity + tile collision', params: [['gravity', 'Gravity', 0.22]] },
  platformer: { title: 'Platformer Controller', desc: 'arrows/WASD + jump', params: [['speed', 'Run speed', 1.2], ['jump', 'Jump force', 3.6], ['jumpSound', 'Jump sound', '', 'sound']] },
  topdown: { title: 'Top-Down Controller', desc: '8-way movement', params: [['speed', 'Speed', 1]] },
  patrol: { title: 'Patrol AI', desc: 'walks, turns at walls', params: [['speed', 'Speed', 0.4], ['edges', 'Turn at edges', true, 'bool']] },
  rpgPlayer: { title: 'RPG Hero', desc: 'stats, combat, menu', params: [['hero', 'Hero (Database)', '', 'ref:heroes']] },
  monster: { title: 'Monster', desc: 'AI, HP, loot', params: [['monster', 'Monster (Database)', '', 'ref:monsters']] },
  npc: { title: 'NPC / Dialogue', desc: 'press E to talk', params: [['name', 'Display name', 'Villager', 'text'], ['text', 'Dialogue (1 line = 1 page)', 'Hello!', 'textarea'], ['shop', 'Opens shop', '', 'ref:shops'], ['quest', 'Gives quest', '', 'ref:quests']] },
  chest: { title: 'Treasure Chest', desc: 'opens once', params: [['loot', 'Contains', '', 'loot'], ['gold', 'Gold', 0], ['openSprite', 'Opened sprite', '', 'sprite']] },
  door: { title: 'Door / Transfer', desc: 'warps the player', params: [['level', 'To level', '', 'levelid'], ['x', 'Tile X', 1], ['y', 'Tile Y', 1]] }
};
function compDefault(type, dv) {
  if (type && type.startsWith('ref:')) { const l = dbList(type.slice(4)); return l[0] ? l[0].id : ''; }
  if (type === 'levelid') return proj.levels[0].id;
  return dv;
}
function compControl(type, val, set) {
  if (type === 'sound') return selectEl(soundOpts(), val, set);
  if (type === 'bool') return inp('checkbox', val, set);
  if (!type) return inp('number', val, v => set(+v), { step: 'any' });
  return dbControl(type, val, set);
}
function syncFromDb(a) {
  const c = a.comps || {};
  if (c.monster) { const m = dbFind('monsters', c.monster.monster); if (m) { if (m.sprite) a.sprite = m.sprite; a.name = m.name; } }
  if (c.rpgPlayer) { const hh = dbFind('heroes', c.rpgPlayer.hero); if (hh && hh.sprite) a.sprite = hh.sprite; }
}
function renderDetails() {
  const el = $('#details'); el.innerHTML = '';
  const a = selActor();
  if (!a) return renderWorldSettings(el);
  $('#det-h').textContent = 'Details — ' + a.name;
  const set = (k, v) => mutate(() => { a[k] = v; });
  el.append(h('div', { class: 'det-sec' }, h('h4', null, 'Actor'),
    row('Name', inp('text', a.name, v => set('name', v))),
    row('Sprite', selectEl(spriteOpts(true), a.sprite, v => set('sprite', v))),
    row('Location', h('div', { class: 'two' }, inp('number', a.x, v => set('x', +v || 0)), inp('number', a.y, v => set('y', +v || 0)))),
    row('Tags', inp('text', a.tags, v => set('tags', v), { placeholder: 'player, enemy…' })),
    row('Template', h('label', { style: 'color:inherit' }, inp('checkbox', a.template, v => set('template', v)), ' hidden at start, for Spawn'))));

  const comps = h('div', { class: 'det-sec' }, h('h4', null, 'Components'));
  a.comps = a.comps || {};
  for (const k of ['rpgPlayer', 'monster', 'npc', 'chest', 'door', 'physics', 'platformer', 'topdown', 'patrol']) {
    const d = COMP_DEFS[k], on = !!a.comps[k];
    const box = h('div', { class: 'comp' }, h('div', { class: 'comp-h' },
      inp('checkbox', on, v => mutate(() => { if (v) { const o = {}; d.params.forEach(([pk, , dv, type]) => o[pk] = compDefault(type, dv)); a.comps[k] = o; syncFromDb(a); } else delete a.comps[k]; })),
      d.title, h('small', null, d.desc)));
    if (on) for (const [pk, label, dv, type] of d.params) {
      const val = a.comps[k][pk] == null ? dv : a.comps[k][pk];
      const setp = v => mutate(() => { a.comps[k][pk] = v; syncFromDb(a); });
      box.append(row(label, compControl(type, val, setp)));
    }
    comps.append(box);
  }
  el.append(comps);
  if (a.comps.monster || a.comps.rpgPlayer || a.comps.npc) {
    const cat = a.comps.monster ? 'monsters' : a.comps.rpgPlayer ? 'heroes' : (a.comps.npc.quest ? 'quests' : 'shops');
    const id = a.comps.monster ? a.comps.monster.monster : a.comps.rpgPlayer ? a.comps.rpgPlayer.hero : (a.comps.npc.quest || a.comps.npc.shop);
    comps.append(h('button', { style: 'width:100%', onclick: () => { S.dbCat = cat; S.dbSel = id; openTab('database'); } }, '🗃 Edit in Database'));
  }
  const n = (a.bp && a.bp.nodes || []).length;
  el.append(h('div', { class: 'det-sec' }, h('h4', null, 'Blueprint'),
    h('p', { class: 'muted', style: 'margin:0 0 8px' }, n ? n + ' nodes of visual logic.' : 'No logic yet. Add events like Overlap or Key Pressed.'),
    h('button', { class: 'bigbtn', onclick: () => openBlueprint(a.id) }, '🔷 Open Blueprint Editor')));
  el.append(h('div', { class: 'det-sec' }, h('div', { class: 'row' },
    h('button', { onclick: duplicateSel }, '⧉ Duplicate'), h('button', { onclick: deleteSel }, '🗑 Delete'), h('button', { onclick: () => frameActor(a) }, '⌖ Focus'))));
}
function renderWorldSettings(el) {
  $('#det-h').textContent = 'World Settings';
  const L = curLevel();
  const varsText = Object.entries(proj.vars || {}).map(([k, v]) => k + '=' + v).join(', ');
  el.append(h('div', { class: 'det-sec' }, h('h4', null, 'Level'),
    row('Name', inp('text', L.name, v => mutate(() => { L.name = v; }))),
    row('Size (tiles)', h('div', { class: 'two' }, inp('number', L.w, v => resizeLevel(L, +v, L.h), { min: 8, max: 512 }), inp('number', L.h, v => resizeLevel(L, L.w, +v), { min: 6, max: 256 }))),
    row('Background', swatches(L.bg, i => mutate(() => { L.bg = i; }))),
    row('Start level', h('label', { style: 'color:inherit' }, inp('checkbox', proj.settings.startLevel === L.id, v => mutate(() => { if (v) proj.settings.startLevel = L.id; })), ' game begins here'))));
  el.append(h('div', { class: 'det-sec' }, h('h4', null, 'Project'),
    row('Game name', inp('text', proj.name, v => mutate(() => { proj.name = v; }))),
    row('HUD text', inp('text', proj.hud, v => mutate(() => { proj.hud = v; }), { placeholder: 'SCORE {score}' })),
    row('Variables', inp('text', varsText, v => mutate(() => { proj.vars = parseVars(v); }), { placeholder: 'score=0, lives=3' })),
    row('CRT filter', h('label', { style: 'color:inherit' }, inp('checkbox', proj.settings.crt, v => mutate(() => { proj.settings.crt = v; })), ' scanlines post-process'))));
  el.append(h('div', { class: 'det-sec muted' }, 'Tip: select an actor in the viewport or Outliner to edit it. Use {var} in HUD and message text.'));
}
function parseVars(t) {
  const o = {};
  t.split(',').forEach(p => { const [k, v] = p.split('=').map(s => (s || '').trim()); if (k && /^\w+$/.test(k)) o[k] = +v || 0; });
  return o;
}
function resizeLevel(L, w, hh) {
  w = Math.max(8, Math.min(512, w | 0)); hh = Math.max(6, Math.min(256, hh | 0));
  mutate(() => {
    const t = new Array(w * hh).fill(null);
    for (let y = 0; y < Math.min(hh, L.h); y++) for (let x = 0; x < Math.min(w, L.w); x++) t[y * w + x] = L.tiles[y * L.w + x];
    L.w = w; L.h = hh; L.tiles = t;
  });
}
