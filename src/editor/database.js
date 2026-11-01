/* BitForge 8 editor: RPG Maker-style Database editor (F9) */
'use strict';
// ---------------------------------------------------------------- database editor
const RARITY = [['0', 'Common'], ['1', 'Uncommon'], ['2', 'Rare'], ['3', 'Epic'], ['4', 'Legendary']];
const LOOT_KINDS = [['items', 'item', 'Items'], ['weapons', 'weapon', 'Weapons'], ['armors', 'armor', 'Armor']];
const STAT_FIELDS = [['hp', 'num', 'Max HP +'], ['mp', 'num', 'Max MP +'], ['atk', 'num', 'Attack +'], ['def', 'num', 'Defense +'], ['mag', 'num', 'Magic +'], ['agi', 'num', 'Agility +']];
const DB_SCHEMA = {
  heroes: { label: 'Heroes', icon: '🧝', fields: [['name', 'text', 'Name'], ['sprite', 'sprite', 'Sprite'], ['class', 'ref:classes', 'Class'], ['level', 'num', 'Starting level'],
    ['_e', 'head', 'Starting equipment'], ['weapon', 'gear:weapon', 'Weapon'], ['shield', 'gear:shield', 'Shield'], ['head', 'gear:head', 'Head'], ['body', 'gear:body', 'Body'], ['acc', 'gear:acc', 'Accessory'],
    ['items', 'list', 'Starting items', { cols: [['loot', 'loot', 'Item'], ['count', 'num', 'Count']], make: () => ({ loot: '', count: 1 }) }], ['bio', 'textarea', 'Profile']],
    make: () => ({ name: 'New Hero', sprite: '', class: '', level: 1, weapon: '', shield: '', head: '', body: '', acc: '', items: [], bio: '' }) },
  classes: { label: 'Classes', icon: '🎓', fields: [['name', 'text', 'Name'], ['_b', 'head', 'Base stats at level 1'], ['hp', 'num', 'Max HP'], ['mp', 'num', 'Max MP'], ['atk', 'num', 'Attack'], ['def', 'num', 'Defense'], ['mag', 'num', 'Magic'], ['agi', 'num', 'Agility'],
    ['_g', 'head', 'Growth per level'], ['ghp', 'num', 'HP / level'], ['gmp', 'num', 'MP / level'], ['gatk', 'num', 'ATK / level'], ['gdef', 'num', 'DEF / level'], ['gmag', 'num', 'MAG / level'], ['gagi', 'num', 'AGI / level'],
    ['learn', 'list', 'Skills learned', { cols: [['skill', 'ref:skills', 'Skill'], ['level', 'num', 'At level']], make: () => ({ skill: '', level: 1 }) }], ['desc', 'textarea', 'Description']],
    make: () => ({ name: 'New Class', hp: 30, mp: 10, atk: 5, def: 4, mag: 4, agi: 4, ghp: 6, gmp: 2, gatk: 1.5, gdef: 1.2, gmag: 1.2, gagi: 0.6, learn: [], desc: '' }) },
  skills: { label: 'Skills', icon: '✨', fields: [['name', 'text', 'Name'], ['icon', 'sprite', 'Icon'], ['type', 'sel:slash=Melee strike,projectile=Projectile,nova=Area burst around you,heal=Heal self', 'Type'],
    ['stat', 'sel:atk=Attack,mag=Magic', 'Scales with'], ['power', 'num', 'Power multiplier'], ['mp', 'num', 'MP cost'], ['cooldown', 'num', 'Cooldown (seconds)'], ['range', 'num', 'Range / radius (px)'],
    ['color', 'color', 'Effect color'], ['sound', 'sound', 'Sound'], ['desc', 'textarea', 'Description']],
    make: () => ({ name: 'New Skill', icon: '', type: 'slash', stat: 'atk', power: 1.5, mp: 3, cooldown: 1, range: 10, color: 11, sound: '', desc: '' }) },
  items: { label: 'Items', icon: '🧪', fields: [['name', 'text', 'Name'], ['icon', 'sprite', 'Icon'], ['type', 'sel:consumable=Consumable,material=Material / loot,key=Key item (can\'t sell)', 'Type'],
    ['effect', 'sel:none=None,heal_hp=Restore HP,heal_mp=Restore MP,heal_all=Restore HP and MP', 'Effect'], ['power', 'num', 'Amount'], ['price', 'num', 'Price (gold)'], ['rarity', 'rarity', 'Rarity'], ['desc', 'textarea', 'Description']],
    make: () => ({ name: 'New Item', icon: '', type: 'consumable', effect: 'heal_hp', power: 30, price: 10, rarity: 0, desc: '' }) },
  weapons: { label: 'Weapons', icon: '⚔️', fields: [['name', 'text', 'Name'], ['icon', 'sprite', 'Icon']].concat(STAT_FIELDS, [['price', 'num', 'Price (gold)'], ['rarity', 'rarity', 'Rarity'], ['desc', 'textarea', 'Description']]),
    make: () => ({ name: 'New Weapon', icon: '', hp: 0, mp: 0, atk: 5, def: 0, mag: 0, agi: 0, price: 50, rarity: 0, desc: '' }) },
  armors: { label: 'Armor', icon: '🛡️', fields: [['name', 'text', 'Name'], ['icon', 'sprite', 'Icon'], ['slot', 'sel:body=Body,head=Head,shield=Shield,acc=Accessory', 'Slot']].concat(STAT_FIELDS, [['price', 'num', 'Price (gold)'], ['rarity', 'rarity', 'Rarity'], ['desc', 'textarea', 'Description']]),
    make: () => ({ name: 'New Armor', icon: '', slot: 'body', hp: 0, mp: 0, atk: 0, def: 3, mag: 0, agi: 0, price: 40, rarity: 0, desc: '' }) },
  monsters: { label: 'Monsters', icon: '👾', fields: [['name', 'text', 'Name'], ['sprite', 'sprite', 'Sprite'], ['level', 'num', 'Level (shown)'], ['hp', 'num', 'Max HP'], ['atk', 'num', 'Attack'], ['def', 'num', 'Defense'],
    ['exp', 'num', 'EXP reward'], ['gold', 'num', 'Gold reward'], ['_ai', 'head', 'Behavior'], ['ai', 'sel:melee=Melee chaser,ranged=Ranged shooter,passive=Passive (fights back)', 'AI'], ['aggro', 'num', 'Aggro range (px)'],
    ['speed', 'num', 'Move speed'], ['respawn', 'num', 'Respawn (sec, 0 = never)'], ['boss', 'bool', 'Boss (big HP bar)'],
    ['drops', 'list', 'Loot table', { cols: [['loot', 'loot', 'Drop'], ['chance', 'num', 'Chance %']], make: () => ({ loot: '', chance: 25 }) }], ['desc', 'textarea', 'Notes']],
    make: () => ({ name: 'New Monster', sprite: '', level: 1, hp: 20, atk: 5, def: 1, exp: 5, gold: 2, ai: 'melee', aggro: 48, speed: 0.5, respawn: 15, boss: false, drops: [], desc: '' }) },
  shops: { label: 'Shops', icon: '🏪', fields: [['name', 'text', 'Name'], ['greeting', 'text', 'Greeting'], ['goods', 'list', 'Goods for sale', { cols: [['loot', 'loot', 'Item']], make: () => ({ loot: '' }) }]],
    make: () => ({ name: 'New Shop', greeting: 'Welcome!', goods: [] }) },
  quests: { label: 'Quests', icon: '📜', fields: [['name', 'text', 'Name'], ['type', 'sel:kill=Defeat monsters,collect=Collect items', 'Objective'], ['monster', 'ref:monsters', 'Monster (defeat)'], ['item', 'loot', 'Item (collect)'],
    ['count', 'num', 'Amount'], ['_r', 'head', 'Rewards'], ['exp', 'num', 'EXP'], ['gold', 'num', 'Gold'], ['reward', 'loot', 'Item'], ['_t', 'head', 'Dialogue'], ['desc', 'textarea', 'Offer text'], ['doneText', 'textarea', 'Completion text']],
    make: () => ({ name: 'New Quest', type: 'kill', monster: '', item: '', count: 3, exp: 30, gold: 20, reward: '', desc: '', doneText: '' }) },
  system: { label: 'System', icon: '⚙️', single: true, fields: [['startGold', 'num', 'Starting gold'], ['lootSprite', 'sprite', 'Loot bag sprite'], ['_s', 'head', 'System sounds'],
    ['s.swing', 'sound', 'Weapon swing'], ['s.hit', 'sound', 'Hit monster'], ['s.hurt', 'sound', 'Player hurt'], ['s.death', 'sound', 'Player defeated'], ['s.levelup', 'sound', 'Level up / quest'],
    ['s.pickup', 'sound', 'Pick up item'], ['s.coin', 'sound', 'Gold / shop'], ['s.heal', 'sound', 'Heal / potion'], ['s.magic', 'sound', 'Default skill'], ['s.menu', 'sound', 'Menu cursor'], ['s.door', 'sound', 'Door / transfer']] }
};
const dbList = cat => (proj.db[cat] = proj.db[cat] || []);
const dbFind = (cat, id) => dbList(cat).find(e => e.id === id);
function lootName(ref) {
  if (!ref) return '';
  const [k, id] = ref.split(':'), cat = (LOOT_KINDS.find(x => x[1] === k) || [])[0];
  const e = cat && dbFind(cat, id); return e ? e.name : '(missing)';
}
function lootSelect(val, onchange) {
  const s = h('select', null, h('option', { value: '' }, '— none —'),
    LOOT_KINDS.map(([cat, k, label]) => h('optgroup', { label }, dbList(cat).map(d => h('option', { value: k + ':' + d.id }, d.name)))));
  s.value = val || ''; s.addEventListener('change', () => onchange(s.value));
  return s;
}
function refSelect(cat, val, onchange) { return selectEl([['', '— none —']].concat(dbList(cat).map(d => [d.id, d.name])), val, onchange); }
function levelSelect(val, onchange) { return selectEl([['', '— pick level —']].concat(proj.levels.map(l => [l.id, l.name])), val, onchange); }
function dbControl(type, val, set) {
  if (type === 'text') return inp('text', val, set);
  if (type === 'textarea') { const t = h('textarea', { rows: 3 }); t.value = val || ''; t.addEventListener('change', () => set(t.value)); return t; }
  if (type === 'num') return inp('number', val, v => set(v === '' ? 0 : +v), { step: 'any' });
  if (type === 'bool') return inp('checkbox', val, set);
  if (type === 'sprite') return h('div', { class: 'row' }, thumbCanvas(val, 20), selectEl(spriteOpts(true), val, set));
  if (type === 'sound') { const s = sound(val); return h('div', { class: 'row' }, selectEl(soundOpts(), val, set), h('button', { title: 'Preview', onclick: () => s && RT.playSound(s) }, '▶')); }
  if (type === 'color') return swatches(val, set);
  if (type === 'rarity') return selectEl(RARITY, String(val || 0), v => set(+v));
  if (type === 'loot') return lootSelect(val, set);
  if (type === 'levelid') return levelSelect(val, set);
  if (type.startsWith('sel:')) return selectEl(type.slice(4).split(',').map(p => p.split('=')), val, set);
  if (type.startsWith('ref:')) return refSelect(type.slice(4), val, set);
  if (type.startsWith('gear:')) {
    const slot = type.slice(5), list = slot === 'weapon' ? dbList('weapons') : dbList('armors').filter(a => (a.slot || 'body') === slot);
    return selectEl([['', '— none —']].concat(list.map(o => [o.id, o.name])), val, set);
  }
  return inp('text', val, set);
}
function openDatabase(cat) { if (cat) { S.dbCat = cat; S.dbSel = null; } openTab('database'); }
function renderDatabase() {
  const page = $('#page-database'); page.innerHTML = '';
  proj.db = proj.db || emptyDb();
  const cat = S.dbCat || 'heroes'; S.dbCat = cat;
  const sch = DB_SCHEMA[cat];
  page.append(h('div', { class: 'db-cats' }, h('div', { class: 'panel-h' }, 'Database'),
    h('div', { class: 'panel-b', style: 'padding:4px 0' }, Object.entries(DB_SCHEMA).map(([k, s]) => h('div', { class: 'db-cat' + (k === cat ? ' on' : ''), onclick: () => { S.dbCat = k; S.dbSel = null; renderDatabase(); } },
      s.icon, ' ', s.label, s.single ? null : h('span', { class: 'badge' }, dbList(k).length))))));
  if (sch.single) {
    proj.db.system = proj.db.system || { sounds: {} };
    page.append(h('div', { class: 'db-list' }, h('div', { class: 'panel-h' }, 'System'), h('div', { class: 'panel-b muted' }, 'Global RPG settings used by every level.')));
    page.append(dbForm(proj.db.system, sch, 'System'));
    return;
  }
  const list = dbList(cat);
  let ent = list.find(e => e.id === S.dbSel) || list[0];
  S.dbSel = ent && ent.id;
  const act = (title, label, fn) => h('button', { title, onclick: fn }, label);
  page.append(h('div', { class: 'db-list' },
    h('div', { class: 'panel-h' }, sch.label, h('div', { class: 'r' },
      act('New entry', '+', () => { mutate(() => { const e = Object.assign({ id: uid(cat[0]) }, sch.make()); list.push(e); S.dbSel = e.id; }, { quiet: true }); renderDatabase(); }),
      act('Duplicate', '⧉', () => { if (!ent) return; mutate(() => { const e = Object.assign(clone(ent), { id: uid(cat[0]), name: ent.name + ' Copy' }); list.splice(list.indexOf(ent) + 1, 0, e); S.dbSel = e.id; }, { quiet: true }); renderDatabase(); }),
      act('Delete', '🗑', () => { if (!ent || !confirm('Delete "' + ent.name + '" from ' + sch.label + '?')) return; mutate(() => { list.splice(list.indexOf(ent), 1); S.dbSel = null; }, { quiet: true }); renderDatabase(); }))),
    h('div', { class: 'panel-b' }, list.map((e, i) => h('div', { class: 'db-item' + (ent === e ? ' on' : ''), onclick: () => { S.dbSel = e.id; renderDatabase(); } },
      h('span', { class: 'muted' }, String(i + 1).padStart(3, '0')), thumbCanvas(e.icon || e.sprite),
      h('span', { class: e.rarity != null ? 'rar' + e.rarity : '' }, e.name || '(unnamed)'))),
      !list.length ? h('div', { class: 'muted', style: 'padding:8px' }, 'Empty. Press + to add.') : null)));
  page.append(ent ? dbForm(ent, sch) : h('div', { class: 'db-form muted' }, 'Select or create an entry.'));
}
function dbForm(e, sch, title) {
  const f = h('div', { class: 'db-form' });
  f.append(h('h2', null, (e.icon || e.sprite) ? thumbCanvas(e.icon || e.sprite) : null, title || e.name || ''));
  const getv = k => k.startsWith('s.') ? (e.sounds || {})[k.slice(2)] : e[k];
  const setv = (k, v) => {
    mutate(() => { if (k.startsWith('s.')) { e.sounds = e.sounds || {}; e.sounds[k.slice(2)] = v; } else e[k] = v; }, { quiet: true });
    renderDatabase();
  };
  for (const [k, type, label, extra] of sch.fields) {
    if (type === 'head') { f.append(h('h4', null, label)); continue; }
    if (type === 'list') { f.append(h('h4', null, label), dbSubList(e, k, extra)); continue; }
    f.append(h('div', { class: 'fld' }, h('label', null, label), dbControl(type, getv(k), v => setv(k, v))));
  }
  if (sch === DB_SCHEMA.classes) {
    const lv = [1, 5, 10, 20, 30, 50];
    const st = (k, l) => Math.round((+e[k] || 0) + (+e['g' + k] || 0) * (l - 1));
    f.append(h('h4', null, 'Stat curve preview'), h('table', { class: 'curve' },
      h('tr', null, h('th', null, 'Level'), lv.map(l => h('th', null, l))),
      ['hp', 'mp', 'atk', 'def', 'mag', 'agi'].map(k => h('tr', null, h('th', null, k.toUpperCase()), lv.map(l => h('td', null, st(k, l))))),
      h('tr', null, h('th', null, 'EXP to next'), lv.map(l => h('td', null, Math.round(20 * Math.pow(l, 1.7)))))));
  }
  if (sch === DB_SCHEMA.monsters) {
    const users = proj.levels.map(L => [L.name, L.actors.filter(a => a.comps && a.comps.monster && a.comps.monster.monster === e.id).length]).filter(x => x[1]);
    f.append(h('h4', null, 'Placed in levels'), h('p', { class: 'muted' }, users.length ? users.map(([n, c]) => n + ' ×' + c).join(' · ') : 'Not placed yet. Use Place Actors → Monster.'));
  }
  if (sch === DB_SCHEMA.quests) {
    const givers = []; proj.levels.forEach(L => L.actors.forEach(a => { if (a.comps && a.comps.npc && a.comps.npc.quest === e.id) givers.push(a.name + ' (' + L.name + ')'); }));
    f.append(h('h4', null, 'Given by'), h('p', { class: 'muted' }, givers.length ? givers.join(' · ') : 'No NPC gives this quest yet. Set it on an NPC component or use a Start Quest node.'));
  }
  return f;
}
function dbSubList(e, k, spec) {
  e[k] = e[k] || [];
  const w = h('div', { class: 'db-sub' });
  e[k].forEach((row, i) => w.append(h('div', { class: 'db-subrow' },
    spec.cols.map(([ck, ct, cl]) => h('div', { class: 'db-subcell' }, h('small', { class: 'muted' }, cl),
      dbControl(ct, row[ck], v => { mutate(() => { row[ck] = v; }, { quiet: true }); renderDatabase(); }))),
    h('button', { title: 'Remove', onclick: () => { mutate(() => { e[k].splice(i, 1); }, { quiet: true }); renderDatabase(); } }, '×'))));
  w.append(h('div', null, h('button', { onclick: () => { mutate(() => { e[k].push(spec.make()); }, { quiet: true }); renderDatabase(); } }, '+ Add row')));
  return w;
}
