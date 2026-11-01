/* BitForge 8 editor: Level viewport rendering and mouse input */
'use strict';
// ---------------------------------------------------------------- viewport
const vp = $('#vp'), vctx = vp.getContext('2d');
function resizeVp() {
  const r = vp.getBoundingClientRect();
  if (r.width < 2) return;
  vp.width = Math.round(r.width); vp.height = Math.round(r.height); S.dirty = true;
  if (S.playing) fitPie();
}
const toWorld = (mx, my) => ({ x: (mx - S.pan.x) / S.zoom, y: (my - S.pan.y) / S.zoom });
function drawViewport() {
  const L = curLevel(), z = S.zoom, ox = Math.round(S.pan.x), oy = Math.round(S.pan.y);
  vctx.imageSmoothingEnabled = false;
  vctx.fillStyle = '#141417'; vctx.fillRect(0, 0, vp.width, vp.height);
  vctx.fillStyle = PAL[L.bg]; vctx.fillRect(ox, oy, L.w * 8 * z, L.h * 8 * z);
  const x0 = Math.max(0, Math.floor(-ox / (8 * z))), y0 = Math.max(0, Math.floor(-oy / (8 * z)));
  const x1 = Math.min(L.w, Math.ceil((vp.width - ox) / (8 * z))), y1 = Math.min(L.h, Math.ceil((vp.height - oy) / (8 * z)));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const id = L.tiles[y * L.w + x]; if (!id) continue;
    const c = RT.spriteCanvas(sprite(id)); if (c) vctx.drawImage(c, ox + x * 8 * z, oy + y * 8 * z, 8 * z, 8 * z);
  }
  if (S.grid && z >= 2) {
    vctx.strokeStyle = 'rgba(255,255,255,0.07)'; vctx.lineWidth = 1; vctx.beginPath();
    for (let x = x0; x <= x1; x++) { vctx.moveTo(ox + x * 8 * z + .5, oy + y0 * 8 * z); vctx.lineTo(ox + x * 8 * z + .5, oy + y1 * 8 * z); }
    for (let y = y0; y <= y1; y++) { vctx.moveTo(ox + x0 * 8 * z, oy + y * 8 * z + .5); vctx.lineTo(ox + x1 * 8 * z, oy + y * 8 * z + .5); }
    vctx.stroke();
  }
  for (const a of L.actors) {
    const c = RT.spriteCanvas(sprite(a.sprite)), px = ox + a.x * z, py = oy + a.y * z;
    vctx.globalAlpha = a.template ? 0.45 : 1;
    if (c) vctx.drawImage(c, px, py, 8 * z, 8 * z);
    else { vctx.strokeStyle = '#f0f'; vctx.strokeRect(px + .5, py + .5, 8 * z - 1, 8 * z - 1); }
    vctx.globalAlpha = 1;
    if (a.template && z >= 2) { vctx.fillStyle = '#ccc'; vctx.font = '10px monospace'; vctx.fillText('T', px + 1, py + 9); }
  }
  // level bounds + camera frame
  vctx.strokeStyle = '#000'; vctx.lineWidth = 2; vctx.strokeRect(ox - 1, oy - 1, L.w * 8 * z + 2, L.h * 8 * z + 2);
  vctx.setLineDash([6, 4]); vctx.strokeStyle = 'rgba(245,166,35,.55)'; vctx.lineWidth = 1;
  vctx.strokeRect(ox + .5, oy + .5, Math.min(RT.W, L.w * 8) * z, Math.min(RT.H, L.h * 8) * z); vctx.setLineDash([]);
  vctx.fillStyle = 'rgba(245,166,35,.8)'; vctx.font = '10px monospace'; vctx.fillText('GAME SCREEN 256×144', ox + 4, oy + Math.min(RT.H, L.h * 8) * z - 4);
  // selection
  const s = selActor();
  if (s) {
    vctx.strokeStyle = '#f5a623'; vctx.lineWidth = 2; vctx.strokeRect(ox + s.x * z - 1, oy + s.y * z - 1, 8 * z + 2, 8 * z + 2);
    vctx.font = '11px system-ui'; const tw = vctx.measureText(s.name).width;
    vctx.fillStyle = '#000c'; vctx.fillRect(ox + s.x * z - 1, oy + s.y * z - 17, tw + 8, 15);
    vctx.fillStyle = '#f5a623'; vctx.fillText(s.name, ox + s.x * z + 3, oy + s.y * z - 6);
  }
  // hover ghost
  if (S.hover && !S.playing) {
    const tx = Math.floor(S.hover.x / 8), ty = Math.floor(S.hover.y / 8);
    if (tx >= 0 && ty >= 0 && tx < L.w && ty < L.h && S.tool !== 'select') {
      const gx = ox + tx * 8 * z, gy = oy + ty * 8 * z;
      let gs = null;
      if (S.tool === 'paint') gs = S.brush; else if (S.tool === 'place') gs = (templateDefs()[S.placeTpl] || {}).sprite;
      const c = gs && RT.spriteCanvas(sprite(gs));
      if (c) { vctx.globalAlpha = 0.6; vctx.drawImage(c, gx, gy, 8 * z, 8 * z); vctx.globalAlpha = 1; }
      vctx.strokeStyle = S.tool === 'erase' ? '#ff5050' : '#fff'; vctx.lineWidth = 1; vctx.strokeRect(gx + .5, gy + .5, 8 * z - 1, 8 * z - 1);
    }
    $('#vp-status').textContent = L.name + ' · ' + L.w + '×' + L.h + ' tiles · zoom ' + z + '× · tile (' + tx + ',' + ty + ') · px (' + Math.floor(S.hover.x) + ',' + Math.floor(S.hover.y) + ')';
  }
}
let drag = null, spaceDown = false;
vp.addEventListener('contextmenu', e => e.preventDefault());
vp.addEventListener('mousedown', e => {
  if (S.playing) return;
  const r = vp.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, w = toWorld(mx, my);
  if (e.button === 1 || e.button === 2 || spaceDown) { drag = { type: 'pan', sx: e.clientX, sy: e.clientY, px: S.pan.x, py: S.pan.y }; e.preventDefault(); return; }
  if (S.tool === 'place') return placeAt(w);
  if (S.tool === 'paint' || S.tool === 'erase') { drag = { type: 'paint', snap: snapshot() }; paintAt(w); return; }
  const L = curLevel();
  const a = [...L.actors].reverse().find(a => w.x >= a.x && w.x < a.x + 8 && w.y >= a.y && w.y < a.y + 8);
  if (a) { select(a.id); drag = { type: 'move', id: a.id, ox: w.x - a.x, oy: w.y - a.y, snap: snapshot() }; }
  else select(null);
});
window.addEventListener('mousemove', e => {
  const r = vp.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
  if (S.tab === 'viewport') { S.hover = toWorld(mx, my); S.dirty = true; }
  if (!drag) return;
  if (drag.type === 'pan') { S.pan.x = drag.px + e.clientX - drag.sx; S.pan.y = drag.py + e.clientY - drag.sy; S.dirty = true; }
  else if (drag.type === 'paint') paintAt(toWorld(mx, my));
  else if (drag.type === 'move') {
    const a = curLevel().actors.find(x => x.id === drag.id); if (!a) return;
    const w = toWorld(mx, my);
    let nx = w.x - drag.ox, ny = w.y - drag.oy;
    nx = S.snap ? Math.round(nx / 8) * 8 : Math.round(nx); ny = S.snap ? Math.round(ny / 8) * 8 : Math.round(ny);
    if (nx !== a.x || ny !== a.y) { if (drag.snap) { pushUndo(drag.snap); drag.snap = null; } a.x = nx; a.y = ny; drag.moved = true; S.dirty = true; }
  }
});
window.addEventListener('mouseup', () => {
  if (drag && (drag.moved || (drag.type === 'paint' && !drag.snap))) { changed({ quiet: true }); if (drag.type === 'move') renderDetails(); }
  drag = null;
});
vp.addEventListener('mouseleave', () => { S.hover = null; S.dirty = true; });
vp.addEventListener('wheel', e => {
  e.preventDefault();
  const r = vp.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, w = toWorld(mx, my);
  const nz = Math.max(1, Math.min(10, S.zoom + (e.deltaY < 0 ? 1 : -1)));
  if (nz === S.zoom) return;
  S.zoom = nz; S.pan.x = Math.round(mx - w.x * nz); S.pan.y = Math.round(my - w.y * nz); S.dirty = true;
}, { passive: false });
function paintAt(w) {
  const L = curLevel(), tx = Math.floor(w.x / 8), ty = Math.floor(w.y / 8);
  if (tx < 0 || ty < 0 || tx >= L.w || ty >= L.h) return;
  const v = S.tool === 'paint' ? S.brush : null, i = ty * L.w + tx;
  if (L.tiles[i] === v) return;
  if (drag && drag.snap) { pushUndo(drag.snap); drag.snap = null; }
  L.tiles[i] = v; S.dirty = true;
}
