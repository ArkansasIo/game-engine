# BitForge 8: 8-bit RPG engine

A retro 8-bit game engine with an editor laid out like a modern AAA engine
(Unreal-style Viewport, Outliner, Details panel, Content Drawer, node-based
Blueprints, Play-In-Editor) and an RPG Maker-style **Database** for heroes,
classes, skills, items, weapons, armor, monsters, shops and quests.

It is a single, dependency-free HTML file. No build step, no install.

## Run it

Double-click `index.html` (or open it in Chrome, Edge or Firefox).
Press **▶ Play** (Alt+P) to play the bundled RPG *Crystal Quest*, and **Esc** to stop.
Press **F9** (or 🗃 Database) to open the Database.

`examples/crystal-quest.html` is the sample game exported with **Package Game**.

## Engine specs

| | |
| --- | --- |
| Resolution | 256 × 144, pixel-perfect scaling |
| Sprites / tiles | 8 × 8 pixels, 16-color palette |
| Audio | Chiptune SFX synth (square, triangle, sawtooth, noise) |
| Frame rate | Fixed 60 Hz update |
| Game styles | Action RPG (real-time, MMO-style), platformer, top-down |
| Post-process | Optional CRT scanline filter |

## RPG features

- **Heroes and classes:** base stats plus per-level growth (HP, MP, ATK, DEF, MAG, AGI),
  an EXP curve, level-ups, and skills learned at set levels. The editor previews each class's stat curve.
- **Real-time combat:** weapon swings, critical hits, knockback, invincibility frames,
  floating damage numbers, and a death/respawn penalty.
- **Skills:** melee strikes, projectiles, area bursts and heals, with MP cost and cooldowns,
  bound to a 4-slot hotbar (keys 1–4).
- **Items, weapons and armor:** consumables, materials, key items, and five equipment slots
  (weapon, shield, head, body, accessory) with stat bonuses and rarity colors
  (common → legendary).
- **Monsters:** melee chasers, ranged shooters and passive monsters, with aggro range, leashing, wandering,
  respawn timers, loot tables, HP bars and boss health bars.
- **NPCs:** paged dialogue boxes, shopkeepers (buy/sell), and quest givers showing `!` / `?` markers.
- **Quests:** defeat-X or collect-X objectives with EXP, gold and item rewards, plus an on-screen tracker.
- **Treasure chests, doors/warps between maps, and a healing well (made with Blueprints).**
- **In-game menu (I):** Status, Items, Equip, Skills (hotbar assignment), Quests and Save.
- **Save and Continue:** the game saves in the browser, and packaged games show *Continue* on the title screen.
- **MMO-style HUD:** HP/MP/EXP bars, gold, quest tracker, hotbar with cooldown overlays and a combat chat log.

### In-game controls (RPG)

| Action | Keys |
| --- | --- |
| Move | Arrows / WASD |
| Attack | Z or Space |
| Skills | 1 2 3 4 |
| Quick potion | Q |
| Talk / open / shop | E |
| Menu | I or Enter (X to go back) |

## Editor tour

- **Database (F9):** the RPG Maker equivalent. Categories are Heroes, Classes, Skills, Items, Weapons,
  Armor, Monsters, Shops, Quests and System (starting gold and system sounds). Every entry has an
  icon or sprite and a full set of editable fields, including loot tables, learn lists and shop inventories.
- **Viewport:** paint tiles (B), erase (E), and select or move actors (Q). Zoom with the wheel; pan with right-drag.
- **Place Actors:**
  - *RPG:* Hero, Monster, NPC, Shopkeeper, Quest Giver, Treasure Chest, Door/Warp
  - *Platformer:* Player, Top-Down Player, Stompable Enemy, Pickup, Goal, Empty Actor
- **Details:** an actor's components. *RPG Hero*, *Monster*, *NPC / Dialogue*, *Treasure Chest* and
  *Door / Transfer* link to Database entries; *Edit in Database* jumps straight to the linked entry.
  Physics, Platformer, Top-Down and Patrol AI are also available.
- **Blueprints:** visual scripting. Besides the general events and actions, the RPG nodes are:
  - Events: Interact, Monster Death
  - Conditions: Has Item?, Quest State?
  - Actions: Show Dialogue, Give/Take Item, Give Gold, Give EXP, Heal Player, Open Shop, Start/Complete Quest, Transfer Player
- **Sprite Editor, Sound Editor, Output Log** and **Package Game** (exports a standalone `.html`).

## Sample game: *Crystal Quest*

Oakvale Town → Whispering Forest → Crystal Cave.

1. Talk to Elder Rowan, who gives the quest *Slime Trouble*.
2. Defeat 5 slimes in the forest and return for the **Old Key**.
3. Use the key to open the sealed cave and defeat the **Crystal Golem** boss.

Guard Brann's side quest *Bone Collector* rewards an Iron Sword. The merchant sells gear,
and the well heals you.

## Note on "MMORPG"

The combat, HUD, loot and progression follow MMORPG conventions, but the game is
single-player. Real online multiplayer, with shared worlds and other players, needs a game
server, which is not part of this engine yet.
