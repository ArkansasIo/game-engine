/* BitForge 8 editor: Boot */
'use strict';
// ---------------------------------------------------------------- boot
function refreshPanels() {
  renderLevels(); renderOutliner(); renderDetails(); renderDrawer(); renderPlace(); renderTabs(); updateHint();
  $('#projname').textContent = proj.name;
  S.dirty = true;
}
function refreshAll() {
  refreshPanels();
  if (S.tab === 'blueprint') renderBlueprint();
  if (S.tab === 'sprite') renderSpriteEditor();
  if (S.tab === 'sound') renderSoundEditor();
  if (S.tab === 'database') renderDatabase();
}
function frame() {
  if (S.dirty && S.tab === 'viewport') { S.dirty = false; drawViewport(); }
  requestAnimationFrame(frame);
}
loadInitial();
$('#t-snap').classList.toggle('on', S.snap); $('#t-grid').classList.toggle('on', S.grid);
setTool('select');
refreshAll();
resizeVp();
requestAnimationFrame(frame);
logMsg('BitForge 8 ready. Press ▶ Play (Alt+P) to play "Crystal Quest", F9 for the Database, or Help → Quick Start.');
window.__bf = { S, get proj() { return proj; }, play, stop, buildStandalone };
