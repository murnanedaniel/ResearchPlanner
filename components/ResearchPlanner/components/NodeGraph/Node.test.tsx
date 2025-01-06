import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Node } from './Node';
import { GraphNode } from '../../types';

// Mock the transform context
jest.mock('react-zoom-pan-pinch', () => ({
  useTransformContext: () => ({
    transformState: {
      scale: 1,
      positionX: 0,
      positionY: 0
    }
  })
}));

describe('Node Component', () => {
  const mockNode: GraphNode = {
    id: 1,
    title: 'Test Node',
    description: 'Test Description',
    x: 100,
    y: 100,
    isObsolete: false
  };

  const defaultProps = {
    node: mockNode,
    isSelected: false,
    isCreatingEdge: false,
    isEdgeStart: false,
    isStartNode: false,
    isGoalNode: false,
    isAutocompleteModeActive: false,
    onNodeClick: jest.fn(),
    onNodeEdit: jest.fn(),
    onNodeDelete: jest.fn(),
    onEdgeCreate: jest.fn(),
    onDragEnd: jest.fn(),
    onMarkObsolete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct title', () => {
    render(<Node {...defaultProps} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('applies correct styling when selected', () => {
    const { container } = render(<Node {...defaultProps} isSelected={true} />);
    expect(container.firstChild).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('applies correct styling when marked as start node', () => {
    const { container } = render(<Node {...defaultProps} isStartNode={true} />);
    expect(container.firstChild).toHaveClass('ring-2', 'ring-emerald-500');
  });

  it('applies correct styling when marked as goal node', () => {
    const { container } = render(<Node {...defaultProps} isGoalNode={true} />);
    expect(container.firstChild).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('calls onNodeClick when clicked', () => {
    render(<Node {...defaultProps} />);
    fireEvent.click(screen.getByText('Test Node'));
    expect(defaultProps.onNodeClick).toHaveBeenCalledWith(mockNode);
  });

  it('calls onEdgeCreate when clicked in edge creation mode', () => {
    render(<Node {...defaultProps} isCreatingEdge={true} />);
    fireEvent.click(screen.getByText('Test Node'));
    expect(defaultProps.onEdgeCreate).toHaveBeenCalledWith(mockNode.id);
  });

  it('calls onNodeEdit on double click', () => {
    render(<Node {...defaultProps} />);
    fireEvent.doubleClick(screen.getByText('Test Node'));
    expect(defaultProps.onNodeEdit).toHaveBeenCalledWith(mockNode);
  });

  it('calls onNodeDelete when delete button is clicked', () => {
    render(<Node {...defaultProps} />);
    const deleteButton = screen.getByRole('button', { name: 'Delete node' });
    fireEvent.click(deleteButton);
    expect(defaultProps.onNodeDelete).toHaveBeenCalledWith(mockNode.id);
  });

  it('calls onMarkObsolete when obsolete button is clicked', () => {
    render(<Node {...defaultProps} />);
    const obsoleteButton = screen.getByRole('button', { name: 'Mark as obsolete' });
    fireEvent.click(obsoleteButton);
    expect(defaultProps.onMarkObsolete).toHaveBeenCalledWith(mockNode.id);
  });

  it('applies opacity styling when node is obsolete', () => {
    const { container } = render(
      <Node {...defaultProps} node={{ ...mockNode, isObsolete: true }} />
    );
    expect(container.firstChild).toHaveClass('opacity-50');
  });
}); 