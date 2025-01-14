import { renderHook, act } from '@testing-library/react';
import { useEdgeOperations } from './useEdgeOperations';
import { GraphProvider, useGraphState } from '../context/GraphContext';
import { Edge, GraphNode } from '../types/index';
import React from 'react';

// Mock the hooks
jest.mock('./useIdGenerator', () => ({
  useIdGenerator: () => ({
    getNextId: () => 1,
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GraphProvider>{children}</GraphProvider>
);

const TestWrapperWithEdge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  return (
    <GraphProvider 
      initialNodes={[initialNode1, initialNode2]} 
      initialEdges={[initialEdge]}
    >
      {children}
    </GraphProvider>
  );
};

describe('useEdgeOperations', () => {
  it('adds an edge', async () => {
    const { result: edgeOpsResult } = renderHook(() => useEdgeOperations(), { wrapper: TestWrapper });
    const { result: graphResult } = renderHook(() => useGraphState(), { wrapper: TestWrapper });

    await act(async () => {
      edgeOpsResult.current.addEdge(1, 2, 'New Edge');
    });

    expect(graphResult.current.edges).toHaveLength(1);
    expect(graphResult.current.edges[0].title).toBe('New Edge');
  });

  it('deletes an edge', async () => {
    const { result: edgeOpsResult } = renderHook(() => useEdgeOperations(), { wrapper: TestWrapperWithEdge });
    const { result: graphResult } = renderHook(() => useGraphState(), { wrapper: TestWrapperWithEdge });

    await act(async () => {
      edgeOpsResult.current.deleteEdge(1);
    });

    expect(graphResult.current.edges).toHaveLength(0);
  });

  it('updates an edge', async () => {
    const { result: edgeOpsResult } = renderHook(() => useEdgeOperations(), { wrapper: TestWrapperWithEdge });
    const { result: graphResult } = renderHook(() => useGraphState(), { wrapper: TestWrapperWithEdge });

    await act(async () => {
      edgeOpsResult.current.updateEdge(1, { title: 'Updated Edge' });
    });

    expect(graphResult.current.edges[0].title).toBe('Updated Edge');
  });

  it('marks an edge obsolete', async () => {
    const { result: edgeOpsResult } = renderHook(() => useEdgeOperations(), { wrapper: TestWrapperWithEdge });
    const { result: graphResult } = renderHook(() => useGraphState(), { wrapper: TestWrapperWithEdge });

    await act(async () => {
      edgeOpsResult.current.markEdgeObsolete(1);
    });

    expect(graphResult.current.edges[0].isObsolete).toBe(true);
  });

  it('gets edges between nodes', async () => {
    const { result: edgeOpsResult } = renderHook(() => useEdgeOperations(), { wrapper: TestWrapperWithEdge });

    const edges = edgeOpsResult.current.getEdgesBetweenNodes(1, 2);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe(1);
    expect(edges[0].target).toBe(2);
  });

  it('gets edges for a node', async () => {
    const { result: edgeOpsResult } = renderHook(() => useEdgeOperations(), { wrapper: TestWrapperWithEdge });

    const edges = edgeOpsResult.current.getEdgesForNode(1);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe(1);
  });
}); 