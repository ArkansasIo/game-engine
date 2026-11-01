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

Two exported sample games are in `examples/`, built with **Package Game**:

- `crystal-quest.html`: the action RPG (town, forest, cave and boss)
- `hero-of-bits.html`: a two-level platformer

### VS Code

Open this folder in VS Code and press **F5** to launch the engine in Chrome or Edge
(the configurations are in `.vscode/launch.json`). You can also install the recommended
**Live Server** extension and choose *Open with Live Server* on `index.html`.

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
- **In-game menus:** see below.
- **Save and Continue:** the game saves in the browser, and packaged games show *Continue* on the title screen.
- **MMO-style HUD:** HP/MP/EXP bars, gold, quest tracker, hotbar with cooldown overlays and a combat chat log.

### In-game menus and sub-menus

Every window sits on a stack, so menus nest like in classic RPGs, for example
Command → Item → Potion → Use / Info / Discard → "Discard Potion? Yes / No".
X always goes back one level.

| Key | Menu | Style |
| --- | --- | --- |
| Enter | **Command window**: Talk, Spell, Status, Item, Equip, Search, Quests, Map, Save, System, with a mini status window | Dragon Warrior |
| I / B | **Backpack**: 8×4 slot grid with rarity borders, stack counts, and a context menu (Use, Equip, Info, Discard) | WoW / MU |
| C | **Character**: paper doll with 5 gear slots, attributes with gear bonuses in green, crit and speed | WoW |
| K | **Spellbook**: cast or bind skills to keys 1–4 | WoW |
| L | **Quest log**: quest list plus a detail pane with objective progress and rewards | WoW |
| M | **World map**: whole level with markers for you, NPCs, monsters, chests and exits | WoW / MU |
| Esc | **Game menu**: Resume, Settings, Controls, Save, Load, Quit | All |

- **Tooltips:** item name in its rarity color, type, stats, an "if equipped" comparison
  (green or red), use effect, flavor text and sell price.
- **Dialogue:** typewriter text with a page arrow and **YES/NO** choices; quest givers ask
  "Will you accept this quest?".
- **Shops:** Buy/Sell tabs (left/right), then a *How many?* sub-menu, then confirmation.
- **Settings:** sound volume, text speed, window style (*Dragon* black/white, *Royal* blue,
  *Stone* gold/MU), damage numbers on or off, and minimap on or off. Settings are saved.
- **HUD:** player frame with portrait, a target frame (gold border for bosses), a minimap, a quest
  tracker, HP/MP orbs, an EXP bar, an action bar (1–4 plus a Q potion slot) and a chat log.

| Action | Keys |
| --- | --- |
| Move | Arrows / WASD |
| Attack | Z or Space |
| Skills | 1 2 3 4 |
| Quick potion | Q |
| Talk / open / shop | E |
| Confirm / back | Z / X |

During a play test in the editor, **Esc** opens the game menu and **Shift+Esc**
(or *Game menu → Exit play test*) stops the play test.

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
