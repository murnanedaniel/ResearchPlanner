import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Node } from './Node';
import { GraphNode } from '../../types';
import { SettingsProvider } from '../../context/SettingsContext';

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

const renderWithProviders = (ui: React.ReactElement) =>
  render(<SettingsProvider>{ui}</SettingsProvider>);

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
    nodes: [mockNode],
    isMultiSelected: false,
    onToggleExpand: jest.fn(),
    scale: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct title', () => {
    renderWithProviders(<Node {...defaultProps} />);
    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('applies correct styling when selected', () => {
    const { container } = renderWithProviders(<Node {...defaultProps} isSelected={true} />);
    const styledDiv = container.querySelector('.ring-blue-500');
    expect(styledDiv).not.toBeNull();
    expect(styledDiv).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('applies correct styling when marked as start node', () => {
    const { container } = renderWithProviders(<Node {...defaultProps} isStartNode={true} />);
    const styledDiv = container.querySelector('.ring-emerald-500');
    expect(styledDiv).not.toBeNull();
    expect(styledDiv).toHaveClass('ring-2', 'ring-emerald-500');
  });

  it('applies correct styling when marked as goal node', () => {
    const { container } = renderWithProviders(<Node {...defaultProps} isGoalNode={true} />);
    const styledDiv = container.querySelector('.ring-blue-500');
    expect(styledDiv).not.toBeNull();
    expect(styledDiv).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('calls onNodeClick when clicked', () => {
    renderWithProviders(<Node {...defaultProps} />);
    fireEvent.click(screen.getByText('Test Node'));
    expect(defaultProps.onNodeClick).toHaveBeenCalledWith(mockNode, expect.any(Object));
  });

  it('calls onEdgeCreate when clicked in edge creation mode', () => {
    renderWithProviders(<Node {...defaultProps} isCreatingEdge={true} />);
    fireEvent.click(screen.getByText('Test Node'));
    expect(defaultProps.onEdgeCreate).toHaveBeenCalledWith(mockNode.id);
  });

  it('calls onNodeEdit on double click', () => {
    renderWithProviders(<Node {...defaultProps} />);
    fireEvent.doubleClick(screen.getByText('Test Node'));
    expect(defaultProps.onNodeEdit).toHaveBeenCalledWith(mockNode);
  });

  it('calls onNodeDelete when delete button is clicked', () => {
    renderWithProviders(<Node {...defaultProps} />);
    const deleteButton = screen.getByRole('button', { name: 'Delete node' });
    fireEvent.click(deleteButton);
    expect(defaultProps.onNodeDelete).toHaveBeenCalledWith(mockNode.id);
  });

  it('calls onMarkObsolete when obsolete button is clicked', () => {
    renderWithProviders(<Node {...defaultProps} />);
    const obsoleteButton = screen.getByRole('button', { name: 'Mark as obsolete' });
    fireEvent.click(obsoleteButton);
    expect(defaultProps.onMarkObsolete).toHaveBeenCalledWith(mockNode.id);
  });

  it('applies opacity styling when node is obsolete', () => {
    const { container } = renderWithProviders(
      <Node {...defaultProps} node={{ ...mockNode, isObsolete: true }} />
    );
    const styledDiv = container.querySelector('.opacity-50');
    expect(styledDiv).not.toBeNull();
  });
}); 