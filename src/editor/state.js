/* BitForge 8 editor: Editor state, undo/redo, autosave, output log */
'use strict';
// ------------------------------------------------------------------- state
const STORE = 'bitforge8.project.v2';
let proj;
const S = {
  levelIdx: 0, sel: null, tool: 'select', placeTpl: null, brush: null, zoom: 3, pan: { x: 40, y: 40 }, snap: true, grid: true,
  tab: 'viewport', openTabs: ['viewport'], bpActor: null, bpPan: { x: 0, y: 0 }, bpSel: null, spriteEdit: null, seColor: '6', seTool: 'pencil',
  soundEdit: null, drawer: 'sprites', playing: false, runtime: null, hover: null, dirty: true, dbCat: 'heroes', dbSel: null
};
let undoStack = [], redoStack = [], logLines = [];

function loadInitial() {
  let saved = null;
  try { saved = localStorage.getItem(STORE); } catch (e) {}
  if (saved) { try { proj = JSON.parse(saved); if (!proj.sprites || !proj.levels) proj = null; } catch (e) { proj = null; } }
  if (!proj) proj = makeDefaultProject();
  ensureProject();
  S.brush = (proj.sprites.find(s => s.solid) || proj.sprites[0] || {}).id || null;
}
function ensureProject() {
  proj.settings = proj.settings || { crt: true }; proj.sounds = proj.sounds || []; proj.vars = proj.vars || {};
  const e = emptyDb(); proj.db = proj.db || e;
  for (const k in e) if (!proj.db[k]) proj.db[k] = e[k];
  proj.db.system.sounds = proj.db.system.sounds || {};
}
const curLevel = () => proj.levels[S.levelIdx] || proj.levels[0];
const sprite = id => proj.sprites.find(s => s.id === id);
const sound = id => proj.sounds.find(s => s.id === id);
function findActor(id) {
  for (const L of proj.levels) { const a = L.actors.find(x => x.id === id); if (a) return { actor: a, level: L }; }
  return null;
}
const selActor = () => S.sel ? curLevel().actors.find(a => a.id === S.sel) : null;

function snapshot() { return JSON.stringify(proj); }
function pushUndo(snap) { undoStack.push(snap || snapshot()); if (undoStack.length > 150) undoStack.shift(); redoStack = []; }
function mutate(fn, opts) { pushUndo(); fn(); changed(opts); }
function changed(opts) {
  S.dirty = true; scheduleSave();
  if (!opts || !opts.quiet) refreshPanels();
}
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); proj = JSON.parse(undoStack.pop()); afterRestore(); logMsg('Undo'); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); proj = JSON.parse(redoStack.pop()); afterRestore(); logMsg('Redo'); }
function afterRestore() {
  if (S.levelIdx >= proj.levels.length) S.levelIdx = 0;
  if (S.sel && !selActor()) S.sel = null;
  S.dirty = true; scheduleSave(); refreshAll();
}
let saveT = 0;
function scheduleSave() {
  $('#savestate').textContent = '● unsaved';
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try { localStorage.setItem(STORE, JSON.stringify(proj)); $('#savestate').textContent = '✓ autosaved'; }
    catch (e) { $('#savestate').textContent = '⚠ autosave unavailable'; }
  }, 400);
}
function logMsg(msg, cls) {
  const t = new Date().toTimeString().slice(0, 8);
  logLines.push({ t, msg, cls }); if (logLines.length > 400) logLines.shift();
  if (S.drawer === 'log') renderDrawer();
}
