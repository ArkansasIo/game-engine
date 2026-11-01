/* BitForge 8 editor: Content drawer: sprites, sounds, log */
'use strict';
// ---------------------------------------------------------------- drawer
function renderDrawer() {
  $$('#drawer-tabs .dt').forEach(b => b.classList.toggle('on', b.dataset.dt === S.drawer));
  const act = $('#drawer-actions'), b = $('#drawer-b'); act.innerHTML = ''; b.innerHTML = '';
  if (S.drawer === 'sprites') {
    act.append(h('button', { onclick: newSprite }, '+ New Sprite'), h('button', { onclick: () => S.brush && openSprite(S.brush) }, '✎ Edit'),
      h('button', { onclick: dupSprite }, '⧉ Duplicate'), h('button', { onclick: delSprite }, '🗑 Delete'));
    b.append(h('div', { class: 'thumbs' }, proj.sprites.map(s => h('div', {
      class: 'thumb' + (S.brush === s.id ? ' on' : ''), title: s.name + (s.solid ? ' (solid tile)' : '') + ' — click: paint brush · double-click: edit',
      onclick: () => { S.brush = s.id; if (S.tool !== 'paint') setTool('paint'); else renderDrawer(); }, ondblclick: () => openSprite(s.id)
    }, thumbCanvas(s.id), h('span', null, s.name), s.solid ? h('i', { class: 'solid' }, 'SOLID') : null))));
  } else if (S.drawer === 'sounds') {
    act.append(h('button', { onclick: newSound }, '+ New Sound'));
    for (const s of proj.sounds) b.append(h('div', { class: 'snd-row' },
      h('button', { onclick: () => RT.playSound(s), title: 'Preview' }, '▶'), h('span', { class: 'w' }, s.wave), h('b', null, s.name),
      h('span', { class: 'muted' }, Math.round(s.f0) + '→' + Math.round(s.f1) + ' Hz · ' + s.dur + 's'),
      h('div', { style: 'margin-left:auto' }, h('button', { onclick: () => openSound(s.id) }, '✎ Edit'))));
  } else {
    act.append(h('button', { onclick: () => { logLines = []; renderDrawer(); } }, 'Clear'));
    const lg = h('div', { id: 'log' }, logLines.map(l => h('div', { class: l.cls || '' }, '[' + l.t + '] ' + l.msg)));
    b.append(lg); b.scrollTop = b.scrollHeight;
  }
}
function newSprite() { mutate(() => { const s = { id: uid('s'), name: 'Sprite ' + (proj.sprites.length + 1), px: new Array(8).fill('........'), solid: false }; proj.sprites.push(s); S.brush = s.id; S.spriteEdit = s.id; }); openTab('sprite'); }
function dupSprite() { const s = sprite(S.brush); if (!s) return; mutate(() => { const c = Object.assign(clone(s), { id: uid('s'), name: s.name + ' Copy' }); proj.sprites.push(c); S.brush = c.id; }); }
function delSprite() {
  const s = sprite(S.brush); if (!s || proj.sprites.length <= 1) return;
  if (!confirm('Delete sprite "' + s.name + '"? Tiles using it will be erased.')) return;
  mutate(() => {
    proj.sprites = proj.sprites.filter(x => x !== s);
    proj.levels.forEach(L => { L.tiles = L.tiles.map(t => t === s.id ? null : t); L.actors.forEach(a => { if (a.sprite === s.id) a.sprite = ''; }); });
    S.brush = proj.sprites[0].id; if (S.spriteEdit === s.id) S.spriteEdit = null;
  });
}
function newSound() { mutate(() => { const s = { id: uid('a'), name: 'Sound ' + (proj.sounds.length + 1), wave: 'square', f0: 440, f1: 880, dur: 0.2, vol: 0.3 }; proj.sounds.push(s); S.soundEdit = s.id; }); openTab('sound'); }
