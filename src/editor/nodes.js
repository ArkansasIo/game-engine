/* BitForge 8 editor: Blueprint node definitions */
'use strict';
// ---------------------------------------------------------------- node defs
const KEYS = [['Space', 'Space'], ['KeyZ', 'Z'], ['KeyX', 'X'], ['KeyC', 'C'], ['KeyE', 'E'], ['KeyQ', 'Q'], ['KeyR', 'R'], ['Enter', 'Enter'], ['ShiftLeft', 'Shift'],
  ['ArrowUp', 'Up'], ['ArrowDown', 'Down'], ['ArrowLeft', 'Left'], ['ArrowRight', 'Right']];
const TARGET = ['target', 'target', 'Target', 'self'];
const NODE_DEFS = {
  BeginPlay: { cat: 'event', title: 'Event BeginPlay', params: [], help: 'Runs once when the actor spawns.' },
  Tick: { cat: 'event', title: 'Event Tick', params: [['every', 'num', 'Every N frames', 1]], help: 'Runs every N frames (60 = once per second).' },
  KeyPressed: { cat: 'event', title: 'Event Key Pressed', params: [['key', 'key', 'Key', 'KeyX']] },
  Overlap: { cat: 'event', title: 'Event Overlap', params: [['tag', 'text', 'Other has tag', 'player']], help: 'Fires when another actor starts touching this one. "Other" refers to it.' },
  Timer: { cat: 'event', title: 'Event Timer', params: [['seconds', 'num', 'Seconds', 1], ['loop', 'bool', 'Loop', true]] },
  FellOutOfWorld: { cat: 'event', title: 'Event Fell Out Of World', params: [] },
  Branch: { cat: 'flow', title: 'Branch', params: [['var', 'text', 'Variable', 'score'], ['op', 'sel', 'Compare', '>=', ['==', '!=', '>', '>=', '<', '<=']], ['value', 'num', 'Value', 0]], outs: ['True', 'False'] },
  IfOtherAbove: { cat: 'flow', title: 'Is Other Stomping?', params: [], outs: ['Stomp', 'Else'], help: 'True if Other is falling onto the top of this actor.' },
  Chance: { cat: 'flow', title: 'Random Chance', params: [['percent', 'num', 'Percent', 50]], outs: ['Yes', 'No'] },
  Delay: { cat: 'flow', title: 'Delay', params: [['seconds', 'num', 'Seconds', 1]] },
  Print: { cat: 'action', title: 'Print String', params: [['text', 'text', 'Text', 'Hello {score}']] },
  ShowMessage: { cat: 'action', title: 'Show Message', params: [['text', 'text', 'Text', 'HELLO!'], ['seconds', 'num', 'Seconds', 2]] },
  SetVar: { cat: 'action', title: 'Set Variable', params: [['var', 'text', 'Variable', 'score'], ['value', 'num', 'Value', 0]] },
  AddVar: { cat: 'action', title: 'Add To Variable', params: [['var', 'text', 'Variable', 'score'], ['amount', 'num', 'Amount', 1]] },
  MoveBy: { cat: 'action', title: 'Move By', params: [TARGET, ['dx', 'num', 'dX', 0], ['dy', 'num', 'dY', 0]] },
  SetVelocity: { cat: 'action', title: 'Set Velocity', params: [TARGET, ['vx', 'num', 'vX (blank=keep)', ''], ['vy', 'num', 'vY (blank=keep)', -3]] },
  Jump: { cat: 'action', title: 'Jump', params: [TARGET, ['force', 'num', 'Force', 3.5], ['air', 'bool', 'Allow in air', false]] },
  FlipDirection: { cat: 'action', title: 'Flip Direction', params: [TARGET] },
  Teleport: { cat: 'action', title: 'Teleport', params: [TARGET, ['x', 'num', 'X', 0], ['y', 'num', 'Y', 0]] },
  Destroy: { cat: 'action', title: 'Destroy Actor', params: [TARGET] },
  Spawn: { cat: 'action', title: 'Spawn Actor', params: [['actor', 'actor', 'Actor', ''], ['dx', 'num', 'Offset X', 8], ['dy', 'num', 'Offset Y', 0]], help: 'Copies an actor (often a Template) from this level.' },
  SetSprite: { cat: 'action', title: 'Set Sprite', params: [TARGET, ['sprite', 'sprite', 'Sprite', '']] },
  PlaySound: { cat: 'action', title: 'Play Sound', params: [['sound', 'sound', 'Sound', '']] },
  Particles: { cat: 'action', title: 'Spawn Particles', params: [['color', 'color', 'Color', 10], ['count', 'num', 'Count', 8]] },
  CameraShake: { cat: 'action', title: 'Camera Shake', params: [['strength', 'num', 'Strength', 2], ['frames', 'num', 'Frames', 15]] },
  LoadLevel: { cat: 'action', title: 'Open Level', params: [['level', 'level', 'Level', '__next'], ['endText', 'text', 'If no next level', 'YOU WIN!\\nSCORE {score}']] },
  // ---- RPG ----
  Interact: { cat: 'event', title: 'Event Interact (RPG)', params: [], help: 'The player pressed E next to this actor.' },
  Death: { cat: 'event', title: 'Event Monster Death (RPG)', params: [], help: 'This monster was defeated. "Other" is the player.' },
  HasLoot: { cat: 'flow', title: 'Has Item?', params: [['loot', 'loot', 'Item', ''], ['count', 'num', 'At least', 1]], outs: ['Yes', 'No'] },
  QuestState: { cat: 'flow', title: 'Quest State?', params: [['quest', 'ref:quests', 'Quest', ''], ['state', 'sel', 'Is', 'done', ['none', 'active', 'ready', 'done']]], outs: ['Yes', 'No'] },
  ShowDialogue: { cat: 'action', title: 'Show Dialogue', params: [['speaker', 'text', 'Speaker', 'NPC'], ['text', 'text', 'Text (\\n = page)', 'Hello, traveler!']], help: 'RPG message box. Waits until the player closes it.' },
  GiveLoot: { cat: 'action', title: 'Give Item', params: [['loot', 'loot', 'Item', ''], ['count', 'num', 'Count', 1]] },
  TakeLoot: { cat: 'action', title: 'Take Item', params: [['loot', 'loot', 'Item', ''], ['count', 'num', 'Count', 1]] },
  GiveGold: { cat: 'action', title: 'Give Gold', params: [['amount', 'num', 'Amount', 50]] },
  GiveExp: { cat: 'action', title: 'Give EXP', params: [['amount', 'num', 'Amount', 50]] },
  HealPlayer: { cat: 'action', title: 'Heal Player', params: [['percent', 'num', 'Percent', 100]] },
  OpenShop: { cat: 'action', title: 'Open Shop', params: [['shop', 'ref:shops', 'Shop', '']] },
  StartQuest: { cat: 'action', title: 'Start Quest', params: [['quest', 'ref:quests', 'Quest', '']] },
  CompleteQuest: { cat: 'action', title: 'Complete Quest', params: [['quest', 'ref:quests', 'Quest', '']] },
  Transfer: { cat: 'action', title: 'Transfer Player', params: [['level', 'levelid', 'Level', ''], ['x', 'num', 'Tile X', 1], ['y', 'num', 'Tile Y', 1]], help: 'Move the player to a tile on any level.' }
};
function newNode(kind, x, y, over) {
  const def = NODE_DEFS[kind], p = {};
  def.params.forEach(([k, , , d]) => p[k] = d);
  return { id: uid('n'), kind, x, y, p: Object.assign(p, over || {}), next: null, nextFalse: null };
}
