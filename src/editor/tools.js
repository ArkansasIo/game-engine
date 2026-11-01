/* BitForge 8 editor: Viewport tools, placement, duplicate/delete */
'use strict';
// ---------------------------------------------------------------- tools
function setTool(t) {
  S.tool = t; if (t !== 'place') S.placeTpl = null;
  ['select', 'paint', 'erase'].forEach(k => $('#t-' + k).classList.toggle('on', S.tool === k));
  $('#vp').style.cursor = t === 'select' ? 'default' : 'crosshair';
  renderPlace(); renderDrawer(); updateHint(); S.dirty = true;
}
function updateHint() {
  const s = sprite(S.brush);
  const map = {
    select: 'Click an actor to select · drag to move · right-drag to pan · wheel to zoom',
    paint: 'Painting with <b>' + (s ? s.name : '?') + '</b> — pick tiles in the Sprites drawer',
    erase: 'Erasing tiles — click & drag',
    place: 'Click to place <b>' + ((templateDefs()[S.placeTpl] || {}).label || '') + '</b> · Esc to cancel'
  };
  $('#vp-hint').innerHTML = map[S.tool] || '';
}
function duplicateSel() {
  const a = selActor(); if (!a) return;
  mutate(() => { const c = clone(a); c.id = uid('o'); c.name = a.name; c.x += 8; curLevel().actors.push(c); S.sel = c.id; });
}
function deleteSel() {
  const a = selActor(); if (!a) return;
  mutate(() => { const L = curLevel(); L.actors = L.actors.filter(x => x !== a); S.sel = null; if (S.bpActor === a.id) S.bpActor = null; });
}
function placeAt(w) {
  const T = templateDefs()[S.placeTpl]; if (!T) return;
  const L = curLevel();
  const x = Math.floor(w.x / 8) * 8, y = Math.floor(w.y / 8) * 8;
  mutate(() => {
    const d = T.make();
    const a = Object.assign({ id: uid('o'), name: d.name, sprite: d.sprite, x, y, tags: d.tags || '', template: false, comps: d.comps || {}, bp: d.bp || { nodes: [] } });
    const same = L.actors.filter(z => z.name.startsWith(d.name)).length;
    if (same) a.name = d.name + ' ' + (same + 1);
    L.actors.push(a); S.sel = a.id;
  });
  logMsg('Placed ' + T.label);
  setTool('select');
}
