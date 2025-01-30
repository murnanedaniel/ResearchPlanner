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
import { useCalendarIntegration } from './hooks/useCalendarIntegration';
import { useSelection } from './hooks/useSelection';
import { addDays } from 'date-fns';

export default function ResearchPlanner() {
  const { 
    nodes, edges, setNodes, setEdges,
    timelineActive, timelineStartDate,
    setTimelineActive, setTimelineStartDate,
    saveToFile: contextSaveToFile,
    loadFromFile: contextLoadFromFile
  } = useGraphState();
  
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  
  const { 
    addNode, 
    deleteNode, 
    markNodeObsolete, 
    updateNode,
    addSubnode,
    collapseToParent,
    handleNodeDrop,
    getAllDescendantIds,
    toggleExpand,
    updateHull
  } = useNodeOperations({
    onExpandedNodesChange: (nodes) => {
      setExpandedNodes(prev => new Set([...Array.from(prev), ...Array.from(nodes)]));
    }
  });

  const { createEdge, deleteEdge, updateEdge } = useEdgeOperations();
  
  const [newItemTitle, setNewItemTitle] = useState('');
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState<number | null>(null);

  // Calendar integration
  const { 
    isCalendarSyncEnabled,
    setIsCalendarSyncEnabled,
    isSyncing,
    isCalendarAuthenticated,
    deleteCalendarEvent,
    setDirtyNodes,
    dirtyNodes,
    login: calendarLogin,
    logout: calendarLogout,
    error: calendarError,
    isInitializing: isCalendarInitializing
  } = useCalendarIntegration({ nodes, setNodes });

  const handleNodeDelete = useCallback((id: number) => {
    // Get the node before deleting it
    const node = nodes.find(n => n.id === id);
    if (node?.calendarEventId) {
      deleteCalendarEvent(node.calendarEventId);
    }
    deleteNode(id);
  }, [nodes, deleteNode, deleteCalendarEvent]);

  // Selection state
  const {
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
  } = useSelection({
    nodes,
    edges,
    onNodeDelete: handleNodeDelete,
    onNodeCollapse: (nodeId) => toggleExpand(nodeId, false)
  });

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

  // New autocomplete states
  const [isAutocompleteModeActive, setAutocompleteModeActive] = useState(false);
  const [autocompleteMode, setAutocompleteMode] = useState<'start' | 'goal' | null>(null);
  const [selectedStartNodes, setSelectedStartNodes] = useState<number[]>([]);
  const [selectedGoalNodes, setSelectedGoalNodes] = useState<number[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);

  const { arrangeNodes } = useLayoutManager();
  const { getNextId, initializeWithExistingIds } = useIdGenerator();
  const { getNextColor } = useColorGenerator();

  const handleAddNode = () => {
    if (!newItemTitle.trim()) return;
    addNode(newItemTitle, selectedNode || undefined);
    setNewItemTitle('');
  };

  const handleAddSubnode = () => {
    if (!selectedNode || !newItemTitle.trim()) return;
    addSubnode(newItemTitle, selectedNode);
    setNewItemTitle('');
  };

  const handleCollapseToNode = () => {
    if (selectedNodes.size <= 1 || !newItemTitle.trim()) return;
    collapseToParent(newItemTitle, Array.from(selectedNodes));
    setNewItemTitle('');
  };

  const handleEditNode = (node: GraphNode) => {
    // If this is an expansion state change
    if ('isExpanded' in node) {
      toggleExpand(node.id, Boolean(node.isExpanded));
    }

    // Handle description update
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

  const handleNodeDragEnd = (id: number, x: number, y: number) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    // Calculate day if timeline is active
    let day = node.day;
    if (timelineActive) {
      const scale = getTimelineConfig(1); // Always use daily scale for now
      const pixelsPerUnit = getPixelsPerUnit(scale);
      const gridIndex = Math.floor(x / pixelsPerUnit);
      const date = addDays(timelineStartDate, gridIndex);
      day = date.toISOString();
    }

    // If day changed or node gets its first day value, mark for sync
    if (day !== node.day || (day && !node.calendarEventId)) {
      setDirtyNodes(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    }

    // Update the dragged node
    const updatedNode = { ...node, x, y, day };
    updateNode(id, updatedNode);

    // If this is a child node or parent node, update hull
    if (node.parentId) {
      updateHull(node.parentId, [{ id, x, y }]);
    }
    if (node.childNodes?.length) {
      updateHull(id, [{ id, x, y }]);
    }
  };

  const handleNodesDragEnd = (updates: { id: number; x: number; y: number }[]) => {
    // Track nodes that need to be marked as dirty
    const nodesToMarkDirty = new Set<number>();
    const hullsToUpdate = new Set<number>();

    updates.forEach(update => {
      const node = nodes.find(n => n.id === update.id);
      if (!node) return;
      
      // Calculate day if timeline is active
      let day = node.day;
      if (timelineActive) {
        const scale = getTimelineConfig(1);
        const pixelsPerUnit = getPixelsPerUnit(scale);
        const gridIndex = Math.floor(update.x / pixelsPerUnit);
        const date = addDays(timelineStartDate, gridIndex);
        day = date.toISOString();
      }

      // If day changed or node gets its first day value, mark for sync
      if (day !== node.day || (day && !node.calendarEventId)) {
        nodesToMarkDirty.add(node.id);
      }

      // Update the node
      updateNode(update.id, { 
        x: update.x, 
        y: update.y, 
        day 
      });

      // Track hulls that need updating
      if (node.parentId) {
        hullsToUpdate.add(node.parentId);
      }
      if (node.childNodes?.length) {
        hullsToUpdate.add(node.id);
      }
    });

    // Update dirty nodes
    if (nodesToMarkDirty.size > 0) {
      setDirtyNodes(prev => {
        const next = new Set(prev);
        nodesToMarkDirty.forEach(id => next.add(id));
        return next;
      });
    }

    // Update hulls with all updated positions
    hullsToUpdate.forEach(id => updateHull(id, updates));
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
      // Immediate local update
      updateNode(selectedNode, { description: value });
      setTempDescription(value);
      // Mark node as needing sync
      setDirtyNodes(prev => {
        const next = new Set(prev);
        next.add(selectedNode);
        return next;
      });
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

  const handleNodeClickWrapper = (node: GraphNode, event?: React.MouseEvent) => {
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

    handleNodeClick(node, event);
  };

  // Add effect to watch for goal node selection
  useEffect(() => {
    if (selectedGoalNodes.length > 0 && autocompleteMode === 'goal') {
      handleAutocompleteGenerate();
    }
  }, [selectedGoalNodes]);

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
            isCalendarAuthenticated={isCalendarAuthenticated}
            onCalendarLogin={calendarLogin}
            onCalendarSignOut={calendarLogout}
            isCalendarInitializing={isCalendarInitializing}
            calendarError={calendarError}
            isSyncing={isSyncing}
            dirtyNodesCount={dirtyNodes.size}
          />
          
          <div className="flex-1 h-0">
            <NodeGraph
              nodes={nodes}
              edges={edges}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              isCreatingEdge={isCreatingEdge}
              edgeStart={edgeStart}
              onNodeClick={handleNodeClickWrapper}
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