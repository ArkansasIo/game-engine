/* BitForge 8 editor: Center tab strip */
'use strict';
// ---------------------------------------------------------------- tabs
const TAB_NAMES = { viewport: '🎮 Viewport', blueprint: '🔷 Blueprint', sprite: '🎨 Sprite Editor', sound: '🔊 Sound Editor', database: '🗃 Database' };
function openTab(t) {
  if (!S.openTabs.includes(t)) S.openTabs.push(t);
  S.tab = t; renderTabs();
  if (t === 'blueprint') renderBlueprint();
  if (t === 'sprite') renderSpriteEditor();
  if (t === 'sound') renderSoundEditor();
  if (t === 'database') renderDatabase();
  if (t === 'viewport') { resizeVp(); }
}
function closeTab(t) {
  S.openTabs = S.openTabs.filter(x => x !== t);
  if (S.tab === t) S.tab = 'viewport';
  renderTabs();
}
function renderTabs() {
  const el = $('#tabs'); el.innerHTML = '';
  for (const t of S.openTabs) {
    let label = TAB_NAMES[t];
    if (t === 'blueprint') { const f = S.bpActor && findActor(S.bpActor); label += f ? ': ' + f.actor.name : ''; }
    if (t === 'sprite') { const s = sprite(S.spriteEdit); label += s ? ': ' + s.name : ''; }
    el.append(h('div', { class: 'tab' + (S.tab === t ? ' on' : ''), onclick: () => openTab(t) }, label,
      t !== 'viewport' ? h('button', { class: 'x', title: 'Close', onclick: e => { e.stopPropagation(); closeTab(t); } }, '×') : null));
  }
  $$('.tabpage').forEach(p => p.classList.toggle('on', p.id === 'page-' + S.tab));
}
