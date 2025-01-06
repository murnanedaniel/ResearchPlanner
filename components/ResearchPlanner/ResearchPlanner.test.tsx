import { render, screen, fireEvent, act } from '@testing-library/react';
import ResearchPlanner from './ResearchPlanner';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock MDXEditor
jest.mock('@mdxeditor/editor', () => ({
  MDXEditor: ({ markdown, onChange }: { markdown: string; onChange: (value: string) => void }) => (
    <div data-testid="mdx-editor">
      <textarea
        data-testid="mock-editor"
        value={markdown}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
  headingsPlugin: () => ({}),
  listsPlugin: () => ({}),
  quotePlugin: () => ({}),
  markdownShortcutPlugin: () => ({})
}));

describe('ResearchPlanner', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  it('saves and loads node descriptions correctly', async () => {
    // Mock initial load
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
      nodes: [{
        id: 1,
        title: 'Test Node',
        description: '# Initial Description',
        x: 0,
        y: 0,
        isObsolete: false
      }],
      edges: []
    }));

    render(<ResearchPlanner />);

    // Find and click the node to select it
    const node = screen.getByText('Test Node');
    fireEvent.click(node);

    // Find the editor and update description
    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveValue('# Initial Description');

    // Update description
    fireEvent.change(editor, { target: { value: '# Updated Description' } });

    // Verify localStorage was called with updated data
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'research-graph',
      expect.stringContaining('# Updated Description')
    );

    // Simulate page refresh by clearing and re-rendering
    mockLocalStorage.getItem.mockReturnValueOnce(mockLocalStorage.setItem.mock.calls[0][1]);
    const { unmount } = render(<ResearchPlanner />);
    unmount();

    // Render again and verify description persists
    render(<ResearchPlanner />);
    fireEvent.click(screen.getByText('Test Node'));
    expect(screen.getByTestId('mock-editor')).toHaveValue('# Updated Description');
  });

  it('persists description changes through node selection changes', () => {
    // Mock initial load with two nodes
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
      nodes: [
        {
          id: 1,
          title: 'Node 1',
          description: '# Description 1',
          x: 0,
          y: 0,
          isObsolete: false
        },
        {
          id: 2,
          title: 'Node 2',
          description: '# Description 2',
          x: 100,
          y: 0,
          isObsolete: false
        }
      ],
      edges: []
    }));

    render(<ResearchPlanner />);

    // Select first node and update description
    fireEvent.click(screen.getByText('Node 1'));
    const editor = screen.getByTestId('mock-editor');
    fireEvent.change(editor, { target: { value: '# Updated Description 1' } });

    // Select second node
    fireEvent.click(screen.getByText('Node 2'));
    expect(screen.getByTestId('mock-editor')).toHaveValue('# Description 2');

    // Select first node again and verify description persisted
    fireEvent.click(screen.getByText('Node 1'));
    expect(screen.getByTestId('mock-editor')).toHaveValue('# Updated Description 1');
  });
}); 