import { render, screen, fireEvent } from '@testing-library/react';
import { SidePanel } from './SidePanel';
import { GraphNode, Edge } from '../../types';

// Mock MDXEditor since it's a complex component
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

describe('SidePanel', () => {
  const mockNode: GraphNode = {
    id: 1,
    title: 'Test Node',
    description: '# Test Description\n\nThis is a test',
    x: 0,
    y: 0,
    isObsolete: false
  };

  const mockEdge: Edge = {
    id: 1,
    source: 1,
    target: 2,
    title: 'Test Edge',
    description: '# Edge Description\n\nThis is an edge',
    isPlanned: false,
    isObsolete: false
  };

  it('displays and updates node description', () => {
    const onDescriptionChange = jest.fn();
    const onTitleChange = jest.fn();

    render(
      <SidePanel
        selectedNode={mockNode}
        selectedEdge={null}
        description={mockNode.description}
        onDescriptionChange={onDescriptionChange}
        onTitleChange={onTitleChange}
      />
    );

    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveValue(mockNode.description);

    // Test description update
    fireEvent.change(editor, { target: { value: 'Updated description' } });
    expect(onDescriptionChange).toHaveBeenCalledWith('Updated description');
  });

  it('displays and updates edge description', () => {
    const onDescriptionChange = jest.fn();
    const onTitleChange = jest.fn();

    render(
      <SidePanel
        selectedNode={null}
        selectedEdge={mockEdge}
        description={mockEdge.description}
        onDescriptionChange={onDescriptionChange}
        onTitleChange={onTitleChange}
      />
    );

    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveValue(mockEdge.description);

    // Test description update
    fireEvent.change(editor, { target: { value: 'Updated edge description' } });
    expect(onDescriptionChange).toHaveBeenCalledWith('Updated edge description');
  });

  it('preserves markdown formatting in description', () => {
    const markdownText = `# Heading
## Subheading
- List item 1
- List item 2

**Bold text**
*Italic text*`;

    const onDescriptionChange = jest.fn();
    const onTitleChange = jest.fn();

    render(
      <SidePanel
        selectedNode={mockNode}
        selectedEdge={null}
        description={markdownText}
        onDescriptionChange={onDescriptionChange}
        onTitleChange={onTitleChange}
      />
    );

    const editor = screen.getByTestId('mock-editor');
    expect(editor).toHaveValue(markdownText);
  });
}); 