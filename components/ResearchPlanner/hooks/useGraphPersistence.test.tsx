import { renderHook, act } from '@testing-library/react';
import { useGraphPersistence } from './useGraphPersistence';
import { GraphNode, Edge } from '../types';

describe('useGraphPersistence', () => {
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
  };
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

  beforeEach(() => {
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  it('saves and loads graph data with descriptions', () => {
    const { result } = renderHook(() => useGraphPersistence());

    const testNode: GraphNode = {
      id: 1,
      title: 'Test Node',
      description: '# Test Description',
      x: 0,
      y: 0,
      isObsolete: false
    };

    const testEdge: Edge = {
      id: 1,
      source: 1,
      target: 2,
      title: 'Test Edge',
      description: '# Edge Description',
      isPlanned: false,
      isObsolete: false
    };

    // Save the data
    act(() => {
      result.current.saveGraph([testNode], [testEdge]);
    });

    // Verify localStorage was called with correct data
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'research-graph',
      expect.stringContaining('"description":"# Test Description"')
    );

    // Mock loading the saved data
    mockLocalStorage.getItem.mockReturnValueOnce(mockLocalStorage.setItem.mock.calls[0][1]);

    // Load the data
    const loadedData = result.current.loadGraph();

    // Verify descriptions are preserved
    expect(loadedData?.nodes[0].description).toBe('# Test Description');
    expect(loadedData?.edges[0].description).toBe('# Edge Description');
  });

  it('handles empty descriptions correctly', () => {
    const { result } = renderHook(() => useGraphPersistence());

    const nodeWithEmptyDesc: GraphNode = {
      id: 1,
      title: 'Test Node',
      description: '',
      x: 0,
      y: 0,
      isObsolete: false
    };

    // Save the data
    act(() => {
      result.current.saveGraph([nodeWithEmptyDesc], []);
    });

    // Mock loading the saved data
    mockLocalStorage.getItem.mockReturnValueOnce(mockLocalStorage.setItem.mock.calls[0][1]);

    // Load the data
    const loadedData = result.current.loadGraph();

    // Verify empty description is preserved as empty string, not null or undefined
    expect(loadedData?.nodes[0].description).toBe('');
  });
}); 