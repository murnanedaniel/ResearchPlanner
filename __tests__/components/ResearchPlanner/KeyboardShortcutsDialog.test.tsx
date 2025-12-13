import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsDialog } from '@/components/ResearchPlanner/components/KeyboardShortcutsDialog';

describe('KeyboardShortcutsDialog', () => {
  it('renders when open is true', () => {
    const mockOnOpenChange = jest.fn();
    render(
      <KeyboardShortcutsDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Quick reference for all available shortcuts')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    const mockOnOpenChange = jest.fn();
    render(
      <KeyboardShortcutsDialog open={false} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('displays all shortcut categories', () => {
    const mockOnOpenChange = jest.fn();
    render(
      <KeyboardShortcutsDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Node Operations')).toBeInTheDocument();
    expect(screen.getByText('Edge Operations')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('File Operations')).toBeInTheDocument();
  });

  it('displays keyboard shortcuts with proper formatting', () => {
    const mockOnOpenChange = jest.fn();
    render(
      <KeyboardShortcutsDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    // Check for specific shortcuts
    expect(screen.getByText('Pan the canvas')).toBeInTheDocument();
    expect(screen.getByText('Delete selected node(s)')).toBeInTheDocument();
    expect(screen.getByText('Multi-select nodes')).toBeInTheDocument();
  });

  it('can be closed via close button', () => {
    const mockOnOpenChange = jest.fn();
    render(
      <KeyboardShortcutsDialog open={true} onOpenChange={mockOnOpenChange} />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
