/* BitForge 8 editor: 8x8 pixel sprite editor */
'use strict';
// ---------------------------------------------------------------- sprite editor
function openSprite(id) { S.spriteEdit = id; S.brush = id; openTab('sprite'); renderDrawer(); }
function setPx(s, x, y, ch) { const r = s.px[y]; s.px[y] = r.slice(0, x) + ch + r.slice(x + 1); }
let seDrag = null;
function renderSpriteEditor() {
  const wrap = $('#se-wrap'); wrap.innerHTML = '';
  let s = sprite(S.spriteEdit);
  if (!s) { s = sprite(S.brush) || proj.sprites[0]; S.spriteEdit = s && s.id; }
  if (!s) return;
  const cv = h('canvas', { id: 'se-canvas', width: 256, height: 256 });
  const left = h('div', { class: 'ed-col' }, h('h3', null, 'Canvas 8×8'), cv, h('div', { class: 'muted' }, 'Left-click: paint · Right-click: erase'));
  const pal = h('div', { class: 'pal' },
    h('div', { class: 'sw tr' + (S.seColor === '.' ? ' on' : ''), title: 'Transparent', onclick: () => { S.seColor = '.'; renderSpriteEditor(); } }),
    PAL.map((c, i) => h('div', { class: 'sw' + (S.seColor === i.toString(16) ? ' on' : ''), title: RT.PALETTE_NAMES[i], style: 'background:' + c, onclick: () => { S.seColor = i.toString(16); renderSpriteEditor(); } })));
  const tool = (k, l) => h('button', { class: S.seTool === k ? 'on' : '', onclick: () => { S.seTool = k; renderSpriteEditor(); } }, l);
  const op = (l, fn) => h('button', { onclick: () => mutate(() => fn(s)) }, l);
  const previews = h('div', { class: 'row previews' }, h('canvas', { id: 'se-p1', width: 8, height: 8, style: 'width:32px;height:32px' }), h('canvas', { id: 'se-p2', width: 24, height: 24, style: 'width:96px;height:96px' }));
  const right = h('div', { class: 'ed-col', style: 'min-width:320px' },
    h('h3', null, 'Sprite'),
    h('div', { class: 'fld' }, h('label', null, 'Name'), inp('text', s.name, v => mutate(() => { s.name = v; }))),
    h('div', { class: 'fld' }, h('label', null, 'Solid tile'), h('label', { style: 'color:inherit' }, inp('checkbox', s.solid, v => mutate(() => { s.solid = v; })), ' blocks movement when painted as a tile')),
    h('h3', null, 'Palette (16 colors)'), pal,
    h('h3', null, 'Tools'), h('div', { class: 'row' }, tool('pencil', '✎ Pencil'), tool('fill', '🪣 Fill'), tool('pick', '💧 Picker')),
    h('div', { class: 'row' }, op('⇋ Flip H', s => { s.px = s.px.map(r => [...r].reverse().join('')); }), op('⇅ Flip V', s => { s.px.reverse(); }),
      op('⟳ Rotate', s => { s.px = s.px.map((_, y) => s.px.map(r => r[y]).reverse().join('')); }),
      op('◀', s => { s.px = s.px.map(r => r.slice(1) + r[0]); }), op('▶', s => { s.px = s.px.map(r => r[7] + r.slice(0, 7)); }),
      op('▲', s => { s.px.push(s.px.shift()); }), op('▼', s => { s.px.unshift(s.px.pop()); }), op('Clear', s => { s.px = new Array(8).fill('........'); })),
    h('h3', null, 'Preview (1× / tiled 3×3)'), previews,
    h('div', { class: 'row' }, h('button', { onclick: () => { S.brush = s.id; setTool('paint'); openTab('viewport'); } }, 'Paint with this tile →'),
      h('select', { onchange: e => { S.spriteEdit = e.target.value; S.brush = e.target.value; renderSpriteEditor(); renderDrawer(); } }, proj.sprites.map(x => h('option', { value: x.id, selected: x.id === s.id }, x.name)))));
  wrap.append(left, right);
  drawSE(s);
  const cell = e => { const r = cv.getBoundingClientRect(); return { x: Math.floor((e.clientX - r.left) / (r.width / 8)), y: Math.floor((e.clientY - r.top) / (r.height / 8)) }; };
  const apply = (e, first) => {
    const { x, y } = cell(e); if (x < 0 || y < 0 || x > 7 || y > 7) return;
    const ch = (e.buttons & 2) || e.button === 2 ? '.' : S.seColor;
    if (S.seTool === 'pick') { S.seColor = s.px[y][x]; S.seTool = 'pencil'; renderSpriteEditor(); return; }
    if (S.seTool === 'fill') {
      if (!first) return;
      const from = s.px[y][x]; if (from === ch) return;
      pushUndo(); const st = [[x, y]];
      while (st.length) { const [a, b] = st.pop(); if (a < 0 || b < 0 || a > 7 || b > 7 || s.px[b][a] !== from) continue; setPx(s, a, b, ch); st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); }
      afterSE(s); return;
    }
    if (s.px[y][x] === ch) return;
    if (seDrag && seDrag.snap) { pushUndo(seDrag.snap); seDrag.snap = null; }
    setPx(s, x, y, ch); drawSE(s); S.dirty = true;
  };
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('mousedown', e => { seDrag = { snap: snapshot() }; apply(e, true); });
  cv.addEventListener('mousemove', e => { if (seDrag && e.buttons) apply(e, false); });
}
function afterSE(s) { drawSE(s); changed({ quiet: true }); renderDrawer(); renderOutliner(); renderPlace(); }
function drawSE(s) {
  const cv = $('#se-canvas'); if (!cv) return;
  const x = cv.getContext('2d'); x.clearRect(0, 0, 256, 256);
  for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) { const ch = s.px[yy][xx]; if (ch !== '.') { x.fillStyle = PAL[parseInt(ch, 16)]; x.fillRect(xx * 32, yy * 32, 32, 32); } }
  x.strokeStyle = '#0006'; for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * 32 + .5, 0); x.lineTo(i * 32 + .5, 256); x.moveTo(0, i * 32 + .5); x.lineTo(256, i * 32 + .5); x.stroke(); }
  const c = RT.spriteCanvas(s);
  const p1 = $('#se-p1').getContext('2d'); p1.clearRect(0, 0, 8, 8); p1.drawImage(c, 0, 0);
  const p2 = $('#se-p2').getContext('2d'); p2.clearRect(0, 0, 24, 24); for (let i = 0; i < 9; i++) p2.drawImage(c, (i % 3) * 8, ((i / 3) | 0) * 8);
}
// Sprite editor mouseup needs re-binding per render; simpler global handler:
window.addEventListener('mouseup', () => { if (seDrag) { const s = sprite(S.spriteEdit); if (!seDrag.snap && s) afterSE(s); seDrag = null; } });
