import { render, renderHook, act } from '@testing-library/react';
import { GraphProvider, useGraphState } from './GraphContext';
import { GraphNode, Edge } from '../types';

// Mock the hooks
jest.mock('../hooks/useGraphPersistence', () => ({
  useGraphPersistence: () => ({
    saveGraph: jest.fn(),
    loadGraph: () => null,
    saveToFile: jest.fn(),
    loadFromFile: jest.fn(),
  }),
}));

jest.mock('../hooks/useIdGenerator', () => ({
  useIdGenerator: () => ({
    initializeWithExistingIds: jest.fn(),
  }),
}));

describe('GraphContext', () => {
  const mockNode: GraphNode = {
    id: 1,
    title: 'Test Node',
    description: '',
    x: 0,
    y: 0,
    isObsolete: false,
  };

  const mockEdge: Edge = {
    id: 1,
    source: 1,
    target: 2,
    title: '',
    description: '',
    isPlanned: true,
    isObsolete: false,
  };

  it('provides empty arrays by default', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GraphProvider>{children}</GraphProvider>
    );

    const { result } = renderHook(() => useGraphState(), { wrapper });

    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
  });

  it('accepts initial nodes and edges', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GraphProvider initialNodes={[mockNode]} initialEdges={[mockEdge]}>
        {children}
      </GraphProvider>
    );

    const { result } = renderHook(() => useGraphState(), { wrapper });

    expect(result.current.nodes).toEqual([mockNode]);
    expect(result.current.edges).toEqual([mockEdge]);
  });

  it('allows updating nodes and edges', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GraphProvider>{children}</GraphProvider>
    );

    const { result } = renderHook(() => useGraphState(), { wrapper });

    act(() => {
      result.current.setNodes([mockNode]);
      result.current.setEdges([mockEdge]);
    });

    expect(result.current.nodes).toEqual([mockNode]);
    expect(result.current.edges).toEqual([mockEdge]);
  });

  it('provides file operations', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GraphProvider>{children}</GraphProvider>
    );

    const { result } = renderHook(() => useGraphState(), { wrapper });

    expect(result.current.saveToFile).toBeDefined();
    expect(result.current.loadFromFile).toBeDefined();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test as we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      const { result } = renderHook(() => useGraphState());
    }).toThrow('useGraphState must be used within a GraphProvider');
    
    consoleSpy.mockRestore();
  });
}); 