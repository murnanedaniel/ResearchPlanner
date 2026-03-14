import { renderHook, act } from '@testing-library/react';
import { useEdgeOperations } from './useEdgeOperations';
import { GraphProvider, useGraphState } from '../context/GraphContext';
import { Edge, GraphNode } from '../types/index';
import React from 'react';

// Mock the hooks
jest.mock('./useIdGenerator', () => ({
  useIdGenerator: () => ({
    getNextId: () => 1,
    initializeWithExistingIds: jest.fn(),
  }),
}));

jest.mock('./useGraphPersistence', () => ({
  useGraphPersistence: () => ({
    saveGraph: jest.fn(),
    loadGraph: jest.fn(() => null),
    saveToFile: jest.fn(),
    loadFromFile: jest.fn(),
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GraphProvider>{children}</GraphProvider>
);

const initialNode1: GraphNode = {
  id: 1,
  title: 'Node 1',
  description: '',
  x: 0,
  y: 0,
  isObsolete: false,
};
const initialNode2: GraphNode = {
  id: 2,
  title: 'Node 2',
  description: '',
  x: 100,
  y: 100,
  isObsolete: false,
};
const initialEdge: Edge = {
  id: 1,
  source: 1,
  target: 2,
  title: 'Test Edge',
  description: '',
  isPlanned: false,
  isObsolete: false,
};

const TestWrapperWithEdge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GraphProvider
    initialNodes={[initialNode1, initialNode2]}
    initialEdges={[initialEdge]}
  >
    {children}
  </GraphProvider>
);

// Combined hook to access both edge operations and graph state in the same context
function useCombinedHook() {
  const edgeOps = useEdgeOperations();
  const graphState = useGraphState();
  return { edgeOps, graphState };
}

describe('useEdgeOperations', () => {
  it('adds an edge', async () => {
    const { result } = renderHook(() => useCombinedHook(), { wrapper: TestWrapper });

    await act(async () => {
      result.current.edgeOps.createEdge(1, 2);
    });

    expect(result.current.graphState.edges).toHaveLength(1);
    expect(result.current.graphState.edges[0].title).toBe('');
  });

  it('deletes an edge', async () => {
    const { result } = renderHook(() => useCombinedHook(), { wrapper: TestWrapperWithEdge });

    await act(async () => {
      result.current.edgeOps.deleteEdge(1);
    });

    expect(result.current.graphState.edges).toHaveLength(0);
  });

  it('updates an edge', async () => {
    const { result } = renderHook(() => useCombinedHook(), { wrapper: TestWrapperWithEdge });

    await act(async () => {
      result.current.edgeOps.updateEdge(1, { title: 'Updated Edge' });
    });

    expect(result.current.graphState.edges[0].title).toBe('Updated Edge');
  });

  it('marks an edge obsolete', async () => {
    const { result } = renderHook(() => useCombinedHook(), { wrapper: TestWrapperWithEdge });

    await act(async () => {
      result.current.edgeOps.markEdgeObsolete(1);
    });

    expect(result.current.graphState.edges[0].isObsolete).toBe(true);
  });

});
