/*
 * BitForge 8 runtime
 * Self-contained game runtime: renderer, physics, Blueprint interpreter,
 * chiptune audio, RPG systems (combat, inventory, quests, shops) and the
 * in-game menu system. Packaged games embed this file verbatim
 * (see BitForgeRuntime.toString() in src/editor/files.js).
 * Exposes: window.PixelRuntime
 */
function BitForgeRuntime(global) {
  'use strict';
  var PALETTE = ['#0b0b14', '#262b44', '#3e4a8a', '#4fa4f7', '#9be2ff', '#1e6b3a', '#45b649', '#a6e05a',
    '#6b3b22', '#b8743a', '#f2c45a', '#ffffff', '#b5303a', '#ff7a5c', '#8a8aa0', '#f4c7a1'];
  var PALETTE_NAMES = ['Black', 'Navy', 'Blue', 'Sky', 'Ice', 'Forest', 'Green', 'Lime',
    'Brown', 'Tan', 'Gold', 'White', 'Red', 'Salmon', 'Gray', 'Skin'];
  var W = 256, H = 144, TS = 8;

  // 3x5 bitmap font
  var G = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
    '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111',
    '9': '111101111001110', ' ': '000000000000000', '!': '010010010000010', '.': '000000000000010', ',': '000000000010100',
    ':': '000010000010000', '-': '000000111000000', '?': '110001010000010', '/': '001001010100100', "'": '010010000000000',
    '+': '000010111010000', '=': '000111000111000', '%': '101001010100101', '(': '010100100100010', ')': '010001001001010',
    '#': '101111101111101', '"': '101101000000000', '[': '110100100100110', ']': '011001001001011', '&': '010101010101011', '*': '000101010101000', '<': '001010100010001', '>': '100010001010100', '_': '000000000000111'
  };

  function drawText(ctx, str, x, y, color, scale) {
    scale = scale || 1;
    str = String(str).toUpperCase();
    ctx.fillStyle = color;
    var cx = x;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === '\n') { y += 6 * scale; cx = x; continue; }
      var g = G[ch] || G['?'];
      for (var p = 0; p < 15; p++) if (g[p] === '1') ctx.fillRect(cx + (p % 3) * scale, y + ((p / 3) | 0) * scale, scale, scale);
      cx += 4 * scale;
    }
  }
  function textWidth(str, scale) { return Math.max(0, String(str).length * 4 * (scale || 1) - (scale || 1)); }

  var cache = new Map();
  function spriteCanvas(s) {
    if (!s || !s.px) return null;
    var sig = s.px.join('');
    var e = cache.get(s.id);
    if (e && e.sig === sig) return e.c;
    var c = document.createElement('canvas');
    c.width = c.height = TS;
    var x = c.getContext('2d');
    for (var yy = 0; yy < TS; yy++) for (var xx = 0; xx < TS; xx++) {
      var ch = (s.px[yy] || '')[xx];
      if (ch && ch !== '.') { x.fillStyle = PALETTE[parseInt(ch, 16)]; x.fillRect(xx, yy, 1, 1); }
    }
    cache.set(s.id, { sig: sig, c: c });
    return c;
  }

  // ---- chiptune audio ----
  var AC = null, noiseBuf = null, masterVol = 1;
  function audio() {
    if (!AC) { try { AC = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function playSound(snd) {
    var ac = audio(); if (!ac || !snd) return;
    var t = ac.currentTime;
    var vol = Math.max(0, Math.min(1, +snd.vol || 0.3));
    var dur = Math.max(0.02, +snd.dur || 0.2);
    var f0 = Math.max(20, +snd.f0 || 440), f1 = Math.max(20, +snd.f1 || 440);
    var g = ac.createGain();
    if (masterVol <= 0) return;
    g.gain.setValueAtTime(Math.max(0.0002, vol * 0.45 * masterVol), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    g.connect(ac.destination);
    var src;
    if (snd.wave === 'noise') {
      if (!noiseBuf) {
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        var d = noiseBuf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      src.playbackRate.setValueAtTime(Math.max(0.05, f0 / 440), t);
      src.playbackRate.exponentialRampToValueAtTime(Math.max(0.05, f1 / 440), t + dur);
    } else {
      src = ac.createOscillator(); src.type = snd.wave || 'square';
      src.frequency.setValueAtTime(f0, t);
      src.frequency.exponentialRampToValueAtTime(f1, t + dur);
    }
    src.connect(g); src.start(t); src.stop(t + dur + 0.03);
  }

  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? (d || 0) : n; }
  function hasTag(a, t) {
    if (!t) return true;
    var want = String(t).trim().toLowerCase();
    return String(a.tags || '').split(',').some(function (x) { return x.trim().toLowerCase() === want; });
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ---- the game instance ----
  function create(canvas, project, opts) {
    opts = opts || {};
    var P = clone(project);
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    var spr = {}, snd = {};
    P.sprites.forEach(function (s) { spr[s.id] = s; });
    (P.sounds || []).forEach(function (s) { snd[s.id] = s; });
    var log = opts.onLog || function () {};

    var vars = {}, L = null, levelIdx = 0, actors = [], runners = [], particles = [], prints = [], big = null;
    var cam = { x: 0, y: 0 }, shake = 0, shakeAmt = 0, frame = 0, overlaps = new Set(), uid = 1;
    var pendingLevel = null, ended = false, running = true, raf = 0, last = 0, acc = 0, title = !!opts.title;
    var keys = {}, pressed = {};

    function resetVars() { vars = {}; var v = P.vars || {}; for (var k in v) vars[k] = num(v[k]); }
    function fmt(s) {
      return String(s == null ? '' : s).replace(/\\n/g, '\n').replace(/\{(\w+)\}/g, function (m, k) { return k in vars ? vars[k] : 0; });
    }

    function spawnActor(def, x, y) {
      var a = clone(def);
      a.uid = uid++; a.x = x; a.y = y; a.vx = 0; a.vy = 0; a.ground = false; a.dir = 1; a.dead = false; a.fell = false;
      a.comps = a.comps || {}; a.bp = a.bp || { nodes: [] }; a.nm = {}; a.timers = [];
      (a.bp.nodes || []).forEach(function (n) { a.nm[n.id] = n; n.p = n.p || {}; if (n.kind === 'Timer') a.timers.push({ node: n, t: 0 }); });
      a.srcDef = def;
      if (a.comps.monster && DB) {
        var m = dbGet('monsters', a.comps.monster.monster);
        if (m) {
          a.m = m; a.hp = a.mhp = Math.max(1, num(m.hp, 10)); a.home = { x: x, y: y }; a.name = m.name;
          if (m.sprite) a.sprite = m.sprite;
          a.atkCd = 30; a.kbx = 0; a.kby = 0; a.flash = 0; a.wander = { t: 0, dx: 0, dy: 0 };
        }
      }
      if (a.comps.rpgPlayer && DB) {
        var hd = dbGet('heroes', a.comps.rpgPlayer.hero) || (DB.heroes || [])[0];
        if (hd && hd.sprite) a.sprite = hd.sprite;
        a.fx = 1; a.fy = 0;
      }
      actors.push(a);
      return a;
    }
    function fire(a, kind, other, filter) {
      var ns = a.bp.nodes;
      for (var i = 0; i < ns.length; i++) {
        var n = ns[i];
        if (n.kind === kind && (!filter || filter(n)) && n.next) runners.push({ a: a, other: other, id: n.next, wait: 0 });
      }
    }
    function hasHandler(a, kind) { return a.bp.nodes.some(function (n) { return n.kind === kind; }); }

    function camTarget() {
      return actors.find(function (a) { return !a.dead && (a.comps.platformer || a.comps.topdown || a.comps.rpgPlayer); }) ||
        actors.find(function (a) { return !a.dead && hasTag(a, 'player'); });
    }
    function camGoal(t) {
      return {
        x: Math.max(0, Math.min(t.x + 4 - W / 2, L.w * TS - W)),
        y: Math.max(0, Math.min(t.y + 4 - H / 2, L.h * TS - H))
      };
    }

    function loadLevel(i) {
      L = clone(P.levels[i]); levelIdx = i;
      actors = []; runners = []; particles = []; overlaps = new Set(); big = null;
      L.actors.forEach(function (d) {
        if (d.template) return;
        if (R && d.comps && d.comps.monster && R.hero.flags['dead:' + d.id]) return;
        var a = spawnActor(d, d.x, d.y);
        if (R && a.comps.chest && R.hero.flags['chest:' + a.id] && a.comps.chest.openSprite) a.sprite = a.comps.chest.openSprite;
      });
      if (!R && DB) { var rp = actors.find(function (a) { return a.comps.rpgPlayer; }); if (rp) initHero(rp.comps.rpgPlayer.hero); }
      if (R) { R.projectiles = []; R.respawns = []; R.target = null; uiClear(); }
      if (pendingSpawn) {
        var pp = actors.find(isPlayer);
        if (pp) { pp.x = pendingSpawn.x; pp.y = pendingSpawn.y; }
        pendingSpawn = null;
      }
      var t = camTarget();
      if (t) { var g = camGoal(t); cam.x = g.x; cam.y = g.y; } else { cam.x = 0; cam.y = 0; }
      actors.slice().forEach(function (a) { fire(a, 'BeginPlay'); });
      log('Loaded level "' + L.name + '"');
    }

    function solidAt(px, py) {
      var tx = Math.floor(px / TS), ty = Math.floor(py / TS);
      if (tx < 0 || tx >= L.w) return true;
      if (ty < 0 || ty >= L.h) return false;
      var id = L.tiles[ty * L.w + tx];
      return !!(id && spr[id] && spr[id].solid);
    }
    function boxSolid(x, y, w, h) {
      return solidAt(x, y) || solidAt(x + w - 0.01, y) || solidAt(x, y + h - 0.01) || solidAt(x + w - 0.01, y + h - 0.01);
    }

    var K = {
      left: function () { return keys.ArrowLeft || keys.KeyA; }, right: function () { return keys.ArrowRight || keys.KeyD; },
      up: function () { return keys.ArrowUp || keys.KeyW; }, down: function () { return keys.ArrowDown || keys.KeyS; },
      jumpP: function () { return pressed.Space || pressed.KeyZ || pressed.ArrowUp || pressed.KeyW; },
      jumpH: function () { return keys.Space || keys.KeyZ || keys.ArrowUp || keys.KeyW; }
    };

    function physics(a) {
      var c = a.comps;
      if (!(c.physics || c.platformer || c.topdown || c.patrol || c.rpgPlayer || c.monster)) return;
      if (a.fell) return;
      if (c.rpgPlayer && R) {
        if (R.deadT) { a.vx = a.vy = 0; }
        else {
          var rx = (K.right() ? 1 : 0) - (K.left() ? 1 : 0), ry = (K.down() ? 1 : 0) - (K.up() ? 1 : 0);
          var rs = Math.min(1.6, 0.9 + R.st.agi * 0.02);
          if (rx && ry) rs *= 0.7071;
          a.vx = rx * rs; a.vy = ry * rs;
          if (rx || ry) { a.fx = rx; a.fy = ry; }
          if (rx) a.dir = rx;
        }
      }
      if (c.monster && a.m && R) monsterAI(a);
      if (c.platformer) {
        var dx = (K.right() ? 1 : 0) - (K.left() ? 1 : 0);
        a.vx = dx * num(c.platformer.speed, 1.2);
        if (dx) a.dir = dx;
        if (K.jumpP() && a.ground) {
          a.vy = -num(c.platformer.jump, 3.6); a.ground = false;
          if (c.platformer.jumpSound) playSound(snd[c.platformer.jumpSound]);
        }
        if (!K.jumpH() && a.vy < -1) a.vy *= 0.6;
      }
      if (c.topdown) {
        var tx = (K.right() ? 1 : 0) - (K.left() ? 1 : 0), ty = (K.down() ? 1 : 0) - (K.up() ? 1 : 0);
        var sp = num(c.topdown.speed, 1);
        if (tx && ty) sp *= 0.7071;
        a.vx = tx * sp; a.vy = ty * sp;
        if (tx) a.dir = tx;
      }
      if (c.patrol) a.vx = a.dir * num(c.patrol.speed, 0.5);
      var grav = c.physics ? num(c.physics.gravity, 0.22) : (c.platformer ? 0.22 : 0);
      if (grav) a.vy = Math.min(4, a.vy + grav);

      a.ground = false;
      var hitWall = false;
      a.x += a.vx;
      if (boxSolid(a.x + 1, a.y, 6, 8)) {
        if (a.vx > 0) a.x = Math.floor((a.x + 7 - 0.001) / TS) * TS - 7;
        else if (a.vx < 0) a.x = Math.floor((a.x + 1) / TS) * TS + TS - 1;
        hitWall = a.vx !== 0; a.vx = 0;
      }
      a.y += a.vy;
      if (boxSolid(a.x + 1, a.y, 6, 8)) {
        if (a.vy > 0) { a.y = Math.floor((a.y + 8 - 0.001) / TS) * TS - 8; a.ground = true; }
        else if (a.vy < 0) a.y = Math.floor(a.y / TS) * TS + TS;
        a.vy = 0;
      }
      if (c.patrol) {
        if (hitWall) a.dir *= -1;
        else if (c.patrol.edges !== false && a.ground) {
          var fx = a.dir > 0 ? a.x + 7.5 : a.x + 0.5;
          if (!solidAt(fx, a.y + 9)) a.dir *= -1;
        }
      }
      if (a.y > L.h * TS + 24) {
        a.fell = true;
        if (hasHandler(a, 'FellOutOfWorld')) fire(a, 'FellOutOfWorld');
        else if (c.platformer || c.topdown) pendingLevel = levelIdx;
        else a.dead = true;
      }
    }

    function overlap(a, b) { return a.x + 1 < b.x + 7 && b.x + 1 < a.x + 7 && a.y < b.y + 8 && b.y < a.y + 8; }

    function burst(x, y, color, count) {
      for (var i = 0; i < count; i++) {
        var ang = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.6;
        particles.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 0.6, life: 20 + Math.random() * 20, c: PALETTE[color & 15] });
      }
    }

    // =====================================================================
    // RPG / action-MMORPG systems (active when the project has a Database
    // and the level contains an actor with the RPG Hero component)
    // =====================================================================
    var DB = P.db || null, R = null, pendingSpawn = null;
    var STATS = ['hp', 'mp', 'atk', 'def', 'mag', 'agi'];
    var RAR = [11, 7, 3, 13, 10], RAR_N = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
    var SLOTS = ['weapon', 'shield', 'head', 'body', 'acc'];
    var SLOT_N = { weapon: 'WEAPON', shield: 'SHIELD', head: 'HEAD', body: 'BODY', acc: 'ACCESSORY' };
    var saveKey = 'bitforge8.save.' + (P.name || 'game');

    function dbGet(cat, id) {
      if (!DB || !id) return null;
      var l = DB[cat] || [];
      for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
      return null;
    }
    function lootDef(ref) {
      if (!ref || typeof ref !== 'string') return null;
      var i = ref.indexOf(':'), kind = ref.slice(0, i), id = ref.slice(i + 1);
      var d = dbGet(kind === 'item' ? 'items' : kind === 'weapon' ? 'weapons' : 'armors', id);
      return d ? { kind: kind, d: d, ref: ref } : null;
    }
    function rar(d) { return RAR[Math.max(0, Math.min(4, num(d && d.rarity, 0) | 0))]; }
    function sfx(k) { var s = DB && DB.system && DB.system.sounds; if (s && s[k]) playSound(snd[s[k]]); }
    function player() { for (var i = 0; i < actors.length; i++) if (!actors[i].dead && actors[i].comps.rpgPlayer) return actors[i]; return null; }
    function isPlayer(o) { var c = o.comps || {}; return !!(c.rpgPlayer || c.platformer || c.topdown); }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function splitLines(t) { return String(t || '').replace(/\\n/g, '\n').split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }
    function wrap(t, n) {
      var out = [], cur = '';
      String(t).split(' ').forEach(function (w) {
        if ((cur + ' ' + w).trim().length > n) { if (cur) out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
      });
      if (cur) out.push(cur);
      return out;
    }
    function expNeed(lv) { return Math.round(20 * Math.pow(lv, 1.7)); }
    function chat(t, c) { if (!R) return; R.chat.push({ t: String(t).toUpperCase(), c: c == null ? 11 : c, life: 300 }); if (R.chat.length > 4) R.chat.shift(); log(t); }
    function floatText(x, y, t, c) { if (R) R.floaters.push({ x: x, y: y, t: String(t), c: c, life: 45 }); }
    function levelIndex(ref) {
      if (ref === '__next') return levelIdx + 1;
      if (ref === '__restart') return levelIdx;
      if (ref === '__first') return 0;
      return P.levels.findIndex(function (l) { return l.id === ref; });
    }
    function transfer(ref, x, y) {
      var i = levelIndex(ref);
      if (i >= 0 && i < P.levels.length) { pendingLevel = i; pendingSpawn = { x: num(x) * TS, y: num(y) * TS }; sfx('door'); }
      else log('Transfer: level not found', 'warn');
    }

    function newR(h) { return { hero: h, ui: null, floaters: [], chat: [], cd: {}, atkCd: 0, iframes: 0, swing: 0, swingSprite: null, projectiles: [], respawns: [], regenT: 0, deadT: 0, lastHurt: -999, st: null, stack: [], target: null }; }
    function initHero(heroId) {
      var hd = dbGet('heroes', heroId) || (DB.heroes || [])[0];
      if (!hd) return;
      var h = { heroId: hd.id, name: hd.name, classId: hd['class'], lv: Math.max(1, num(hd.level, 1) | 0), exp: 0, gold: num(DB.system && DB.system.startGold, 0),
        inv: {}, gear: { weapon: '', shield: '', head: '', body: '', acc: '' }, skills: [], hotbar: [], quests: {}, flags: {} };
      if (hd.weapon) h.gear.weapon = 'weapon:' + hd.weapon;
      ['shield', 'head', 'body', 'acc'].forEach(function (s) { if (hd[s]) h.gear[s] = 'armor:' + hd[s]; });
      R = newR(h);
      (hd.items || []).forEach(function (it) { if (lootDef(it.loot)) h.inv[it.loot] = (h.inv[it.loot] || 0) + Math.max(1, num(it.count, 1) | 0); });
      learnSkills(true);
      var st = heroStats(); h.hp = st.hp; h.mp = st.mp; R.st = st;
    }
    function heroStats() {
      var h = R.hero, c = dbGet('classes', h.classId) || {}, s = {};
      STATS.forEach(function (k) { s[k] = num(c[k], 5) + num(c['g' + k], 1) * (h.lv - 1); });
      SLOTS.forEach(function (sl) { var L = lootDef(h.gear[sl]); if (L) STATS.forEach(function (k) { s[k] += num(L.d[k], 0); }); });
      STATS.forEach(function (k) { s[k] = Math.max(k === 'hp' ? 1 : 0, Math.round(s[k])); });
      return s;
    }
    function learnSkills(silent) {
      var h = R.hero, c = dbGet('classes', h.classId);
      if (!c) return;
      (c.learn || []).forEach(function (l) {
        if (l.skill && num(l.level, 1) <= h.lv && h.skills.indexOf(l.skill) < 0 && dbGet('skills', l.skill)) {
          h.skills.push(l.skill);
          var free = h.hotbar.findIndex(function (x) { return !x; });
          if (free >= 0) h.hotbar[free] = l.skill; else if (h.hotbar.length < 4) h.hotbar.push(l.skill);
          if (!silent) chat('LEARNED ' + dbGet('skills', l.skill).name + '!', 10);
        }
      });
    }
    function giveExp(n) {
      var h = R.hero; n = Math.round(n);
      if (n <= 0) return;
      h.exp += n;
      while (h.exp >= expNeed(h.lv)) {
        h.exp -= expNeed(h.lv); h.lv++;
        var st = heroStats(); h.hp = st.hp; h.mp = st.mp; R.st = st;
        chat('LEVEL UP! ' + h.name + ' IS NOW LV ' + h.lv, 10); sfx('levelup');
        var p = player();
        if (p) { burst(p.x + 4, p.y + 4, 10, 24); floatText(p.x + 4, p.y - 6, 'LEVEL UP!', 10); }
        learnSkills(false);
      }
    }
    function countLoot(ref) { return (R && R.hero.inv[ref]) || 0; }
    function giveLoot(ref, n, silent) {
      var L = lootDef(ref); if (!L) return;
      n = n == null ? 1 : n;
      R.hero.inv[ref] = countLoot(ref) + n;
      if (!silent) { chat('RECEIVED ' + L.d.name + (n > 1 ? ' X' + n : ''), rar(L.d)); sfx('pickup'); }
    }
    function takeLoot(ref, n) { var c = countLoot(ref) - (n == null ? 1 : n); if (c > 0) R.hero.inv[ref] = c; else delete R.hero.inv[ref]; }

    // ---- combat ----
    function calcDmg(atk, def) { return Math.max(1, Math.round((atk - def * 0.4) * (0.85 + Math.random() * 0.3))); }
    function damageMonster(a, power) {
      if (a.dead || !a.m) return;
      var dmg = calcDmg(power, num(a.m.def, 0)), crit = Math.random() < 0.05 + R.st.agi * 0.004;
      if (crit) dmg = Math.round(dmg * 1.6);
      a.hp -= dmg; a.aggro = true; a.flash = 8; R.target = a;
      floatText(a.x + 4, a.y - 2, dmg + (crit ? '!' : ''), crit ? 10 : 11);
      sfx('hit');
      var p = player();
      if (p && !a.m.boss) { var dx = a.x - p.x, dy = a.y - p.y, l = Math.hypot(dx, dy) || 1; a.kbx = dx / l * 2.2; a.kby = dy / l * 2.2; }
      if (a.hp <= 0) killMonster(a);
    }
    function killMonster(a) {
      var m = a.m, h = R.hero, p = player();
      a.dead = true; a.hp = 0;
      burst(a.x + 4, a.y + 4, 11, 14);
      chat('DEFEATED ' + m.name + '  +' + num(m.exp, 0) + ' EXP', 14);
      var g = num(m.gold, 0);
      if (g) { h.gold += g; floatText(a.x + 4, a.y + 6, '+' + g + 'G', 10); }
      (m.drops || []).forEach(function (d) { if (d.loot && Math.random() * 100 < num(d.chance, 0)) spawnLoot(a.x, a.y, d.loot); });
      Object.keys(h.quests).forEach(function (qid) {
        var st = h.quests[qid], q = dbGet('quests', qid);
        if (q && st.state === 'active' && q.type === 'kill' && q.monster === m.id && st.n < num(q.count, 1)) {
          st.n++; chat(q.name + ' ' + st.n + '/' + num(q.count, 1), st.n >= num(q.count, 1) ? 7 : 4);
        }
      });
      if (num(m.respawn, 0) > 0 && a.srcDef && a.srcDef.id) R.respawns.push({ def: a.srcDef, t: Math.round(num(m.respawn) * 60) });
      else h.flags['dead:' + a.id] = 1;
      fire(a, 'Death', p);
      giveExp(num(m.exp, 0));
    }
    function spawnLoot(x, y, ref) {
      var L = lootDef(ref); if (!L) return;
      var s = L.d.icon || (DB.system && DB.system.lootSprite) || '';
      var a = spawnActor({ id: 'loot', name: L.d.name, sprite: s, tags: 'loot', comps: {}, bp: { nodes: [] } }, x + ((Math.random() * 10 - 5) | 0), y + ((Math.random() * 6 - 3) | 0));
      a.lootRef = ref; a.bob = Math.random() * 6;
    }
    function hurtPlayer(atk) {
      if (!R || R.iframes > 0 || R.deadT) return;
      var h = R.hero, p = player(), dmg = calcDmg(atk, R.st.def);
      h.hp -= dmg; R.iframes = 40; R.lastHurt = frame;
      if (p) floatText(p.x + 4, p.y - 2, dmg, 12);
      sfx('hurt'); shake = 6; shakeAmt = 1;
      if (h.hp <= 0) {
        h.hp = 0; R.deadT = 150; big = { t: 'YOU HAVE FALLEN', life: 150 }; sfx('death');
        chat('YOU WERE DEFEATED. LOST 10% GOLD.', 12);
      }
    }
    function face(p) { var fx = p.fx || 0, fy = p.fy || 0; if (!fx && !fy) fx = p.dir || 1; var l = Math.hypot(fx, fy); return { x: fx / l, y: fy / l }; }
    function hitArea(cx, cy, r, power) {
      actors.slice().forEach(function (a) {
        if (a.m && !a.dead && Math.abs(a.x + 4 - cx) < r + 4 && Math.abs(a.y + 4 - cy) < r + 4) damageMonster(a, power);
      });
    }
    function attack(p) {
      if (R.atkCd > 0) return;
      var f = face(p), w = lootDef(R.hero.gear.weapon);
      R.atkCd = Math.max(12, 26 - Math.floor(R.st.agi / 2)); R.swing = 10; R.swingSprite = w ? w.d.icon : null;
      sfx('swing');
      hitArea(p.x + 4 + f.x * 8, p.y + 4 + f.y * 8, 7, R.st.atk);
    }
    function castSkill(p, id) {
      var sk = dbGet('skills', id), h = R.hero;
      if (!sk || R.cd[id] > 0) return;
      var cost = num(sk.mp, 0);
      if (h.mp < cost) { floatText(p.x + 4, p.y - 4, 'NO MP', 3); return; }
      h.mp -= cost; R.cd[id] = Math.round(num(sk.cooldown, 1) * 60);
      var pw = (sk.stat === 'mag' ? R.st.mag : R.st.atk) * num(sk.power, 1), f = face(p), col = num(sk.color, 11) & 15;
      if (sk.sound && snd[sk.sound]) playSound(snd[sk.sound]); else sfx('magic');
      if (sk.type === 'projectile') R.projectiles.push({ x: p.x + 4, y: p.y + 4, vx: f.x * 2.6, vy: f.y * 2.6, life: 80, dmg: pw, c: col, from: 'p' });
      else if (sk.type === 'heal') {
        var amt = Math.round(pw + 10); h.hp = Math.min(R.st.hp, h.hp + amt);
        floatText(p.x + 4, p.y - 4, '+' + amt, 7); burst(p.x + 4, p.y + 4, col, 16);
      } else if (sk.type === 'nova') {
        var rr = num(sk.range, 26);
        for (var i = 0; i < 28; i++) { var an = i / 28 * Math.PI * 2; particles.push({ x: p.x + 4, y: p.y + 4, vx: Math.cos(an) * rr / 18, vy: Math.sin(an) * rr / 18, life: 18, c: PALETTE[col], ng: 1 }); }
        hitArea(p.x + 4, p.y + 4, rr, pw);
      } else {
        var w = lootDef(h.gear.weapon); R.swing = 14; R.swingSprite = w ? w.d.icon : null;
        burst(p.x + 4 + f.x * 10, p.y + 4 + f.y * 10, col, 10);
        hitArea(p.x + 4 + f.x * 9, p.y + 4 + f.y * 9, num(sk.range, 10), pw);
      }
    }
    function monsterAI(a) {
      var m = a.m, p = player(), dx = 0, dy = 0, sp = num(m.speed, 0.5);
      if (a.atkCd > 0) a.atkCd--;
      if (a.flash > 0) a.flash--;
      var d = p ? dist(a, p) : 1e9, aggroR = num(m.aggro, 48), homeD = Math.hypot(a.x - a.home.x, a.y - a.home.y);
      if (a.leash) {
        if (homeD < 4) { a.leash = false; a.hp = a.mhp; } else { dx = a.home.x - a.x; dy = a.home.y - a.y; }
      } else if (p && !R.deadT && ((m.ai !== 'passive' && d < aggroR) || (a.aggro && d < aggroR * 2.5))) {
        a.aggro = true;
        if (homeD > 170 && !m.boss) { a.leash = true; a.aggro = false; }
        if (m.ai === 'ranged') {
          if (d < 36) { dx = a.x - p.x; dy = a.y - p.y; } else if (d > 70) { dx = p.x - a.x; dy = p.y - a.y; }
          if (a.atkCd <= 0 && d < 110) {
            var ddx = p.x - a.x, ddy = p.y - a.y, l = Math.hypot(ddx, ddy) || 1;
            R.projectiles.push({ x: a.x + 4, y: a.y + 4, vx: ddx / l * 1.6, vy: ddy / l * 1.6, life: 120, dmg: num(m.atk, 5), c: 12, from: 'm' });
            a.atkCd = 90; if (!R.target || R.target.dead) R.target = a;
          }
        } else {
          if (d > 6) { dx = p.x - a.x; dy = p.y - a.y; }
          if (d < 10 && a.atkCd <= 0) { hurtPlayer(num(m.atk, 5)); a.atkCd = m.boss ? 40 : 50; if (!R.target || R.target.dead) R.target = a; }
        }
      } else {
        a.aggro = false;
        if (--a.wander.t <= 0) {
          a.wander.t = 60 + (Math.random() * 120 | 0);
          if (Math.random() < 0.5) { a.wander.dx = 0; a.wander.dy = 0; }
          else { var an = Math.random() * 6.283; a.wander.dx = Math.cos(an); a.wander.dy = Math.sin(an); }
        }
        dx = a.wander.dx; dy = a.wander.dy;
        if (homeD > 40) { dx = a.home.x - a.x; dy = a.home.y - a.y; }
      }
      var l2 = Math.hypot(dx, dy), s = (a.aggro || a.leash) ? sp : sp * 0.5;
      a.vx = l2 > 0.01 ? dx / l2 * s : 0; a.vy = l2 > 0.01 ? dy / l2 * s : 0;
      a.vx += a.kbx; a.vy += a.kby; a.kbx *= 0.75; a.kby *= 0.75;
      if (Math.abs(a.vx) > 0.05) a.dir = a.vx > 0 ? 1 : -1;
    }
    function updateProjectiles() {
      var p = player();
      R.projectiles.forEach(function (q) {
        q.x += q.vx; q.y += q.vy; q.life--;
        if (solidAt(q.x, q.y)) q.life = 0;
        if (q.from === 'p') {
          for (var i = 0; i < actors.length; i++) {
            var a = actors[i];
            if (a.m && !a.dead && Math.abs(a.x + 4 - q.x) < 5 && Math.abs(a.y + 4 - q.y) < 5) { damageMonster(a, q.dmg); q.life = 0; break; }
          }
        } else if (p && Math.abs(p.x + 4 - q.x) < 4 && Math.abs(p.y + 4 - q.y) < 5) { hurtPlayer(q.dmg); q.life = 0; }
        if (q.life <= 0) burst(q.x, q.y, q.c, 5);
      });
      R.projectiles = R.projectiles.filter(function (q) { return q.life > 0; });
    }

    // ---- interaction, NPCs, quests, chests ----
    function interactTarget(p) {
      var best = null, bd = 14;
      actors.forEach(function (a) {
        if (a === p || a.dead) return;
        var c = a.comps;
        if (!(c.npc || (c.chest && !R.hero.flags['chest:' + a.id]) || hasHandler(a, 'Interact'))) return;
        var d = dist(a, p); if (d < bd) { bd = d; best = a; }
      });
      return best;
    }
    function interact(p) {
      var a = interactTarget(p); if (!a) return;
      if (a.comps.npc) talk(a); else if (a.comps.chest) openChest(a);
      fire(a, 'Interact', p);
    }
    function openChest(a) {
      var c = a.comps.chest, h = R.hero, lines = [], L = lootDef(c.loot);
      h.flags['chest:' + a.id] = 1;
      if (c.openSprite) a.sprite = c.openSprite;
      if (L) { giveLoot(c.loot, 1, true); lines.push('FOUND ' + L.d.name + '!'); chat('FOUND ' + L.d.name, rar(L.d)); }
      var g = num(c.gold, 0);
      if (g) { h.gold += g; lines.push('FOUND ' + g + ' GOLD!'); }
      sfx('coin'); burst(a.x + 4, a.y + 2, 10, 12);
      if (lines.length) openDialog('TREASURE', lines);
    }
    function questProg(q) { var st = R.hero.quests[q.id]; if (!st) return 0; return q.type === 'collect' ? countLoot(q.item) : st.n; }
    function questReady(q) { return !!q && questProg(q) >= num(q.count, 1); }
    function questState(q) { var st = q && R.hero.quests[q.id]; return !st ? 'none' : st.state === 'done' ? 'done' : questReady(q) ? 'ready' : 'active'; }
    function acceptQuest(q) { if (R.hero.quests[q.id]) return; R.hero.quests[q.id] = { state: 'active', n: 0 }; chat('QUEST ACCEPTED: ' + q.name, 10); sfx('pickup'); }
    function completeQuest(q) {
      var h = R.hero, st = h.quests[q.id];
      if (!st || st.state === 'done') return;
      if (q.type === 'collect' && q.item) takeLoot(q.item, num(q.count, 1));
      st.state = 'done';
      chat('QUEST COMPLETE: ' + q.name, 10); sfx('levelup');
      var g = num(q.gold, 0); if (g) { h.gold += g; chat('+' + g + ' GOLD', 10); }
      if (q.reward) giveLoot(q.reward, 1);
      giveExp(num(q.exp, 0));
    }
    function talk(a) {
      var c = a.comps.npc, name = c.name || a.name, lines = splitLines(c.text), q = dbGet('quests', c.quest), sh = dbGet('shops', c.shop), after = null;
      var shop = function () { if (sh) openShop(sh); };
      if (q) {
        var s = questState(q);
        if (s === 'none') {
          lines = lines.concat(splitLines(q.desc));
          lines.push('[' + q.name + ']  WILL YOU ACCEPT THIS QUEST?');
          openDialog(name, lines, null, function (yes) {
            if (yes) { acceptQuest(q); openDialog(name, ['THANK YOU! I KNEW I COULD COUNT ON YOU.'], shop); }
            else openDialog(name, ['I SEE... COME BACK IF YOU CHANGE YOUR MIND.'], shop);
          });
          return;
        }
        if (s === 'ready') { lines = lines.concat(splitLines(q.doneText || 'YOU DID IT! HERE IS YOUR REWARD.')); after = function () { completeQuest(q); }; }
        else if (s === 'active') lines.push(q.name + ': ' + questProg(q) + ' / ' + num(q.count, 1));
      }
      if (sh && sh.greeting) lines.push(sh.greeting);
      var done = function () { if (after) after(); shop(); };
      if (lines.length) openDialog(name, lines, done); else done();
    }

    // ---- inventory & equipment ----
    function slotOf(L) { return L.kind === 'weapon' ? 'weapon' : L.kind === 'armor' ? (L.d.slot || 'body') : null; }
    function clampHero() { R.st = heroStats(); R.hero.hp = Math.min(R.hero.hp, R.st.hp); R.hero.mp = Math.min(R.hero.mp, R.st.mp); }
    function equip(ref) {
      var L = lootDef(ref), h = R.hero;
      if (!L || countLoot(ref) <= 0) return;
      var sl = slotOf(L); if (!sl) return;
      takeLoot(ref, 1);
      if (h.gear[sl]) giveLoot(h.gear[sl], 1, true);
      h.gear[sl] = ref; clampHero(); sfx('menu'); chat('EQUIPPED ' + L.d.name, rar(L.d));
    }
    function unequip(sl) { var h = R.hero; if (!h.gear[sl]) return; giveLoot(h.gear[sl], 1, true); h.gear[sl] = ''; clampHero(); sfx('menu'); }
    function useItem(ref) {
      var L = lootDef(ref), h = R.hero, p = player();
      if (!L) return false;
      if (L.kind !== 'item') { equip(ref); return true; }
      var d = L.d, pw = num(d.power, 0);
      if (d.type !== 'consumable' || !d.effect || d.effect === 'none') { chat("CAN'T USE THAT NOW", 14); return false; }
      if (d.effect === 'heal_hp' || d.effect === 'heal_all') h.hp = Math.min(R.st.hp, h.hp + pw);
      if (d.effect === 'heal_mp' || d.effect === 'heal_all') h.mp = Math.min(R.st.mp, h.mp + pw);
      takeLoot(ref, 1); sfx('heal');
      if (p) { floatText(p.x + 4, p.y - 4, '+' + pw, d.effect === 'heal_mp' ? 3 : 7); burst(p.x + 4, p.y + 4, 7, 10); }
      return true;
    }
    function quickPotion() { var best = bestPotion(); if (best) useItem(best.ref); else chat('NO POTIONS!', 12); }
    function statStr(d) {
      var o = [];
      STATS.forEach(function (k) { var v = num(d[k], 0); if (v) o.push(k.toUpperCase() + (v > 0 ? '+' : '') + v); });
      return o.join(' ');
    }

    // ---- save / load ----
    function hasSave() { try { return !!localStorage.getItem(saveKey); } catch (e) { return false; } }
    function saveGame() {
      var p = player();
      try {
        localStorage.setItem(saveKey, JSON.stringify({ hero: R.hero, level: levelIdx, x: p ? p.x : 0, y: p ? p.y : 0, vars: vars }));
        chat('GAME SAVED', 7); sfx('levelup');
      } catch (e) { chat('SAVE FAILED', 12); }
    }
    function loadSave() {
      try {
        var d = JSON.parse(localStorage.getItem(saveKey));
        R = newR(d.hero); vars = d.vars || vars; pendingSpawn = { x: d.x, y: d.y };
        loadLevel(Math.min(d.level | 0, P.levels.length - 1));
        R.st = heroStats();
        chat('WELCOME BACK, ' + d.hero.name, 10);
      } catch (e) { log('Load failed', 'warn'); }
    }

    // ---- per-frame RPG update ----
    function rpgUpdate() {
      var p = player();
      R.st = heroStats();
      if (R.deadT) {
        R.deadT--;
        if (!R.deadT) { var hh = R.hero; hh.hp = R.st.hp; hh.mp = R.st.mp; hh.gold = Math.floor(hh.gold * 0.9); pendingLevel = levelIdx; }
        return;
      }
      if (!p) return;
      if (R.atkCd > 0) R.atkCd--;
      if (R.iframes > 0) R.iframes--;
      if (R.swing > 0) R.swing--;
      for (var k in R.cd) if (R.cd[k] > 0) R.cd[k]--;
      if (++R.regenT >= 60) {
        R.regenT = 0;
        var h = R.hero;
        if (frame - R.lastHurt > 300) h.hp = Math.min(R.st.hp, h.hp + Math.max(1, Math.round(R.st.hp * 0.03)));
        h.mp = Math.min(R.st.mp, h.mp + 1);
      }
      if (pressed.KeyZ || pressed.Space) attack(p);
      for (var i = 0; i < 4; i++) if (pressed['Digit' + (i + 1)]) castSkill(p, R.hero.hotbar[i]);
      if (pressed.KeyQ) quickPotion();
      if (pressed.KeyE) interact(p);
      if (!R.ui) {
        if (pressed.Enter) openCommand();
        else if (pressed.KeyI || pressed.KeyB) openBags();
        else if (pressed.KeyC) openCharacter();
        else if (pressed.KeyK) uiPush(spellWin(60, 14, 'KeyK'));
        else if (pressed.KeyL) openQuestLog();
        else if (pressed.KeyM) openMap();
        else if (pressed.Escape) openGameMenu();
      }
      updateProjectiles();
      actors.forEach(function (a) { if (a.lootRef && !a.dead && overlap(a, p)) { a.dead = true; giveLoot(a.lootRef, 1); } });
      R.respawns.forEach(function (r) {
        if (--r.t <= 0) { var a = spawnActor(r.def, r.def.x, r.def.y); fire(a, 'BeginPlay'); burst(a.x + 4, a.y + 4, 14, 8); }
      });
      R.respawns = R.respawns.filter(function (r) { return r.t > 0; });
    }

    function invRows() {
      var order = ['item', 'weapon', 'armor'];
      return Object.keys(R.hero.inv).map(function (ref) { var L = lootDef(ref); return L ? { L: L, n: R.hero.inv[ref] } : null; })
        .filter(Boolean).sort(function (a, b) { return order.indexOf(a.L.kind) - order.indexOf(b.L.kind); });
    }
    // =====================================================================
    // In-game UI: a stack of windows -> menus and nested sub-menus.
    // Dragon Warrior-style command windows + WoW / MU-style panels & HUD.
    // =====================================================================
    var CFG = { vol: 80, speed: 1, theme: 0, dmg: 1, mini: 1 };
    var cfgKey = saveKey + '.cfg';
    try { var cfg0 = JSON.parse(localStorage.getItem(cfgKey) || 'null'); if (cfg0) for (var ck in cfg0) CFG[ck] = cfg0[ck]; } catch (e) {}
    masterVol = CFG.vol / 100;
    function saveCfg() { masterVol = CFG.vol / 100; try { localStorage.setItem(cfgKey, JSON.stringify(CFG)); } catch (e) {} }
    var SPEEDS = [0.5, 1, 3, 999], SPEED_N = ['SLOW', 'NORMAL', 'FAST', 'INSTANT'], THEME_N = ['DRAGON', 'ROYAL', 'STONE'];
    var STAT_LONG = { hp: 'MAX HP', mp: 'MAX MP', atk: 'ATTACK', def: 'DEFENSE', mag: 'MAGIC', agi: 'AGILITY' };
    var SKILL_T = { slash: 'MELEE STRIKE', projectile: 'PROJECTILE', nova: 'AREA BURST', heal: 'HEAL' };
    var CONTROLS_LINES = [['CONTROLS', 10], ['ARROWS / WASD    MOVE', 11], ['Z / SPACE        ATTACK', 11], ['1 2 3 4          SKILLS', 11], ['Q                QUICK POTION', 11],
      ['E                TALK / OPEN', 11], ['ENTER            COMMAND MENU', 11], ['I / B            BACKPACK', 11], ['C                CHARACTER', 11], ['K                SPELLBOOK', 11],
      ['L                QUEST LOG', 11], ['M                WORLD MAP', 11], ['ESC              GAME MENU', 11], ['X                BACK', 14]];

    function uiPush(w) { R.stack.push(w); R.ui = w; return w; }
    function uiPop() { R.stack.pop(); R.ui = R.stack[R.stack.length - 1] || null; }
    function uiClear() { if (R) { R.stack = []; R.ui = null; } }
    function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function rarIdx(d) { return clampN(num(d && d.rarity, 0) | 0, 0, 4); }
    function nav() {
      return {
        up: pressed.ArrowUp || pressed.KeyW, down: pressed.ArrowDown || pressed.KeyS, left: pressed.ArrowLeft || pressed.KeyA, right: pressed.ArrowRight || pressed.KeyD,
        ok: pressed.KeyZ || pressed.Space || pressed.Enter || pressed.KeyE, back: pressed.KeyX || pressed.Backspace || pressed.Escape
      };
    }
    function updateUI() { R.st = heroStats(); if (R.ui) R.ui.update(nav()); }
    function drawUI() { R.stack.forEach(function (w, i) { w.draw(i === R.stack.length - 1); }); }

    // ---- drawing primitives ----
    function T(s, x, y, c) { drawText(ctx, s, x, y, PALETTE[c == null ? 11 : c]); }
    function TR(s, x, y, c) { s = String(s); T(s, x - textWidth(s), y, c); }
    function rect(x, y, w, h) { ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h); }
    function icon(id, x, y) { var c = spriteCanvas(spr[id]); if (c) ctx.drawImage(c, x, y); }
    function bar(x, y, w, h, v, max, c) {
      ctx.fillStyle = PALETTE[0]; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = PALETTE[1]; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = PALETTE[c]; ctx.fillRect(x, y, Math.round(w * clampN(v / (max || 1), 0, 1)), h);
    }
    function win(x, y, w, h, title) {
      var t = CFG.theme;
      if (t === 1) {          // ROYAL: blue gradient, double frame (classic JRPG)
        var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2b3aa0'); g.addColorStop(1, '#0a0f3e');
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = PALETTE[14]; rect(x, y, w, h); ctx.fillStyle = PALETTE[11]; rect(x + 1, y + 1, w - 2, h - 2);
      } else if (t === 2) {   // STONE: dark stone with gold trim and ruby corners (MU style)
        ctx.fillStyle = '#17120c'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#4a3a24'; rect(x + 1, y + 1, w - 2, h - 2);
        ctx.fillStyle = PALETTE[10]; rect(x, y, w, h);
        ctx.fillStyle = PALETTE[12]; [[x, y], [x + w - 2, y], [x, y + h - 2], [x + w - 2, y + h - 2]].forEach(function (c) { ctx.fillRect(c[0], c[1], 2, 2); });
      } else {                // DRAGON: black with a rounded white border (Dragon Warrior)
        ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = PALETTE[11];
        ctx.fillRect(x + 3, y + 1, w - 6, 1); ctx.fillRect(x + 3, y + h - 2, w - 6, 1);
        ctx.fillRect(x + 1, y + 3, 1, h - 6); ctx.fillRect(x + w - 2, y + 3, 1, h - 6);
        ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + w - 3, y + 2, 1, 1); ctx.fillRect(x + 2, y + h - 3, 1, 1); ctx.fillRect(x + w - 3, y + h - 3, 1, 1);
      }
      if (title) {
        title = String(title).toUpperCase();
        var tw = textWidth(title) + 6, tx = x + ((w - tw) >> 1);
        ctx.fillStyle = t === 1 ? '#2b3aa0' : t === 2 ? '#17120c' : '#000'; ctx.fillRect(tx, y - 1, tw, 5);
        T(title, tx + 3, y - 2, t === 2 ? 10 : 11);
      }
    }
    function pointer(x, y, blink) {
      if (blink && (frame >> 4) % 2) return;
      ctx.fillStyle = PALETTE[CFG.theme === 2 ? 10 : 11];
      ctx.fillRect(x, y, 1, 5); ctx.fillRect(x + 1, y + 1, 1, 3); ctx.fillRect(x + 2, y + 2, 1, 1);
    }

    // ---- generic list window (used by every menu / sub-menu) ----
    function listWin(o) {
      var w = { cur: o.cur || 0 };
      function rows() { return o.rows(); }
      function headH() { return o.head ? o.head.length * 7 + 3 : 0; }
      w.height = function () { var n = Math.min(o.max || 99, Math.max(1, Math.ceil(rows().length / (o.cols || 1)))); return n * (o.rowH || 9) + 10 + headH(); };
      w.update = function (k) {
        var rs = rows(), cols = o.cols || 1, before = w.cur;
        if (k.back || (o.toggle && pressed[o.toggle])) { sfx('menu'); if (o.onBack) o.onBack(w); else uiPop(); return; }
        if (cols === 2) {
          if (k.left && w.cur % 2) w.cur--;
          if (k.right && w.cur % 2 === 0 && w.cur + 1 < rs.length) w.cur++;
          if (k.up && w.cur - 2 >= 0) w.cur -= 2;
          if (k.down && w.cur + 2 < rs.length) w.cur += 2;
        } else {
          if (k.up) w.cur = w.cur > 0 ? w.cur - 1 : rs.length - 1;
          if (k.down) w.cur = w.cur < rs.length - 1 ? w.cur + 1 : 0;
          if ((k.left || k.right) && o.onLR) { o.onLR(rs[w.cur], k.right ? 1 : -1, w); sfx('menu'); }
        }
        w.cur = clampN(w.cur, 0, Math.max(0, rows().length - 1));
        if (w.cur !== before) sfx('menu');
        var r = rows()[w.cur];
        if (o.digits && r) for (var i = 0; i < 4; i++) if (pressed['Digit' + (i + 1)]) o.digits(r, i);
        if (k.ok && r && !r.disabled) { sfx('menu'); o.onPick(r, w); }
      };
      w.draw = function (top) {
        var rs = rows(), cols = o.cols || 1, rh = o.rowH || 9, x = o.x, y = o.y, ww = o.w, hh = w.height(), max = o.max || 99;
        win(x, y, ww, hh, typeof o.title === 'function' ? o.title() : o.title);
        var hy = y + 6;
        if (o.head) { o.head.forEach(function (l, i) { T(l, x + 8, hy + i * 7, 11); }); hy += headH(); }
        var cw = Math.floor((ww - 14) / cols), lines = Math.ceil(rs.length / cols);
        var start = clampN(Math.floor(w.cur / cols) - (max >> 1), 0, Math.max(0, lines - max));
        for (var i = 0; i < rs.length; i++) {
          var ln = Math.floor(i / cols) - start;
          if (ln < 0 || ln >= max) continue;
          var r = rs[i], rx = x + 10 + (i % cols) * cw, ry = hy + ln * rh, ty = ry + ((rh - 5) >> 1), tx = rx;
          if (i === w.cur) pointer(rx - 6, ty, top);
          if (r.icon) { icon(r.icon, rx, ry + ((rh - 8) >> 1)); tx += 10; }
          T(r.label, tx, ty, r.disabled ? 14 : (r.col != null ? r.col : 11));
          if (r.right != null && r.right !== '') TR(String(r.right), rx + cw - 6, ty, r.rcol != null ? r.rcol : 14);
        }
        if (start > 0) T('-', x + ww - 8, y + 4, 14);
        if (start + max < lines) T('-', x + ww - 8, y + hh - 7, 14);
        if (!rs.length) T(o.empty || 'NOTHING', x + 10, hy + 2, 14);
        if (o.extra) o.extra(x, y, ww, hh, rs[w.cur], top);
        if (top && o.tip && rs[w.cur]) o.tip(rs[w.cur], x, y, ww, hh);
      };
      return w;
    }
    function confirmWin(x, y, q, onYes, onNo) {
      var lines = q ? wrap(String(q).toUpperCase(), 30) : null;
      var ww = q ? Math.max(44, Math.max.apply(null, lines.map(function (l) { return textWidth(l); })) + 18) : 40;
      return listWin({ x: clampN(x, 2, W - ww - 2), y: y, w: ww, head: lines, rows: function () { return [{ label: 'YES', yes: 1 }, { label: 'NO' }]; },
        onPick: function (r) { uiPop(); if (r.yes) { if (onYes) onYes(); } else if (onNo) onNo(); },
        onBack: function () { uiPop(); if (onNo) onNo(); } });
    }

    // ---- tooltips (WoW style) ----
    function kindLine(L) {
      if (L.kind === 'weapon') return 'WEAPON';
      if (L.kind === 'armor') return ({ body: 'BODY ARMOR', head: 'HEAD', shield: 'SHIELD', acc: 'ACCESSORY' })[L.d.slot || 'body'] || 'ARMOR';
      return ({ consumable: 'CONSUMABLE', material: 'MATERIAL', key: 'QUEST ITEM' })[L.d.type] || 'ITEM';
    }
    function tipLines(L) {
      var out = [[L.d.name, rar(L.d)], [RAR_N[rarIdx(L.d)] + ' ' + kindLine(L), 14]];
      STATS.forEach(function (k) { var v = num(L.d[k], 0); if (v) out.push([(v > 0 ? '+' : '') + v + ' ' + STAT_LONG[k], 7]); });
      if (L.kind !== 'item') {
        var sl = slotOf(L), cur = lootDef(R.hero.gear[sl]);
        if (cur && cur.ref === L.ref) out.push(['- EQUIPPED -', 3]);
        else {
          var diffs = [];
          STATS.forEach(function (k) { var dv = num(L.d[k], 0) - num(cur ? cur.d[k] : 0, 0); if (dv) diffs.push([(dv > 0 ? '+' : '') + dv + ' ' + k.toUpperCase(), dv > 0 ? 7 : 12]); });
          if (diffs.length) { out.push(['IF EQUIPPED:', 14]); diffs.forEach(function (d) { out.push(['  ' + d[0], d[1]]); }); }
        }
      }
      if (L.kind === 'item' && L.d.type === 'consumable' && L.d.effect && L.d.effect !== 'none')
        out.push(['USE: RESTORES ' + num(L.d.power, 0) + (L.d.effect === 'heal_mp' ? ' MP' : L.d.effect === 'heal_all' ? ' HP+MP' : ' HP'), 7]);
      if (L.d.desc) wrap('"' + String(L.d.desc).toUpperCase() + '"', 28).forEach(function (l) { out.push([l, 10]); });
      if (num(L.d.price, 0) && !(L.kind === 'item' && L.d.type === 'key')) out.push(['SELL PRICE: ' + Math.floor(num(L.d.price) / 2) + ' G', 14]);
      return out;
    }
    function skillTip(s) {
      var out = [[s.name, 10], ['MANA ' + num(s.mp, 0) + '   COOLDOWN ' + num(s.cooldown, 1) + 'S', 14], [SKILL_T[s.type] || 'SKILL', 4],
        ['SCALES WITH ' + (s.stat === 'mag' ? 'MAGIC' : 'ATTACK') + ' X' + num(s.power, 1), 14]];
      if (s.desc) wrap('"' + String(s.desc).toUpperCase() + '"', 28).forEach(function (l) { out.push([l, 10]); });
      var hb = R.hero.hotbar.indexOf(s.id);
      out.push([hb >= 0 ? 'BOUND TO KEY ' + (hb + 1) : 'PRESS 1-4 TO BIND', 3]);
      return out;
    }
    function tipSize(lines) { return { w: Math.max.apply(null, lines.map(function (l) { return textWidth(l[0]); })) + 10, h: lines.length * 7 + 6 }; }
    function drawTip(lines, x, y, alignRight) {
      var s = tipSize(lines);
      if (alignRight) x -= s.w;
      x = clampN(x, 1, W - s.w - 1); y = clampN(y, 1, H - s.h - 1);
      ctx.fillStyle = 'rgba(4,6,16,0.95)'; ctx.fillRect(x, y, s.w, s.h);
      ctx.fillStyle = PALETTE[lines[0][1]]; rect(x, y, s.w, s.h);
      lines.forEach(function (l, i) { T(l[0], x + 5, y + 4 + i * 7, l[1]); });
    }
    function infoWin(lines) {
      return {
        update: function (k) { if (k.ok || k.back) { uiPop(); sfx('menu'); } },
        draw: function () { var s = tipSize(lines); drawTip(lines, (W - s.w) >> 1, (H - s.h) >> 1); }
      };
    }

    // ---- dialogue (Dragon Warrior message window, optional YES/NO) ----
    function openDialog(speaker, lines, onClose, choice) {
      var pages = [];
      lines.forEach(function (l) { var w = wrap(String(l).toUpperCase(), 57); for (var i = 0; i < w.length; i += 3) pages.push(w.slice(i, i + 3)); });
      if (!pages.length) { if (onClose) onClose(); return; }
      var d = { speaker: String(speaker || '').toUpperCase(), pages: pages, i: 0, t: 0, onClose: onClose, choice: choice };
      d.update = function (k) {
        var full = d.pages[d.i].join('\n').length, last = d.i === d.pages.length - 1;
        if (d.t < full) d.t = Math.min(full, d.t + SPEEDS[CFG.speed]);
        if (d.t >= full && last && d.choice && !d.asked) {
          d.asked = true;
          uiPush(confirmWin(W - 50, H - 46 - 31, null, function () { closeDialog(d); d.choice(true); }, function () { closeDialog(d); d.choice(false); }));
          return;
        }
        if (k.ok || k.back) {
          if (d.t < full) { d.t = full; return; }
          if (!last) { d.i++; d.t = 0; sfx('menu'); return; }
          if (!d.choice) closeDialog(d);
        }
      };
      d.draw = function (top) {
        var y = H - 46;
        win(4, y, W - 8, 42, d.speaker);
        var pg = d.pages[d.i], left = Math.floor(d.t);
        pg.forEach(function (l, i) { if (left <= 0) return; T(l.slice(0, left), 12, y + 9 + i * 9, 11); left -= l.length + 1; });
        if (top && d.t >= pg.join('\n').length && !(d.choice && d.i === d.pages.length - 1) && (frame >> 4) % 2 === 0) {
          ctx.fillStyle = PALETTE[11]; ctx.fillRect(W - 18, y + 33, 5, 1); ctx.fillRect(W - 17, y + 34, 3, 1); ctx.fillRect(W - 16, y + 35, 1, 1);
        }
      };
      uiPush(d);
    }
    function closeDialog(d) {
      if (R.stack.indexOf(d) < 0) return;
      while (R.ui !== d) uiPop();
      uiPop(); sfx('menu');
      if (d.onClose) d.onClose();
    }
    function say(lines, onClose) { openDialog('', lines, onClose); }

    // ---- item / equipment / spell sub-menus ----
    function itemActions(ref, x, y) {
      var L = lootDef(ref); if (!L) return;
      var rows = [];
      if (L.kind === 'item' && L.d.type === 'consumable') rows.push({ label: 'USE', a: 'use' });
      if (L.kind !== 'item') rows.push({ label: 'EQUIP', a: 'equip' });
      rows.push({ label: 'INFO', a: 'info' });
      if (!(L.kind === 'item' && L.d.type === 'key')) rows.push({ label: 'DISCARD', a: 'drop' });
      rows.push({ label: 'CANCEL', a: 'x' });
      uiPush(listWin({ x: clampN(x, 2, W - 54), y: clampN(y, 4, H - rows.length * 9 - 14), w: 52, rows: function () { return rows; },
        onPick: function (r) {
          uiPop();
          if (r.a === 'use') useItem(ref);
          else if (r.a === 'equip') equip(ref);
          else if (r.a === 'info') uiPush(infoWin(tipLines(L)));
          else if (r.a === 'drop') uiPush(confirmWin(70, 50, 'DISCARD ' + L.d.name + '?', function () { takeLoot(ref, 1); chat('DISCARDED ' + L.d.name, 14); }));
        } }));
    }
    function itemListWin(x, y) {
      return listWin({ x: x, y: y, w: 118, max: 9, title: 'ITEM', rowH: 10, empty: 'NO ITEMS',
        rows: function () { return invRows().map(function (r) { return { icon: r.L.d.icon, label: r.L.d.name, right: r.n > 1 ? 'X' + r.n : '', col: rar(r.L.d), L: r.L }; }); },
        tip: function (r, x0, y0, w0) { drawTip(tipLines(r.L), x0 + w0 + 2, y0); },
        onPick: function (r, w) { itemActions(r.L.ref, x + 66, y + 10 + w.cur * 10); } });
    }
    function deltaSum(L, sl) {
      var cur = lootDef(R.hero.gear[sl]), best = null;
      STATS.forEach(function (k) { var dv = num(L.d[k], 0) - num(cur ? cur.d[k] : 0, 0); if (dv && (!best || Math.abs(dv) > Math.abs(best.v))) best = { k: k, v: dv }; });
      return best ? { txt: (best.v > 0 ? '+' : '') + best.v + ' ' + best.k.toUpperCase(), c: best.v > 0 ? 7 : 12 } : { txt: '=', c: 14 };
    }
    function equipList(sl, x, y) {
      return listWin({ x: clampN(x, 2, W - 132), y: clampN(y, 4, 60), w: 128, max: 7, rowH: 10, title: SLOT_N[sl],
        rows: function () {
          var out = [{ label: '(UNEQUIP)', col: 14, ref: '' }];
          invRows().forEach(function (r) {
            if (slotOf(r.L) !== sl) return;
            var dl = deltaSum(r.L, sl);
            out.push({ icon: r.L.d.icon, label: r.L.d.name, col: rar(r.L.d), L: r.L, ref: r.L.ref, right: dl.txt, rcol: dl.c });
          });
          return out;
        },
        tip: function (r, x0, y0, w0) { if (r.L) drawTip(tipLines(r.L), x0 + w0 + 2, y0); },
        onPick: function (r) { uiPop(); if (r.ref) equip(r.ref); else unequip(sl); } });
    }
    function equipSlotsWin(x, y) {
      return listWin({ x: x, y: y, w: 150, title: 'EQUIP', rowH: 10,
        rows: function () { return SLOTS.map(function (sl) { var L = lootDef(R.hero.gear[sl]); return { label: sl === 'acc' ? 'ACC.' : SLOT_N[sl], right: L ? L.d.name : '-', rcol: L ? rar(L.d) : 14, col: 4, sl: sl, L: L }; }); },
        tip: function (r, x0, y0, w0, h0) { if (r.L) drawTip(tipLines(r.L), x0, y0 + h0 + 2); },
        onPick: function (r, w) { uiPush(equipList(r.sl, x + 24, y + 14 + w.cur * 10)); } });
    }
    function bindHotbar(id, i) { var hb = R.hero.hotbar, old = hb.indexOf(id); if (old >= 0) hb[old] = hb[i] || null; hb[i] = id; sfx('menu'); }
    function spellWin(x, y, toggleKey) {
      return listWin({ x: x, y: y, w: 128, title: toggleKey ? 'SPELLBOOK' : 'SPELL', rowH: 10, max: 8, toggle: toggleKey, empty: 'NO SKILLS YET',
        rows: function () {
          return R.hero.skills.map(function (id) { return dbGet('skills', id); }).filter(Boolean).map(function (s) {
            var hb = R.hero.hotbar.indexOf(s.id);
            return { icon: s.icon, label: (hb >= 0 ? (hb + 1) + ' ' : '') + s.name, right: num(s.mp, 0) + ' MP', rcol: R.hero.mp >= num(s.mp, 0) ? 3 : 12, sk: s };
          });
        },
        tip: function (r, x0, y0, w0) { drawTip(skillTip(r.sk), x0 + w0 + 2, y0); },
        digits: function (r, i) { bindHotbar(r.sk.id, i); },
        onPick: function (r, w) {
          var acts = [{ label: 'CAST', a: 'cast' }, { label: 'BIND KEY', a: 'bind' }, { label: 'CANCEL', a: 'x' }];
          uiPush(listWin({ x: x + 64, y: y + 12 + w.cur * 10, w: 60, rows: function () { return acts; }, onPick: function (q) {
            uiPop();
            if (q.a === 'cast') { uiClear(); var p = player(); if (p) castSkill(p, r.sk.id); }
            else if (q.a === 'bind') uiPush(listWin({ x: x + 60, y: y + 24, w: 110, title: 'BIND TO KEY',
              rows: function () { return [0, 1, 2, 3].map(function (i) { var s = dbGet('skills', R.hero.hotbar[i]); return { label: 'KEY ' + (i + 1), right: s ? s.name : '-', i: i }; }); },
              onPick: function (k2) { bindHotbar(r.sk.id, k2.i); uiPop(); } }));
          } }));
        } });
    }
    function search(p) {
      var t = interactTarget(p);
      if (t && t.comps.chest) return openChest(t);
      var near = actors.find(function (a) { return a.lootRef && !a.dead && dist(a, p) < 16; });
      if (near) { near.dead = true; giveLoot(near.lootRef, 1); return; }
      say(['YOU SEARCHED ALL AROUND.', 'BUT THERE FOUND NOTHING.']);
    }

    // ---- Dragon Warrior COMMAND window (Enter) ----
    function drawMiniStatus(x, y) {
      var h = R.hero;
      win(x, y, 56, 47, h.name);
      [['LV', h.lv], ['HP', h.hp], ['MP', h.mp], ['G', h.gold], ['E', h.exp]].forEach(function (r, i) { T(r[0], x + 7, y + 6 + i * 7, 11); TR(String(r[1]), x + 49, y + 6 + i * 7, 11); });
    }
    function openCommand() {
      var p = player();
      var cmds = [
        { label: 'TALK', f: function () { var t = interactTarget(p); uiClear(); if (t) interact(p); else say(['THERE IS NO ONE THERE.']); } },
        { label: 'SPELL', f: function () { uiPush(spellWin(56, 14)); } },
        { label: 'STATUS', f: openCharacter },
        { label: 'ITEM', f: function () { uiPush(itemListWin(56, 14)); } },
        { label: 'EQUIP', f: function () { uiPush(equipSlotsWin(56, 14)); } },
        { label: 'SEARCH', f: function () { uiClear(); search(p); } },
        { label: 'QUESTS', f: openQuestLog },
        { label: 'MAP', f: openMap },
        { label: 'SAVE', f: function () { uiPush(confirmWin(60, 40, 'SAVE YOUR ADVENTURE?', function () { saveGame(); say(['YOUR DEEDS HAVE BEEN RECORDED.']); })); } },
        { label: 'SYSTEM', f: openGameMenu }
      ];
      uiPush(listWin({ x: 4, y: 6, w: 92, cols: 2, title: 'COMMAND', rows: function () { return cmds; }, onPick: function (r) { r.f(); },
        extra: function (x, y, w, h) { drawMiniStatus(x, y + h + 4); } }));
    }

    // ---- WoW-style CHARACTER panel (C): paper doll + attributes ----
    var CSLOTS = [['head', 0, 0], ['body', 0, 1], ['shield', 0, 2], ['weapon', 1, 0], ['acc', 1, 1]];
    var CSLOT_L = { head: 'H', body: 'B', shield: 'S', weapon: 'W', acc: 'A' };
    function baseStats() { var h = R.hero, c = dbGet('classes', h.classId) || {}, s = {}; STATS.forEach(function (k) { s[k] = Math.round(num(c[k], 5) + num(c['g' + k], 1) * (h.lv - 1)); }); return s; }
    function openCharacter() {
      var c = { cur: 3 };
      function pos(i) { var s = CSLOTS[i]; return { x: s[1] ? 84 : 20, y: 22 + s[2] * 15 }; }
      c.update = function (k) {
        if (k.back || pressed.KeyC) { uiPop(); sfx('menu'); return; }
        var s = CSLOTS[c.cur], b = c.cur;
        if (k.up || k.down) { var t = CSLOTS.findIndex(function (q) { return q[1] === s[1] && q[2] === s[2] + (k.down ? 1 : -1); }); if (t >= 0) c.cur = t; }
        if (k.left || k.right) {
          var col = k.right ? 1 : 0, best = -1;
          CSLOTS.forEach(function (q, i) { if (q[1] === col && (best < 0 || Math.abs(q[2] - s[2]) < Math.abs(CSLOTS[best][2] - s[2]))) best = i; });
          if (best >= 0) c.cur = best;
        }
        if (c.cur !== b) sfx('menu');
        if (k.ok) { var p0 = pos(c.cur); sfx('menu'); uiPush(equipList(CSLOTS[c.cur][0], p0.x + 16, p0.y)); }
      };
      c.draw = function (top) {
        var h = R.hero, st = R.st, cl = dbGet('classes', h.classId) || {}, p = player();
        win(6, 6, W - 12, H - 26, 'CHARACTER');
        ctx.fillStyle = PALETTE[1]; ctx.fillRect(38, 22, 40, 41);
        ctx.fillStyle = PALETTE[14]; rect(38, 22, 40, 41);
        var pc = p && spriteCanvas(spr[p.sprite]); if (pc) ctx.drawImage(pc, 42, 26, 32, 32);
        CSLOTS.forEach(function (s, i) {
          var q = pos(i), L = lootDef(h.gear[s[0]]);
          ctx.fillStyle = '#0d0d16'; ctx.fillRect(q.x, q.y, 12, 12);
          ctx.fillStyle = L ? PALETTE[rar(L.d)] : '#3a3a48'; rect(q.x, q.y, 12, 12);
          if (L) icon(L.d.icon, q.x + 2, q.y + 2); else T(CSLOT_L[s[0]], q.x + 5, q.y + 4, 14);
          if (i === c.cur && (!top || (frame >> 4) % 2 === 0)) { ctx.fillStyle = PALETTE[10]; rect(q.x - 1, q.y - 1, 14, 14); }
        });
        T(h.name, 20, 70, 10); T('LV ' + h.lv + ' ' + (cl.name || ''), 20, 78, 11);
        bar(20, 87, 76, 2, h.exp, expNeed(h.lv), 10); T('EXP ' + h.exp + '/' + expNeed(h.lv), 20, 92, 14);
        ctx.fillStyle = PALETTE[14]; ctx.fillRect(104, 13, 1, H - 44);
        T('ATTRIBUTES', 112, 15, 4);
        var base = baseStats();
        [['hp', 'HEALTH'], ['mp', 'MANA'], ['atk', 'ATTACK'], ['def', 'DEFENSE'], ['mag', 'MAGIC'], ['agi', 'AGILITY']].forEach(function (s, i) {
          var y = 25 + i * 8, v = st[s[0]], bonus = v - base[s[0]];
          T(s[1], 112, y, 11); TR(String(v), 212, y, 11);
          if (bonus) T((bonus > 0 ? '+' : '') + bonus, 216, y, bonus > 0 ? 7 : 12);
        });
        T('CRIT CHANCE', 112, 77, 14); TR(Math.round((0.05 + st.agi * 0.004) * 100) + '%', 212, 77, 11);
        T('MOVE SPEED', 112, 85, 14); TR(Math.round(Math.min(1.6, 0.9 + st.agi * 0.02) * 100) + '%', 212, 85, 11);
        T('GOLD', 112, 93, 14); TR(h.gold + ' G', 212, 93, 10);
        T('ARROWS: SLOT   Z: CHANGE   X: CLOSE', 14, H - 31, 14);
        if (top) {
          var q2 = pos(c.cur), L2 = lootDef(h.gear[CSLOTS[c.cur][0]]);
          drawTip(L2 ? tipLines(L2) : [['EMPTY ' + SLOT_N[CSLOTS[c.cur][0]] + ' SLOT', 14]], q2.x + 16, q2.y);
        }
      };
      uiPush(c);
    }

    // ---- WoW / MU-style BACKPACK grid (I / B) ----
    function openBags() {
      var COLS = 8, ROWS = 4, N = COLS * ROWS, SZ = 13, bx = 8, by = 16, bw = COLS * SZ + 13, bh = ROWS * SZ + 24;
      var b = { cur: 0 };
      b.update = function (k) {
        if (k.back || pressed.KeyI || pressed.KeyB) { uiPop(); sfx('menu'); return; }
        var o = b.cur;
        if (k.left) b.cur = (b.cur + N - 1) % N;
        if (k.right) b.cur = (b.cur + 1) % N;
        if (k.up) b.cur = (b.cur + N - COLS) % N;
        if (k.down) b.cur = (b.cur + COLS) % N;
        if (b.cur !== o) sfx('menu');
        var it = invRows()[b.cur];
        if (k.ok && it) { sfx('menu'); itemActions(it.L.ref, bx + 7 + (b.cur % COLS) * SZ + 14, by + 8 + Math.floor(b.cur / COLS) * SZ); }
      };
      b.draw = function (top) {
        var items = invRows();
        win(bx, by, bw, bh, 'BACKPACK');
        for (var i = 0; i < N; i++) {
          var sx = bx + 7 + (i % COLS) * SZ, sy = by + 8 + Math.floor(i / COLS) * SZ, it = items[i];
          ctx.fillStyle = '#0c0c14'; ctx.fillRect(sx, sy, 12, 12);
          ctx.fillStyle = it ? PALETTE[rar(it.L.d)] : '#2a2a38'; rect(sx, sy, 12, 12);
          if (it) { icon(it.L.d.icon, sx + 2, sy + 2); if (it.n > 1) { var ns = String(it.n); shadowText(ns, sx + 12 - textWidth(ns), sy + 7, PALETTE[11]); } }
          if (i === b.cur && (!top || (frame >> 4) % 2 === 0)) { ctx.fillStyle = PALETTE[10]; rect(sx - 1, sy - 1, 14, 14); }
        }
        T(items.length + '/' + N, bx + 7, by + bh - 10, 14);
        TR(R.hero.gold + ' G', bx + bw - 7, by + bh - 10, 10);
        shadowText('Z: USE/EQUIP   X: CLOSE', bx + 2, by + bh + 3, PALETTE[14]);
        var it2 = items[b.cur];
        if (top && it2) drawTip(tipLines(it2.L), bx + bw + 3, by);
      };
      uiPush(b);
    }

    // ---- QUEST LOG (L) ----
    function questList() {
      return Object.keys(R.hero.quests).map(function (id) { return dbGet('quests', id); }).filter(Boolean)
        .sort(function (a, b) { return (questState(a) === 'done') - (questState(b) === 'done'); });
    }
    function openQuestLog() {
      var q = { cur: 0 };
      q.update = function (k) {
        if (k.back || pressed.KeyL) { uiPop(); sfx('menu'); return; }
        var n = questList().length, o = q.cur;
        if (k.up) q.cur = Math.max(0, q.cur - 1);
        if (k.down) q.cur = Math.min(Math.max(0, n - 1), q.cur + 1);
        if (q.cur !== o) sfx('menu');
      };
      q.draw = function (top) {
        var list = questList();
        win(6, 6, W - 12, H - 26, 'QUEST LOG');
        ctx.fillStyle = PALETTE[14]; ctx.fillRect(96, 13, 1, H - 44);
        list.slice(0, 11).forEach(function (qq, i) {
          var s = questState(qq), y = 15 + i * 9;
          if (i === q.cur) pointer(10, y, top);
          T(qq.name, 16, y, s === 'done' ? 14 : s === 'ready' ? 7 : 11);
        });
        var c = list[q.cur];
        if (!c) { T('NO QUESTS YET.', 104, 15, 14); T('TALK TO PEOPLE WITH A !', 104, 25, 14); T('ABOVE THEIR HEADS.', 104, 32, 14); return; }
        var s = questState(c), x = 104, y = 15;
        T(c.name, x, y, 10); y += 10;
        var obj = c.type === 'collect' ? 'COLLECT ' + (lootDef(c.item) ? lootDef(c.item).d.name : '?') : 'DEFEAT ' + ((dbGet('monsters', c.monster) || {}).name || '?');
        T(obj + '  ' + Math.min(questProg(c), num(c.count, 1)) + '/' + num(c.count, 1), x, y, 11); y += 8;
        T(s === 'done' ? 'COMPLETED' : s === 'ready' ? 'READY TO TURN IN!' : 'IN PROGRESS', x, y, s === 'ready' ? 7 : s === 'done' ? 14 : 3); y += 10;
        wrap(String(c.desc || '').toUpperCase(), 34).slice(0, 5).forEach(function (l) { T(l, x, y, 14); y += 7; });
        y += 3; T('REWARDS', x, y, 4); y += 8;
        T(num(c.exp, 0) + ' EXP   ' + num(c.gold, 0) + ' GOLD', x, y, 11); y += 8;
        var rw = lootDef(c.reward); if (rw) { icon(rw.d.icon, x, y - 2); T(rw.d.name, x + 10, y, rar(rw.d)); }
      };
      uiPush(q);
    }

    // ---- WORLD MAP (M) + minimap ----
    var tileCol = {};
    function tileColor(id) {
      if (id in tileCol) return tileCol[id];
      var s = spr[id], cnt = {}, best = null;
      if (s) s.px.join('').split('').forEach(function (ch) { if (ch !== '.') { cnt[ch] = (cnt[ch] || 0) + 1; if (!best || cnt[ch] > cnt[best]) best = ch; } });
      return (tileCol[id] = best ? PALETTE[parseInt(best, 16)] : null);
    }
    function markerCol(a) {
      var c = a.comps;
      if (c.rpgPlayer) return null;
      if (a.m) return PALETTE[a.m.boss ? 13 : 12];
      if (c.npc) return PALETTE[10];
      if (c.chest && !R.hero.flags['chest:' + a.id]) return PALETTE[9];
      if (c.door) return PALETTE[4];
      return null;
    }
    function drawMapArea(x0, y0, tx0, ty0, tw, th, s) {
      ctx.fillStyle = '#000'; ctx.fillRect(x0, y0, tw * s, th * s);
      for (var ty = 0; ty < th; ty++) for (var tx = 0; tx < tw; tx++) {
        var gx = tx0 + tx, gy = ty0 + ty;
        if (gx < 0 || gy < 0 || gx >= L.w || gy >= L.h) continue;
        var id = L.tiles[gy * L.w + gx];
        ctx.fillStyle = (id && tileColor(id)) || PALETTE[L.bg];
        ctx.fillRect(x0 + tx * s, y0 + ty * s, s, s);
      }
      var ms = Math.max(2, s);
      actors.forEach(function (a) {
        if (a.dead || a.lootRef) return;
        var col = markerCol(a); if (!col) return;
        var mx = (a.x + 4) / TS - tx0, my = (a.y + 4) / TS - ty0;
        if (mx < 0 || my < 0 || mx >= tw || my >= th) return;
        ctx.fillStyle = col; ctx.fillRect(x0 + Math.floor(mx * s - ms / 2), y0 + Math.floor(my * s - ms / 2), ms, ms);
      });
      var p = player();
      if (p && (frame >> 3) % 2) {
        var px = (p.x + 4) / TS - tx0, py = (p.y + 4) / TS - ty0;
        ctx.fillStyle = PALETTE[11]; ctx.fillRect(x0 + Math.floor(px * s - ms / 2), y0 + Math.floor(py * s - ms / 2), ms, ms);
      }
    }
    function openMap() {
      var m = {};
      m.update = function (k) { if (k.back || k.ok || pressed.KeyM) { uiPop(); sfx('menu'); } };
      m.draw = function () {
        var s = Math.max(1, Math.floor(Math.min((W - 24) / L.w, (H - 46) / L.h))), mw = L.w * s, mh = L.h * s;
        var x = (W - mw) >> 1, y = 12 + ((H - 46 - mh) >> 1);
        win(x - 6, y - 7, mw + 12, mh + 22, 'MAP - ' + L.name);
        drawMapArea(x, y, 0, 0, L.w, L.h, s);
        var lx = x, ly = y + mh + 5;
        [[11, 'YOU'], [10, 'NPC'], [12, 'FOE'], [9, 'CHEST'], [4, 'EXIT']].forEach(function (e) {
          ctx.fillStyle = PALETTE[e[0]]; ctx.fillRect(lx, ly, 3, 3); T(e[1], lx + 5, ly - 1, 14); lx += textWidth(e[1]) + 12;
        });
      };
      uiPush(m);
    }

    // ---- GAME MENU (Esc) & SETTINGS ----
    function settingsWin() {
      function rows() {
        return [
          { label: 'SOUND VOLUME', right: '< ' + CFG.vol + '% >', k: 'vol' },
          { label: 'TEXT SPEED', right: '< ' + SPEED_N[CFG.speed] + ' >', k: 'speed' },
          { label: 'WINDOW STYLE', right: '< ' + THEME_N[CFG.theme] + ' >', k: 'theme' },
          { label: 'DAMAGE NUMBERS', right: '< ' + (CFG.dmg ? 'ON' : 'OFF') + ' >', k: 'dmg' },
          { label: 'MINIMAP', right: '< ' + (CFG.mini ? 'ON' : 'OFF') + ' >', k: 'mini' },
          { label: 'DONE', k: 'done' }];
      }
      function adj(r, d) {
        if (!r) return;
        if (r.k === 'vol') CFG.vol = clampN(CFG.vol + d * 10, 0, 100);
        else if (r.k === 'speed') CFG.speed = (CFG.speed + d + 4) % 4;
        else if (r.k === 'theme') CFG.theme = (CFG.theme + d + 3) % 3;
        else if (r.k === 'dmg') CFG.dmg = CFG.dmg ? 0 : 1;
        else if (r.k === 'mini') CFG.mini = CFG.mini ? 0 : 1;
        saveCfg();
      }
      return listWin({ x: 52, y: 28, w: 152, title: 'SETTINGS', rowH: 10, rows: rows, onLR: function (r, d) { adj(r, d); }, onPick: function (r) { if (r.k === 'done') uiPop(); else adj(r, 1); } });
    }
    function quitToTitle() { R = null; resetVars(); title = true; loadLevel(startIdx); }
    function openGameMenu() {
      var rows = [{ label: 'RESUME', a: 'resume' }, { label: 'SETTINGS', a: 'settings' }, { label: 'CONTROLS', a: 'controls' }, { label: 'SAVE GAME', a: 'save' },
        { label: 'LOAD GAME', a: 'load' }, { label: opts.onExit ? 'EXIT PLAY TEST' : 'QUIT TO TITLE', a: 'quit' }];
      uiPush(listWin({ x: 80, y: 30, w: 96, title: 'GAME MENU', rowH: 10, rows: function () { return rows; },
        onPick: function (r) {
          if (r.a === 'resume') uiClear();
          else if (r.a === 'settings') uiPush(settingsWin());
          else if (r.a === 'controls') uiPush(infoWin(CONTROLS_LINES));
          else if (r.a === 'save') uiPush(confirmWin(90, 60, 'SAVE YOUR ADVENTURE?', function () { saveGame(); say(['YOUR DEEDS HAVE BEEN RECORDED.']); }));
          else if (r.a === 'load') {
            if (!hasSave()) say(['NO SAVED ADVENTURE WAS FOUND.']);
            else uiPush(confirmWin(70, 60, 'LOAD YOUR SAVE? UNSAVED PROGRESS WILL BE LOST.', function () { uiClear(); loadSave(); }));
          } else if (r.a === 'quit') uiPush(confirmWin(90, 60, opts.onExit ? 'STOP THE PLAY TEST?' : 'QUIT TO THE TITLE?', function () { uiClear(); if (opts.onExit) opts.onExit(); else quitToTitle(); }));
        } }));
    }

    // ---- SHOP: buy/sell tabs, quantity & confirmation sub-menus ----
    function shopRows(u) {
      if (u.mode === 0) return (u.shop.goods || []).map(function (g) { return lootDef(g && g.loot !== undefined ? g.loot : g); }).filter(Boolean)
        .map(function (L) { return { icon: L.d.icon, label: L.d.name, right: num(L.d.price, 0) + ' G', rcol: R.hero.gold >= num(L.d.price, 0) ? 10 : 12, col: rar(L.d), L: L }; });
      return invRows().filter(function (r) { return !(r.L.kind === 'item' && r.L.d.type === 'key'); })
        .map(function (r) { return { icon: r.L.d.icon, label: r.L.d.name + (r.n > 1 ? ' X' + r.n : ''), right: Math.floor(num(r.L.d.price, 0) / 2) + ' G', rcol: 10, col: rar(r.L.d), L: r.L }; });
    }
    function buyFlow(L) {
      var price = num(L.d.price, 0);
      var go = function (n) {
        var total = price * n;
        uiPush(confirmWin(60, 50, (n > 1 ? n + ' ' : '') + L.d.name + ' FOR ' + total + ' G. IS THAT OKAY?', function () {
          if (R.hero.gold < total) { sfx('hurt'); say(['YOU DO NOT HAVE ENOUGH GOLD.']); return; }
          R.hero.gold -= total; giveLoot(L.ref, n, true); sfx('coin'); chat('BOUGHT ' + L.d.name + (n > 1 ? ' X' + n : ''), rar(L.d));
        }));
      };
      if (L.kind !== 'item') return go(1);
      uiPush(listWin({ x: 84, y: 40, w: 84, title: 'HOW MANY?', rows: function () {
        return [1, 5, 10].map(function (n) { return { label: 'X' + n, right: price * n + ' G', rcol: R.hero.gold >= price * n ? 10 : 12, n: n }; });
      }, onPick: function (r) { uiPop(); go(r.n); } }));
    }
    function sellFlow(L) {
      var price = Math.floor(num(L.d.price, 0) / 2), have = countLoot(L.ref);
      var go = function (n) {
        uiPush(confirmWin(60, 50, 'I WILL PAY ' + price * n + ' G FOR ' + (n > 1 ? n + ' ' : '') + L.d.name + '. OKAY?', function () {
          takeLoot(L.ref, n); R.hero.gold += price * n; sfx('coin'); chat('SOLD ' + L.d.name + (n > 1 ? ' X' + n : '') + ' +' + price * n + 'G', 14);
        }));
      };
      if (have <= 1) return go(1);
      uiPush(listWin({ x: 84, y: 40, w: 92, title: 'HOW MANY?', rows: function () {
        return [{ label: 'X1', n: 1, right: price + ' G' }, { label: 'ALL X' + have, n: have, right: price * have + ' G' }];
      }, onPick: function (r) { uiPop(); go(r.n); } }));
    }
    function openShop(sh) {
      var u = { shop: sh, mode: 0 };
      sfx('menu');
      uiPush(listWin({ x: 6, y: 8, w: 132, max: 8, rowH: 10, title: function () { return u.mode ? '< SELL >' : '< BUY >'; }, empty: 'NOTHING HERE',
        rows: function () { return shopRows(u); },
        onLR: function (r, d, w) { u.mode = 1 - u.mode; w.cur = 0; },
        tip: function (r, x, y, w) { drawTip(tipLines(r.L), x + w + 3, y); },
        extra: function (x, y, w, h) {
          win(x, y + h + 3, w, 23);
          T(String(sh.name || 'SHOP').toUpperCase(), x + 7, y + h + 8, 10);
          T('GOLD', x + 7, y + h + 16, 14); TR(R.hero.gold + ' G', x + w - 7, y + h + 16, 10);
        },
        onPick: function (r) { if (u.mode === 0) buyFlow(r.L); else sellFlow(r.L); } }));
    }

    // ---- HUD: unit frames, target frame, minimap, orbs, action bar ----
    function bestPotion() {
      var best = null;
      Object.keys(R.hero.inv).forEach(function (ref) {
        var L = lootDef(ref);
        if (L && L.kind === 'item' && L.d.type === 'consumable' && (L.d.effect === 'heal_hp' || L.d.effect === 'heal_all') && (!best || num(L.d.power) < num(best.d.power))) best = L;
      });
      return best;
    }
    function unitFrame(x, y, w, sid, name, lv, hp, mhp, mp, mmp, elite) {
      ctx.fillStyle = 'rgba(6,8,18,0.82)'; ctx.fillRect(x, y, w, 21);
      ctx.fillStyle = elite ? PALETTE[10] : PALETTE[14]; rect(x, y, w, 21);
      if (elite) { ctx.fillRect(x - 1, y + 3, 1, 15); ctx.fillRect(x + w, y + 3, 1, 15); }
      ctx.fillStyle = PALETTE[1]; ctx.fillRect(x + 2, y + 2, 17, 17);
      var c = spriteCanvas(spr[sid]); if (c) ctx.drawImage(c, x + 3, y + 3, 16, 16);
      var ls = String(lv);
      ctx.fillStyle = '#000'; ctx.fillRect(x + 2, y + 13, textWidth(ls) + 2, 7); T(ls, x + 3, y + 14, elite ? 10 : 11);
      T(name, x + 22, y + 3, elite ? 10 : 11);
      bar(x + 22, y + 10, w - 25, 4, hp, mhp, 12);
      if (mmp != null) bar(x + 22, y + 16, w - 25, 2, mp, mmp, 3);
    }
    function orb(cx, cy, r, ratio, col) {
      ratio = clampN(ratio || 0, 0, 1);
      var lvl = cy + r + 1 - ratio * (2 * r + 1), rim = PALETTE[CFG.theme === 2 ? 10 : 14];
      for (var dy = -r; dy <= r; dy++) {
        var hw = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8)), yy = cy + dy;
        ctx.fillStyle = yy >= lvl ? PALETTE[col] : '#160d0d'; ctx.fillRect(cx - hw, yy, hw * 2 + 1, 1);
        ctx.fillStyle = rim; ctx.fillRect(cx - hw - 1, yy, 1, 1); ctx.fillRect(cx + hw + 1, yy, 1, 1);
      }
      ctx.fillStyle = rim; ctx.fillRect(cx - 2, cy - r - 1, 5, 1); ctx.fillRect(cx - 2, cy + r + 1, 5, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(cx - 3, cy - 4, 2, 1); ctx.fillRect(cx - 4, cy - 3, 1, 2);
    }
    function drawHud(p) {
      var h = R.hero, st = R.st, rim = PALETTE[CFG.theme === 2 ? 10 : 14];
      unitFrame(2, 2, 84, p.sprite, h.name, h.lv, h.hp, st.hp, h.mp, st.mp, false);
      var tg = R.target && !R.target.dead && actors.indexOf(R.target) >= 0 ? R.target : null;
      if (tg) unitFrame(90, 2, 90, tg.sprite, tg.m.name, num(tg.m.level, 1), tg.hp, tg.mhp, null, null, !!tg.m.boss);
      var ry = 3;
      if (CFG.mini) {
        var mx = W - 42, my = 2;
        drawMapArea(mx + 1, my + 1, Math.floor((p.x + 4) / TS) - 19, Math.floor((p.y + 4) / TS) - 14, 39, 28, 1);
        ctx.fillStyle = rim; rect(mx, my, 41, 30);
        ry = 35;
      }
      var gs = h.gold + ' G'; shadowText(gs, W - 3 - textWidth(gs), ry, PALETTE[10]); ry += 8;
      Object.keys(h.quests).forEach(function (id) {
        var q = dbGet('quests', id);
        if (!q || h.quests[id].state === 'done' || ry > 60) return;
        var s = q.name + ' ' + Math.min(questProg(q), num(q.count, 1)) + '/' + num(q.count, 1);
        shadowText(s, W - 3 - textWidth(s), ry, PALETTE[questReady(q) ? 7 : 11]); ry += 7;
      });
      // bottom action bar
      var by = H - 16;
      ctx.fillStyle = 'rgba(12,10,8,0.88)'; ctx.fillRect(0, by, W, 16);
      ctx.fillStyle = rim; ctx.fillRect(0, by, W, 1);
      ctx.fillStyle = PALETTE[1]; ctx.fillRect(20, by + 2, W - 40, 1);
      ctx.fillStyle = PALETTE[10]; ctx.fillRect(20, by + 2, Math.round((W - 40) * Math.min(1, h.exp / expNeed(h.lv))), 1);
      orb(10, H - 9, 7, h.hp / st.hp, 12);
      orb(W - 11, H - 9, 7, st.mp ? h.mp / st.mp : 0, 3);
      shadowText(h.hp + '/' + st.hp, 21, by + 6, PALETTE[13]);
      var ms = h.mp + '/' + st.mp; shadowText(ms, W - 21 - textWidth(ms), by + 6, PALETTE[4]);
      var hx = (W - 5 * 14) >> 1, hy = by + 3;
      for (var i = 0; i < 5; i++) {
        var x = hx + i * 14;
        ctx.fillStyle = '#000'; ctx.fillRect(x, hy, 12, 12);
        ctx.fillStyle = '#4a4a58'; rect(x, hy, 12, 12);
        if (i < 4) {
          var id = h.hotbar[i], sk = dbGet('skills', id);
          if (sk) {
            icon(sk.icon, x + 2, hy + 2);
            var cd = R.cd[id] || 0, tot = Math.max(1, num(sk.cooldown, 1) * 60);
            if (cd > 0) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; var ch = Math.ceil(10 * cd / tot); ctx.fillRect(x + 1, hy + 11 - ch, 10, ch); }
            if (h.mp < num(sk.mp, 0)) { ctx.fillStyle = 'rgba(30,40,170,0.5)'; ctx.fillRect(x + 1, hy + 1, 10, 10); }
          }
          shadowText(String(i + 1), x + 1, hy + 1, PALETTE[11]);
        } else {
          var bp = bestPotion();
          if (bp) { icon(bp.d.icon, x + 2, hy + 2); var cnt = String(countLoot(bp.ref)); shadowText(cnt, x + 12 - textWidth(cnt), hy + 7, PALETTE[11]); }
          shadowText('Q', x + 1, hy + 1, PALETTE[11]);
        }
      }
      R.chat.forEach(function (c, i) { shadowText(c.t, 3, by - 7 - (R.chat.length - 1 - i) * 7, PALETTE[c.c]); });
      if (R.deadT) { ctx.fillStyle = 'rgba(120,0,0,0.25)'; ctx.fillRect(0, 0, W, H); }
    }
    function drawWorldRpg(cx, cy, p) {
      R.projectiles.forEach(function (q) {
        ctx.fillStyle = PALETTE[q.c]; ctx.fillRect(Math.round(q.x) - cx - 1, Math.round(q.y) - cy - 1, 3, 3);
        ctx.fillStyle = PALETTE[11]; ctx.fillRect(Math.round(q.x) - cx, Math.round(q.y) - cy, 1, 1);
      });
      if (p && R.swing > 0) {
        var f = face(p), sx = Math.round(p.x + f.x * 7) - cx, sy = Math.round(p.y + f.y * 7) - cy, sc = spriteCanvas(spr[R.swingSprite]);
        if (sc) { if (f.x < 0) { ctx.save(); ctx.translate(sx + 8, sy); ctx.scale(-1, 1); ctx.drawImage(sc, 0, 0); ctx.restore(); } else ctx.drawImage(sc, sx, sy); }
        else { ctx.fillStyle = PALETTE[11]; ctx.fillRect(sx + 2, sy + 2, 4, 4); }
      }
      actors.forEach(function (a) {
        if (a.dead) return;
        var px = Math.round(a.x) - cx, py = Math.round(a.y) - cy;
        if (a.m && (a.aggro || a.hp < a.mhp)) bar(px, py - 3, 8, 1, a.hp, a.mhp, 12);
        if (a === R.target) { ctx.fillStyle = PALETTE[a.m && a.m.boss ? 10 : 12]; ctx.fillRect(px + 1, py + 9, 6, 1); }
        if (a.comps.npc && a.comps.npc.quest) {
          var q = dbGet('quests', a.comps.npc.quest), s = q ? questState(q) : 'done';
          if (s === 'none') T('!', px + 3, py - 7, 10); else if (s === 'ready') T('?', px + 3, py - 7, 10); else if (s === 'active') T('?', px + 3, py - 7, 14);
        }
      });
      if (p && !R.ui) {
        var it = interactTarget(p);
        if (it) { var ix = Math.round(it.x) - cx, iy = Math.round(it.y) - cy - 9; ctx.fillStyle = PALETTE[0]; ctx.fillRect(ix + 1, iy - 1, 7, 7); T('E', ix + 3, iy, 10); }
      }
      R.floaters.forEach(function (f) {
        if (!CFG.dmg && /^[0-9]+!?$/.test(f.t)) return;
        var s = String(f.t).toUpperCase(), x = Math.round(f.x - cx - textWidth(s) / 2), y = Math.round(f.y - cy);
        drawText(ctx, s, x + 1, y + 1, PALETTE[0]); drawText(ctx, s, x, y, PALETTE[f.c]);
      });
    }

    function exec(r, n) {
      var p = n.p || {}, a = r.a, o = r.other;
      var tgt = p.target === 'other' ? o : a;
      switch (n.kind) {
        case 'Print': prints.push({ t: fmt(p.text), life: 150 }); log('[' + a.name + '] ' + fmt(p.text), 'bp'); break;
        case 'ShowMessage': big = { t: fmt(p.text), life: Math.round(num(p.seconds, 2) * 60) }; break;
        case 'SetVar': if (p.var) vars[p.var] = num(p.value); break;
        case 'AddVar': if (p.var) vars[p.var] = (vars[p.var] || 0) + num(p.amount, 1); break;
        case 'Branch': {
          var v = vars[p.var] || 0, x = num(p.value), ok;
          switch (p.op) { case '==': ok = v === x; break; case '!=': ok = v !== x; break; case '>': ok = v > x; break;
            case '<': ok = v < x; break; case '<=': ok = v <= x; break; default: ok = v >= x; }
          return { next: ok ? n.next : n.nextFalse };
        }
        case 'IfOtherAbove': {
          var st = !!(o && o.vy > 0 && o.y + 8 <= a.y + 5);
          return { next: st ? n.next : n.nextFalse };
        }
        case 'Chance': return { next: Math.random() * 100 < num(p.percent, 50) ? n.next : n.nextFalse };
        case 'MoveBy': if (tgt) { tgt.x += num(p.dx); tgt.y += num(p.dy); } break;
        case 'SetVelocity': if (tgt) {
          if (p.vx !== '' && p.vx != null) tgt.vx = num(p.vx);
          if (p.vy !== '' && p.vy != null) tgt.vy = num(p.vy);
        } break;
        case 'Jump': if (tgt && (tgt.ground || p.air)) { tgt.vy = -num(p.force, 3.5); tgt.ground = false; } break;
        case 'FlipDirection': if (tgt) tgt.dir *= -1; break;
        case 'Teleport': if (tgt) { tgt.x = num(p.x); tgt.y = num(p.y); tgt.vx = tgt.vy = 0; } break;
        case 'Destroy': if (tgt) tgt.dead = true; break;
        case 'Spawn': {
          var d = L.actors.find(function (z) { return z.name === p.actor; });
          if (d) { var s = spawnActor(d, a.x + num(p.dx) * (a.dir < 0 ? -1 : 1), a.y + num(p.dy)); s.dir = a.dir; fire(s, 'BeginPlay'); }
          else log('Spawn: no actor named "' + p.actor + '" in this level', 'warn');
        } break;
        case 'SetSprite': if (tgt && spr[p.sprite]) tgt.sprite = p.sprite; break;
        case 'PlaySound': playSound(snd[p.sound]); break;
        case 'Particles': burst(a.x + 4, a.y + 4, num(p.color, 10), num(p.count, 8)); break;
        case 'CameraShake': shake = Math.round(num(p.frames, 15)); shakeAmt = num(p.strength, 2); break;
        case 'LoadLevel': {
          var i = -1;
          if (p.level === '__next') i = levelIdx + 1;
          else if (p.level === '__restart') i = levelIdx;
          else if (p.level === '__first') i = 0;
          else i = P.levels.findIndex(function (l) { return l.id === p.level; });
          if (i >= P.levels.length) { ended = true; big = { t: fmt(p.endText || 'THE END'), life: 1e9 }; log('Game finished'); }
          else if (i >= 0) pendingLevel = i;
          else log('LoadLevel: level not found', 'warn');
        } break;
        case 'Delay': return { next: n.next, wait: Math.max(1, Math.round(num(p.seconds, 1) * 60)) };
        // ---- RPG nodes ----
        case 'ShowDialogue':
          if (R) { openDialog(fmt(p.speaker), splitLines(fmt(p.text)), null); return { next: n.next, block: true }; }
          big = { t: fmt(p.text), life: 150 }; break;
        case 'GiveLoot': if (R) giveLoot(p.loot, Math.max(1, num(p.count, 1) | 0)); break;
        case 'TakeLoot': if (R) takeLoot(p.loot, Math.max(1, num(p.count, 1) | 0)); break;
        case 'GiveGold': if (R) { R.hero.gold = Math.max(0, R.hero.gold + num(p.amount)); chat((num(p.amount) >= 0 ? '+' : '') + num(p.amount) + ' GOLD', 10); } break;
        case 'GiveExp': if (R) giveExp(num(p.amount)); break;
        case 'HealPlayer': if (R) { var hs = heroStats(), pc = num(p.percent, 100) / 100; R.hero.hp = Math.min(hs.hp, R.hero.hp + Math.round(hs.hp * pc)); R.hero.mp = Math.min(hs.mp, R.hero.mp + Math.round(hs.mp * pc)); } break;
        case 'OpenShop': if (R) { var sh = dbGet('shops', p.shop); if (sh) { openShop(sh); return { next: n.next, block: true }; } } break;
        case 'StartQuest': if (R) { var sq = dbGet('quests', p.quest); if (sq) acceptQuest(sq); } break;
        case 'CompleteQuest': if (R) { var cq = dbGet('quests', p.quest); if (cq && R.hero.quests[cq.id]) completeQuest(cq); } break;
        case 'Transfer': transfer(p.level, p.x, p.y); break;
        case 'HasLoot': return { next: (R && countLoot(p.loot) >= num(p.count, 1)) ? n.next : n.nextFalse };
        case 'QuestState': return { next: (R && questState(dbGet('quests', p.quest)) === (p.state || 'none')) ? n.next : n.nextFalse };
      }
      return { next: n.next };
    }

    function stepRunners() {
      var list = runners; runners = [];
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.block) { if (R && R.ui) { runners.push(r); continue; } r.block = false; }
        if (r.wait > 0) { r.wait--; if (r.wait > 0) { runners.push(r); continue; } }
        var steps = 0;
        while (r.id && steps++ < 128) {
          var n = r.a.nm[r.id];
          if (!n) { r.id = null; break; }
          var res = exec(r, n);
          r.id = res.next;
          if (pendingLevel !== null) return;
          if (res.wait) { r.wait = res.wait; break; }
          if (res.block) { r.block = true; break; }
        }
        if (r.id) runners.push(r);
      }
    }

    function update() {
      if (title) {
        if (Object.keys(pressed).length) {
          var cont = pressed.KeyC && DB && hasSave();
          title = false; audio();
          if (cont) loadSave();
        }
        pressed = {};
        return;
      }
      frame++;
      if (R && R.ui) {
        updateUI();
        if (big && !ended) { big.life--; if (big.life <= 0) big = null; }
        pressed = {};
        if (pendingLevel !== null) { var pl0 = pendingLevel; pendingLevel = null; loadLevel(pl0); }
        return;
      }
      if (!ended) {
        if (R) rpgUpdate();
        var live = actors.slice();
        Object.keys(pressed).forEach(function (code) {
          live.forEach(function (a) { if (!a.dead) fire(a, 'KeyPressed', null, function (n) { return n.p.key === code; }); });
        });
        live.forEach(function (a) {
          if (a.dead) return;
          fire(a, 'Tick', null, function (n) { return frame % Math.max(1, Math.round(num(n.p.every, 1))) === 0; });
          a.timers.forEach(function (tm) {
            if (tm.done) return;
            tm.t++;
            if (tm.t >= Math.max(1, num(tm.node.p.seconds, 1) * 60)) {
              tm.t = 0; if (!tm.node.p.loop) tm.done = true;
              if (tm.node.next) runners.push({ a: a, other: null, id: tm.node.next, wait: 0 });
            }
          });
        });
        actors.forEach(function (a) { if (!a.dead) physics(a); });
        var now = new Set(), al = actors.filter(function (a) { return !a.dead; });
        for (var i = 0; i < al.length; i++) for (var j = i + 1; j < al.length; j++) {
          var A = al[i], B = al[j];
          if (!overlap(A, B)) continue;
          var k = A.uid + '_' + B.uid;
          now.add(k);
          if (!overlaps.has(k)) {
            fire(A, 'Overlap', B, function (n) { return hasTag(B, n.p.tag); });
            fire(B, 'Overlap', A, function (n) { return hasTag(A, n.p.tag); });
            if (A.comps.door && isPlayer(B)) transfer(A.comps.door.level, A.comps.door.x, A.comps.door.y);
            if (B.comps.door && isPlayer(A)) transfer(B.comps.door.level, B.comps.door.x, B.comps.door.y);
          }
        }
        overlaps = now;
        stepRunners();
      }
      actors = actors.filter(function (a) { return !a.dead; });
      particles.forEach(function (q) { q.x += q.vx; q.y += q.vy; if (!q.ng) q.vy += 0.08; q.life--; });
      if (R) {
        R.floaters.forEach(function (f) { f.y -= 0.35; f.life--; });
        R.floaters = R.floaters.filter(function (f) { return f.life > 0; });
        R.chat.forEach(function (c) { c.life--; });
        R.chat = R.chat.filter(function (c) { return c.life > 0; });
      }
      particles = particles.filter(function (q) { return q.life > 0; });
      prints.forEach(function (q) { q.life--; }); prints = prints.filter(function (q) { return q.life > 0; }).slice(-6);
      if (big && !ended) { big.life--; if (big.life <= 0) big = null; }
      if (shake > 0) shake--;
      var t = camTarget();
      if (t) { var g = camGoal(t); cam.x += (g.x - cam.x) * 0.18; cam.y += (g.y - cam.y) * 0.18; }
      if (pendingLevel !== null) { var nl = pendingLevel; pendingLevel = null; loadLevel(nl); }
      pressed = {};
    }

    function shadowText(s, x, y, col, sc) { drawText(ctx, s, x + 1, y + 1, PALETTE[0], sc); drawText(ctx, s, x, y, col, sc); }

    function render() {
      ctx.fillStyle = PALETTE[L ? L.bg : 0]; ctx.fillRect(0, 0, W, H);
      if (title) {
        var nm = String(P.name || 'GAME').toUpperCase(), sc = textWidth(nm, 2) < W - 16 ? 2 : 1;
        shadowText(nm, ((W - textWidth(nm, sc)) / 2) | 0, 50, PALETTE[10], sc);
        var tl = DB && hasSave() ? 'ENTER: NEW GAME    C: CONTINUE' : 'PRESS ANY KEY';
        if ((Date.now() / 500 | 0) % 2) shadowText(tl, ((W - textWidth(tl)) / 2) | 0, 84, PALETTE[11]);
        drawText(ctx, 'MADE WITH BITFORGE 8', ((W - textWidth('MADE WITH BITFORGE 8')) / 2) | 0, 130, PALETTE[1]);
        return;
      }
      var cx = Math.round(cam.x), cy = Math.round(cam.y);
      if (shake > 0) { cx += Math.round((Math.random() * 2 - 1) * shakeAmt); cy += Math.round((Math.random() * 2 - 1) * shakeAmt); }
      var x0 = Math.max(0, Math.floor(cx / TS)), y0 = Math.max(0, Math.floor(cy / TS));
      for (var ty = y0; ty < Math.min(L.h, y0 + H / TS + 2); ty++) for (var tx = x0; tx < Math.min(L.w, x0 + W / TS + 2); tx++) {
        var id = L.tiles[ty * L.w + tx];
        if (id && spr[id]) ctx.drawImage(spriteCanvas(spr[id]), tx * TS - cx, ty * TS - cy);
      }
      var rp = R ? player() : null;
      actors.forEach(function (a) {
        var c = spriteCanvas(spr[a.sprite]); if (!c) return;
        if (a === rp && R.iframes > 0 && frame % 4 < 2) return;
        if (a.flash > 0 && frame % 4 < 2) return;
        var px = Math.round(a.x) - cx, py = Math.round(a.y) - cy;
        if (a.lootRef) py += Math.round(Math.sin(frame / 10 + a.bob) * 1.5);
        if (a.dir < 0) { ctx.save(); ctx.translate(px + TS, py); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); }
        else ctx.drawImage(c, px, py);
      });
      particles.forEach(function (q) { ctx.fillStyle = q.c; ctx.fillRect(Math.round(q.x) - cx, Math.round(q.y) - cy, 1, 1); });
      if (R) drawWorldRpg(cx, cy, rp);
      if (R && rp) drawHud(rp); else if (P.hud) shadowText(fmt(P.hud), 3, 3, PALETTE[11]);
      prints.forEach(function (q, i) { shadowText(q.t, 3, (R && rp ? 26 : 12) + i * 7, PALETTE[4]); });
      if (R && R.stack.length) drawUI();
      if (big) {
        var lines = big.t.split('\n'), longest = Math.max.apply(null, lines.map(function (l) { return l.length; }));
        var s2 = longest * 8 <= W - 24 ? 2 : 1, bh = lines.length * 6 * s2 + 10, bw = textWidth('x'.repeat(longest), s2) + 16;
        var bx = ((W - bw) / 2) | 0, by = ((H - bh) / 2) | 0;
        ctx.fillStyle = PALETTE[0]; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = PALETTE[11]; ctx.fillRect(bx, by, bw, 1); ctx.fillRect(bx, by + bh - 1, bw, 1); ctx.fillRect(bx, by, 1, bh); ctx.fillRect(bx + bw - 1, by, 1, bh);
        lines.forEach(function (l, i) { drawText(ctx, l, ((W - textWidth(l, s2)) / 2) | 0, by + 5 + i * 6 * s2, PALETTE[10], s2); });
      }
    }

    function loop(t) {
      if (!running) return;
      if (!last) last = t;
      acc += Math.min(100, t - last); last = t;
      while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
      render();
      raf = requestAnimationFrame(loop);
    }

    var GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
    function kd(e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (GAME_KEYS.indexOf(e.code) >= 0) e.preventDefault();
      if (!keys[e.code]) pressed[e.code] = true;
      keys[e.code] = true;
    }
    function ku(e) { keys[e.code] = false; }
    function bl() { keys = {}; }
    global.addEventListener('keydown', kd);
    global.addEventListener('keyup', ku);
    global.addEventListener('blur', bl);

    resetVars();
    var start = typeof opts.startLevel === 'number' ? opts.startLevel : Math.max(0, P.levels.findIndex(function (l) { return l.id === (P.settings || {}).startLevel; }));
    var startIdx = Math.min(start, P.levels.length - 1);
    loadLevel(startIdx);
    raf = requestAnimationFrame(loop);

    return {
      stop: function () {
        running = false; cancelAnimationFrame(raf);
        global.removeEventListener('keydown', kd); global.removeEventListener('keyup', ku); global.removeEventListener('blur', bl);
      },
      debug: function () { return { vars: vars, level: L && L.name, actors: actors, ended: ended, frame: frame, rpg: R }; }
    };
  }

  global.PixelRuntime = { PALETTE: PALETTE, PALETTE_NAMES: PALETTE_NAMES, W: W, H: H, TS: TS, drawText: drawText, spriteCanvas: spriteCanvas, playSound: playSound, create: create };
}
BitForgeRuntime(window);
