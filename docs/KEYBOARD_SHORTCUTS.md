# Keyboard Shortcuts Guide

ResearchPlanner now includes comprehensive keyboard shortcuts for all actions, making your workflow faster and more efficient.

## Accessing the Keyboard Shortcuts Help

Click the keyboard icon (⌨️) in the top-right corner of the graph area to view all available shortcuts.

## Available Shortcuts

### Node Operations
| Shortcut | Action |
|----------|--------|
| `N` | Create new node |
| `O` | Mark selected node as obsolete |
| `Delete` or `Backspace` | Delete selected nodes |
| `Space` | Expand/collapse selected node |

### Edge Operations
| Shortcut | Action |
|----------|--------|
| `E` | Toggle edge creation mode |
| `Alt + Click` (on node) | Create edge from node |

### Selection
| Shortcut | Action |
|----------|--------|
| `Ctrl+A` (or `⌘+A` on Mac) | Select all nodes |
| `Escape` | Clear selection and collapse nodes |
| `Ctrl + Click` (or `⌘ + Click`) | Add node to selection |
| `Ctrl + Drag` (or `⌘ + Drag`) | Select multiple nodes |

### View Controls
| Shortcut | Action |
|----------|--------|
| `+` or `=` | Zoom in |
| `-` or `_` | Zoom out |
| `0` | Reset zoom |

### Timeline
| Shortcut | Action |
|----------|--------|
| `T` | Toggle timeline view |

### File Operations
| Shortcut | Action |
|----------|--------|
| `Ctrl+S` (or `⌘+S`) | Save graph |
| `Ctrl+O` (or `⌘+O`) | Load graph |
| `Ctrl+E` (or `⌘+E`) | Export graph |

### Other
| Shortcut | Action |
|----------|--------|
| `Double Click` (on canvas) | Create node at position |

## Smart Context Awareness

Keyboard shortcuts are automatically disabled when you're editing text in:
- Node/Edge descriptions (MDX Editor)
- Input fields
- Text areas

This ensures that shortcuts don't interfere with your typing.

## Platform Support

The shortcuts automatically adapt to your platform:
- **Mac**: Uses `⌘` (Command) key
- **Windows/Linux**: Uses `Ctrl` key

## Implementation Details

The keyboard shortcuts system is implemented using:
- **`useKeyboardShortcuts` hook**: Centralized keyboard event handling
- **Context awareness**: Detects when user is editing text
- **Platform detection**: Automatically uses appropriate modifier keys
- **Accessibility**: All shortcuts are documented and discoverable

## Related Files

- `components/ResearchPlanner/hooks/useKeyboardShortcuts.ts` - Main hook implementation
- `components/ResearchPlanner/components/KeyboardShortcutsHelp/KeyboardShortcutsHelp.tsx` - Help dialog component
- `components/ResearchPlanner/hooks/useKeyboardShortcuts.test.ts` - Test suite
