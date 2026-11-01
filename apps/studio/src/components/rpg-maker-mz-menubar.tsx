import { Database, FolderOpen, Grid3X3, Image, Maximize2, Play, Redo2, Save, Undo2, Upload } from 'lucide-react';
import {
  Menubar,
  MenubarContent,
  MenubarCheckboxItem,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import type { EditorMode } from '@/components/studio-sidebar';
import type { StudioInterface } from '@/lib/studio-interface';

export function RpgMakerMzMenubar({ title, hasProject, canExport, mode, canUndo, canRedo, gridVisible, dimInactiveLayers, studioInterface, onNewProject, onOpenProject, onSaveDraft, onExportProject, onRevertProject, onCloseProject, onChangeMode, onUndo, onRedo, onToggleGrid, onToggleDimInactiveLayers, onFitMap, onOpenMapSettings, onOpenAssets, onOpenDatabase, onPlay, onChangeStudioInterface }: {
  title?: string;
  hasProject: boolean;
  canExport: boolean;
  mode: EditorMode;
  canUndo: boolean;
  canRedo: boolean;
  gridVisible: boolean;
  dimInactiveLayers: boolean;
  studioInterface: StudioInterface;
  onNewProject: () => void;
  onOpenProject: () => void;
  onSaveDraft: () => void;
  onExportProject: () => void;
  onRevertProject: () => void;
  onCloseProject: () => void;
  onChangeMode: (mode: EditorMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleGrid: () => void;
  onToggleDimInactiveLayers: () => void;
  onFitMap: () => void;
  onOpenMapSettings: () => void;
  onOpenAssets: () => void;
  onOpenDatabase: () => void;
  onPlay: () => void;
  onChangeStudioInterface: (value: StudioInterface) => void;
}) {
  return <header className="shrink-0 bg-card text-card-foreground" data-slot="rpg-maker-mz-menubar">
    <div className="flex h-8 items-center border-b px-1">
      <Menubar className="h-7 flex-1 rounded-none border-0 bg-transparent p-0">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent sideOffset={3}>
            <MenubarItem onClick={onNewProject}>New Project…</MenubarItem>
            <MenubarItem onClick={onOpenProject}><FolderOpen />Open…<MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
            <MenubarItem disabled={!hasProject} onClick={onSaveDraft}><Save />Save Draft<MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
            <MenubarItem disabled={!canExport} onClick={onExportProject}><Upload />Export…<MenubarShortcut>⇧⌘E</MenubarShortcut></MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled={!hasProject} onClick={onRevertProject}>Revert to Source</MenubarItem>
            <MenubarItem disabled={!hasProject} onClick={onCloseProject}>Close Project</MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Interface</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup value={studioInterface} onValueChange={value => onChangeStudioInterface(value as StudioInterface)}>
                  <MenubarRadioItem value="modern">Modern</MenubarRadioItem>
                  <MenubarRadioItem value="rpgMakerMz">RPG Maker MZ</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent sideOffset={3}>
            <MenubarItem disabled={!canUndo} onClick={onUndo}><Undo2 />Undo<MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
            <MenubarItem disabled={!canRedo} onClick={onRedo}><Redo2 />Redo<MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Mode</MenubarTrigger>
          <MenubarContent sideOffset={3}>
            <MenubarRadioGroup value={mode} onValueChange={value => onChangeMode(value as EditorMode)}>
              <MenubarRadioItem value="drawing">Map</MenubarRadioItem>
              <MenubarRadioItem value="events">Event</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent sideOffset={3}>
            <MenubarCheckboxItem checked={gridVisible} onCheckedChange={onToggleGrid}><Grid3X3 />Show Grid</MenubarCheckboxItem>
            <MenubarCheckboxItem checked={dimInactiveLayers} onCheckedChange={onToggleDimInactiveLayers}>Dim Inactive Layers</MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem disabled={!hasProject} onClick={onFitMap}><Maximize2 />Fit Map</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Tools</MenubarTrigger>
          <MenubarContent sideOffset={3}>
            <MenubarItem disabled={!hasProject} onClick={onOpenMapSettings}>Map Settings…</MenubarItem>
            <MenubarSeparator />
            <MenubarItem disabled={!hasProject} onClick={onOpenAssets}><Image />Resource Manager…</MenubarItem>
            <MenubarItem disabled={!hasProject} onClick={onOpenDatabase}><Database />Database…</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Game</MenubarTrigger>
          <MenubarContent sideOffset={3}>
            <MenubarItem disabled={!canExport} onClick={onPlay}><Play />Playtest</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent sideOffset={3}><MenubarItem disabled>About RPG Crafter</MenubarItem></MenubarContent>
        </MenubarMenu>
      </Menubar>
      <span className="max-w-[40%] truncate px-2 text-[11px] text-muted-foreground">{title ? `${title} — RPG Crafter` : 'RPG Crafter'}</span>
    </div>
  </header>;
}
