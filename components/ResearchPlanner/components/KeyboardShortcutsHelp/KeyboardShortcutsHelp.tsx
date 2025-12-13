import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { KEYBOARD_SHORTCUTS, getModifierKeyDisplay } from '../../hooks/useKeyboardShortcuts';

interface ShortcutItem {
  key: string;
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

export function KeyboardShortcutsHelp() {
  const modifierKey = getModifierKeyDisplay();

  // Build shortcuts array from the constants
  const categories: ShortcutCategory[] = [
    {
      title: 'Node Operations',
      shortcuts: Object.values(KEYBOARD_SHORTCUTS.NODE_OPERATIONS).map(s => ({
        key: s.key,
        description: s.description
      }))
    },
    {
      title: 'Edge Operations',
      shortcuts: Object.values(KEYBOARD_SHORTCUTS.EDGE_OPERATIONS).map(s => ({
        key: s.key,
        description: s.description
      }))
    },
    {
      title: 'Selection',
      shortcuts: Object.values(KEYBOARD_SHORTCUTS.SELECTION).map(s => ({
        key: s.key.replace('Ctrl', modifierKey),
        description: s.description
      }))
    },
    {
      title: 'View Controls',
      shortcuts: Object.values(KEYBOARD_SHORTCUTS.VIEW).map(s => ({
        key: s.key,
        description: s.description
      }))
    },
    {
      title: 'Timeline',
      shortcuts: Object.values(KEYBOARD_SHORTCUTS.TIMELINE).map(s => ({
        key: s.key,
        description: s.description
      }))
    },
    {
      title: 'File Operations',
      shortcuts: Object.values(KEYBOARD_SHORTCUTS.FILE).map(s => ({
        key: s.key.replace('Ctrl', modifierKey),
        description: s.description
      }))
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Keyboard Shortcuts (?)">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick reference for all available keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {categories.map((category, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="font-semibold text-sm text-slate-900">{category.title}</h3>
              <div className="space-y-1">
                {category.shortcuts.map((shortcut, shortcutIdx) => (
                  <div
                    key={shortcutIdx}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50"
                  >
                    <span className="text-sm text-slate-600">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Additional mouse shortcuts */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="font-semibold text-sm text-slate-900">Mouse Shortcuts</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50">
                <span className="text-sm text-slate-600">Create edge from node</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded">
                  Alt + Click
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50">
                <span className="text-sm text-slate-600">Multi-select nodes</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded">
                  {modifierKey} + Click
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50">
                <span className="text-sm text-slate-600">Select multiple nodes</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded">
                  {modifierKey} + Drag
                </kbd>
              </div>
              <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50">
                <span className="text-sm text-slate-600">Create node at position</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded">
                  Double Click
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
