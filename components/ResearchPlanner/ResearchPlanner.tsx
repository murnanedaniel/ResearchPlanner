'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { NodeGraph } from './components/NodeGraph/NodeGraph';
import { SidePanel } from './components/SidePanel/SidePanel';
import { GraphNode, Edge, GraphData } from './types/index';
import { useLayoutManager } from './hooks/useLayoutManager';
import { Button } from '@/components/ui/button';
import { useIdGenerator } from './hooks/useIdGenerator';
import { useGraphState } from './context/GraphContext';
import { useNodeOperations } from './hooks/useNodeOperations';
import { useEdgeOperations } from './hooks/useEdgeOperations';
import { calculateNodeHull } from './utils/hull';
import { useColorGenerator } from './hooks/useColorGenerator';
import { SettingsProvider } from './context/SettingsContext';
import { getTimelineConfig, getPixelsPerUnit, snapToGrid } from './utils/timeline';
import type { TimelineConfig } from './utils/timeline';
import { useGoogleCalendar } from './hooks/useGoogleCalendar';
import { useCalendarPersistence } from './hooks/useCalendarPersistence';

// Use environment variables for Google Calendar credentials
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;

if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
  console.error('Google Calendar credentials not found in environment variables');
}

export default function ResearchPlanner() {
  const { 
    nodes, edges, setNodes, setEdges,
    timelineActive, timelineStartDate,
    setTimelineActive, setTimelineStartDate,
    saveToFile: contextSaveToFile,
    loadFromFile: contextLoadFromFile
  } = useGraphState();
  
  const { addNode, deleteNode, markNodeObsolete, updateNode } = useNodeOperations();
  const { createEdge, deleteEdge, updateEdge } = useEdgeOperations();
  const { saveCalendarState, loadCalendarState } = useCalendarPersistence();
  
  const [newItemTitle, setNewItemTitle] = useState('');
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState<number | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [isCalendarSyncEnabled, setIsCalendarSyncEnabled] = useState(false);
  const initialLoadRef = useRef(false);
  
  const calendar = useGoogleCalendar({
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || ''
  });

  // Load initial calendar state and restore sync preferences
  useEffect(() => {
    // Skip if we're still initializing
    if (calendar.isInitializing) {
      console.log('Skipping state load - still initializing');
      return;
    }

    // Skip if we've already loaded and auth hasn't changed
    if (initialLoadRef.current && !calendar.isAuthenticated) {
      return;
    }

    console.log('\n=== Loading Calendar State ===');
    const savedState = loadCalendarState();
    console.log('Loaded saved state:', savedState);

    // Only restore sync state if initialization is complete
    if (calendar.isInitialized) {
      if (savedState?.isCalendarAuthenticated && calendar.isAuthenticated) {
        console.log('Restoring sync state:', savedState.isCalendarSyncEnabled);
        // Batch the state updates to prevent race conditions
        Promise.resolve().then(() => {
          setIsCalendarSyncEnabled(savedState.isCalendarSyncEnabled);
        });
      } else if (!calendar.isAuthenticated) {
        setIsCalendarSyncEnabled(false);
      }
      initialLoadRef.current = true;
    }
  }, [calendar.isAuthenticated, calendar.isInitializing, calendar.isInitialized]);

  // Combined effect for auth and sync state changes
  useEffect(() => {
    // Skip during initialization
    if (!calendar.isInitialized || calendar.isInitializing) {
      return;
    }

    // Only save state if we're fully initialized
    if (calendar.isInitialized) {
      saveCalendarState({
        isCalendarSyncEnabled,
        isCalendarAuthenticated: calendar.isAuthenticated
      });
    }
  }, [isCalendarSyncEnabled, calendar.isAuthenticated, calendar.isInitializing, calendar.isInitialized]);

  // Calendar sync effect (consolidated)
  useEffect(() => {
    // Skip if we're initializing or sync conditions aren't met
    if (calendar.isInitializing || !isCalendarSyncEnabled || !calendar.isAuthenticated) {
      console.log('\n=== Calendar Sync Effect ===');
      console.log('Sync enabled:', isCalendarSyncEnabled);
      console.log('Calendar authenticated:', calendar.isAuthenticated);
      console.log('Sync skipped: disabled or not authenticated');
      return;
    }

    console.log('\n=== Calendar Sync Effect ===');
    console.log('Sync enabled:', isCalendarSyncEnabled);
    console.log('Calendar authenticated:', calendar.isAuthenticated);

    // Get nodes with days that need syncing
    const nodesToSync = nodes.filter(node => node.day && !node.calendarEventId);
    const nodesToUpdate = nodes.filter(node => node.day && node.calendarEventId);

    console.log('Nodes to sync:', nodesToSync.length);
    console.log('Nodes to update:', nodesToUpdate.length);

    // Create new events
    nodesToSync.forEach(async (node) => {
      console.log('\nSyncing node:', node.title);
      console.log('Node date:', node.day);
      console.log('Node date type:', typeof node.day);
      try {
        const eventId = await calendar.syncNode(node);
        console.log('Created event with ID:', eventId);
        // Update node with calendar event ID
        setNodes(prev => prev.map(n => 
          n.id === node.id ? { ...n, calendarEventId: eventId } : n
        ));
      } catch (error) {
        console.error('Failed to sync node:', node.title, error);
      }
    });

    // Update existing events
    nodesToUpdate.forEach(async (node) => {
      console.log('\nUpdating node:', node.title);
      console.log('Node date:', node.day);
      console.log('Node date type:', typeof node.day);
      console.log('Event ID:', node.calendarEventId);
      try {
        await calendar.updateNode(node, node.calendarEventId!);
        console.log('Updated event successfully');
      } catch (error) {
        console.error('Failed to update node:', node.title, error);
      }
    });
  }, [nodes, isCalendarSyncEnabled, calendar.isAuthenticated, calendar.isInitializing]);

  // Initialize expandedNodes from loaded graph data
  useEffect(() => {
    if (nodes.length > 0) {
      // Get all nodes that are marked as expanded
      const expandedNodeIds = nodes
        .filter(node => node.isExpanded)
        .map(node => node.id);
      
      // Update expandedNodes state
      setExpandedNodes(new Set(expandedNodeIds));
    }
  }, [nodes]);

  // Handle calendar sync when nodes change
  useEffect(() => {
    console.log('\n=== Calendar Sync Effect ===');
    console.log('Sync enabled:', isCalendarSyncEnabled);
    console.log('Calendar authenticated:', calendar.isAuthenticated);
    
    if (!isCalendarSyncEnabled || !calendar.isAuthenticated) {
      console.log('Sync skipped: disabled or not authenticated');
      return;
    }

    // Get nodes with days that need syncing
    const nodesToSync = nodes.filter(node => node.day && !node.calendarEventId);
    const nodesToUpdate = nodes.filter(node => node.day && node.calendarEventId);

    console.log('Nodes to sync:', nodesToSync.length);
    console.log('Nodes to update:', nodesToUpdate.length);

    // Create new events
    nodesToSync.forEach(async (node) => {
      console.log('\nSyncing node:', node.title);
      console.log('Node date:', node.day);
      console.log('Node date type:', typeof node.day);
      try {
        const eventId = await calendar.syncNode(node);
        console.log('Created event with ID:', eventId);
        // Update node with calendar event ID
        setNodes(prev => prev.map(n => 
          n.id === node.id ? { ...n, calendarEventId: eventId } : n
        ));
      } catch (error) {
        console.error('Failed to sync node:', node.title, error);
      }
    });

    // Update existing events
    nodesToUpdate.forEach(async (node) => {
      console.log('\nUpdating node:', node.title);
      console.log('Node date:', node.day);
      console.log('Node date type:', typeof node.day);
      console.log('Event ID:', node.calendarEventId);
      try {
        await calendar.updateNode(node, node.calendarEventId!);
        console.log('Updated event successfully');
      } catch (error) {
        console.error('Failed to update node:', node.title, error);
      }
    });
  }, [nodes, isCalendarSyncEnabled, calendar.isAuthenticated]);

  // New autocomplete states
  const [isAutocompleteModeActive, setAutocompleteModeActive] = useState(false);
  const [autocompleteMode, setAutocompleteMode] = useState<'start' | 'goal' | null>(null);
  const [selectedStartNodes, setSelectedStartNodes] = useState<number[]>([]);
  const [selectedGoalNodes, setSelectedGoalNodes] = useState<number[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);

  const { arrangeNodes, getNewNodePosition } = useLayoutManager();
  const { getNextId, initializeWithExistingIds } = useIdGenerator();
  const { getNextColor } = useColorGenerator();

  // Add ref for tracking latest selection
  const latestSelectionRef = useRef<{
    node: number | null;
    edge: number | null;
  }>({ node: null, edge: null });

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

  const handleAddNode = () => {
    if (!newItemTitle.trim()) return;
    addNode(newItemTitle, selectedNode || undefined);
    setNewItemTitle('');
  };

  const handleNodeDelete = useCallback((id: number) => {
    const node = nodes.find(n => n.id === id);
    if (node?.calendarEventId && isCalendarSyncEnabled && calendar.isAuthenticated) {
      calendar.deleteNode(node.calendarEventId).catch(console.error);
    }
    deleteNode(id);
  }, [nodes, isCalendarSyncEnabled, calendar.isAuthenticated]);

  const handleNodeClick = (node: GraphNode, event?: React.MouseEvent) => {
    if (isCreatingEdge) {
      handleEdgeCreate(node.id);
      return;
    }

    if (isAutocompleteModeActive) {
      if (autocompleteMode === 'start') {
        setSelectedStartNodes([node.id]);
        setAutocompleteMode('goal');
      } else if (autocompleteMode === 'goal') {
        setSelectedGoalNodes([node.id]);
      }
      return;
    }

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
    setEditingEdge(null);  // Ensure we clear any editing edge state
  };

  const handleMultiSelect = useCallback((nodeIds: number[]) => {
    setSelectedNodes(new Set(nodeIds));
    setSelectedNode(nodeIds[nodeIds.length - 1] || null);
    setSelectedEdge(null);
  }, []);

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
      
      if (e.key === 'Delete' && selectedNodes.size > 0 && !isEditingText) {
        Array.from(selectedNodes).forEach(nodeId => {
          handleNodeDelete(nodeId);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, handleNodeDelete]);

  // Add effect to watch for goal node selection
  useEffect(() => {
    if (selectedGoalNodes.length > 0 && autocompleteMode === 'goal') {
      handleAutocompleteGenerate();
    }
  }, [selectedGoalNodes]);

  const handleEditNode = (node: GraphNode) => {
    // If this is an expansion state change
    if ('isExpanded' in node) {
      const nodesMap = new Map(nodes.map(n => [n.id, n]));
      const allDescendants = getAllDescendantIds(node.id, nodesMap);
      
      // Update expanded nodes set
      setExpandedNodes(prev => {
        const next = new Set(prev);
        if (node.isExpanded) {
          next.add(node.id);
        } else {
          next.delete(node.id);
          // Also remove all descendants when collapsing
          allDescendants.forEach(id => next.delete(id));
        }
        return next;
      });

      // Update all affected nodes
      setNodes(prev => prev.map(n => {
        if (n.id === node.id) {
          return { ...n, isExpanded: node.isExpanded };
        }
        // When collapsing, also collapse all descendants
        if (!node.isExpanded && allDescendants.includes(n.id)) {
          return { ...n, isExpanded: false };
        }
        return n;
      }));
    }

    // Remove dialog-related code
    if (node.description !== undefined) {
      setEditingNode(node);
      setTempDescription(node.description);
    }
  };

  const handleEditEdge = (edge: Edge) => {
    // Update ref first
    latestSelectionRef.current = { node: null, edge: edge.id };
    
    // Update description immediately
    setTempDescription(edge.description || '');
    
    // Then update selection state
    setEditingNode(null);
    setSelectedNode(null);
    setSelectedEdge(edge.id);
  };

  const handleNodeDragEnd = (id: number, x: number, y: number, day?: Date) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    // Update the dragged node
    const updatedNode = { ...node, x, y, day };

    // If this is a child node, update parent's hull
    if (node.parentId) {
        const parentNode = nodes.find(n => n.id === node.parentId);
        if (parentNode) {
            const siblingNodes = nodes.filter(n => n.parentId === node.parentId);
            const updatedParent = {
                ...parentNode,
                hullPoints: calculateNodeHull(parentNode, [
                    ...siblingNodes.filter(n => n.id !== id),
                    updatedNode
                ])
            };
            
            setNodes(prev => [
                ...prev.filter(n => n.id !== id && n.id !== node.parentId),
                updatedParent,
                updatedNode
            ]);
            return;
        }
    }

    // If this is a parent node, update its own hull
    if (node.childNodes?.length) {
        const childNodes = nodes.filter(n => node.childNodes?.includes(n.id));
        updatedNode.hullPoints = calculateNodeHull(updatedNode, childNodes);
    }

    setNodes(prev => [
        ...prev.filter(n => n.id !== id),
        updatedNode
    ]);
  };

  const handleNodesDragEnd = (updates: { id: number; x: number; y: number; day?: Date }[]) => {
    // First, collect all nodes that need updating (including parents)
    const nodesToUpdate = new Set<number>();
    const nodeUpdates = new Map<number, Partial<GraphNode>>();

    updates.forEach(update => {
        const node = nodes.find(n => n.id === update.id);
        if (!node) return;

        nodesToUpdate.add(update.id);
        nodeUpdates.set(update.id, { x: update.x, y: update.y, day: update.day });

        // If node has a parent, we need to update the parent's hull
        if (node.parentId) {
            nodesToUpdate.add(node.parentId);
        }
    });

    setNodes(prev => {
        const updatedNodes = prev.map(node => {
            if (!nodesToUpdate.has(node.id)) return node;

            const updates = nodeUpdates.get(node.id) || {};
            const updatedNode = { ...node, ...updates };

            // If this is a parent node, recalculate its hull
            if (node.childNodes?.length) {
                const childNodes = prev
                    .filter(n => node.childNodes?.includes(n.id))
                    .map(n => {
                        const childUpdates = nodeUpdates.get(n.id);
                        return childUpdates ? { ...n, ...childUpdates } : n;
                    });
                updatedNode.hullPoints = calculateNodeHull(updatedNode, childNodes);
            }

            return updatedNode;
        });

        return updatedNodes;
    });
  };

  const handleEdgeCreate = (nodeId: number) => {
    if (edgeStart === null) {
      setEdgeStart(nodeId);
    } else if (edgeStart !== nodeId) {
      createEdge(edgeStart, nodeId);
      setIsCreatingEdge(false);
      setEdgeStart(null);
    }
  };

  const handleToggleEdgeCreate = () => {
    setIsCreatingEdge(!isCreatingEdge);
    setEdgeStart(null); // Reset edge start when toggling
  };

  const handleDescriptionChange = (value: string) => {
    if (selectedNode !== null) {
      updateNode(selectedNode, { description: value });
      setTempDescription(value);
    } else if (selectedEdge !== null) {
      updateEdge(selectedEdge, { description: value });
      setTempDescription(value);
    }
  };

  const handleTitleChange = (value: string) => {
    if (selectedNode !== null) {
      updateNode(selectedNode, { title: value });
    } else if (selectedEdge !== null) {
      updateEdge(selectedEdge, { title: value });
    }
  };

  // New autocomplete handlers
  const handleAutocompleteToggle = () => {
    if (isAutocompleteModeActive) {
      // Reset all autocomplete states
      setAutocompleteModeActive(false);
      setAutocompleteMode(null);
      setSelectedStartNodes([]);
      setSelectedGoalNodes([]);
    } else {
      setAutocompleteModeActive(true);
      setAutocompleteMode('start');
    }
  };

  const calculateIntermediatePosition = (
    startNode: GraphNode,
    goalNode: GraphNode,
    index: number,
    totalSteps: number
  ) => {
    // Ensure we have valid coordinates
    if (!startNode?.x || !startNode?.y || !goalNode?.x || !goalNode?.y) {
      // Default position if coordinates are missing
      return {
        x: 100 + (index * 100),
        y: 100 + (index * 50)
      };
    }

    // Calculate midpoint with horizontal offset
    const midpointX = (startNode.x + goalNode.x) / 2;
    const startY = Math.min(startNode.y, goalNode.y);
    const endY = Math.max(startNode.y, goalNode.y);
    const stepSize = (endY - startY) / (totalSteps + 1);
    
    // Add horizontal offset based on index
    const horizontalOffset = (index - (totalSteps - 1) / 2) * 50; // Increased spacing
    
    return {
      x: midpointX + horizontalOffset,
      y: startY + (stepSize * (index + 1))
    };
  };

  const handleAutocompleteGenerate = async () => {
    if (selectedStartNodes.length === 0 || selectedGoalNodes.length === 0) return;

    setIsAutocompleteLoading(true);
    try {
      const startNode = nodes.find(n => n.id === selectedStartNodes[0])!;
      const goalNode = nodes.find(n => n.id === selectedGoalNodes[0])!;

      const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startNodes: [{ id: startNode.id, title: startNode.title, description: startNode.description }],
          goalNodes: [{ id: goalNode.id, title: goalNode.title, description: goalNode.description }],
          nodes: nodes.map(n => ({ id: n.id, title: n.title, description: n.description })),
          edges: edges.map(e => ({ source: e.source, target: e.target, description: e.description }))
        })
      });

      const data = await response.json();
      
      // Create new nodes with positions
      const newNodes = data.map((step: any, index: number) => {
        const nodeId = getNextId();
        return {
          id: nodeId,
          title: step.title,
          description: step.markdown,
          ...calculateIntermediatePosition(startNode, goalNode, index, data.length)
        };
      });

      // Create edges
      const newEdges = [];
      const firstEdgeId = getNextId();
      newEdges.push({ 
        id: firstEdgeId,
        source: startNode.id, 
        target: newNodes[0].id,
        title: '',
        description: '',
        isPlanned: true,
        isObsolete: false
      });

      for (let i = 0; i < newNodes.length - 1; i++) {
        const edgeId = getNextId();
        newEdges.push({ 
          id: edgeId,
          source: newNodes[i].id, 
          target: newNodes[i + 1].id,
          title: '',
          description: '',
          isPlanned: true,
          isObsolete: false
        });
      }

      const lastEdgeId = getNextId();
      newEdges.push({ 
        id: lastEdgeId,
        source: newNodes[newNodes.length - 1].id, 
        target: goalNode.id,
        title: '',
        description: '',
        isPlanned: true,
        isObsolete: false
      });

      setNodes([...nodes, ...newNodes]);
      setEdges([...edges, ...newEdges]);
    } catch (error) {
      console.error('Error generating autocomplete:', error);
    } finally {
      setIsAutocompleteLoading(false);
      setAutocompleteModeActive(false);
      setAutocompleteMode(null);
      setSelectedStartNodes([]);
      setSelectedGoalNodes([]);
    }
  };

  const handleAddSubnode = () => {
    if (!selectedNode || !newItemTitle.trim()) return;

    const parentNode = nodes.find(n => n.id === selectedNode);
    if (!parentNode) return;

    const id = getNextId();
    const position = getNewNodePosition(nodes, selectedNode);
    
    // Create the child node
    const newNode: GraphNode = {
        id,
        title: newItemTitle.trim(),
        description: '',
        x: position.x,
        y: position.y,
        isObsolete: false,
        parentId: selectedNode,
        childNodes: [],
    };

    // Get all child nodes including the new one
    const childNodes = [
        ...nodes.filter(n => n.parentId === selectedNode),
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
        hullColor: parentNode.hullColor || getNextColor()  // Use existing color or generate new one
    };

    setNodes(prev => [
        ...prev.filter(n => n.id !== selectedNode),
        updatedParent,
        newNode,
    ]);

    // Expand the parent node
    setExpandedNodes(prev => new Set(Array.from(prev).concat([selectedNode])));
    setNewItemTitle('');
  };

  // Helper function to get all descendant node IDs recursively
  const getAllDescendantIds = useCallback((nodeId: number, nodesMap: Map<number, GraphNode>): number[] => {
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
  }, []);

  // Add ESC key handler for collapsing nodes and clearing selections
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedNode !== null) {
          const node = nodes.find(n => n.id === selectedNode);
          if (node?.childNodes?.length) {
            // Create a map for efficient node lookup
            const nodesMap = new Map(nodes.map(n => [n.id, n]));
            
            // Get all descendant nodes recursively
            const allDescendants = getAllDescendantIds(selectedNode, nodesMap);
            
            // Remove all descendants from expanded nodes set
            setExpandedNodes(prev => {
              const next = new Set(prev);
              allDescendants.forEach(id => next.delete(id));
              next.delete(selectedNode); // Also collapse the selected node
              return next;
            });

            // Update all affected nodes' expanded state
            setNodes(prev => prev.map(n => {
              if (n.id === selectedNode || allDescendants.includes(n.id)) {
                return { ...n, isExpanded: false };
              }
              return n;
            }));
          }
        }
        // Clear all selections regardless
        setSelectedNode(null);
        setSelectedNodes(new Set());
        setSelectedEdge(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, nodes, getAllDescendantIds]);

  const handleCollapseToNode = () => {
    if (selectedNodes.size <= 1 || !newItemTitle.trim()) return;

    console.log('Collapsing nodes to parent. Selected nodes:', Array.from(selectedNodes));
    console.log('Current nodes before collapse:', nodes);

    // Initialize ID generator with existing IDs to ensure uniqueness
    const existingIds = nodes.map(n => n.id);
    initializeWithExistingIds(existingIds);

    const selectedNodesList = Array.from(selectedNodes);
    const selectedNodeObjects = nodes.filter(n => selectedNodes.has(n.id));
    console.log('Selected node objects:', selectedNodeObjects);
    
    // Calculate average position of selected nodes
    const avgX = selectedNodeObjects.reduce((sum, n) => sum + n.x, 0) / selectedNodeObjects.length;
    const avgY = selectedNodeObjects.reduce((sum, n) => sum + n.y, 0) / selectedNodeObjects.length;

    // Create the parent node with a guaranteed unique ID
    const parentNode: GraphNode = {
      id: getNextId(),
      title: newItemTitle.trim(),
      description: '',
      x: avgX,
      y: avgY,
      isObsolete: false,
      childNodes: selectedNodesList,
      isExpanded: true,
      hullColor: getNextColor()  // Set the hull color when creating the parent node
    };

    // Calculate hull points for the parent
    const hullPoints = calculateNodeHull(parentNode, selectedNodeObjects);
    parentNode.hullPoints = hullPoints;

    console.log('Created parent node:', parentNode);

    // Update child nodes with parentId
    const updatedNodes = nodes.map(node => {
      if (selectedNodes.has(node.id)) {
        console.log(`Setting parentId ${parentNode.id} for child node:`, node);
        return { ...node, parentId: parentNode.id };
      }
      return node;
    });
    console.log('Updated nodes with new parent IDs:', updatedNodes);

    // Add the new parent node and update state
    const finalNodes = [...updatedNodes, parentNode];
    console.log('Final nodes after collapse:', finalNodes);
    
    setNodes(finalNodes);
    setExpandedNodes(prev => new Set([...Array.from(prev), parentNode.id]));
    setSelectedNodes(new Set([parentNode.id]));
    setSelectedNode(parentNode.id);
    setNewItemTitle('');
  };

  const handleNodeDragOver = (targetNode: GraphNode) => {
    // Only allow dropping if the target node is not a child of the dragged node
    if (selectedNode === null) return;
    const sourceNode = nodes.find(n => n.id === selectedNode);
    if (!sourceNode) return;

    // Prevent circular parent-child relationships
    if (targetNode.parentId === sourceNode.id) return;
    
    // If the target node is already expanded, highlight it
    if (targetNode.isExpanded) {
      // Add visual feedback here if needed
    }
  };

  const handleNodeDrop = (sourceId: number, targetId: number) => {
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

    // Calculate hull points
    const hullPoints = calculateNodeHull(targetNode, childNodes);

    // Update the target node's childNodes array, mark as expanded, and set hull
    const updatedTargetNode = {
        ...targetNode,
        childNodes: [...(targetNode.childNodes || []), sourceId],
        isExpanded: true,
        hullPoints,
        hullColor: targetNode.hullColor || getNextColor()  // Use existing color or generate new one
    };

    // Update nodes array and ensure isExpanded is set correctly for all nodes
    setNodes(prev => prev.map(node => {
        if (node.id === sourceId) return updatedSourceNode;
        if (node.id === targetId) return updatedTargetNode;
        // For all other nodes, ensure isExpanded matches the expandedNodes set
        return {
            ...node,
            isExpanded: expandedNodes.has(node.id)
        };
    }));

    // Ensure the parent node is expanded
    setExpandedNodes(prev => new Set([...Array.from(prev), targetId]));
  };

  const onToggleExpand = useCallback((nodeId: number) => {
    setNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          isExpanded: !expandedNodes.has(nodeId)
        };
      }
      return node;
    }));

    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, [expandedNodes]);

  return (
    <SettingsProvider>
      <div className="flex h-full w-full bg-gray-50">
        {/* Main Graph Area (2/3) */}
        <div className="w-2/3 h-full p-4 flex flex-col">
          <Toolbar
            nodeTitle={newItemTitle}
            onNodeTitleChange={setNewItemTitle}
            onAddNode={handleAddNode}
            onAddSubnode={handleAddSubnode}
            onCollapseToNode={handleCollapseToNode}
            selectedNodeId={selectedNode}
            selectedNodes={selectedNodes}
            isCreatingEdge={isCreatingEdge}
            onToggleEdgeCreate={handleToggleEdgeCreate}
            isAutocompleteModeActive={isAutocompleteModeActive}
            onToggleAutocomplete={handleAutocompleteToggle}
            autocompleteMode={autocompleteMode}
            isAutocompleteLoading={isAutocompleteLoading}
            isTimelineActive={timelineActive}
            onTimelineToggle={setTimelineActive}
            timelineStartDate={timelineStartDate}
            onTimelineStartDateChange={setTimelineStartDate}
            isCalendarSyncEnabled={isCalendarSyncEnabled}
            onCalendarSyncToggle={setIsCalendarSyncEnabled}
            isCalendarAuthenticated={calendar.isAuthenticated}
            onCalendarLogin={calendar.login}
            isCalendarInitializing={calendar.isInitializing}
            calendarError={calendar.error}
          />
          
          <div className="flex-1 h-0">
            <NodeGraph
              nodes={nodes}
              edges={edges}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              isCreatingEdge={isCreatingEdge}
              edgeStart={edgeStart}
              onNodeClick={handleNodeClick}
              onNodeEdit={handleEditNode}
              onNodeDelete={handleNodeDelete}
              onEdgeEdit={handleEditEdge}
              onEdgeDelete={deleteEdge}
              onEdgeCreate={handleEdgeCreate}
              onNodeDragEnd={handleNodeDragEnd}
              onNodesDragEnd={handleNodesDragEnd}
              onMarkObsolete={markNodeObsolete}
              selectedStartNodes={selectedStartNodes}
              selectedGoalNodes={selectedGoalNodes}
              isAutocompleteModeActive={isAutocompleteModeActive}
              selectedNodes={selectedNodes}
              onMultiSelect={handleMultiSelect}
              expandedNodes={expandedNodes}
              onNodeDragOver={handleNodeDragOver}
              onNodeDrop={handleNodeDrop}
              isTimelineActive={timelineActive}
              timelineStartDate={timelineStartDate}
            />
          </div>

          {/* File operations buttons */}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={contextSaveToFile}>
              Save to File
            </Button>
            <Button variant="outline" onClick={contextLoadFromFile}>
              Load from File
            </Button>
          </div>
        </div>

        {/* Side Panel (1/3) */}
        <SidePanel
          selectedNode={nodes.find(n => n.id === selectedNode) || null}
          selectedEdge={edges.find(e => e.id === selectedEdge) || null}
          description={tempDescription}
          onDescriptionChange={handleDescriptionChange}
          onTitleChange={handleTitleChange}
        />
      </div>
    </SettingsProvider>
  );
}