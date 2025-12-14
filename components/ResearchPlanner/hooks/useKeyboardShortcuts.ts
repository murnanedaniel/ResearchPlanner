import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutHandlers {
  // Node operations
  onCreateNode?: () => void;
  onMarkObsolete?: () => void;
  onDeleteSelected?: () => void;
  onExpandCollapse?: () => void;
  
  // Edge operations
  onToggleEdgeCreation?: () => void;
  
  // Selection operations
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  
  // View operations
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  
  // Timeline operations
  onToggleTimeline?: () => void;
  
  // File operations
  onSave?: () => void;
  onLoad?: () => void;
  onExport?: () => void;
}

export interface UseKeyboardShortcutsOptions {
  handlers: KeyboardShortcutHandlers;
  enabled?: boolean;
}

/**
 * Custom hook to manage keyboard shortcuts for the application
 * Provides a centralized way to handle all keyboard shortcuts
 */
export function useKeyboardShortcuts({
  handlers,
  enabled = true
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Check if we're currently editing text
    const activeElement = document.activeElement;
    const isEditingText = 
      activeElement?.closest('.mdxeditor-root') !== null ||
      activeElement?.closest('[contenteditable="true"]') !== null ||
      activeElement?.closest('.prose') !== null ||
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA';

    // File operations (Ctrl/Cmd + key)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          handlers.onSave?.();
          return;
        case 'o':
          if (!isEditingText) {
            e.preventDefault();
            handlers.onLoad?.();
          }
          return;
        case 'e':
          e.preventDefault();
          handlers.onExport?.();
          return;
        case 'a':
          if (!isEditingText) {
            e.preventDefault();
            handlers.onSelectAll?.();
          }
          return;
      }
    }

    // Skip other shortcuts if editing text
    if (isEditingText) return;

    // Single key shortcuts
    switch (e.key.toLowerCase()) {
      case 'n':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onCreateNode?.();
        }
        break;
      case 'e':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onToggleEdgeCreation?.();
        }
        break;
      case 'o':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onMarkObsolete?.();
        }
        break;
      case 't':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onToggleTimeline?.();
        }
        break;
      case ' ':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onExpandCollapse?.();
        }
        break;
      case 'delete':
      case 'backspace':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onDeleteSelected?.();
        }
        break;
      case 'escape':
        handlers.onClearSelection?.();
        break;
      case '+':
      case '=':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onZoomIn?.();
        }
        break;
      case '-':
      case '_':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onZoomOut?.();
        }
        break;
      case '0':
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          handlers.onResetZoom?.();
        }
        break;
    }
  }, [enabled, handlers]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Get the display name for keyboard shortcuts based on platform
 */
export function getModifierKeyDisplay(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  
  // Check userAgent as a fallback for platform detection
  const userAgent = navigator.userAgent.toLowerCase();
  const isMac = userAgent.indexOf('mac') >= 0;
  
  return isMac ? '⌘' : 'Ctrl';
}

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = {
  NODE_OPERATIONS: {
    CREATE_NODE: { key: 'N', description: 'Create new node' },
    MARK_OBSOLETE: { key: 'O', description: 'Mark selected node as obsolete' },
    DELETE: { key: 'Delete', description: 'Delete selected nodes' },
    EXPAND_COLLAPSE: { key: 'Space', description: 'Expand/collapse selected node' },
  },
  EDGE_OPERATIONS: {
    TOGGLE_EDGE_MODE: { key: 'E', description: 'Toggle edge creation mode' },
  },
  SELECTION: {
    SELECT_ALL: { key: 'Ctrl+A', description: 'Select all nodes' },
    CLEAR_SELECTION: { key: 'Escape', description: 'Clear selection and collapse nodes' },
  },
  VIEW: {
    ZOOM_IN: { key: '+', description: 'Zoom in' },
    ZOOM_OUT: { key: '-', description: 'Zoom out' },
    RESET_ZOOM: { key: '0', description: 'Reset zoom' },
  },
  TIMELINE: {
    TOGGLE_TIMELINE: { key: 'T', description: 'Toggle timeline view' },
  },
  FILE: {
    SAVE: { key: 'Ctrl+S', description: 'Save graph' },
    LOAD: { key: 'Ctrl+O', description: 'Load graph' },
    EXPORT: { key: 'Ctrl+E', description: 'Export graph' },
  },
} as const;
