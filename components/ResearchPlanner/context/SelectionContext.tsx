'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SelectionContextType {
  // Single selection state
  selectedNode: number | null;
  selectedEdge: number | null;
  setSelectedNode: (id: number | null) => void;
  setSelectedEdge: (id: number | null) => void;
  
  // Multi-select state
  selectedNodes: Set<number>;
  setSelectedNodes: (nodes: Set<number>) => void;
  
  // Autocomplete selection state
  selectedStartNodes: number[];
  selectedGoalNodes: number[];
  setSelectedStartNodes: (nodes: number[]) => void;
  setSelectedGoalNodes: (nodes: number[]) => void;
  
  // Selection operations
  clearAllSelections: () => void;
  toggleNodeSelection: (nodeId: number) => void;
  isNodeSelected: (nodeId: number) => boolean;
}

const SelectionContext = createContext<SelectionContextType | null>(null);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  // Single selection state
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  
  // Multi-select state
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  
  // Autocomplete selection state
  const [selectedStartNodes, setSelectedStartNodes] = useState<number[]>([]);
  const [selectedGoalNodes, setSelectedGoalNodes] = useState<number[]>([]);

  // Selection operations
  const clearAllSelections = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setSelectedNodes(new Set());
    setSelectedStartNodes([]);
    setSelectedGoalNodes([]);
  }, []);

  const toggleNodeSelection = useCallback((nodeId: number) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const isNodeSelected = useCallback((nodeId: number) => {
    return selectedNodes.has(nodeId);
  }, [selectedNodes]);

  const value = {
    selectedNode,
    selectedEdge,
    setSelectedNode,
    setSelectedEdge,
    selectedNodes,
    setSelectedNodes,
    selectedStartNodes,
    selectedGoalNodes,
    setSelectedStartNodes,
    setSelectedGoalNodes,
    clearAllSelections,
    toggleNodeSelection,
    isNodeSelected,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
} 