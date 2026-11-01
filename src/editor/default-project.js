/* BitForge 8 editor: Sample project ("Crystal Quest"), empty database and Place Actors templates */
'use strict';
// ------------------------------------------------------------ default project
function emptyDb() {
  return { heroes: [], classes: [], skills: [], items: [], weapons: [], armors: [], monsters: [], shops: [], quests: [], system: { startGold: 0, lootSprite: '', sounds: {} } };
}
function makeDefaultProject() {
  const S = (name, px, solid) => ({ id: uid('s'), name, px, solid: !!solid });
  const sp = {
    // RPG characters
    knight: S('Aria (Knight)', ['..eeee..', '.eebbee.', '.effffe.', '..f0f0..', '..ffff..', '.c2222c.', 'f.2222.f', '..1..1..']),
    mage: S('Milo (Mage)', ['...22...', '..2222..', '.222222.', '..ffff..', '..f0f0..', '..ffff..', '.222222.', '..8..8..']),
    villager: S('Villager', ['..8888..', '.888888.', '..ffff..', '..f0f0..', '..ffff..', '.666666.', 'f.6666.f', '..9..9..']),
    merchant: S('Merchant', ['..aaaa..', '.aaaaaa.', '..ffff..', '..f0f0..', '..ffff..', '.cccccc.', 'f.cccc.f', '..8..8..']),
    elder: S('Elder', ['..bbbb..', '.bbbbbb.', '..ffff..', '..f0f0..', '..fbbf..', '.2bbbb2.', '.222222.', '..2..2..']),
    guard: S('Guard', ['.eeeeee.', '.e1111e.', '..ffff..', '..f0f0..', '..ffff..', '.eeeeee.', 'f.eeee.f', '..1..1..']),
    slime: S('Slime', ['........', '..6666..', '.666666.', '66b66b66', '66066066', '66666666', '.666666.', '........']),
    bat: S('Bat', ['........', 'e......e', 'ee.11.ee', 'ee1111ee', '.e1c1ce.', '..1111..', '...11...', '........']),
    skeleton: S('Skeleton', ['..bbbb..', '.bbbbbb.', '.b0bb0b.', '..bbbb..', '...bb...', '.bbbbbb.', '..b..b..', '.bb..bb.']),
    golem: S('Crystal Golem', ['..eeee..', '.e4ee4e.', 'eeeeeeee', 'e4e44e4e', 'eeeeeeee', '.ee..ee.', '.ee..ee.', 'eee..eee']),
    // RPG terrain
    meadow: S('Meadow', ['66666666', '66766666', '66666656', '66666666', '65666666', '66666676', '66766666', '66666666']),
    path: S('Dirt Path', ['99999999', '99989999', '99999999', '98999989', '99999999', '99999899', '99899999', '99999999']),
    flowers: S('Flowers', ['66666666', '66d66666', '6dad6666', '66d66b66', '6666bab6', '66666b66', '66666666', '66666666']),
    water: S('Water', ['22222222', '23322222', '22222222', '22222332', '22222222', '22332222', '22222222', '22222223'], true),
    tree: S('Tree', ['..5555..', '.567765.', '56776665', '56666765', '.556655.', '...88...', '..5885..', '........'], true),
    stone: S('Stone Wall', ['eeeeeee1', 'eeeeeee1', '11111111', 'eee1eeee', 'eee1eeee', '11111111', 'eeeeeee1', 'eeeeeee1'], true),
    cave: S('Cave Floor', ['11111111', '12111111', '11111211', '11111111', '11211111', '11111121', '11111111', '11112111']),
    roof: S('Roof', ['cdddcddd', 'cccccccc', 'ddcdddcd', 'cccccccc', 'cdddcddd', 'cccccccc', 'ddcdddcd', 'cccccccc'], true),
    wall: S('House Wall', ['99999999', '98999989', '99999999', '88888888', '99999999', '99899899', '99999999', '88888888'], true),
    window: S('Window', ['99999999', '9eeeeee9', '9e4444e9', '9e4444e9', '9eeeeee9', '99999999', '99999999', '88888888'], true),
    door: S('Door', ['88888888', '89999998', '89999998', '89999998', '8999a998', '89999998', '89999998', '89999998']),
    caveDoor: S('Cave Door', ['eeeeeeee', 'ee0000ee', 'e000000e', 'e000000e', 'e000000e', 'e000000e', 'e000000e', 'e000000e']),
    well: S('Well', ['..8888..', '.8....8.', 'eeeeeeee', 'e222222e', 'e233332e', 'e222222e', 'eeeeeeee', '.eeeeee.']),
    chest: S('Chest', ['........', '.888888.', '89999998', '8888a888', '89999998', '89999998', '88888888', '........']),
    chestOpen: S('Chest (Open)', ['.888888.', '8......8', '80000008', '8888a888', '89999998', '89999998', '88888888', '........']),
    // icons
    potion: S('Potion', ['...bb...', '...88...', '..bccb..', '.bccccb.', '.cccccc.', '.cccccc.', '..cccc..', '........']),
    hipotion: S('Hi-Potion', ['...bb...', '...88...', '..bddb..', '.bddddb.', '.dddadd.', '.dddddd.', '..dddd..', '........']),
    ether: S('Ether', ['...bb...', '...88...', '..b33b..', '.b3333b.', '.333333.', '.333333.', '..3333..', '........']),
    gel: S('Slime Gel', ['........', '...66...', '..6776..', '.667766.', '.666666.', '..6666..', '........', '........']),
    wing: S('Bat Wing', ['........', 'e.......', 'ee......', 'eee.....', '.eeee...', '..eeeee.', '...eeee.', '........']),
    bone: S('Bone', ['........', 'b......b', 'bb....bb', '.bbbbbb.', '.bbbbbb.', 'bb....bb', 'b......b', '........']),
    key: S('Old Key', ['..aa....', '.a..a...', '.a..a...', '..aa....', '...a....', '...aaa..', '...a....', '...aa...']),
    woodSword: S('Wooden Sword', ['......99', '.....998', '....998.', '...998..', '.8998...', '..88....', '.8.8....', '8.......']),
    ironSword: S('Iron Sword', ['......bb', '.....bbe', '....bbe.', '...bbe..', '.8bbe...', '..88....', '.8.8....', '8.......']),
    staff: S('Oak Staff', ['......cc', '......cc', '.....8..', '....8...', '...8....', '..8.....', '.8......', '8.......']),
    crystal: S('Crystal Blade', ['......44', '.....443', '....443.', '...443..', '.a443...', '..aa....', '.a.a....', 'a.......']),
    tunic: S('Tunic', ['.99..99.', '99999999', '99999999', '.999999.', '.999999.', '.999999.', '.9....9.', '........']),
    leather: S('Leather Armor', ['.88..88.', '88888888', '88a88a88', '.888888.', '.888888.', '.888888.', '.8....8.', '........']),
    helm: S('Helm', ['........', '..eeee..', '.eeeeee.', 'eeeeeeee', 'ee1111ee', 'e1....1e', '........', '........']),
    shield: S('Shield', ['.eeeeee.', 'e222222e', 'e22aa22e', 'e2aaaa2e', 'e22aa22e', '.e2222e.', '..e22e..', '...ee...']),
    ring: S('Ring', ['........', '...44...', '..a44a..', '.a....a.', '.a....a.', '..a..a..', '...aa...', '........']),
    healIcon: S('Heal Icon', ['........', '...77...', '...77...', '.777777.', '.777777.', '...77...', '...77...', '........']),
    whirlIcon: S('Whirl Icon', ['a..a..a.', '.a.a.a..', '..aaa...', 'aaabaaa.', '..aaa...', '.a.a.a..', 'a..a..a.', '........']),
    frostIcon: S('Frost Icon', ['4..4..4.', '.4.4.4..', '..444...', '444b444.', '..444...', '.4.4.4..', '4..4..4.', '........']),
    fire: S('Fireball', ['........', '...dd...', '..dada..', '.daaaad.', '.dabbad.', '..daad..', '...dd...', '........']),
    lootbag: S('Loot Bag', ['...8....', '..989...', '.89a98..', '.899998.', '89999998', '89999998', '.888888.', '........']),
    // platformer kit (used by the platformer Place Actors)
    hero: S('Hero', ['..cccc..', '.cccccc.', '..ffff..', '.f0ff0f.', '..ffff..', '.222222.', '.2.22.2.', '.88..88.']),
    grass: S('Grass', ['77677767', '66666666', '86868686', '88988898', '89888988', '88898889', '98888898', '88988888'], true),
    dirt: S('Dirt', ['88988898', '89888988', '88898889', '98888898', '88988888', '88889888', '89888898', '88898888'], true),
    brick: S('Brick', ['99999998', '99999998', '88888888', '99989999', '99989999', '88888888', '99999998', '99999998'], true),
    block: S('Gold Block', ['aaaaaaa8', 'ab8aa8a8', 'aaaaaaa8', 'aaa88aa8', 'aaaaaaa8', 'ab8aa8a8', 'aaaaaaa8', '88888888'], true),
    coin: S('Coin', ['...aa...', '..abba..', '.aabaaa.', '.aabaaa.', '.aabaaa.', '.aaaaaa.', '..aaaa..', '...aa...']),
    flag: S('Flag', ['bc......', 'bccc....', 'bccccc..', 'bccc....', 'bc......', 'b.......', 'b.......', 'e.......'])
  };
  const N = (name, wave, f0, f1, dur, vol) => ({ id: uid('a'), name, wave, f0, f1, dur, vol });
  const sd = {
    swing: N('Swing', 'noise', 1400, 500, 0.07, 0.25), hit: N('Hit', 'sawtooth', 420, 60, 0.14, 0.35), hurt: N('Hurt', 'square', 320, 90, 0.22, 0.35),
    death: N('Death', 'sawtooth', 500, 40, 0.9, 0.4), levelup: N('Level Up', 'square', 260, 1560, 0.55, 0.28), pickup: N('Pickup', 'triangle', 700, 1400, 0.1, 0.35),
    coin: N('Coin', 'square', 990, 1980, 0.12, 0.25), heal: N('Heal', 'triangle', 400, 1300, 0.45, 0.35), fire: N('Fire', 'noise', 300, 1500, 0.25, 0.35),
    frost: N('Frost', 'triangle', 1800, 300, 0.4, 0.3), menu: N('Menu', 'square', 900, 900, 0.04, 0.15), door: N('Door', 'triangle', 220, 110, 0.22, 0.4),
    jump: N('Jump', 'square', 280, 720, 0.16, 0.3), boom: N('Explosion', 'noise', 900, 50, 0.5, 0.5)
  };

  // ---------------- Database ----------------
  const D = emptyDb();
  const add = (cat, o) => { o.id = uid(cat[0]); D[cat].push(o); return o; };
  const sk = {
    slash: add('skills', { name: 'Power Slash', icon: sp.ironSword.id, type: 'slash', stat: 'atk', power: 1.8, mp: 3, cooldown: 1.5, range: 10, color: 11, sound: sd.swing.id, desc: 'A heavy strike at the enemy in front of you.' }),
    heal: add('skills', { name: 'Heal', icon: sp.healIcon.id, type: 'heal', stat: 'mag', power: 3, mp: 5, cooldown: 3, range: 0, color: 7, sound: sd.heal.id, desc: 'Restore your own HP with holy light.' }),
    whirl: add('skills', { name: 'Whirlwind', icon: sp.whirlIcon.id, type: 'nova', stat: 'atk', power: 1.4, mp: 8, cooldown: 4, range: 22, color: 10, sound: sd.swing.id, desc: 'Spin and strike every enemy around you.' }),
    fireball: add('skills', { name: 'Fireball', icon: sp.fire.id, type: 'projectile', stat: 'mag', power: 2.2, mp: 4, cooldown: 0.8, range: 0, color: 13, sound: sd.fire.id, desc: 'Hurl a ball of fire in the direction you face.' }),
    frost: add('skills', { name: 'Frost Nova', icon: sp.frostIcon.id, type: 'nova', stat: 'mag', power: 2, mp: 10, cooldown: 5, range: 30, color: 4, sound: sd.frost.id, desc: 'A ring of ice that damages all nearby enemies.' })
  };
  const cl = {
    knight: add('classes', { name: 'Knight', hp: 40, mp: 12, atk: 8, def: 6, mag: 3, agi: 4, ghp: 8, gmp: 2, gatk: 2.5, gdef: 2, gmag: 0.5, gagi: 0.6,
      learn: [{ skill: sk.slash.id, level: 1 }, { skill: sk.heal.id, level: 3 }, { skill: sk.whirl.id, level: 5 }], desc: 'Sturdy front-line fighter.' }),
    mage: add('classes', { name: 'Mage', hp: 28, mp: 30, atk: 4, def: 3, mag: 9, agi: 5, ghp: 5, gmp: 5, gatk: 1, gdef: 1, gmag: 2.5, gagi: 0.8,
      learn: [{ skill: sk.fireball.id, level: 1 }, { skill: sk.heal.id, level: 2 }, { skill: sk.frost.id, level: 4 }], desc: 'Fragile caster with devastating spells.' })
  };
  const it = {
    potion: add('items', { name: 'Potion', icon: sp.potion.id, type: 'consumable', effect: 'heal_hp', power: 40, price: 15, rarity: 0, desc: 'Restores 40 HP.' }),
    hipotion: add('items', { name: 'Hi-Potion', icon: sp.hipotion.id, type: 'consumable', effect: 'heal_hp', power: 120, price: 60, rarity: 1, desc: 'Restores 120 HP.' }),
    ether: add('items', { name: 'Ether', icon: sp.ether.id, type: 'consumable', effect: 'heal_mp', power: 25, price: 30, rarity: 0, desc: 'Restores 25 MP.' }),
    gel: add('items', { name: 'Slime Gel', icon: sp.gel.id, type: 'material', effect: 'none', power: 0, price: 8, rarity: 0, desc: 'Sticky. Merchants buy it.' }),
    wing: add('items', { name: 'Bat Wing', icon: sp.wing.id, type: 'material', effect: 'none', power: 0, price: 12, rarity: 0, desc: 'Leathery wing of a cave bat.' }),
    bone: add('items', { name: 'Bone', icon: sp.bone.id, type: 'material', effect: 'none', power: 0, price: 14, rarity: 0, desc: 'An old bone. The town guard collects these.' }),
    key: add('items', { name: 'Old Key', icon: sp.key.id, type: 'key', effect: 'none', power: 0, price: 0, rarity: 2, desc: 'Opens the sealed cave in the Whispering Forest.' })
  };
  const wp = {
    wood: add('weapons', { name: 'Wooden Sword', icon: sp.woodSword.id, atk: 3, mag: 0, agi: 0, price: 20, rarity: 0, desc: 'A training sword.' }),
    iron: add('weapons', { name: 'Iron Sword', icon: sp.ironSword.id, atk: 8, mag: 0, agi: 0, price: 90, rarity: 1, desc: 'Reliable forged steel.' }),
    staff: add('weapons', { name: 'Oak Staff', icon: sp.staff.id, atk: 2, mag: 6, agi: 0, price: 80, rarity: 1, desc: 'Channels magic.' }),
    crystal: add('weapons', { name: 'Crystal Blade', icon: sp.crystal.id, atk: 18, mag: 4, agi: 2, price: 999, rarity: 3, desc: 'Carved from the Golem\'s crystal heart.' })
  };
  const ar = {
    tunic: add('armors', { name: 'Cloth Tunic', icon: sp.tunic.id, slot: 'body', def: 2, hp: 0, mp: 0, atk: 0, mag: 0, agi: 0, price: 10, rarity: 0, desc: 'Simple clothes.' }),
    leather: add('armors', { name: 'Leather Armor', icon: sp.leather.id, slot: 'body', def: 5, hp: 0, mp: 0, atk: 0, mag: 0, agi: 0, price: 70, rarity: 1, desc: 'Tough boiled leather.' }),
    helm: add('armors', { name: 'Iron Helm', icon: sp.helm.id, slot: 'head', def: 3, hp: 0, mp: 0, atk: 0, mag: 0, agi: 0, price: 55, rarity: 1, desc: 'Protects your head.' }),
    shield: add('armors', { name: 'Wooden Shield', icon: sp.shield.id, slot: 'shield', def: 3, hp: 0, mp: 0, atk: 0, mag: 0, agi: 0, price: 45, rarity: 0, desc: 'Blocks a few hits.' }),
    ring: add('armors', { name: 'Ring of Vigor', icon: sp.ring.id, slot: 'acc', def: 0, hp: 20, mp: 10, atk: 0, mag: 0, agi: 1, price: 300, rarity: 2, desc: 'Pulses with life.' })
  };
  add('heroes', { name: 'Aria', sprite: sp.knight.id, class: cl.knight.id, level: 1, weapon: wp.wood.id, shield: '', head: '', body: ar.tunic.id, acc: '',
    items: [{ loot: 'item:' + it.potion.id, count: 3 }], bio: 'A young knight from Oakvale.' });
  add('heroes', { name: 'Milo', sprite: sp.mage.id, class: cl.mage.id, level: 1, weapon: wp.staff.id, shield: '', head: '', body: ar.tunic.id, acc: '',
    items: [{ loot: 'item:' + it.ether.id, count: 2 }, { loot: 'item:' + it.potion.id, count: 2 }], bio: 'An apprentice mage. Try him by changing the RPG Hero component.' });
  const L = (k, id) => k + ':' + id;
  const mo = {
    slime: add('monsters', { name: 'Slime', sprite: sp.slime.id, level: 1, hp: 22, atk: 6, def: 1, exp: 6, gold: 3, ai: 'melee', aggro: 48, speed: 0.45, respawn: 12, boss: false,
      drops: [{ loot: L('item', it.gel.id), chance: 50 }, { loot: L('item', it.potion.id), chance: 15 }], desc: 'A wobbly forest pest.' }),
    bat: add('monsters', { name: 'Bat', sprite: sp.bat.id, level: 2, hp: 16, atk: 8, def: 1, exp: 9, gold: 4, ai: 'melee', aggro: 64, speed: 0.85, respawn: 15, boss: false,
      drops: [{ loot: L('item', it.wing.id), chance: 50 }, { loot: L('item', it.ether.id), chance: 10 }], desc: 'Fast and erratic.' }),
    skel: add('monsters', { name: 'Skeleton Archer', sprite: sp.skeleton.id, level: 4, hp: 45, atk: 11, def: 4, exp: 22, gold: 10, ai: 'ranged', aggro: 84, speed: 0.45, respawn: 20, boss: false,
      drops: [{ loot: L('item', it.bone.id), chance: 60 }, { loot: L('armor', ar.helm.id), chance: 10 }, { loot: L('item', it.hipotion.id), chance: 10 }], desc: 'Keeps its distance and shoots.' }),
    golem: add('monsters', { name: 'Crystal Golem', sprite: sp.golem.id, level: 8, hp: 420, atk: 20, def: 8, exp: 320, gold: 250, ai: 'melee', aggro: 90, speed: 0.55, respawn: 0, boss: true,
      drops: [{ loot: L('weapon', wp.crystal.id), chance: 100 }, { loot: L('armor', ar.ring.id), chance: 60 }], desc: 'Ancient guardian of the cave. Boss.' })
  };
  const shop = add('shops', { name: 'Oakvale General Store', greeting: 'Welcome! Take a look at my wares.',
    goods: [L('item', it.potion.id), L('item', it.hipotion.id), L('item', it.ether.id), L('weapon', wp.iron.id), L('weapon', wp.staff.id), L('armor', ar.shield.id), L('armor', ar.leather.id), L('armor', ar.helm.id)].map(loot => ({ loot })) });
  const q1 = add('quests', { name: 'Slime Trouble', type: 'kill', monster: mo.slime.id, item: '', count: 5, exp: 60, gold: 50, reward: L('item', it.key.id),
    desc: 'Slimes are eating our crops! Defeat 5 Slimes in the Whispering Forest, east of town.',
    doneText: 'Thank you, hero! Take this Old Key. It opens the sealed cave in the forest. Beware what sleeps inside...' });
  const q2 = add('quests', { name: 'Bone Collector', type: 'collect', monster: '', item: L('item', it.bone.id), count: 3, exp: 120, gold: 80, reward: L('weapon', wp.iron.id),
    desc: 'Skeletons haunt the forest cave. Bring me 3 Bones and I will forge you a real sword.',
    doneText: 'Fine bones! As promised, an Iron Sword. Equip it from your menu (I).' });
  D.system = { startGold: 60, lootSprite: sp.lootbag.id,
    sounds: { swing: sd.swing.id, hit: sd.hit.id, hurt: sd.hurt.id, death: sd.death.id, levelup: sd.levelup.id, pickup: sd.pickup.id, coin: sd.coin.id, heal: sd.heal.id, magic: sd.fire.id, menu: sd.menu.id, door: sd.door.id } };

  // ---------------- Levels ----------------
  let seed = 1337;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function level(name, w, hh, bg) { return { id: uid('l'), name, w, h: hh, bg, tiles: new Array(w * hh).fill(null), actors: [] }; }
  const set = (Lv, x, y, s) => { if (x >= 0 && y >= 0 && x < Lv.w && y < Lv.h) Lv.tiles[y * Lv.w + x] = s ? s.id : null; };
  const get = (Lv, x, y) => Lv.tiles[y * Lv.w + x];
  const fill = (Lv, s) => Lv.tiles.fill(s.id);
  const rect = (Lv, x0, y0, x1, y1, s) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(Lv, x, y, s); };
  const clear = (Lv, x, y, s) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const t = get(Lv, x + dx, y + dy); if (t === sp.tree.id || t === sp.stone.id) set(Lv, x + dx, y + dy, s); } };
  const actor = (Lv, name, sprite, x, y, comps, extra) => { const a = Object.assign({ id: uid('o'), name, sprite: sprite ? sprite.id : '', x: x * 8, y: y * 8, tags: '', template: false, comps: comps || {}, bp: { nodes: [] } }, extra || {}); Lv.actors.push(a); return a; };
  const hero = (Lv, x, y) => actor(Lv, 'Hero (Player Start)', sp.knight, x, y, { rpgPlayer: { hero: D.heroes[0].id } }, { tags: 'player' });
  const monster = (Lv, m, x, y) => actor(Lv, m.name, { id: m.sprite }, x, y, { monster: { monster: m.id } }, { tags: 'enemy' });
  const npc = (Lv, name, s, x, y, text, extra) => actor(Lv, name, s, x, y, { npc: Object.assign({ name, text, shop: '', quest: '' }, extra || {}) }, { tags: 'npc' });
  const chest = (Lv, x, y, loot, gold) => actor(Lv, 'Treasure Chest', sp.chest, x, y, { chest: { loot, gold, openSprite: sp.chestOpen.id } });
  const warp = (Lv, x, y, to, tx, ty, s) => actor(Lv, 'Warp → ' + to.name, s || null, x, y, { door: { level: to.id, x: tx, y: ty } });

  const town = level('Oakvale Town', 32, 18, 6);
  const forest = level('Whispering Forest', 48, 27, 6);
  const cave = level('Crystal Cave', 40, 22, 1);

  // Town
  fill(town, sp.meadow);
  for (let x = 0; x < 32; x++) { set(town, x, 0, sp.tree); set(town, x, 17, sp.tree); }
  for (let y = 0; y < 18; y++) { set(town, 0, y, sp.tree); if (y !== 8 && y !== 9) set(town, 31, y, sp.tree); }
  rect(town, 1, 8, 31, 9, sp.path); rect(town, 15, 4, 16, 16, sp.path);
  rect(town, 2, 1, 7, 2, sp.roof); rect(town, 2, 3, 7, 4, sp.wall); set(town, 3, 3, sp.window); set(town, 6, 3, sp.window); set(town, 4, 4, sp.door); set(town, 4, 5, sp.path); set(town, 4, 6, sp.path); set(town, 4, 7, sp.path);
  rect(town, 19, 1, 25, 2, sp.roof); rect(town, 19, 3, 25, 4, sp.wall); set(town, 20, 3, sp.window); set(town, 24, 3, sp.window); set(town, 22, 4, sp.door); rect(town, 22, 5, 22, 7, sp.path);
  rect(town, 3, 12, 7, 15, sp.water);
  for (let i = 0; i < 40; i++) { const x = 1 + (rnd() * 30 | 0), y = 1 + (rnd() * 16 | 0); if (get(town, x, y) === sp.meadow.id && rnd() < 0.5) set(town, x, y, sp.flowers); }
  hero(town, 13, 10);
  npc(town, 'Elder Rowan', sp.elder, 6, 6, 'Ah, a brave soul at last.', { quest: q1.id });
  npc(town, 'Merchant Pell', sp.merchant, 23, 6, '', { shop: shop.id });
  npc(town, 'Villager Tom', sp.villager, 10, 11, 'Welcome to Oakvale, traveler!\nArrows or WASD to move. Z or Space to swing your weapon.\nKeys 1-4 cast skills from your hotbar. Q drinks a potion.\nPress I to open your menu: items, equipment, skills, quests and saving.\nPress E next to people and chests to interact.');
  npc(town, 'Lina', sp.villager, 19, 13, 'They say a Crystal Golem sleeps deep inside the forest cave.\nOnly Elder Rowan holds the key to that sealed door.');
  npc(town, 'Guard Brann', sp.guard, 28, 12, 'Halt! ...Oh, you look capable.', { quest: q2.id });
  chest(town, 1, 15, L('item', it.potion.id), 20);
  const well = actor(town, 'Healing Well', sp.well, 11, 5, {}, { tags: 'well' });
  {
    const ev = newNode('Interact', 40, 60), h1 = newNode('HealPlayer', 290, 60, { percent: 100 }), s1 = newNode('PlaySound', 540, 60, { sound: sd.heal.id }),
      d1 = newNode('ShowDialogue', 790, 60, { speaker: 'Healing Well', text: 'You drink the cool, clear water...\\nHP and MP fully restored!' });
    ev.next = h1.id; h1.next = s1.id; s1.next = d1.id; well.bp.nodes.push(ev, h1, s1, d1);
  }
  warp(town, 31, 8, forest, 1, 13); warp(town, 31, 9, forest, 1, 14);

  // Forest
  fill(forest, sp.meadow);
  for (let x = 0; x < 48; x++) { set(forest, x, 0, sp.tree); set(forest, x, 26, sp.tree); }
  for (let y = 0; y < 27; y++) { set(forest, 47, y, sp.tree); if (y !== 13 && y !== 14) set(forest, 0, y, sp.tree); }
  rect(forest, 0, 13, 44, 14, sp.path); rect(forest, 43, 5, 44, 14, sp.path);
  rect(forest, 38, 1, 46, 4, sp.stone);
  rect(forest, 20, 18, 25, 22, sp.water);
  for (let y = 1; y < 26; y++) for (let x = 1; x < 47; x++) {
    if (get(forest, x, y) !== sp.meadow.id) continue;
    const r = rnd();
    if (r < 0.09) set(forest, x, y, sp.tree); else if (r < 0.12) set(forest, x, y, sp.flowers);
  }
  set(forest, 43, 4, sp.path);
  hero(forest, 2, 13);
  const spots = [];
  [[8, 6], [12, 20], [18, 9], [28, 23], [30, 6], [35, 18]].forEach(([x, y]) => { monster(forest, mo.slime, x, y); spots.push([x, y]); });
  [[22, 4], [38, 9], [9, 24]].forEach(([x, y]) => { monster(forest, mo.bat, x, y); spots.push([x, y]); });
  chest(forest, 45, 24, L('armor', ar.leather.id), 30); spots.push([45, 24]);
  chest(forest, 3, 3, L('item', it.ether.id), 15); spots.push([3, 3]);
  spots.forEach(([x, y]) => clear(forest, x, y, sp.meadow));
  const cdoor = actor(forest, 'Sealed Cave Door', sp.caveDoor, 43, 4, {}, { tags: 'door' });
  {
    const ev = newNode('Overlap', 40, 60, { tag: 'player' }), hk = newNode('HasLoot', 290, 60, { loot: L('item', it.key.id), count: 1 }),
      tr = newNode('Transfer', 540, 40, { level: cave.id, x: 3, y: 10 }),
      no = newNode('ShowDialogue', 540, 240, { speaker: 'Sealed Door', text: 'A heavy stone door. It is locked tight.\\nPerhaps someone in Oakvale knows how to open it...' });
    ev.next = hk.id; hk.next = tr.id; hk.nextFalse = no.id; cdoor.bp.nodes.push(ev, hk, tr, no);
  }
  warp(forest, 0, 13, town, 30, 8); warp(forest, 0, 14, town, 30, 9);

  // Cave
  fill(cave, sp.cave);
  for (let x = 0; x < 40; x++) { set(cave, x, 0, sp.stone); set(cave, x, 21, sp.stone); }
  for (let y = 0; y < 22; y++) { set(cave, 0, y, sp.stone); set(cave, 39, y, sp.stone); }
  for (let y = 1; y < 21; y++) for (let x = 2; x < 38; x++) if (rnd() < 0.08) set(cave, x, y, sp.stone);
  rect(cave, 1, 9, 38, 11, sp.cave); rect(cave, 29, 5, 38, 16, sp.cave);
  hero(cave, 3, 10);
  const cs = [];
  [[10, 5], [14, 16], [22, 7], [25, 15]].forEach(([x, y]) => { monster(cave, mo.skel, x, y); cs.push([x, y]); });
  [[18, 4], [30, 18]].forEach(([x, y]) => { monster(cave, mo.bat, x, y); cs.push([x, y]); });
  chest(cave, 37, 3, L('item', it.hipotion.id), 100); cs.push([37, 3]);
  chest(cave, 5, 18, L('armor', ar.helm.id), 0); cs.push([5, 18]);
  cs.forEach(([x, y]) => clear(cave, x, y, sp.cave));
  const boss = monster(cave, mo.golem, 34, 10);
  {
    const ev = newNode('Death', 40, 60), d1 = newNode('ShowDialogue', 290, 60, { speaker: 'Crystal Golem', text: 'The golem crumbles... its crystal heart fades to silence.' }),
      m1 = newNode('ShowMessage', 540, 60, { text: 'VICTORY!\\nOAKVALE IS SAVED', seconds: 4 }), g1 = newNode('GiveExp', 790, 60, { amount: 100 });
    ev.next = d1.id; d1.next = m1.id; m1.next = g1.id; boss.bp.nodes.push(ev, d1, m1, g1);
  }
  warp(cave, 1, 10, forest, 43, 6);

  return {
    format: 'bitforge8', version: 2, name: 'Crystal Quest',
    hud: '', vars: {},
    settings: { crt: true, startLevel: town.id },
    sprites: Object.values(sp), sounds: Object.values(sd), levels: [town, forest, cave], db: D
  };
}
// Place-actor templates are generated from current sprites/sounds/database.
function templateDefs() {
  const sid = n => (proj.sprites.find(s => s.name === n) || {}).id || '';
  const aid = n => (proj.sounds.find(s => s.name === n) || {}).id || '';
  const db = proj.db || emptyDb();
  const first = cat => (db[cat] || [])[0] || {};
  const coinG = () => { const ev = newNode('Overlap', 40, 60, { tag: 'player' }), a = newNode('AddVar', 290, 60, { var: 'score', amount: 10 }), b = newNode('PlaySound', 540, 60, { sound: aid('Coin') }), c = newNode('Destroy', 790, 60); ev.next = a.id; a.next = b.id; b.next = c.id; return { nodes: [ev, a, b, c] }; };
  const enemyG = () => {
    const ev = newNode('Overlap', 40, 60, { tag: 'player' }), st = newNode('IfOtherAbove', 290, 60), k = newNode('Destroy', 540, 40), b = newNode('SetVelocity', 790, 40, { target: 'other', vx: '', vy: -3 }), d = newNode('LoadLevel', 540, 260, { level: '__restart' });
    ev.next = st.id; st.next = k.id; k.next = b.id; st.nextFalse = d.id; return { nodes: [ev, st, k, b, d] };
  };
  const goalG = () => { const ev = newNode('Overlap', 40, 60, { tag: 'player' }), m = newNode('ShowMessage', 290, 60, { text: 'LEVEL CLEAR!' }), d = newNode('Delay', 540, 60, { seconds: 2 }), l = newNode('LoadLevel', 790, 60); ev.next = m.id; m.next = d.id; d.next = l.id; return { nodes: [ev, m, d, l] }; };
  const m0 = first('monsters'), h0 = first('heroes');
  return {
    rpgHero: { group: 'RPG', label: 'RPG Hero', desc: 'Player start · stats, combat, menu', sprite: h0.sprite || sid('Hero'), make: () => ({ name: 'Hero (Player Start)', sprite: h0.sprite || '', tags: 'player', comps: { rpgPlayer: { hero: h0.id || '' } } }) },
    monster: { group: 'RPG', label: 'Monster', desc: 'AI, HP bar, loot (Database)', sprite: m0.sprite || sid('Slime'), make: () => ({ name: m0.name || 'Monster', sprite: m0.sprite || '', tags: 'enemy', comps: { monster: { monster: m0.id || '' } } }) },
    npc: { group: 'RPG', label: 'NPC', desc: 'Talks when you press E', sprite: sid('Villager'), make: () => ({ name: 'Villager', sprite: sid('Villager'), tags: 'npc', comps: { npc: { name: 'Villager', text: 'Hello, traveler!', shop: '', quest: '' } } }) },
    shopkeeper: { group: 'RPG', label: 'Shopkeeper', desc: 'Opens a shop', sprite: sid('Merchant'), make: () => ({ name: 'Shopkeeper', sprite: sid('Merchant'), tags: 'npc', comps: { npc: { name: 'Shopkeeper', text: '', shop: first('shops').id || '', quest: '' } } }) },
    questGiver: { group: 'RPG', label: 'Quest Giver', desc: 'Gives & rewards a quest', sprite: sid('Elder'), make: () => ({ name: 'Quest Giver', sprite: sid('Elder'), tags: 'npc', comps: { npc: { name: 'Elder', text: 'I need your help.', shop: '', quest: first('quests').id || '' } } }) },
    chest: { group: 'RPG', label: 'Treasure Chest', desc: 'Loot + gold, opens once', sprite: sid('Chest'), make: () => ({ name: 'Treasure Chest', sprite: sid('Chest'), tags: '', comps: { chest: { loot: first('items').id ? 'item:' + first('items').id : '', gold: 10, openSprite: sid('Chest (Open)') } } }) },
    door: { group: 'RPG', label: 'Door / Warp', desc: 'Transfers the player', sprite: sid('Door'), make: () => ({ name: 'Door', sprite: sid('Door'), tags: '', comps: { door: { level: proj.levels[0].id, x: 2, y: 2 } } }) },
    player: { group: 'Platformer', label: 'Platformer Player', desc: 'Run & jump hero', sprite: sid('Hero'), make: () => ({ name: 'Player', sprite: sid('Hero'), tags: 'player', comps: { physics: { gravity: 0.22 }, platformer: { speed: 1.2, jump: 3.6, jumpSound: aid('Jump') } } }) },
    topdown: { group: 'Platformer', label: 'Top-Down Player', desc: '8-way movement, no combat', sprite: sid('Hero'), make: () => ({ name: 'TopDown Player', sprite: sid('Hero'), tags: 'player', comps: { topdown: { speed: 1 } } }) },
    enemy: { group: 'Platformer', label: 'Stompable Enemy', desc: 'Patrols, stomp to kill', sprite: sid('Slime'), make: () => ({ name: 'Enemy', sprite: sid('Slime'), tags: 'enemy', comps: { physics: { gravity: 0.22 }, patrol: { speed: 0.4, edges: true } }, bp: enemyG() }) },
    coin: { group: 'Platformer', label: 'Pickup', desc: 'Adds score on touch', sprite: sid('Coin'), make: () => ({ name: 'Coin', sprite: sid('Coin'), tags: 'pickup', comps: {}, bp: coinG() }) },
    goal: { group: 'Platformer', label: 'Goal', desc: 'Loads the next level', sprite: sid('Flag'), make: () => ({ name: 'Goal', sprite: sid('Flag'), tags: 'goal', comps: {}, bp: goalG() }) },
    empty: { group: 'Platformer', label: 'Empty Actor', desc: 'Blank, add components', sprite: '', make: () => ({ name: 'Actor', sprite: sid('Gold Block'), tags: '', comps: {} }) }
  };
}
