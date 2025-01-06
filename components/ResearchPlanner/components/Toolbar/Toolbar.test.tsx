import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Toolbar } from './Toolbar';

describe('Toolbar Component', () => {
  const defaultProps = {
    nodeTitle: '',
    onNodeTitleChange: jest.fn(),
    onAddNode: jest.fn(),
    isCreatingEdge: false,
    onToggleEdgeCreate: jest.fn(),
    isAutocompleteModeActive: false,
    onToggleAutocomplete: jest.fn(),
    autocompleteMode: null as ('start' | 'goal' | null),
    isAutocompleteLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input field and buttons', () => {
    render(<Toolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Node title...')).toBeInTheDocument();
    expect(screen.getByText('Add Node')).toBeInTheDocument();
    expect(screen.getByText('Create Edge')).toBeInTheDocument();
    expect(screen.getByText('Autocomplete')).toBeInTheDocument();
  });

  it('handles node title input changes', () => {
    render(<Toolbar {...defaultProps} />);
    const input = screen.getByPlaceholderText('Node title...');
    fireEvent.change(input, { target: { value: 'New Node' } });
    expect(defaultProps.onNodeTitleChange).toHaveBeenCalledWith('New Node');
  });

  it('handles add node button click', () => {
    render(<Toolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Add Node'));
    expect(defaultProps.onAddNode).toHaveBeenCalled();
  });

  it('toggles edge creation mode', () => {
    render(<Toolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Create Edge'));
    expect(defaultProps.onToggleEdgeCreate).toHaveBeenCalled();
  });

  it('shows correct button text in edge creation mode', () => {
    render(<Toolbar {...defaultProps} isCreatingEdge={true} />);
    expect(screen.getByText('Cancel Edge')).toBeInTheDocument();
  });

  it('handles autocomplete button click', () => {
    render(<Toolbar {...defaultProps} />);
    fireEvent.click(screen.getByText('Autocomplete'));
    expect(defaultProps.onToggleAutocomplete).toHaveBeenCalled();
  });

  it('shows correct text during start node selection', () => {
    render(<Toolbar {...defaultProps} isAutocompleteModeActive={true} autocompleteMode="start" />);
    expect(screen.getByText('Select Start Node')).toBeInTheDocument();
  });

  it('shows correct text during goal node selection', () => {
    render(<Toolbar {...defaultProps} isAutocompleteModeActive={true} autocompleteMode="goal" />);
    expect(screen.getByText('Select Goal Node')).toBeInTheDocument();
  });

  it('shows loading state during autocomplete generation', () => {
    render(<Toolbar {...defaultProps} isAutocompleteLoading={true} />);
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByText('Generating...')).toBeDisabled();
  });
}); 