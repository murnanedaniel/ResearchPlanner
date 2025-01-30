import { useCallback } from 'react';
import { GraphNode } from '../types';
import { useGraphState } from '../context/GraphContext';
import { useIdGenerator } from './useIdGenerator';
import { useLayoutManager } from './useLayoutManager';
import { useColorGenerator } from './useColorGenerator';
import { calculateNodeHull } from '../utils/hull';

interface NodeOperationsConfig {
  onExpandedNodesChange?: (nodes: Set<number>) => void;
}

export function useNodeOperations(config?: NodeOperationsConfig) {
  const { nodes, edges, setNodes, setEdges } = useGraphState();
  const { getNextId, initializeWithExistingIds } = useIdGenerator();
  const { getNewNodePosition } = useLayoutManager();
  const { getNextColor } = useColorGenerator();

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

  const getAllDescendantIds = useCallback((nodeId: number): number[] => {
    const nodesMap = new Map(nodes.map(n => [n.id, n]));
    const node = nodesMap.get(nodeId);
    if (!node?.childNodes?.length) return [];
    
    const descendants: number[] = [];
    const stack = [...node.childNodes];
    
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      descendants.push(currentId);
      
      const currentNode = nodesMap.get(currentId);
      if (currentNode?.childNodes?.length) {
        stack.push(...currentNode.childNodes);
      }
    }
    
    return descendants;
  }, [nodes]);

  const updateHull = useCallback((parentId: number, updatedNodes?: { id: number; x: number; y: number }[]) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode?.childNodes?.length) return;

    // Get child nodes with updated positions if provided
    const childNodes = nodes.filter(n => parentNode.childNodes?.includes(n.id)).map(node => {
      if (!updatedNodes) return node;
      const update = updatedNodes.find(u => u.id === node.id);
      if (!update) return node;
      return { ...node, x: update.x, y: update.y };
    });

    const hullPoints = calculateNodeHull(parentNode, childNodes);

    setNodes(prev => prev.map(n => 
      n.id === parentId 
        ? { ...n, hullPoints }
        : n
    ));
  }, [nodes, setNodes]);

  const addSubnode = useCallback((title: string, parentId: number) => {
    if (!title.trim()) return;
    
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const id = getNextId();
    const position = getNewNodePosition(nodes, parentId);
    
    // Create the child node
    const newNode: GraphNode = {
      id,
      title: title.trim(),
      description: '',
      x: position.x,
      y: position.y,
      isObsolete: false,
      parentId,
      childNodes: [],
    };

    // Get all child nodes including the new one
    const childNodes = [
      ...nodes.filter(n => n.parentId === parentId),
      newNode
    ];

    // Calculate hull points
    const hullPoints = calculateNodeHull(parentNode, childNodes);

    // Update the parent node
    const updatedParent: GraphNode = {
      ...parentNode,
      childNodes: [...(parentNode.childNodes || []), id],
      isExpanded: true,
      hullPoints,
      hullColor: parentNode.hullColor || getNextColor()
    };

    setNodes(prev => [
      ...prev.filter(n => n.id !== parentId),
      updatedParent,
      newNode,
    ]);

    // Notify about expansion change
    if (config?.onExpandedNodesChange) {
      config.onExpandedNodesChange(new Set([...Array.from(new Set([parentId])), id]));
    }

    return newNode;
  }, [nodes, getNextId, getNewNodePosition, setNodes, getNextColor]);

  const collapseToParent = useCallback((title: string, nodeIds: number[]) => {
    if (!title.trim() || nodeIds.length <= 1) return;

    const selectedNodeObjects = nodes.filter(n => nodeIds.includes(n.id));
    
    // Calculate average position
    const avgX = selectedNodeObjects.reduce((sum, n) => sum + n.x, 0) / selectedNodeObjects.length;
    const avgY = selectedNodeObjects.reduce((sum, n) => sum + n.y, 0) / selectedNodeObjects.length;

    // Create the parent node
    const parentNode: GraphNode = {
      id: getNextId(),
      title: title.trim(),
      description: '',
      x: avgX,
      y: avgY,
      isObsolete: false,
      childNodes: nodeIds,
      isExpanded: true,
      hullColor: getNextColor()
    };

    // Calculate hull points
    const hullPoints = calculateNodeHull(parentNode, selectedNodeObjects);
    parentNode.hullPoints = hullPoints;

    // Update child nodes with parentId
    const updatedNodes = nodes.map(node => {
      if (nodeIds.includes(node.id)) {
        return { ...node, parentId: parentNode.id };
      }
      return node;
    });

    // Add the new parent node
    setNodes([...updatedNodes, parentNode]);

    // Notify about expansion change
    if (config?.onExpandedNodesChange) {
      config.onExpandedNodesChange(new Set([parentNode.id]));
    }

    return parentNode;
  }, [nodes, getNextId, getNextColor, setNodes]);

  const handleNodeDrop = useCallback((sourceId: number, targetId: number) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    const targetNode = nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    // Prevent circular parent-child relationships
    if (targetNode.parentId === sourceNode.id) return;

    // Update the source node with the new parent
    const updatedSourceNode = {
      ...sourceNode,
      parentId: targetId
    };

    // Get all child nodes including the new one
    const childNodes = [
      ...nodes.filter(n => n.parentId === targetId),
      updatedSourceNode
    ];

    // Calculate hull points using current positions
    const hullPoints = calculateNodeHull(targetNode, childNodes);

    // Update the target node's childNodes array and set hull
    const updatedTargetNode = {
      ...targetNode,
      childNodes: [...(targetNode.childNodes || []), sourceId],
      isExpanded: true,
      hullPoints,
      hullColor: targetNode.hullColor || getNextColor()
    };

    setNodes(prev => prev.map(node => {
      if (node.id === sourceId) return updatedSourceNode;
      if (node.id === targetId) return updatedTargetNode;
      return node;
    }));

    // Notify about expansion change
    if (config?.onExpandedNodesChange) {
      config.onExpandedNodesChange(new Set([targetId]));
    }
  }, [nodes, setNodes, getNextColor]);

  const toggleExpand = useCallback((nodeId: number, isExpanded: boolean) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const descendants = getAllDescendantIds(nodeId);
    
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return { ...n, isExpanded };
      }
      // When collapsing, also collapse all descendants
      if (!isExpanded && descendants.includes(n.id)) {
        return { ...n, isExpanded: false };
      }
      return n;
    }));

    // Notify about expansion change
    if (config?.onExpandedNodesChange) {
      const newExpandedNodes = new Set<number>();
      if (isExpanded) {
        newExpandedNodes.add(nodeId);
      }
      config.onExpandedNodesChange(newExpandedNodes);
    }
  }, [nodes, setNodes, getAllDescendantIds]);

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
    addSubnode,
    collapseToParent,
    handleNodeDrop,
    getAllDescendantIds,
    toggleExpand,
    updateHull
  };
} 