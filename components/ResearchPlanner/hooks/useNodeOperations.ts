import { useCallback } from 'react';
import { GraphNode } from '../types';
import { useGraphState } from '../context/GraphContext';
import { useIdGenerator } from './useIdGenerator';
import { useLayoutManager } from './useLayoutManager';

export function useNodeOperations() {
  const { nodes, edges, setNodes, setEdges } = useGraphState();
  const { getNextId, initializeWithExistingIds } = useIdGenerator();
  const { getNewNodePosition } = useLayoutManager();

  const addNode = useCallback((title: string, selectedNodeId?: number) => {
    if (!title.trim()) return;
    
    const existingIds = nodes.map(n => n.id);
    initializeWithExistingIds(existingIds);
    
    const position = getNewNodePosition(nodes, selectedNodeId);
    const id = getNextId();
    const newNode: GraphNode = {
      id,
      title: title.trim(),
      x: position.x,
      y: position.y,
      description: '',
      isObsolete: false
    };

    setNodes(prevNodes => [...prevNodes, newNode]);
    return newNode;
  }, [nodes, getNextId, getNewNodePosition, setNodes, initializeWithExistingIds]);

  const deleteNode = useCallback((id: number) => {
    setNodes(prevNodes => prevNodes.filter(node => node.id !== id));
    setEdges(prevEdges => prevEdges.filter(edge => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const updateNode = useCallback((id: number, updates: Partial<GraphNode>) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === id 
          ? { ...node, ...updates }
          : node
      )
    );
  }, [setNodes]);

  const createNodeAtPosition = useCallback((title: string, x: number, y: number) => {
    if (!title.trim()) return;
    const existingIds = nodes.map(n => n.id);
    initializeWithExistingIds(existingIds);
    const id = getNextId();
    const newNode: GraphNode = {
      id,
      title: title.trim(),
      x,
      y,
      description: '',
      isObsolete: false
    };

    setNodes(prevNodes => [...prevNodes, newNode]);
    return newNode;
  }, [nodes, getNextId, setNodes, initializeWithExistingIds]);

  const getDownstreamNodes = useCallback((startNodeId: number): Set<number> => {
    const downstream = new Set<number>([startNodeId]);
    const queue = [startNodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      edges
        .filter(edge => edge.source === currentId)
        .forEach(edge => {
          if (!downstream.has(edge.target)) {
            downstream.add(edge.target);
            queue.push(edge.target);
          }
        });
    }
    
    return downstream;
  }, [edges]);

  const markNodeObsolete = useCallback((nodeId: number) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    const newObsoleteState = !targetNode.isObsolete;
    const downstreamNodes = getDownstreamNodes(nodeId);
    
    setNodes(prevNodes => prevNodes.map(node => ({
      ...node,
      isObsolete: downstreamNodes.has(node.id) 
        ? newObsoleteState
        : node.isObsolete
    })));
    
    setEdges(prevEdges => prevEdges.map(edge => ({
      ...edge,
      isObsolete: (downstreamNodes.has(edge.source) || downstreamNodes.has(edge.target))
        ? newObsoleteState
        : edge.isObsolete
    })));
  }, [nodes, getDownstreamNodes, setNodes, setEdges]);

  return {
    addNode,
    deleteNode,
    updateNode,
    markNodeObsolete,
    getDownstreamNodes,
    createNodeAtPosition
  };
} 