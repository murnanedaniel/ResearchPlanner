'use client';

import React, { useEffect, useState } from 'react';
import { GraphNode, Edge } from '../../types';
import { Node as NodeComponent } from './Node';
import { GRAPH_CONSTANTS } from '../../constants';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScalingText } from '../shared/ScalingText';

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
    onMarkObsolete: (id: number) => void;
}

const WrappedEdgeLabel = ({ text, x1, y1, x2, y2, className = '' }: { 
    text: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    className?: string;
}) => {
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Calculate perpendicular offset
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Get unit perpendicular vector (rotated 90 degrees counterclockwise)
    const perpX = -dy / length;
    const perpY = dx / length;
    
    // Offset by a fixed amount in the perpendicular direction
    const offset = 25; // Adjust this value to control label distance from line
    const labelX = midX + perpX * offset;
    const labelY = midY + perpY * offset;

    return (
        <g transform={`translate(${labelX},${labelY}) rotate(${angle < 90 && angle > -90 ? angle : angle + 180})`}>
            <foreignObject
                x={-GRAPH_CONSTANTS.EDGE_MAX_WIDTH / 2}
                y={-GRAPH_CONSTANTS.MAX_FONT_SIZE * 1.5}
                width={GRAPH_CONSTANTS.EDGE_MAX_WIDTH}
                height={GRAPH_CONSTANTS.MAX_FONT_SIZE * 5}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <ScalingText 
                        text={text} 
                        className={`text-slate-600 pointer-events-none select-none ${className}`}
                        verticalAlign="top"
                    />
                </div>
            </foreignObject>
        </g>
    );
};

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
    onNodeDragEnd,
    onMarkObsolete
}: NodeGraphProps) {
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setInitialPosition({
            x: window.innerWidth / 3,
            y: window.innerHeight / 2
        });
    }, []);

    return (
        <div className="relative w-full h-full border border-gray-200 rounded-lg graph-container overflow-hidden bg-white shadow-sm">
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
                                            console.log('Edge clicked:', edge);
                                            onEdgeEdit(edge);
                                        }}
                                    >
                                        {/* Invisible wider line for better click detection */}
                                        <line
                                            x1={startX}
                                            y1={startY}
                                            x2={endX}
                                            y2={endY}
                                            stroke="transparent"
                                            strokeWidth="20"
                                            className="cursor-pointer"
                                        />
                                        {/* Visible line */}
                                        <line
                                            x1={startX}
                                            y1={startY}
                                            x2={endX}
                                            y2={endY}
                                            stroke="#64748b"
                                            strokeWidth="2"
                                            markerEnd="url(#arrowhead)"
                                            className={`group-hover:stroke-blue-500 ${edge.isObsolete ? 'opacity-50' : ''}`}
                                        />
                                        {edge.title && (
                                            <WrappedEdgeLabel
                                                text={edge.title}
                                                x1={startX}
                                                y1={startY}
                                                x2={endX}
                                                y2={endY}
                                                className={edge.isObsolete ? 'opacity-50' : ''}
                                            />
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
                                onMarkObsolete={onMarkObsolete}
                            />
                        ))}
                    </div>
                </TransformComponent>
                <ZoomControls />
            </TransformWrapper>
        </div>
    );
}