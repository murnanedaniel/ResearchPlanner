'use client';

import React, { useEffect, useState } from 'react';
import { GraphNode, Edge } from '../../types';
import { Node as NodeComponent } from './Node';
import { GRAPH_CONSTANTS } from '../../constants';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  
  return (
    <div className="absolute bottom-4 right-4 flex gap-2">
      <Button variant="outline" size="icon" onClick={() => zoomIn()}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => zoomOut()}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={() => resetTransform()}>
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface NodeGraphProps {
    nodes: GraphNode[];
    edges: Edge[];
    selectedNode: number | null;
    isCreatingEdge: boolean;
    edgeStart: number | null;
    onNodeClick: (node: GraphNode) => void;
    onNodeEdit: (node: GraphNode) => void;
    onNodeDelete: (id: number) => void;
    onEdgeCreate: (id: number) => void;
    onEdgeEdit: (edge: Edge) => void;
    onEdgeDelete: (id: number) => void;
    onNodeDragEnd: (id: number, x: number, y: number) => void;
}

export function NodeGraph({
    nodes,
    edges,
    selectedNode,
    isCreatingEdge,
    edgeStart,
    onNodeClick,
    onNodeEdit,
    onNodeDelete,
    onEdgeCreate,
    onEdgeEdit,
    onEdgeDelete,
    onNodeDragEnd
}: NodeGraphProps) {
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setInitialPosition({
            x: window.innerWidth / 3,
            y: window.innerHeight / 2
        });
    }, []);

    return (
        <div className="relative w-full h-[600px] border border-gray-200 rounded-lg graph-container overflow-hidden bg-white shadow-sm">
            <TransformWrapper
                initialScale={1}
                minScale={0.1}
                maxScale={2}
                limitToBounds={false}
                centerOnInit={true}
                initialPositionX={-500}
                initialPositionY={-500}
                panning={{
                    disabled: false,
                    velocityDisabled: true,
                    excluded: ['node-drag-handle']
                }}
            >
                <TransformComponent
                    wrapperClass="w-full h-full"
                    contentClass="w-full h-full relative"
                >
                    <div className="relative w-[2000px] h-[2000px]">
                        <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }}>
                            <defs>
                                <marker
                                    id="arrowhead"
                                    viewBox="0 0 10 10"
                                    refX="5"
                                    refY="5"
                                    markerWidth="6"
                                    markerHeight="6"
                                    orient="auto-start-reverse"
                                >
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
                                </marker>
                            </defs>
                            
                            {edges.map(edge => {
                                const sourceNode = nodes.find(n => n.id === edge.source);
                                const targetNode = nodes.find(n => n.id === edge.target);
                                if (!sourceNode || !targetNode) return null;

                                // Calculate the direction vector
                                const dx = targetNode.x - sourceNode.x;
                                const dy = targetNode.y - sourceNode.y;
                                const length = Math.sqrt(dx * dx + dy * dy);

                                // Normalize the direction vector
                                const unitDx = dx / length;
                                const unitDy = dy / length;

                                // Adjust start and end points by node radius
                                const startX = sourceNode.x + (unitDx * (GRAPH_CONSTANTS.NODE_RADIUS + GRAPH_CONSTANTS.ARROW_SIZE));
                                const startY = sourceNode.y + (unitDy * (GRAPH_CONSTANTS.NODE_RADIUS + GRAPH_CONSTANTS.ARROW_SIZE));
                                const endX = targetNode.x - (unitDx * (GRAPH_CONSTANTS.NODE_RADIUS + GRAPH_CONSTANTS.ARROW_SIZE));
                                const endY = targetNode.y - (unitDy * (GRAPH_CONSTANTS.NODE_RADIUS + GRAPH_CONSTANTS.ARROW_SIZE));

                                return (
                                    <g 
                                        key={edge.id}
                                        className="cursor-pointer group"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Edge group clicked:', edge);
                                            onEdgeEdit(edge);
                                        }}
                                    >
                                        <line
                                            x1={startX}
                                            y1={startY}
                                            x2={endX}
                                            y2={endY}
                                            stroke="#64748b"
                                            strokeWidth="2"
                                            markerEnd="url(#arrowhead)"
                                            className="group-hover:stroke-blue-500"
                                        />
                                        {edge.title && (
                                            <text
                                                x={(startX + endX) / 2}
                                                y={(startY + endY) / 2 - 10}
                                                textAnchor="middle"
                                                className="text-sm fill-slate-500 pointer-events-none"
                                            >
                                                {edge.title}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>

                        {nodes.map(node => (
                            <NodeComponent
                                key={node.id}
                                node={node}
                                isSelected={node.id === selectedNode}
                                isCreatingEdge={isCreatingEdge}
                                isEdgeStart={node.id === edgeStart}
                                onNodeClick={onNodeClick}
                                onNodeEdit={onNodeEdit}
                                onNodeDelete={onNodeDelete}
                                onEdgeCreate={onEdgeCreate}
                                onDragEnd={onNodeDragEnd}
                            />
                        ))}
                    </div>
                </TransformComponent>
                <ZoomControls />
            </TransformWrapper>
        </div>
    );
}