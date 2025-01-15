import { useCallback } from 'react';
import { GraphData, GraphNode } from '../types';

export function useGraphPersistence() {
  const saveGraph = useCallback((data: GraphData) => {
    try {
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
      
      // Parse the data
      const parsed = JSON.parse(data);
      
      // Handle old format (array of nodes)
      if (Array.isArray(parsed)) {
        console.log('Converting old format to new format');
        return {
          nodes: parsed as GraphNode[],
          edges: [],
          timelineActive: false,
          timelineStartDate: new Date().toISOString(),
          expandedNodes: []
        };
      }
      
      // Handle new format
      return parsed as GraphData;
    } catch (error) {
      console.error('Failed to load graph:', error);
      return null;
    }
  }, []);

  const saveToFile = useCallback((data: GraphData) => {
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
            const parsed = JSON.parse(content);
            
            // Handle old format (array of nodes)
            if (Array.isArray(parsed)) {
              resolve({
                nodes: parsed as GraphNode[],
                edges: [],
                timelineActive: false,
                timelineStartDate: new Date().toISOString(),
                expandedNodes: []
              });
              return;
            }
            
            // Handle new format
            resolve(parsed as GraphData);
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