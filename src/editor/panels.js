/* BitForge 8 editor: Place Actors, Levels and Outliner panels */
'use strict';
// ---------------------------------------------------------------- left panels
function thumbCanvas(spriteId, size) {
  const c = h('canvas', { width: 8, height: 8 });
  const s = sprite(spriteId), sc = s && RT.spriteCanvas(s);
  if (sc) c.getContext('2d').drawImage(sc, 0, 0);
  if (size) c.style.width = c.style.height = size + 'px';
  return c;
}
function renderPlace() {
  const el = $('#place'); el.innerHTML = '';
  const T = templateDefs();
  let grp = null;
  for (const k in T) {
    const t = T[k];
    if (t.group !== grp) { grp = t.group; el.append(h('div', { class: 'place-group' }, grp)); }
    el.append(h('div', { class: 'place-item' + (S.tool === 'place' && S.placeTpl === k ? ' on' : ''), title: 'Click, then click in the viewport to place', onclick: () => { setTool('place'); S.placeTpl = k; renderPlace(); } },
      thumbCanvas(t.sprite), h('div', null, h('b', null, t.label), h('small', null, t.desc))));
  }
}
function renderLevels() {
  const el = $('#levels'); el.innerHTML = '';
  proj.levels.forEach((L, i) => {
    el.append(h('div', { class: 'lvl' + (i === S.levelIdx ? ' on' : ''), onclick: () => switchLevel(i) },
      '🗺 ', L.name, h('span', { class: 'badge' + (proj.settings.startLevel === L.id ? ' start' : '') }, proj.settings.startLevel === L.id ? 'START' : L.w + '×' + L.h)));
  });
  const sel = $('#t-level'); sel.innerHTML = '';
  proj.levels.forEach((L, i) => sel.append(h('option', { value: i }, L.name)));
  sel.value = S.levelIdx;
}
function switchLevel(i) { S.levelIdx = i; S.sel = null; S.dirty = true; refreshPanels(); }

// ---------------------------------------------------------------- outliner
function compSummary(a) {
  const c = a.comps || {}, out = [];
  if (c.rpgPlayer) out.push('RPG Hero'); if (c.monster) out.push('Monster'); if (c.npc) out.push(c.npc.shop ? 'Shop' : c.npc.quest ? 'Quest' : 'NPC');
  if (c.chest) out.push('Chest'); if (c.door) out.push('Warp');
  if (c.platformer) out.push('Platformer'); if (c.topdown) out.push('TopDown'); if (c.patrol) out.push('Patrol');
  if (!out.length && c.physics) out.push('Physics');
  const n = (a.bp && a.bp.nodes || []).length; if (n) out.push(n + ' nodes');
  return out.join(' · ');
}
function renderOutliner() {
  const el = $('#outliner'), L = curLevel(); el.innerHTML = '';
  $('#ol-count').textContent = '(' + L.actors.length + ' actors)';
  el.append(h('div', { class: 'ol-row' + (!S.sel ? ' on' : ''), onclick: () => select(null) }, '🌍', h('b', null, L.name), h('span', { class: 't' }, 'World Settings')));
  for (const a of L.actors) {
    el.append(h('div', { class: 'ol-row' + (S.sel === a.id ? ' on' : ''), style: 'padding-left:18px', onclick: () => select(a.id), ondblclick: () => frameActor(a) },
      thumbCanvas(a.sprite), a.name, a.template ? h('span', { class: 'badge' }, 'TEMPLATE') : null, h('span', { class: 't' }, compSummary(a))));
  }
}
function select(id) { S.sel = id; S.dirty = true; renderOutliner(); renderDetails(); }
function frameActor(a) {
  const r = $('#vp').getBoundingClientRect();
  S.pan.x = Math.round(r.width / 2 - (a.x + 4) * S.zoom); S.pan.y = Math.round(r.height / 2 - (a.y + 4) * S.zoom); S.dirty = true;
}
