import { useCallback } from 'react';
import { GraphNode, Edge, GraphData } from '../types';

export function useGraphPersistence() {
  const saveGraph = useCallback((
    nodes: GraphNode[], 
    edges: Edge[],
    timelineActive?: boolean,
    timelineStartDate?: Date
  ) => {
    try {
      const data: GraphData = { 
        nodes, 
        edges,
        timelineActive,
        timelineStartDate: timelineStartDate?.toISOString()
      };
      const serialized = JSON.stringify(data);
      console.log('Saving graph:', data);
      localStorage.setItem('research-graph', serialized);
    } catch (error) {
      console.error('Failed to save graph:', error);
    }
  }, []);

  const loadGraph = useCallback((): GraphData | null => {
    try {
      const data = localStorage.getItem('research-graph');
      console.log('Raw loaded data:', data);
      if (!data) {
        console.log('No saved graph found');
        return null;
      }
      const parsed = JSON.parse(data) as GraphData;
      console.log('Parsed graph data:', parsed);
      return parsed;
    } catch (error) {
      console.error('Failed to load graph:', error);
      return null;
    }
  }, []);

  const saveToFile = useCallback((
    nodes: GraphNode[], 
    edges: Edge[],
    timelineActive?: boolean,
    timelineStartDate?: Date
  ) => {
    const data: GraphData = { 
      nodes, 
      edges,
      timelineActive,
      timelineStartDate: timelineStartDate?.toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'research-graph.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const loadFromFile = useCallback((): Promise<GraphData | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const data = JSON.parse(content) as GraphData;
            resolve(data);
          } catch (error) {
            console.error('Failed to parse file:', error);
            resolve(null);
          }
        };
        reader.readAsText(file);
      };

      input.click();
    });
  }, []);

  return { saveGraph, loadGraph, saveToFile, loadFromFile };
} 