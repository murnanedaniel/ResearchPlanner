'use client';

import { useCallback } from 'react';
import { Edge } from '../types';
import { useGraphState } from '../context/GraphContext';
import { useIdGenerator } from './useIdGenerator';

export function useEdgeOperations() {
  const { edges, setEdges } = useGraphState();
  const { getNextId } = useIdGenerator();

  const createEdge = useCallback((sourceId: number, targetId: number) => {
    const newEdge: Edge = {
      id: getNextId(),
      source: sourceId,
      target: targetId,
      title: '',
      description: '',
      isPlanned: true,
      isObsolete: false
    };
    setEdges(prevEdges => [...prevEdges, newEdge]);
    return newEdge;
  }, [getNextId, setEdges]);

  const deleteEdge = useCallback((edgeId: number) => {
    setEdges(prevEdges => prevEdges.filter(edge => edge.id !== edgeId));
  }, [setEdges]);

  const updateEdge = useCallback((id: number, updates: Partial<Edge>) => {
    setEdges(prevEdges => 
      prevEdges.map(edge => 
        edge.id === id 
          ? { ...edge, ...updates }
          : edge
      )
    );
  }, [setEdges]);

  return {
    createEdge,
    deleteEdge,
    updateEdge,
  };
} 