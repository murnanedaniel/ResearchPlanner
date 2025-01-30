'use client';

import { useCallback, useState } from 'react';
import { Edge } from '../types';
import { useGraphState } from '../context/GraphContext';
import { useIdGenerator } from './useIdGenerator';

export function useEdgeOperations() {
  const { edges, setEdges } = useGraphState();
  const { getNextId } = useIdGenerator();

  // Edge creation state
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState<number | null>(null);

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

  const toggleEdgeCreation = useCallback(() => {
    setIsCreatingEdge(prev => !prev);
    setEdgeStart(null); // Reset edge start when toggling
  }, []);

  const handleEdgeCreate = useCallback((nodeId: number) => {
    if (edgeStart === null) {
      setEdgeStart(nodeId);
    } else if (edgeStart !== nodeId) {
      createEdge(edgeStart, nodeId);
      setIsCreatingEdge(false);
      setEdgeStart(null);
    }
  }, [edgeStart, createEdge]);

  const markEdgeObsolete = useCallback((edgeId: number) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    updateEdge(edgeId, { isObsolete: !edge.isObsolete });
  }, [edges, updateEdge]);

  const toggleEdgePlanned = useCallback((edgeId: number) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    updateEdge(edgeId, { isPlanned: !edge.isPlanned });
  }, [edges, updateEdge]);

  return {
    // Edge CRUD
    createEdge,
    deleteEdge,
    updateEdge,
    // Edge creation flow
    isCreatingEdge,
    edgeStart,
    toggleEdgeCreation,
    handleEdgeCreate,
    // Edge state
    markEdgeObsolete,
    toggleEdgePlanned
  };
} 