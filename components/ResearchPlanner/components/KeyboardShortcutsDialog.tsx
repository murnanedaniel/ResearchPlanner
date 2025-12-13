'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutItem[];
}

const KEYBOARD_SHORTCUTS: ShortcutCategory[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Mouse Drag'], description: 'Pan the canvas' },
      { keys: ['Scroll'], description: 'Zoom in/out' },
      { keys: ['Zoom In Button'], description: 'Zoom in' },
      { keys: ['Zoom Out Button'], description: 'Zoom out' },
      { keys: ['Reset Button'], description: 'Reset view' },
    ],
  },
  {
    title: 'Node Operations',
    shortcuts: [
      { keys: ['Double Click'], description: 'Create node at cursor' },
      { keys: ['Enter'], description: 'Add node from toolbar' },
      { keys: ['Delete'], description: 'Delete selected node(s)' },
      { keys: ['Click'], description: 'Select node' },
      { keys: ['Ctrl', 'Click'], description: 'Multi-select nodes' },
      { keys: ['Ctrl', 'Drag'], description: 'Multi-select area' },
      { keys: ['Esc'], description: 'Collapse selected node / Clear selection' },
    ],
  },
  {
    title: 'Edge Operations',
    shortcuts: [
      { keys: ['Alt', 'Click'], description: 'Start creating edge from node' },
      { keys: ['Esc'], description: 'Cancel edge creation' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['Timeline Toggle'], description: 'Enable/disable timeline view' },
      { keys: ['Expand Button'], description: 'Expand/collapse subgraph' },
    ],
  },
  {
    title: 'File Operations',
    shortcuts: [
      { keys: ['Save Button'], description: 'Export graph to file' },
      { keys: ['Load Button'], description: 'Import graph from file' },
    ],
  },
];

const KeyboardKey: React.FC<{ shortcut: string }> = ({ shortcut }) => (
  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-md shadow-sm">
    {shortcut}
  </kbd>
);

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick reference for all available shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {KEYBOARD_SHORTCUTS.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-sm text-gray-700">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-gray-400 mx-1">+</span>
                          )}
                          <KeyboardKey shortcut={key} />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
