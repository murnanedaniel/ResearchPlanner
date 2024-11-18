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
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState<number | null>(null);

  const { arrangeNodes, getNewNodePosition } = useLayoutManager();
  const { saveGraph, loadGraph, saveToFile, loadFromFile } = useGraphPersistence();

  useEffect(() => {
    const savedData = loadGraph();
    if (savedData && savedData.nodes.length > 0) {
      console.log('Loaded nodes:', savedData.nodes);
      setNodes(savedData.nodes);
      setEdges(savedData.edges);
    }
  }, [loadGraph]);
  
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      saveGraph(nodes, edges);
    }
  }, [nodes, edges, saveGraph]);

  const addNode = () => {
    if (!newItemTitle.trim()) return;
    
    const position = getNewNodePosition(nodes, selectedNode || undefined);
    const newNode: GraphNode = {
      id: nodes.length + 1,
      title: newItemTitle,
      x: position.x,
      y: position.y,
      description: '',
      isObsolete: false
    };

    setNodes([...nodes, newNode]);
    setNewItemTitle('');
  };

  const deleteNode = (nodeId: number) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
  };

  const handleNodeClick = (node: GraphNode) => {
    setEditingEdge(null);
    setSelectedEdge(null);
    setSelectedNode(node.id);
    const currentNode = nodes.find(n => n.id === node.id);
    if (currentNode) {
      console.log('Node clicked, description:', currentNode.description);
      setTempDescription(currentNode.description || '');
    }
  };

  const handleEditNode = (node: GraphNode) => {
    setEditingNode(node);
    setTempDescription(node.description);
    setIsNodeDialogOpen(true);
  };

  const handleEditEdge = (edge: Edge) => {
    setEditingNode(null);
    setSelectedNode(null);
    setSelectedEdge(edge.id);
    const currentEdge = edges.find(e => e.id === edge.id);
    if (currentEdge) {
      setTempDescription(currentEdge.description || '');
    }
  };

  const handleNodeDragEnd = (nodeId: number, x: number, y: number) => {
    setNodes(nodes.map(node => 
      node.id === nodeId 
        ? { ...node, x, y }
        : node
    ));
  };

  const handleEdgeCreate = (nodeId: number) => {
    if (edgeStart === null) {
      setEdgeStart(nodeId);
    } else if (edgeStart !== nodeId) {
      const newEdge: Edge = {
        id: edges.length + 1,
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
    setTempDescription(value);
    
    if (selectedNode !== null) {
      const updatedNodes = nodes.map(node => 
        node.id === selectedNode 
          ? { ...node, description: value }
          : node
      );
      setNodes(updatedNodes);
    } else if (selectedEdge !== null) {
      const updatedEdges = edges.map(edge => 
        edge.id === selectedEdge
          ? { ...edge, description: value }
          : edge
      );
      setEdges(updatedEdges);
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

  return (
    <div className="flex h-full w-full bg-gray-50">
      {/* Main Graph Area (2/3) */}
      <div className="w-2/3 h-full p-4 flex flex-col">
        <Toolbar
          nodeTitle={newItemTitle}
          onNodeTitleChange={setNewItemTitle}
          onAddNode={addNode}
          isCreatingEdge={isCreatingEdge}
          onToggleEdgeCreate={handleToggleEdgeCreate}
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
            onNodeDelete={deleteNode}
            onEdgeEdit={handleEditEdge}
            onEdgeDelete={deleteEdge}
            onEdgeCreate={handleEdgeCreate}
            onNodeDragEnd={handleNodeDragEnd}
            onMarkObsolete={markNodeObsolete}
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