import { renderHook, act } from '@testing-library/react';
import { useNodeOperations } from './useNodeOperations';
import { GraphProvider, useGraphState } from '../context/GraphContext';
import { GraphNode } from '../types';
import React from 'react';

// Mock the hooks
jest.mock('./useIdGenerator', () => ({
  useIdGenerator: () => ({
    getNextId: () => 1,
  }),
}));

jest.mock('./useLayoutManager', () => ({
  useLayoutManager: () => ({
    getNewNodePosition: () => ({ x: 100, y: 100 }),
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GraphProvider>{children}</GraphProvider>
);

const TestWrapperWithNode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialNode: GraphNode = {
    id: 1,
    title: 'Test Node',
    description: '',
    x: 0,
    y: 0,
    isObsolete: false,
  };
  return <GraphProvider initialNodes={[initialNode]} initialEdges={[]}>{children}</GraphProvider>;
};

describe('useNodeOperations', () => {
  it('adds a node', async () => {
    const { result: nodeOpsResult } = renderHook(() => useNodeOperations(), { wrapper: TestWrapper });
    const { result: graphResult } = renderHook(() => useGraphState(), { wrapper: TestWrapper });

    await act(async () => {
      nodeOpsResult.current.addNode('Test Node');
    });

    expect(graphResult.current.nodes).toHaveLength(1);
    expect(graphResult.current.nodes[0].title).toBe('Test Node');
  });

  it('deletes a node', async () => {
    const { result: nodeOpsResult } = renderHook(() => useNodeOperations(), { wrapper: TestWrapperWithNode });
    const { result: graphResult } = renderHook(() => useGraphState(), { wrapper: TestWrapperWithNode });

    await act(async () => {
      nodeOpsResult.current.deleteNode(1);
    });

    expect(graphResult.current.nodes).toHaveLength(0);
  });

  it('updates a node', async () => {
    const { result: nodeOpsResult } = renderHook(() => useNodeOperations(), { wrapper: TestWrapperWithNode });
    const { result: graphResult } = renderHook(() => useGraphState(), { wrapper: TestWrapperWithNode });

    await act(async () => {
      nodeOpsResult.current.updateNode(1, { title: 'Updated Node' });
    });

    expect(graphResult.current.nodes[0].title).toBe('Updated Node');
  });

  it('marks a node obsolete', async () => {
    const { result: nodeOpsResult } = renderHook(() => useNodeOperations(), { wrapper: TestWrapperWithNode });
    const { result: graphResult } = renderHook(() => useGraphState(), { wrapper: TestWrapperWithNode });

    await act(async () => {
      nodeOpsResult.current.markNodeObsolete(1);
    });

    expect(graphResult.current.nodes[0].isObsolete).toBe(true);
  });
}); 