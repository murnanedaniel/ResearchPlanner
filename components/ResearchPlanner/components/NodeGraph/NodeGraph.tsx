'use client';

import React, { useEffect, useState } from 'react';
import { GraphNode, Edge, SelectionBox } from '../../types';
import { Node as NodeComponent } from './Node';
import { GRAPH_CONSTANTS } from '../../constants';
import { TransformWrapper, TransformComponent, useControls, useTransformContext } from 'react-zoom-pan-pinch';
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
    selectedNodes: Set<number>;
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
    selectedStartNodes: number[];
    selectedGoalNodes: number[];
    isAutocompleteModeActive: boolean;
    onMultiSelect: (nodeIds: number[]) => void;
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

function GraphContent({
    nodes,
    edges,
    selectedNode,
    selectedNodes,
    isCreatingEdge,
    edgeStart,
    onNodeClick,
    onNodeEdit,
    onNodeDelete,
    onEdgeCreate,
    onEdgeEdit,
    onEdgeDelete,
    onNodeDragEnd,
    onMarkObsolete,
    selectedStartNodes,
    selectedGoalNodes,
    isAutocompleteModeActive,
    onMultiSelect,
    isCtrlPressed
}: NodeGraphProps & { isCtrlPressed: boolean }) {
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const transformContext = useTransformContext();

    const getTransformedPoint = (clientX: number, clientY: number) => {
        const rect = document.querySelector('.graph-container')?.getBoundingClientRect();
        if (!rect || !transformContext?.transformState) return { x: 0, y: 0 };

        const { scale, positionX, positionY } = transformContext.transformState;
        const x = ((clientX - rect.left) / scale) - (positionX / scale);
        const y = ((clientY - rect.top) / scale) - (positionY / scale);
        
        return { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isCtrlPressed) return;
        
        const point = getTransformedPoint(e.clientX, e.clientY);
        setSelectionBox({
            start: point,
            current: point
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!selectionBox) return;
        
        const point = getTransformedPoint(e.clientX, e.clientY);
        setSelectionBox(prev => ({
            start: prev!.start,
            current: point
        }));
    };

    const handleMouseUp = () => {
        if (!selectionBox) return;
        
        const selectedIds = nodes.filter(node => {
            const { start, current } = selectionBox;
            
            const left = Math.min(start.x, current.x);
            const right = Math.max(start.x, current.x);
            const top = Math.min(start.y, current.y);
            const bottom = Math.max(start.y, current.y);
            
            return node.x >= left && node.x <= right && node.y >= top && node.y <= bottom;
        }).map(node => node.id);
        
        if (selectedIds.length > 0) {
            onMultiSelect(selectedIds);
        }
        
        setSelectionBox(null);
    };

    return (
        <div 
            className="relative w-[2000px] h-[2000px]"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {selectionBox && (
                <div
                    className="absolute border border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
                    style={{
                        left: Math.min(selectionBox.start.x, selectionBox.current.x),
                        top: Math.min(selectionBox.start.y, selectionBox.current.y),
                        width: Math.abs(selectionBox.current.x - selectionBox.start.x),
                        height: Math.abs(selectionBox.current.y - selectionBox.start.y)
                    }}
                />
            )}
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
                            {/* Delete button */}
                            <g
                                transform={`translate(${(startX + endX) / 2},${(startY + endY) / 2})`}
                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdgeDelete(edge.id);
                                }}
                            >
                                <circle
                                    r="12"
                                    fill="#ef4444"
                                    className="stroke-white"
                                />
                                <path
                                    d="M -6 -6 L 6 6 M -6 6 L 6 -6"
                                    stroke="white"
                                    strokeWidth="2"
                                />
                            </g>
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
                    isMultiSelected={selectedNodes.has(node.id)}
                    isCreatingEdge={isCreatingEdge}
                    isEdgeStart={node.id === edgeStart}
                    onNodeClick={onNodeClick}
                    onNodeEdit={onNodeEdit}
                    onNodeDelete={onNodeDelete}
                    onEdgeCreate={onEdgeCreate}
                    onDragEnd={onNodeDragEnd}
                    onMarkObsolete={onMarkObsolete}
                    isStartNode={selectedStartNodes.includes(node.id)}
                    isGoalNode={selectedGoalNodes.includes(node.id)}
                    isAutocompleteModeActive={isAutocompleteModeActive}
                />
            ))}
        </div>
    );
}

export function NodeGraph(props: NodeGraphProps) {
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);

    useEffect(() => {
        setInitialPosition({
            x: window.innerWidth / 3,
            y: window.innerHeight / 2
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(false);
        };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
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
                    disabled: isCtrlPressed,
                    velocityDisabled: true,
                    excluded: ['node-drag-handle']
                }}
            >
                <TransformComponent
                    wrapperClass="w-full h-full"
                    contentClass="w-full h-full relative"
                >
                    <GraphContent {...props} isCtrlPressed={isCtrlPressed} />
                </TransformComponent>
                <ZoomControls />
            </TransformWrapper>
        </div>
    );
}