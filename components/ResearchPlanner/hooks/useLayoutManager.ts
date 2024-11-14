'use client';

import { useCallback } from 'react';
import { GraphNode, Edge } from '../types';

interface Position {
  x: number;
  y: number;
}

interface NodeWithDepth extends GraphNode {
  depth: number;
}

export function useLayoutManager() {
  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 100;

  const getNewNodePosition = useCallback((nodes: GraphNode[], selectedId?: number): Position => {
    if (nodes.length === 0) {
      return { x: 500, y: 500 };
    }

    // If no node is selected, place the new node below the last node
    if (!selectedId) {
      const lastNode = nodes[nodes.length - 1];
      return {
        x: lastNode.x,
        y: lastNode.y + VERTICAL_SPACING
      };
    }

    // If a node is selected, place the new node to the right of it
    const selectedNode = nodes.find(n => n.id === selectedId);
    if (!selectedNode) {
      const lastNode = nodes[nodes.length - 1];
      return {
        x: lastNode.x,
        y: lastNode.y + VERTICAL_SPACING
      };
    }

    return {
      x: selectedNode.x + HORIZONTAL_SPACING,
      y: selectedNode.y
    };
  }, []);

  const arrangeNodes = useCallback((nodes: GraphNode[], edges: Edge[], forceArrange: boolean = false): GraphNode[] => {
    if (!forceArrange || nodes.length === 0) return nodes;

    // Start with root nodes (nodes with no incoming edges)
    const incomingEdges = new Map<number, number>();
    edges.forEach(edge => {
      incomingEdges.set(edge.target, (incomingEdges.get(edge.target) || 0) + 1);
    });

    const nodesWithDepth: NodeWithDepth[] = nodes.map(node => ({
      ...node,
      depth: 0
    }));

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = nodesWithDepth.filter(node => !incomingEdges.has(node.id));

    // Breadth-first traversal to assign depths
    const queue = rootNodes.map(node => node.id);
    const visited = new Set<number>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const outgoingEdges = edges.filter(edge => edge.source === currentId);
      const currentDepth = nodesWithDepth.find(n => n.id === currentId)!.depth;

      outgoingEdges.forEach(edge => {
        const targetNode = nodesWithDepth.find(n => n.id === edge.target)!;
        targetNode.depth = Math.max(targetNode.depth, currentDepth + 1);
        queue.push(edge.target);
      });
    }

    // Group nodes by depth
    const nodesByDepth = nodesWithDepth.reduce((acc, node) => {
      acc[node.depth] = acc[node.depth] || [];
      acc[node.depth].push(node);
      return acc;
    }, {} as Record<number, NodeWithDepth[]>);

    // Position nodes
    return nodesWithDepth.map(node => {
      const nodesAtDepth = nodesByDepth[node.depth];
      const indexAtDepth = nodesAtDepth.findIndex(n => n.id === node.id);
      
      return {
        ...node,
        x: node.depth * HORIZONTAL_SPACING + 100,
        y: indexAtDepth * VERTICAL_SPACING + 100
      };
    });
  }, []); // No dependencies needed now

  return {
    arrangeNodes,
    getNewNodePosition
  };
}