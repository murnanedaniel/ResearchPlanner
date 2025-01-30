import { useState, useRef, useEffect, useCallback } from 'react';
import { GraphNode, Edge } from '../types';

interface UseSelectionProps {
  nodes: GraphNode[];
  edges: Edge[];
  onNodeDelete: (id: number) => void;
  onNodeCollapse?: (nodeId: number) => void;
}

interface SelectionRef {
  node: number | null;
  edge: number | null;
}

interface UseSelectionReturn {
  selectedNode: number | null;
  selectedNodes: Set<number>;
  selectedEdge: number | null;
  tempDescription: string;
  latestSelectionRef: React.MutableRefObject<SelectionRef>;
  handleNodeClick: (node: GraphNode, event?: React.MouseEvent) => void;
  handleMultiSelect: (nodeIds: number[]) => void;
  clearSelections: () => void;
  setTempDescription: (description: string) => void;
  setSelectedNode: (id: number | null) => void;
  setSelectedNodes: (nodes: Set<number>) => void;
  setSelectedEdge: (id: number | null) => void;
}

export function useSelection({ 
  nodes, 
  edges, 
  onNodeDelete,
  onNodeCollapse 
}: UseSelectionProps): UseSelectionReturn {
  // Selection state
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [tempDescription, setTempDescription] = useState('');

  // Add ref for tracking latest selection
  const latestSelectionRef = useRef<SelectionRef>({ node: null, edge: null });

  const clearSelections = useCallback(() => {
    setSelectedNode(null);
    setSelectedNodes(new Set());
    setSelectedEdge(null);
  }, []);

  // Keep the description sync effect
  useEffect(() => {
    const { node: selectedNodeId, edge: selectedEdgeId } = latestSelectionRef.current;
    
    if (selectedNodeId !== null) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        setTempDescription(node.description || '');
      }
    } else if (selectedEdgeId !== null || selectedEdge !== null) {
      const edgeId = selectedEdgeId || selectedEdge;
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        setTempDescription(edge.description || '');
      }
    } else {
      setTempDescription('');
    }
  }, [nodes, edges, selectedEdge]);

  // Handle keyboard shortcuts for selection operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're currently editing in any part of the MDXEditor
      const activeElement = document.activeElement;
      const isEditingText = 
        activeElement?.closest('.mdxeditor-root') !== null ||
        activeElement?.closest('[contenteditable="true"]') !== null ||
        activeElement?.closest('.prose') !== null ||
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA';
      
      if (isEditingText) return;

      if (e.key === 'Delete' && selectedNodes.size > 0) {
        Array.from(selectedNodes).forEach(nodeId => {
          onNodeDelete(nodeId);
        });
      }

      // Handle ESC key
      if (e.key === 'Escape') {
        // If there's a selected node with children and we have a collapse handler
        if (selectedNode !== null && onNodeCollapse) {
          const node = nodes.find(n => n.id === selectedNode);
          if (node?.childNodes?.length) {
            onNodeCollapse(selectedNode);
          }
        }
        // Clear all selections
        clearSelections();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, selectedNode, onNodeDelete, onNodeCollapse, nodes, clearSelections]);

  const handleNodeClick = useCallback((node: GraphNode, event?: React.MouseEvent) => {
    // Handle ctrl-click multi-selection
    if (event?.ctrlKey) {
      const newSelectedNodes = new Set(selectedNodes);
      if (selectedNodes.has(node.id)) {
        newSelectedNodes.delete(node.id);
      } else {
        newSelectedNodes.add(node.id);
      }
      setSelectedNodes(newSelectedNodes);
      return;
    }

    // Update ref first
    latestSelectionRef.current = { node: node.id, edge: null };
    
    // Always set description to node's description (even if empty)
    setTempDescription(node.description || '');
    
    // Then update selection state
    setSelectedNode(node.id);
    setSelectedNodes(new Set([node.id]));
    setSelectedEdge(null);
  }, [selectedNodes]);

  const handleMultiSelect = useCallback((nodeIds: number[]) => {
    setSelectedNodes(new Set(nodeIds));
    setSelectedNode(nodeIds[nodeIds.length - 1] || null);
    setSelectedEdge(null);
  }, []);

  return {
    selectedNode,
    selectedNodes,
    selectedEdge,
    tempDescription,
    latestSelectionRef,
    handleNodeClick,
    handleMultiSelect,
    clearSelections,
    setTempDescription,
    setSelectedNode,
    setSelectedNodes,
    setSelectedEdge
  };
} 