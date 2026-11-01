/* BitForge 8 editor: Menus, toolbar commands and keyboard shortcuts */
'use strict';
// ---------------------------------------------------------------- commands & keys
const CMDS = {
  new: newProject, open: () => $('#file-open').click(), save: saveProject, export: exportGame, undo, redo, dup: duplicateSel, del: deleteSel, help: showHelp,
  'tab-viewport': () => openTab('viewport'), 'tab-sprite': () => openTab('sprite'), 'tab-sound': () => openTab('sound'), 'tab-blueprint': () => openTab('blueprint'), 'tab-database': () => openTab('database')
};
$$('.menu').forEach(m => {
  m.firstElementChild.addEventListener('click', e => { e.stopPropagation(); const o = m.classList.contains('open'); $$('.menu').forEach(x => x.classList.remove('open')); if (!o) m.classList.add('open'); });
  m.addEventListener('mouseenter', () => { if ($('.menu.open') && !m.classList.contains('open')) { $$('.menu').forEach(x => x.classList.remove('open')); m.classList.add('open'); } });
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cmd]');
  if (b) { CMDS[b.dataset.cmd](); }
  $$('.menu').forEach(x => x.classList.remove('open'));
});
$('#t-select').onclick = () => setTool('select'); $('#t-paint').onclick = () => setTool('paint'); $('#t-erase').onclick = () => setTool('erase');
$('#t-snap').onclick = () => { S.snap = !S.snap; $('#t-snap').classList.toggle('on', S.snap); };
$('#t-grid').onclick = () => { S.grid = !S.grid; $('#t-grid').classList.toggle('on', S.grid); S.dirty = true; };
$('#t-level').onchange = e => switchLevel(+e.target.value);
$('#btn-db').onclick = () => openTab('database');
$('#btn-play').onclick = play; $('#btn-stop').onclick = stop; $('#btn-export').onclick = exportGame;
$$('#drawer-tabs .dt').forEach(b => b.onclick = () => { S.drawer = b.dataset.dt; renderDrawer(); });
$('#lv-add').onclick = () => mutate(() => {
  const g = (proj.sprites.find(s => s.solid) || {}).id || null, w = 48, hh = 18;
  const L = { id: uid('l'), name: 'Level ' + (proj.levels.length + 1), w, h: hh, bg: 3, tiles: new Array(w * hh).fill(null), actors: [] };
  for (let x = 0; x < w; x++) { L.tiles[16 * w + x] = g; L.tiles[17 * w + x] = g; }
  proj.levels.push(L); S.levelIdx = proj.levels.length - 1; S.sel = null;
});
$('#lv-dup').onclick = () => mutate(() => { const L = clone(curLevel()); L.id = uid('l'); L.name += ' Copy'; L.actors.forEach(a => a.id = uid('o')); proj.levels.splice(S.levelIdx + 1, 0, L); S.levelIdx++; S.sel = null; });
$('#lv-del').onclick = () => {
  if (proj.levels.length <= 1) return;
  if (!confirm('Delete level "' + curLevel().name + '"?')) return;
  mutate(() => { const id = curLevel().id; proj.levels.splice(S.levelIdx, 1); if (proj.settings.startLevel === id) proj.settings.startLevel = proj.levels[0].id; S.levelIdx = 0; S.sel = null; });
};
window.addEventListener('keydown', e => {
  const inField = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName);
  if (S.playing) {
    if (e.key === 'Escape') { const rpg = S.runtime && S.runtime.debug().rpg; if (e.shiftKey || !rpg) { e.preventDefault(); stop(); } }
    return;
  }
  if (e.altKey && e.code === 'KeyP') { e.preventDefault(); play(); return; }
  if (e.code === 'F9') { e.preventDefault(); openTab('database'); return; }
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') { e.preventDefault(); saveProject(); return; }
  if (inField) return;
  if (e.ctrlKey || e.metaKey) {
    if (e.code === 'KeyZ') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (e.code === 'KeyY') { e.preventDefault(); redo(); }
    else if (e.code === 'KeyD') { e.preventDefault(); duplicateSel(); }
    return;
  }
  if (e.code === 'Space' && S.tab === 'viewport') { spaceDown = true; e.preventDefault(); return; }
  if (e.key === 'Escape') { if ($('#modal').classList.contains('on')) $('#modal').classList.remove('on'); else setTool('select'); return; }
  if (S.tab !== 'viewport') return;
  if (e.code === 'KeyQ') setTool('select'); else if (e.code === 'KeyB') setTool('paint'); else if (e.code === 'KeyE') setTool('erase');
  else if (e.code === 'KeyG') $('#t-grid').click();
  else if (e.code === 'KeyF') { const a = selActor(); if (a) frameActor(a); }
  else if (e.key === 'Delete' || e.key === 'Backspace') deleteSel();
});
window.addEventListener('keyup', e => { if (e.code === 'Space') spaceDown = false; });
window.addEventListener('resize', () => { resizeVp(); if (S.tab === 'blueprint') drawWires(); });
new ResizeObserver(resizeVp).observe($('#tabbody'));
