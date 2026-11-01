/* BitForge 8 editor: Blueprint (visual scripting) graph editor */
'use strict';
// ---------------------------------------------------------------- blueprint editor
function openBlueprint(id) { S.bpActor = id; S.bpPan = { x: 20, y: 20 }; S.bpSel = null; openTab('blueprint'); }
function bpActor() { const f = S.bpActor && findActor(S.bpActor); return f && f.actor; }
function renderBpPalette() {
  const q = $('#bp-search').value.toLowerCase(), el = $('#bp-palette'); el.innerHTML = '';
  for (const [cat, label] of [['event', 'Events'], ['flow', 'Flow Control'], ['action', 'Actions']]) {
    const items = Object.entries(NODE_DEFS).filter(([k, d]) => d.cat === cat && (!q || d.title.toLowerCase().includes(q)));
    if (!items.length) continue;
    el.append(h('div', { class: 'bp-cat' }, label));
    items.forEach(([k, d]) => el.append(h('button', { class: 'bp-add ' + cat, title: d.help || '', onclick: () => addBpNode(k) }, d.title)));
  }
}
function addBpNode(kind) {
  const a = bpActor(); if (!a) return;
  const g = $('#bp-graph').getBoundingClientRect();
  mutate(() => {
    a.bp = a.bp || { nodes: [] };
    const n = newNode(kind, Math.round(g.width / 2 - S.bpPan.x - 100 + Math.random() * 40), Math.round(g.height / 2 - S.bpPan.y - 60 + Math.random() * 40));
    a.bp.nodes.push(n); S.bpSel = n.id;
  }, { quiet: true });
  renderBlueprint();
}
function paramControl(type, val, onchange, opt, actorLevel) {
  if (type.startsWith('ref:') || type === 'loot' || type === 'levelid') return dbControl(type, val, onchange);
  switch (type) {
    case 'num': return inp('number', val, onchange, { step: 'any' });
    case 'bool': return inp('checkbox', val, onchange);
    case 'key': return selectEl(KEYS, val, onchange);
    case 'sel': return selectEl(opt.map(o => [o, o]), val, onchange);
    case 'target': return selectEl([['self', 'Self'], ['other', 'Other']], val, onchange);
    case 'sprite': return selectEl(spriteOpts(true), val, onchange);
    case 'sound': return selectEl(soundOpts(), val, onchange);
    case 'color': { const s = selectEl(PAL.map((c, i) => [i, RT.PALETTE_NAMES[i]]), val, v => onchange(+v)); s.style.borderLeft = '10px solid ' + PAL[+val || 0]; return s; }
    case 'level': return selectEl([['__next', '→ Next Level'], ['__restart', '↻ Restart Level'], ['__first', '⏮ First Level']].concat(proj.levels.map(l => [l.id, l.name])), val, onchange);
    case 'actor': {
      const names = [...new Set((actorLevel ? actorLevel.actors : []).map(a => a.name))];
      if (val && !names.includes(val)) names.unshift(val);
      return selectEl([['', '— pick —']].concat(names.map(n => [n, n])), val, onchange);
    }
    default: return inp('text', val, onchange);
  }
}
function renderBlueprint() {
  renderBpPalette();
  const a = bpActor(), f = S.bpActor && findActor(S.bpActor);
  $('#bp-title').textContent = a ? a.name : '—';
  const nodesEl = $('#bp-nodes'); nodesEl.innerHTML = '';
  $('#bp-empty').textContent = !a ? 'Select an actor and press "Open Blueprint Editor" in Details.' : (!(a.bp && a.bp.nodes.length) ? 'Empty graph. Add an Event node from the left, then drag from its ▶ pin to an Action.' : '');
  if (a) {
    a.bp = a.bp || { nodes: [] };
    for (const n of a.bp.nodes) {
      const def = NODE_DEFS[n.kind]; if (!def) continue;
      n.p = n.p || {};
      const el = h('div', { class: 'node cat-' + def.cat + (S.bpSel === n.id ? ' selected' : ''), 'data-id': n.id, style: 'left:' + n.x + 'px;top:' + n.y + 'px' });
      const head = h('div', { class: 'node-head', title: def.help || '' });
      if (def.cat !== 'event') head.append(h('span', { class: 'pin in' }));
      head.append(h('span', { class: 'node-title' }, def.title),
        h('button', { class: 'node-x', title: 'Delete node', onmousedown: e => e.stopPropagation(), onclick: () => delBpNode(n.id) }, '×'));
      el.append(head);
      const body = h('div', { class: 'node-body' });
      for (const [k, type, label, , opt] of def.params) {
        body.append(h('div', { class: 'prow' }, h('label', null, label),
          paramControl(type, n.p[k], v => { pushUndo(); n.p[k] = v; changed({ quiet: true }); if (type === 'color') renderBlueprint(); }, opt, f && f.level)));
      }
      const outs = def.outs || ['Exec'];
      const oe = h('div', { class: 'outs' });
      outs.forEach((o, i) => {
        const linked = i === 0 ? n.next : n.nextFalse;
        oe.append(h('div', { class: 'out' }, o, h('span', { class: 'pin out' + (i ? ' f' : '') + (linked ? '' : ' empty'), 'data-out': i, title: 'Drag to connect · click to disconnect' })));
      });
      body.append(oe);
      el.append(body);
      nodesEl.append(el);
    }
  }
  applyBpPan(); drawWires();
  renderTabs();
}
function applyBpPan() { $('#bp-layer').style.transform = 'translate(' + S.bpPan.x + 'px,' + S.bpPan.y + 'px)'; }
function pinPos(el) {
  const lr = $('#bp-layer').getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: r.left - lr.left + r.width / 2, y: r.top - lr.top + r.height / 2 };
}
function wirePath(p, q) { const dx = Math.max(40, Math.abs(q.x - p.x) / 2); return `M${p.x},${p.y} C${p.x + dx},${p.y} ${q.x - dx},${q.y} ${q.x},${q.y}`; }
function drawWires(temp) {
  const svg = $('#bp-wires'), a = bpActor(); let out = '';
  if (a && a.bp) for (const n of a.bp.nodes) {
    [n.next, n.nextFalse].forEach((tid, i) => {
      if (!tid) return;
      const src = $(`.node[data-id="${n.id}"] .pin.out[data-out="${i}"]`), dst = $(`.node[data-id="${tid}"] .pin.in`);
      if (src && dst) out += `<path class="${i ? 'false' : ''}" d="${wirePath(pinPos(src), pinPos(dst))}"/>`;
    });
  }
  if (temp) out += `<path class="temp" d="${wirePath(temp.p, temp.q)}"/>`;
  svg.innerHTML = out;
}
function delBpNode(id) {
  const a = bpActor(); if (!a) return;
  mutate(() => {
    a.bp.nodes = a.bp.nodes.filter(n => n.id !== id);
    a.bp.nodes.forEach(n => { if (n.next === id) n.next = null; if (n.nextFalse === id) n.nextFalse = null; });
  }, { quiet: true });
  renderBlueprint();
}
let bpDrag = null;
$('#bp-graph').addEventListener('mousedown', e => {
  const a = bpActor(); if (!a) return;
  const pin = e.target.closest('.pin.out'), head = e.target.closest('.node-head'), nodeEl = e.target.closest('.node');
  if (pin) {
    const nid = pin.closest('.node').dataset.id;
    bpDrag = { type: 'wire', nid, out: +pin.dataset.out, p: pinPos(pin), sx: e.clientX, sy: e.clientY };
    e.preventDefault(); return;
  }
  if (head && !e.target.closest('button')) {
    const n = a.bp.nodes.find(x => x.id === nodeEl.dataset.id);
    S.bpSel = n.id; $$('.node').forEach(x => x.classList.toggle('selected', x === nodeEl));
    bpDrag = { type: 'node', n, el: nodeEl, sx: e.clientX, sy: e.clientY, x: n.x, y: n.y, snap: snapshot() };
    e.preventDefault(); return;
  }
  if (!nodeEl) { bpDrag = { type: 'pan', sx: e.clientX, sy: e.clientY, x: S.bpPan.x, y: S.bpPan.y }; S.bpSel = null; $$('.node').forEach(x => x.classList.remove('selected')); }
});
window.addEventListener('mousemove', e => {
  if (!bpDrag) return;
  if (bpDrag.type === 'pan') { S.bpPan.x = bpDrag.x + e.clientX - bpDrag.sx; S.bpPan.y = bpDrag.y + e.clientY - bpDrag.sy; applyBpPan(); }
  else if (bpDrag.type === 'node') {
    const nx = Math.round((bpDrag.x + e.clientX - bpDrag.sx) / 8) * 8, ny = Math.round((bpDrag.y + e.clientY - bpDrag.sy) / 8) * 8;
    if (nx !== bpDrag.n.x || ny !== bpDrag.n.y) {
      if (bpDrag.snap) { pushUndo(bpDrag.snap); bpDrag.snap = null; }
      bpDrag.n.x = nx; bpDrag.n.y = ny; bpDrag.el.style.left = nx + 'px'; bpDrag.el.style.top = ny + 'px'; bpDrag.moved = true; drawWires();
    }
  } else if (bpDrag.type === 'wire') {
    const lr = $('#bp-layer').getBoundingClientRect();
    drawWires({ p: bpDrag.p, q: { x: e.clientX - lr.left, y: e.clientY - lr.top } });
  }
});
window.addEventListener('mouseup', e => {
  if (!bpDrag) return;
  const d = bpDrag; bpDrag = null;
  if (d.type === 'node' && d.moved) changed({ quiet: true });
  if (d.type === 'wire') {
    const a = bpActor(), src = a.bp.nodes.find(n => n.id === d.nid);
    const tgtEl = document.elementFromPoint(e.clientX, e.clientY);
    const tnode = tgtEl && tgtEl.closest && tgtEl.closest('.node');
    const key = d.out ? 'nextFalse' : 'next';
    const clicked = Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) < 4;
    if (tnode && tnode.dataset.id !== src.id && NODE_DEFS[a.bp.nodes.find(n => n.id === tnode.dataset.id).kind].cat !== 'event') {
      pushUndo(); src[key] = tnode.dataset.id; changed({ quiet: true });
    } else if (src[key] && (clicked || !tnode)) { pushUndo(); src[key] = null; changed({ quiet: true }); }
    renderBlueprint();
  }
});
$('#bp-search').addEventListener('input', renderBpPalette);
