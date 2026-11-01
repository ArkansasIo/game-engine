/* BitForge 8 editor: Chiptune sound effect editor */
'use strict';
// ---------------------------------------------------------------- sound editor
function openSound(id) { S.soundEdit = id; openTab('sound'); }
const SFX_PRESETS = {
  Coin: { wave: 'square', f0: 990, f1: 1980, dur: 0.12 }, Jump: { wave: 'square', f0: 280, f1: 720, dur: 0.16 },
  Hit: { wave: 'sawtooth', f0: 420, f1: 60, dur: 0.3 }, Explosion: { wave: 'noise', f0: 900, f1: 50, dur: 0.5 },
  'Power Up': { wave: 'square', f0: 260, f1: 1560, dur: 0.55 }, Laser: { wave: 'sawtooth', f0: 1500, f1: 220, dur: 0.18 },
  Blip: { wave: 'triangle', f0: 660, f1: 660, dur: 0.06 }
};
function renderSoundEditor() {
  const wrap = $('#snd-wrap'); wrap.innerHTML = '';
  let s = sound(S.soundEdit) || proj.sounds[0];
  if (!s) { wrap.append(h('div', { class: 'muted' }, 'No sounds. Create one in the Sounds drawer.')); return; }
  S.soundEdit = s.id;
  const upd = (k, v) => { pushUndo(); s[k] = v; changed({ quiet: true }); drawSnd(s); renderDrawer(); };
  const slider = (k, label, min, max, step) => {
    const val = h('span', { class: 'muted', style: 'width:60px' }, s[k]);
    const r = h('input', { type: 'range', min, max, step, value: s[k] });
    r.addEventListener('input', () => { s[k] = +r.value; val.textContent = r.value; drawSnd(s); });
    r.addEventListener('change', () => { upd(k, +r.value); RT.playSound(s); });
    return h('div', { class: 'fld' }, h('label', null, label), h('div', { class: 'row' }, r, val));
  };
  wrap.append(h('div', { class: 'ed-col', style: 'min-width:360px' },
    h('h3', null, 'Chiptune SFX'),
    h('div', { class: 'fld' }, h('label', null, 'Sound'), selectEl(proj.sounds.map(x => [x.id, x.name]), s.id, v => { S.soundEdit = v; renderSoundEditor(); })),
    h('div', { class: 'fld' }, h('label', null, 'Name'), inp('text', s.name, v => { upd('name', v); renderSoundEditor(); })),
    h('div', { class: 'fld' }, h('label', null, 'Waveform'), selectEl([['square', 'Square (pulse)'], ['triangle', 'Triangle'], ['sawtooth', 'Sawtooth'], ['noise', 'Noise']], s.wave, v => { upd('wave', v); RT.playSound(s); })),
    slider('f0', 'Start freq (Hz)', 40, 3000, 1), slider('f1', 'End freq (Hz)', 40, 3000, 1), slider('dur', 'Duration (s)', 0.02, 1.5, 0.01), slider('vol', 'Volume', 0.05, 1, 0.05),
    h('div', { class: 'row' }, h('button', { class: 'on', onclick: () => RT.playSound(s) }, '▶ Play'),
      h('button', { onclick: () => { pushUndo(); Object.assign(s, { wave: ['square', 'triangle', 'sawtooth', 'noise'][Math.random() * 4 | 0], f0: 80 + Math.random() * 1800 | 0, f1: 60 + Math.random() * 1800 | 0, dur: +(0.05 + Math.random() * 0.5).toFixed(2) }); changed({ quiet: true }); renderSoundEditor(); renderDrawer(); RT.playSound(s); } }, '🎲 Randomize'),
      h('button', { onclick: () => { if (proj.sounds.length <= 1 || !confirm('Delete sound "' + s.name + '"?')) return; mutate(() => { proj.sounds = proj.sounds.filter(x => x !== s); S.soundEdit = null; }); renderSoundEditor(); } }, '🗑 Delete')),
    h('h3', null, 'Presets'),
    h('div', { class: 'row' }, Object.entries(SFX_PRESETS).map(([k, v]) => h('button', { onclick: () => { pushUndo(); Object.assign(s, v); changed({ quiet: true }); renderSoundEditor(); renderDrawer(); RT.playSound(s); } }, k)))),
    h('div', { class: 'ed-col' }, h('h3', null, 'Pitch envelope'), h('canvas', { id: 'snd-canvas', width: 420, height: 200 })));
  drawSnd(s);
}
function drawSnd(s) {
  const c = $('#snd-canvas'); if (!c) return;
  const x = c.getContext('2d'); x.fillStyle = '#0b0b0e'; x.fillRect(0, 0, 420, 200);
  x.strokeStyle = '#ffffff14'; for (let i = 0; i < 420; i += 30) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 200); x.stroke(); }
  const fy = f => 190 - Math.log(f / 40) / Math.log(3000 / 40) * 180;
  x.strokeStyle = '#a6e05a'; x.lineWidth = 2; x.beginPath();
  for (let i = 0; i <= 400; i++) { const t = i / 400, f = s.f0 * Math.pow(s.f1 / s.f0, t); const px = 10 + i, py = fy(f); i ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.stroke();
  x.strokeStyle = '#f2c45a'; x.beginPath();
  for (let i = 0; i <= 400; i++) { const t = i / 400, g = Math.pow(0.002, t); const py = 190 - g * 60 * s.vol; i ? x.lineTo(10 + i, py) : x.moveTo(10, py); }
  x.stroke();
  x.fillStyle = '#ddd'; x.font = '11px monospace';
  x.fillText(s.wave.toUpperCase() + '  ' + Math.round(s.f0) + 'Hz → ' + Math.round(s.f1) + 'Hz  ' + s.dur + 's', 10, 14);
  x.fillStyle = '#a6e05a'; x.fillText('pitch', 360, 14); x.fillStyle = '#f2c45a'; x.fillText('volume', 360, 28);
}
