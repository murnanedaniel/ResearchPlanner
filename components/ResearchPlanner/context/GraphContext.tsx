'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { GraphNode, Edge, GraphData } from '../types';
import { useGraphPersistence } from '../hooks/useGraphPersistence';
import { useIdGenerator } from '../hooks/useIdGenerator';

interface GraphContextType {
  // Core state
  nodes: GraphNode[];
  edges: Edge[];
  setNodes: (nodes: GraphNode[] | ((prev: GraphNode[]) => GraphNode[])) => void;
  setEdges: (edges: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  
  // Timeline state
  timelineActive: boolean;
  timelineStartDate: Date;
  setTimelineActive: (active: boolean) => void;
  setTimelineStartDate: (date: Date) => void;
  
  // Node expansion state
  expandedNodes: Set<number>;
  setExpandedNodes: (nodes: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  
  // File operations
  saveToFile: () => void;
  loadFromFile: () => Promise<GraphData | null>;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

interface GraphProviderProps {
  children: ReactNode;
  initialNodes?: GraphNode[];
  initialEdges?: Edge[];
  initialTimelineActive?: boolean;
  initialTimelineStartDate?: Date;
  initialExpandedNodes?: Set<number>;
}

export function GraphProvider({ 
  children, 
  initialNodes = [], 
  initialEdges = [],
  initialTimelineActive = false,
  initialTimelineStartDate = new Date(),
  initialExpandedNodes = new Set()
}: GraphProviderProps) {
  const [nodes, setNodes] = React.useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = React.useState<Edge[]>(initialEdges);
  const [timelineActive, setTimelineActive] = React.useState(initialTimelineActive);
  const [timelineStartDate, setTimelineStartDate] = React.useState(initialTimelineStartDate);
  const [expandedNodes, setExpandedNodes] = React.useState<Set<number>>(initialExpandedNodes);
  
  const { saveGraph, loadGraph, saveToFile, loadFromFile } = useGraphPersistence();
  const { initializeWithExistingIds } = useIdGenerator();

  // Load initial data
  useEffect(() => {
    const data = loadGraph();
    if (data && data.nodes && data.edges) {
      setNodes(data.nodes);
      setEdges(data.edges);
      setTimelineActive(data.timelineActive ?? false);
      setTimelineStartDate(data.timelineStartDate ? new Date(data.timelineStartDate) : new Date());
      setExpandedNodes(new Set(data.expandedNodes ?? []));
      
      // Initialize ID generator with existing IDs
      initializeWithExistingIds([
        ...data.nodes.map(n => n.id),
        ...data.edges.map(e => e.id)
      ]);
    }
  }, [loadGraph, initializeWithExistingIds]);

  // Save on changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const graphData: GraphData = {
        nodes,
        edges,
        timelineActive,
        timelineStartDate: timelineStartDate.toISOString(),
        expandedNodes: Array.from(expandedNodes)
      };
      saveGraph(graphData);
    }
  }, [nodes, edges, timelineActive, timelineStartDate, expandedNodes, saveGraph]);

  const handleSaveToFile = () => {
    const graphData: GraphData = {
      nodes,
      edges,
      timelineActive,
      timelineStartDate: timelineStartDate.toISOString(),
      expandedNodes: Array.from(expandedNodes)
    };
    saveToFile(graphData);
  };

  const handleLoadFromFile = async () => {
    const data = await loadFromFile();
    if (data) {
      setNodes(data.nodes);
      setEdges(data.edges);
      setTimelineActive(data.timelineActive ?? false);
      setTimelineStartDate(data.timelineStartDate ? new Date(data.timelineStartDate) : new Date());
      setExpandedNodes(new Set(data.expandedNodes ?? []));
    }
    return data;
  };

  const value = {
    nodes,
    edges,
    setNodes,
    setEdges,
    timelineActive,
    timelineStartDate,
    setTimelineActive,
    setTimelineStartDate,
    expandedNodes,
    setExpandedNodes,
    saveToFile: handleSaveToFile,
    loadFromFile: handleLoadFromFile
  };

  return (
    <GraphContext.Provider value={value}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraphState() {
  const context = useContext(GraphContext);
  if (context === undefined) {
    throw new Error('useGraphState must be used within a GraphProvider');
  }
  return context;
} 