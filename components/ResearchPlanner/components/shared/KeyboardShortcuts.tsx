'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Detect platform for appropriate modifier key display
const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modifierKey = isMac ? 'Cmd' : 'Ctrl';

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open shortcuts dialog with ? key
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Check if we're not in an input field
        const activeElement = document.activeElement;
        const isEditingText = 
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          activeElement?.closest('.mdxeditor-root') !== null ||
          activeElement?.closest('[contenteditable="true"]') !== null;
        
        if (!isEditingText) {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-10"
        title="Keyboard shortcuts"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Quick reference for keyboard shortcuts and interactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Section title="Node Operations">
              <Shortcut keys={["Double-click canvas"]} description="Create new node at cursor position" />
              <Shortcut keys={["Double-click node"]} description="Edit node details" />
              <Shortcut keys={["Click node"]} description="Select node" />
              <Shortcut keys={["Drag node"]} description="Move node" />
              <Shortcut keys={["Right-click node"]} description="Open context menu" />
              <Shortcut keys={["Del"]} description="Delete selected node(s)" />
              <Shortcut keys={["Esc"]} description="Collapse selected node / Clear selection" />
            </Section>

            <Section title="Multi-Selection">
              <Shortcut keys={[modifierKey, "Click"]} description="Toggle node selection" />
              <Shortcut keys={[modifierKey, "Drag"]} description="Box select multiple nodes" />
              <Shortcut keys={["Drag selected"]} description="Move all selected nodes" />
            </Section>

            <Section title="Edge Operations">
              <Shortcut keys={["Alt", "Click node"]} description="Start edge creation" />
              <Shortcut keys={["Click node"]} description="(While creating) Complete edge" />
              <Shortcut keys={["Esc"]} description="(While creating) Cancel edge creation" />
              <Shortcut keys={["Click edge"]} description="Select edge for editing" />
              <Shortcut keys={["Hover edge", "Click X"]} description="Delete edge" />
            </Section>

            <Section title="Navigation">
              <Shortcut keys={["Drag canvas"]} description="Pan view" />
              <Shortcut keys={["Mouse wheel"]} description="Zoom in/out" />
              <Shortcut keys={[modifierKey, "Drag canvas"]} description="Box select (no pan)" />
            </Section>

            <Section title="Special Features">
              <Shortcut keys={[modifierKey, "Drag onto node"]} description="Make dragged node a child" />
              <Shortcut keys={["?"]} description="Show this help dialog" />
            </Section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-sm mb-3 text-slate-700">{title}</h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function Shortcut({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="flex gap-1 flex-wrap">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono whitespace-nowrap">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="text-slate-400">+</span>}
          </React.Fragment>
        ))}
      </div>
      <p className="text-slate-600 flex-1 text-right">{description}</p>
    </div>
  );
}
