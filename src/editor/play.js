/* BitForge 8 editor: Play In Editor */
'use strict';
// ---------------------------------------------------------------- play in editor
function fitPie() {
  const host = $('#page-viewport').getBoundingClientRect();
  const sc = Math.max(1, Math.floor(Math.min((host.width - 20) / RT.W, (host.height - 50) / RT.H)));
  const c = $('#pie-screen canvas'); if (c) { c.style.width = RT.W * sc + 'px'; c.style.height = RT.H * sc + 'px'; }
}
function play() {
  if (S.playing) return;
  openTab('viewport');
  const scr = $('#pie-screen'); scr.innerHTML = '';
  scr.classList.toggle('crt', !!proj.settings.crt);
  const c = h('canvas'); scr.append(c);
  $('#pie').classList.add('on');
  S.playing = true; fitPie();
  logMsg('▶ Play In Editor started from "' + curLevel().name + '"');
  try {
    S.runtime = RT.create(c, proj, { startLevel: S.levelIdx, onLog: (m, cls) => logMsg(m, cls), onExit: () => setTimeout(stop, 0) });
  } catch (err) { logMsg('Runtime error: ' + err.message, 'err'); stop(); return; }
  $('#btn-play').disabled = true; $('#btn-stop').disabled = false;
  document.activeElement && document.activeElement.blur();
}
function stop() {
  if (!S.playing) return;
  if (S.runtime) S.runtime.stop();
  S.runtime = null; S.playing = false;
  $('#pie').classList.remove('on'); $('#pie-screen').innerHTML = '';
  $('#btn-play').disabled = false; $('#btn-stop').disabled = true;
  logMsg('■ Play session ended');
}
