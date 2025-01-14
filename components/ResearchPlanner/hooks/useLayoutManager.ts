'use client';

import { useCallback } from 'react';
import { GraphNode, Edge } from '../types';
import { GRAPH_CONSTANTS } from '../constants';

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
    // Get the graph container element
    const container = document.querySelector('.graph-container');
    if (!container) {
      return { x: GRAPH_CONSTANTS.CANVAS_SIZE / 2, y: GRAPH_CONSTANTS.CANVAS_SIZE / 2 };
    }

    // Get the container's bounding rect
    const rect = container.getBoundingClientRect();
    
    // Get the current transform state from data attributes
    const scale = parseFloat(container.getAttribute('data-scale') || '1');
    const positionX = parseFloat(container.getAttribute('data-position-x') || '0');
    const positionY = parseFloat(container.getAttribute('data-position-y') || '0');

    // Calculate the center of the viewport in graph coordinates
    const viewportCenterX = (rect.width / 2 - positionX) / scale;
    const viewportCenterY = (rect.height / 2 - positionY) / scale;

    return {
      x: viewportCenterX,
      y: viewportCenterY
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