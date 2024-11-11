"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Define interfaces for our data structures
interface Node {
  id: number;
  title: string;
  x: number;
  y: number;
  description: string;
}

interface Edge {
  id: number;
  source: number;
  target: number;
  description: string;
  label: string;
}

export default function ResearchPlanner() {
  // State declarations with TypeScript types
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [nodeTitle, setNodeTitle] = useState('');
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);

  const NODE_RADIUS = 40;

  // Helper functions with TypeScript types
  const addNode = () => {
    if (!nodeTitle.trim()) return;
    const newNode: Node = {
      id: Date.now(),
      title: nodeTitle,
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      description: ''
    };
    setNodes([...nodes, newNode]);
    setNodeTitle('');
  };

  const addEdge = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    const edgeExists = edges.some(
      edge => (edge.source === sourceId && edge.target === targetId) ||
             (edge.source === targetId && edge.target === sourceId)
    );
    if (!edgeExists) {
      const newEdge: Edge = {
        id: Date.now(),
        source: sourceId,
        target: targetId,
        description: '',
        label: 'Click to edit'
      };
      setEdges([...edges, newEdge]);
    }
    setSelectedNode(null);
  };

  const handleNodeClick = (node: Node) => {
    if (selectedNode === null) {
      setSelectedNode(node.id);
    } else {
      addEdge(selectedNode, node.id);
    }
  };

  const deleteNode = (nodeId: number) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
    setSelectedNode(null);
  };

  const handleEditNode = (node: Node, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNode(node);
    setTempDescription(node.description);
    setIsNodeDialogOpen(true);
  };

  const handleNodeDialogClose = () => {
    if (editingNode) {
      setNodes(nodes.map(node => 
        node.id === editingNode.id 
          ? { ...node, description: tempDescription }
          : node
      ));
    }
    setEditingNode(null);
    setTempDescription('');
    setIsNodeDialogOpen(false);
  };

  const handleEditEdge = (edge: Edge, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEdge(edge);
    setTempDescription(edge.description);
    setIsEdgeDialogOpen(true);
  };

  const handleEdgeDialogClose = () => {
    if (editingEdge) {
      setEdges(edges.map(edge => 
        edge.id === editingEdge.id 
          ? { 
              ...edge, 
              description: tempDescription,
              label: tempDescription.split('\n')[0].slice(0, 20) + (tempDescription.length > 20 ? '...' : '')
            }
          : edge
      ));
    }
    setEditingEdge(null);
    setTempDescription('');
    setIsEdgeDialogOpen(false);
  };

  const calculateEdgeMidpoint = (edge: Edge) => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (!source || !target) return { x: 0, y: 0 };
    
    return {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2
    };
  };


  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Research Project Planner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter experiment name"
            value={nodeTitle}
            onChange={(e) => setNodeTitle(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addNode}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Experiment
          </Button>
        </div>
        
        <div className="relative border rounded-lg h-96 bg-slate-50">
          {/* Draw edges and their labels */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#000" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              
              // Calculate the direction vector
              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              // Adjust start and end points to account for node radius
              const startX = source.x + (dx * NODE_RADIUS / distance);
              const startY = source.y + (dy * NODE_RADIUS / distance);
              const endX = target.x - (dx * NODE_RADIUS / distance);
              const endY = target.y - (dy * NODE_RADIUS / distance);
              
              return (
                <g key={edge.id}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="black"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                    className="cursor-pointer"
                    onClick={(e) => handleEditEdge(edge, e)}
                  />
                  <foreignObject
                    x={calculateEdgeMidpoint(edge).x - 50}
                    y={calculateEdgeMidpoint(edge).y - 12}
                    width="100"
                    height="24"
                    className="pointer-events-none"
                  >
                    <div className="bg-white px-2 py-1 rounded text-xs text-center">
                      {edge.label || 'Click to edit'}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* Draw nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute flex items-center justify-center 
                rounded-full cursor-pointer transition-colors
                ${selectedNode === node.id ? 'border-blue-500 border-4' : 'border-2'}
                bg-white hover:bg-gray-50
              `}
              style={{
                left: node.x,
                top: node.y,
                width: NODE_RADIUS * 2,
                height: NODE_RADIUS * 2,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleNodeClick(node)}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-sm">
                  {node.title.length > 10 ? `${node.title.slice(0, 10)}...` : node.title}
                </div>
                
                <button
                  className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full 
                    flex items-center justify-center hover:bg-blue-600 transition-colors"
                  onClick={(e) => handleEditNode(node, e)}
                >
                  <span className="text-xs">✎</span>
                </button>

                <button
                  className="absolute -bottom-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full 
                    flex items-center justify-center hover:bg-red-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          {selectedNode 
            ? "Click another node to create a connection" 
            : "Click a node to start creating a connection"}
        </div>

        {/* Node editing dialog */}
        <Dialog open={isNodeDialogOpen} onOpenChange={handleNodeDialogClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Experiment: {editingNode?.title}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <Textarea
                placeholder="Enter experiment details (supports markdown)"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                className="min-h-[200px]"
              />
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-2">Preview:</h3>
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {tempDescription}
                </ReactMarkdown>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edge editing dialog */}
        <Dialog open={isEdgeDialogOpen} onOpenChange={handleEdgeDialogClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Connection Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <Textarea
                placeholder="Describe the relationship between these experiments (supports markdown)"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                className="min-h-[200px]"
              />
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-2">Preview:</h3>
                <ReactMarkdown className="prose prose-sm max-w-none">
                  {tempDescription}
                </ReactMarkdown>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}