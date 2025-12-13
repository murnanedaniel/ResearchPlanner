import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS, getModifierKeyDisplay } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let mockHandlers: any;

  beforeEach(() => {
    mockHandlers = {
      onCreateNode: jest.fn(),
      onMarkObsolete: jest.fn(),
      onDeleteSelected: jest.fn(),
      onExpandCollapse: jest.fn(),
      onToggleEdgeCreation: jest.fn(),
      onSelectAll: jest.fn(),
      onClearSelection: jest.fn(),
      onZoomIn: jest.fn(),
      onZoomOut: jest.fn(),
      onResetZoom: jest.fn(),
      onToggleTimeline: jest.fn(),
      onSave: jest.fn(),
      onLoad: jest.fn(),
      onExport: jest.fn(),
    };
  });

  it('should call onCreateNode when N is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: 'n' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onCreateNode).toHaveBeenCalled();
  });

  it('should call onToggleEdgeCreation when E is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: 'e' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onToggleEdgeCreation).toHaveBeenCalled();
  });

  it('should call onMarkObsolete when O is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: 'o' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onMarkObsolete).toHaveBeenCalled();
  });

  it('should call onToggleTimeline when T is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: 't' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onToggleTimeline).toHaveBeenCalled();
  });

  it('should call onClearSelection when Escape is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onClearSelection).toHaveBeenCalled();
  });

  it('should call onZoomIn when + is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: '+' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onZoomIn).toHaveBeenCalled();
  });

  it('should call onZoomOut when - is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: '-' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onZoomOut).toHaveBeenCalled();
  });

  it('should call onSave when Ctrl+S is pressed', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    Object.defineProperty(event, 'preventDefault', {
      value: jest.fn(),
    });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onSave).toHaveBeenCalled();
  });

  it('should not call handlers when disabled', () => {
    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers, enabled: false }));
    
    const event = new KeyboardEvent('keydown', { key: 'n' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onCreateNode).not.toHaveBeenCalled();
  });

  it('should not call handlers when editing text', () => {
    // Create a mock input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    renderHook(() => useKeyboardShortcuts({ handlers: mockHandlers }));
    
    const event = new KeyboardEvent('keydown', { key: 'n' });
    window.dispatchEvent(event);
    
    expect(mockHandlers.onCreateNode).not.toHaveBeenCalled();
    
    document.body.removeChild(input);
  });
});

describe('KEYBOARD_SHORTCUTS', () => {
  it('should define all required shortcuts', () => {
    expect(KEYBOARD_SHORTCUTS.NODE_OPERATIONS).toBeDefined();
    expect(KEYBOARD_SHORTCUTS.EDGE_OPERATIONS).toBeDefined();
    expect(KEYBOARD_SHORTCUTS.SELECTION).toBeDefined();
    expect(KEYBOARD_SHORTCUTS.VIEW).toBeDefined();
    expect(KEYBOARD_SHORTCUTS.TIMELINE).toBeDefined();
    expect(KEYBOARD_SHORTCUTS.FILE).toBeDefined();
  });

  it('should have correct key mappings', () => {
    expect(KEYBOARD_SHORTCUTS.NODE_OPERATIONS.CREATE_NODE.key).toBe('N');
    expect(KEYBOARD_SHORTCUTS.EDGE_OPERATIONS.TOGGLE_EDGE_MODE.key).toBe('E');
    expect(KEYBOARD_SHORTCUTS.VIEW.ZOOM_IN.key).toBe('+');
    expect(KEYBOARD_SHORTCUTS.FILE.SAVE.key).toBe('Ctrl+S');
  });
});

describe('getModifierKeyDisplay', () => {
  it('should return the correct modifier key display', () => {
    const display = getModifierKeyDisplay();
    expect(typeof display).toBe('string');
    expect(display.length).toBeGreaterThan(0);
  });
});
