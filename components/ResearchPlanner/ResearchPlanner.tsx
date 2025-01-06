'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { NodeGraph } from './components/NodeGraph/NodeGraph';
import { SidePanel } from './components/SidePanel/SidePanel';
import { GraphNode, Edge } from './types';
import { useLayoutManager } from './hooks/useLayoutManager';
import { useGraphPersistence } from './hooks/useGraphPersistence';
import { Button } from '@/components/ui/button';

export default function ResearchPlanner() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState<number | null>(null);
  const nextIdRef = useRef(1);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // New autocomplete states
  const [isAutocompleteModeActive, setAutocompleteModeActive] = useState(false);
  const [autocompleteMode, setAutocompleteMode] = useState<'start' | 'goal' | null>(null);
  const [selectedStartNodes, setSelectedStartNodes] = useState<number[]>([]);
  const [selectedGoalNodes, setSelectedGoalNodes] = useState<number[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);

  const { arrangeNodes, getNewNodePosition } = useLayoutManager();
  const { saveGraph, loadGraph, saveToFile, loadFromFile } = useGraphPersistence();

  // Add ref for tracking latest selection
  const latestSelectionRef = useRef<{
    node: number | null;
    edge: number | null;
  }>({ node: null, edge: null });

  const saveGraphState = useCallback(() => {
    if (nodes.length > 0 || edges.length > 0) {
      saveGraph(nodes, edges);
    }
  }, [nodes, edges, saveGraph]);

  const getNextId = useCallback(() => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    return id;
  }, []); // No dependencies needed

  useEffect(() => {
    const savedData = loadGraph();
    if (savedData && savedData.nodes.length > 0) {
      console.log('Loaded nodes:', savedData.nodes);
      setNodes(savedData.nodes);
      setEdges(savedData.edges);
      
      // Set nextIdRef to highest existing ID + 1
      const maxNodeId = Math.max(...savedData.nodes.map(n => n.id));
      const maxEdgeId = savedData.edges.length > 0 ? Math.max(...savedData.edges.map(e => e.id)) : 0;
      nextIdRef.current = Math.max(maxNodeId, maxEdgeId) + 1;
    }
  }, [loadGraph]);

  // Add initial mount effect
  useEffect(() => {
    const savedData = loadGraph();
    if (savedData && savedData.nodes.length > 0) {
      // If there's a selected node, set its description
      if (selectedNode !== null) {
        const node = savedData.nodes.find(n => n.id === selectedNode);
        if (node) {
          console.log('Initial mount: Setting description for selected node:', node.description);
          setTempDescription(node.description || '');
        }
      }
    }
  }, []); // Only run once on mount

  // Modify the description sync effect to use the ref
  useEffect(() => {
    const { node: selectedNodeId, edge: selectedEdgeId } = latestSelectionRef.current;
    
    if (selectedNodeId !== null) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        console.log('Syncing description for selected node:', node.description);
        setTempDescription(node.description || '');
      }
    } else if (selectedEdgeId !== null) {
      const edge = edges.find(e => e.id === selectedEdgeId);
      if (edge) {
        console.log('Syncing description for selected edge:', edge.description);
        setTempDescription(edge.description || '');
      }
    }
  }, [nodes, edges]); // Only depend on data changes, not selection changes

  // Restore general save effect
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      saveGraph(nodes, edges);
    }
  }, [nodes, edges, saveGraph]);

  const addNode = () => {
    if (!newItemTitle.trim()) return;
    
    const position = getNewNodePosition(nodes, selectedNode || undefined);
    const id = getNextId();
    const newNode: GraphNode = {
      id,
      title: newItemTitle,
      x: position.x,
      y: position.y,
      description: '',
      isObsolete: false
    };

    setNodes(prevNodes => [...prevNodes, newNode]);
    setNewItemTitle('');
  };

  const handleNodeDelete = useCallback((id: number) => {
    setNodes(prevNodes => {
      const newNodes = prevNodes.filter(node => node.id !== id);
      setEdges(prevEdges => {
        const newEdges = prevEdges.filter(edge => edge.source !== id && edge.target !== id);
        // Save the new state immediately
        saveGraph(newNodes, newEdges);
        return newEdges;
      });
      return newNodes;
    });
    setSelectedNode(null);
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, [saveGraph]);

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
    
    // Update description immediately from the node data
    setTempDescription(node.description || '');
    
    // Then update selection state
    setSelectedNode(node.id);
    setSelectedNodes(new Set([node.id]));
    setSelectedEdge(null);
  };

  const handleMultiSelect = useCallback((nodeIds: number[]) => {
    setSelectedNodes(new Set(nodeIds));
    setSelectedNode(nodeIds[nodeIds.length - 1] || null);
    setSelectedEdge(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNodes.size > 0) {
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
      // Update expanded nodes set
      setExpandedNodes(prev => {
        const next = new Set(prev);
        if (node.isExpanded) {
          next.add(node.id);
        } else {
          next.delete(node.id);
        }
        return next;
      });
    }

    // Update the node in the nodes array
    setNodes(prev => prev.map(n => 
      n.id === node.id ? { ...n, ...node } : n
    ));

    // If we're editing in the dialog
    if (node.description !== undefined) {
      setEditingNode(node);
      setTempDescription(node.description);
      setIsNodeDialogOpen(true);
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

  const handleNodeDragEnd = (id: number, newX: number, newY: number, isMultiDrag?: boolean) => {
    if (isMultiDrag && selectedNodes.size > 1) {
      // Get the dragged node's original position
      const draggedNode = nodes.find(n => n.id === id);
      if (!draggedNode) return;

      // Calculate the movement delta
      const deltaX = newX - draggedNode.x;
      const deltaY = newY - draggedNode.y;

      // Update all selected nodes
      const updatedNodes = nodes.map(node => {
        if (selectedNodes.has(node.id)) {
          return {
            ...node,
            x: node.x + deltaX,
            y: node.y + deltaY
          };
        }
        return node;
      });

      setNodes(updatedNodes);
    } else {
      // Single node drag
      const updatedNodes = nodes.map(node => {
        if (node.id === id) {
          return { ...node, x: newX, y: newY };
        }
        return node;
      });
      setNodes(updatedNodes);
    }
  };

  const handleEdgeCreate = (nodeId: number) => {
    if (edgeStart === null) {
      setEdgeStart(nodeId);
    } else if (edgeStart !== nodeId) {
      const newEdge: Edge = {
        id: getNextId(),
        source: edgeStart,
        target: nodeId,
        title: '',
        description: '',
        isPlanned: true,
        isObsolete: false
      };
      setEdges(prevEdges => [...prevEdges, newEdge]);
      setIsCreatingEdge(false);
      setEdgeStart(null);
    }
  };

  const deleteEdge = (edgeId: number) => {
    setEdges(edges.filter(edge => edge.id !== edgeId));
  };

  const handleToggleEdgeCreate = () => {
    setIsCreatingEdge(!isCreatingEdge);
    setEdgeStart(null); // Reset edge start when toggling
  };

  const handleDescriptionChange = (value: string) => {
    console.log('Description changed:', value);
    
    if (selectedNode !== null) {
      console.log('Updating node description:', selectedNode, value);
      setNodes(prevNodes => {
        const updatedNodes = prevNodes.map(node => 
          node.id === selectedNode 
            ? { ...node, description: value }
            : node
        );
        // Save immediately after updating description
        saveGraph(updatedNodes, edges);
        return updatedNodes;
      });
      setTempDescription(value);  // Move this after the node update
    } else if (selectedEdge !== null) {
      console.log('Updating edge description:', selectedEdge, value);
      setEdges(prevEdges => {
        const updatedEdges = prevEdges.map(edge => 
          edge.id === selectedEdge
            ? { ...edge, description: value }
            : edge
        );
        // Save immediately after updating description
        saveGraph(nodes, updatedEdges);
        return updatedEdges;
      });
      setTempDescription(value);  // Move this after the edge update
    }
  };

  const handleTitleChange = (value: string) => {
    if (selectedNode !== null) {
      setNodes(nodes.map(node => 
        node.id === selectedNode 
          ? { ...node, title: value }
          : node
      ));
    } else if (selectedEdge !== null) {
      setEdges(edges.map(edge => 
        edge.id === selectedEdge
          ? { ...edge, title: value }
          : edge
      ));
    }
  };

  const handleSaveToFile = () => {
    saveToFile(nodes, edges);
  };

  const handleLoadFromFile = async () => {
    const data = await loadFromFile();
    if (data) {
      setNodes(data.nodes);
      setEdges(data.edges);
    }
  };

  const getDownstreamNodes = (startNodeId: number, nodes: GraphNode[], edges: Edge[]): Set<number> => {
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
  };

  const markNodeObsolete = (nodeId: number) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    // Toggle obsolete state
    const newObsoleteState = !targetNode.isObsolete;
    const downstreamNodes = getDownstreamNodes(nodeId, nodes, edges);
    
    setNodes(nodes.map(node => ({
      ...node,
      // Only update if node is in downstream path
      isObsolete: downstreamNodes.has(node.id) 
        ? newObsoleteState  // Set to new state if in downstream path
        : node.isObsolete   // Keep existing state if not in downstream path
    })));
    
    setEdges(edges.map(edge => ({
      ...edge,
      // Update if either source or target is in downstream path
      isObsolete: (downstreamNodes.has(edge.source) || downstreamNodes.has(edge.target))
        ? newObsoleteState  // Set to new state if connected to downstream path
        : edge.isObsolete   // Keep existing state if not connected
    })));
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

    // Update the parent node
    const updatedParent: GraphNode = {
      ...parentNode,
      childNodes: [...(parentNode.childNodes || []), id],
      isExpanded: true,
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

  // Add ESC key handler for collapsing nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedNode !== null) {
        const node = nodes.find(n => n.id === selectedNode);
        if (node?.childNodes?.length) {
          // Remove from expanded nodes set
          setExpandedNodes(prev => {
            const next = new Set(prev);
            next.delete(selectedNode);
            return next;
          });

          // Update the node's expanded state
          setNodes(prev => prev.map(n => 
            n.id === selectedNode 
              ? { ...n, isExpanded: false }
              : n
          ));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, nodes]);

  const handleCollapseToNode = () => {
    if (selectedNodes.size <= 1 || !newItemTitle.trim()) return;

    const selectedNodesList = Array.from(selectedNodes);
    const selectedNodeObjects = nodes.filter(n => selectedNodes.has(n.id));
    
    // Calculate average position of selected nodes
    const avgX = selectedNodeObjects.reduce((sum, n) => sum + n.x, 0) / selectedNodeObjects.length;
    const avgY = selectedNodeObjects.reduce((sum, n) => sum + n.y, 0) / selectedNodeObjects.length;

    // Create the parent node
    const parentNode: GraphNode = {
      id: getNextId(),
      title: newItemTitle.trim(),
      description: '',
      x: avgX,
      y: avgY,
      isObsolete: false,
      childNodes: selectedNodesList,
      isExpanded: true,
    };

    // Update child nodes with parentId
    const updatedNodes = nodes.map(node => 
      selectedNodes.has(node.id) 
        ? { ...node, parentId: parentNode.id }
        : node
    );

    // Add the new parent node and update state
    setNodes([...updatedNodes, parentNode]);
    setExpandedNodes(prev => new Set([...Array.from(prev), parentNode.id]));
    setSelectedNodes(new Set([parentNode.id]));
    setSelectedNode(parentNode.id);
    setNewItemTitle('');
  };

  return (
    <div className="flex h-full w-full bg-gray-50">
      {/* Main Graph Area (2/3) */}
      <div className="w-2/3 h-full p-4 flex flex-col">
        <Toolbar
          nodeTitle={newItemTitle}
          onNodeTitleChange={setNewItemTitle}
          onAddNode={addNode}
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
        />
        
        <div className="flex-1 h-0">
          <NodeGraph
            nodes={nodes}
            edges={edges}
            selectedNode={selectedNode}
            isCreatingEdge={isCreatingEdge}
            edgeStart={edgeStart}
            onNodeClick={handleNodeClick}
            onNodeEdit={handleEditNode}
            onNodeDelete={handleNodeDelete}
            onEdgeEdit={handleEditEdge}
            onEdgeDelete={deleteEdge}
            onEdgeCreate={handleEdgeCreate}
            onNodeDragEnd={handleNodeDragEnd}
            onMarkObsolete={markNodeObsolete}
            selectedStartNodes={selectedStartNodes}
            selectedGoalNodes={selectedGoalNodes}
            isAutocompleteModeActive={isAutocompleteModeActive}
            selectedNodes={selectedNodes}
            onMultiSelect={handleMultiSelect}
            expandedNodes={expandedNodes}
          />
        </div>

        {/* File operations buttons */}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleSaveToFile}>
            Save to File
          </Button>
          <Button variant="outline" onClick={handleLoadFromFile}>
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
  );
}