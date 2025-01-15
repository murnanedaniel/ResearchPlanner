'use client';

import React, { useEffect, useState } from 'react';
import { GraphNode, Edge } from '../../types';
import { Node as NodeComponent } from './Node';
import { GRAPH_CONSTANTS, getGraphConstant } from '../../constants';
import { TransformWrapper, TransformComponent, useControls, useTransformContext } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScalingText } from '../shared/ScalingText';
import { TimelineGrid } from './TimelineGrid';
import { getTimelineConfig, getPixelsPerUnit, snapToGrid } from '../../utils/timeline';
import type { TimelineConfig } from '../../utils/timeline';
import { useSettings } from '../../context/SettingsContext';

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
    selectedEdge: number | null;
    isCreatingEdge: boolean;
    edgeStart: number | null;
    onNodeClick: (node: GraphNode) => void;
    onNodeEdit: (node: GraphNode) => void;
    onNodeDelete: (id: number) => void;
    onEdgeCreate: (id: number) => void;
    onEdgeEdit: (edge: Edge) => void;
    onEdgeDelete: (id: number) => void;
    onNodeDragEnd: (id: number, x: number, y: number) => void;
    onNodesDragEnd?: (updates: { id: number; x: number; y: number }[]) => void;
    onMarkObsolete: (id: number) => void;
    selectedStartNodes: number[];
    selectedGoalNodes: number[];
    isAutocompleteModeActive: boolean;
    onMultiSelect: (nodeIds: number[]) => void;
    expandedNodes: Set<number>;
    onNodeDragOver: (node: GraphNode) => void;
    onNodeDrop: (sourceId: number, targetId: number) => void;
    isTimelineActive: boolean;
    timelineStartDate: Date;
}

interface SelectionBox {
    start: { x: number; y: number };
    current: { x: number; y: number };
}

const WrappedEdgeLabel = ({ text, x1, y1, x2, y2, className = '' }: { 
    text: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    className?: string;
}) => {
    const { settings } = useSettings();
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

    const edgeMaxWidth = getGraphConstant('EDGE_MAX_WIDTH', settings);
    const maxFontSize = getGraphConstant('MAX_FONT_SIZE', settings);

    return (
        <g transform={`translate(${labelX},${labelY}) rotate(${angle < 90 && angle > -90 ? angle : angle + 180})`}>
            <foreignObject
                x={-edgeMaxWidth / 2}
                y={-maxFontSize * 1.5}
                width={edgeMaxWidth}
                height={maxFontSize * 5}
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
    selectedEdge,
    isCreatingEdge,
    edgeStart,
    onNodeClick,
    onNodeEdit,
    onNodeDelete,
    onEdgeCreate,
    onEdgeEdit,
    onEdgeDelete,
    onNodeDragEnd,
    onNodesDragEnd,
    onMarkObsolete,
    selectedStartNodes,
    selectedGoalNodes,
    isAutocompleteModeActive,
    onMultiSelect,
    expandedNodes,
    onNodeDragOver,
    onNodeDrop,
    isCtrlPressed,
    isTimelineActive,
    timelineStartDate,
    currentScale,
    transformState
}: NodeGraphProps & { isCtrlPressed: boolean; currentScale: number; transformState: any }) {
    const { settings } = useSettings();
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
    const transformContext = useTransformContext();

    // Filter visible nodes
    const visibleNodes = nodes.filter(node => {
        // Show if node has no parent
        if (!node.parentId) return true;
        // Show if parent is expanded
        return expandedNodes.has(node.parentId);
    });

    // Filter visible edges - only show edges where both nodes are visible
    const visibleEdges = edges.filter(edge => {
        const sourceVisible = visibleNodes.some(node => node.id === edge.source);
        const targetVisible = visibleNodes.some(node => node.id === edge.target);
        return sourceVisible && targetVisible;
    });

    const getTransformedPoint = (clientX: number, clientY: number) => {
        const rect = document.querySelector('.graph-container')?.getBoundingClientRect();
        if (!rect || !transformContext?.transformState) return { x: 0, y: 0 };

        const { scale, positionX, positionY } = transformContext.transformState;
        
        // Adjust for both scale and position in a single step
        const x = (clientX - rect.left - positionX) / scale;
        const y = (clientY - rect.top - positionY) / scale;
        
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
        setSelectionBox(prev => {
            const next = {
                start: prev!.start,
                current: point
            };
            return next;
        });
    };

    const handleMouseUp = () => {
        if (!selectionBox) return;
        
        const selectedIds = visibleNodes.filter(node => {
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

    const handleNodeDragEnd = (id: number, x: number, y: number) => {
        console.log('Node drag end:', { id, x, y });
        console.log('Selected nodes:', Array.from(selectedNodes));
        
        // Find the dragged node to calculate the delta
        const draggedNode = nodes.find(n => n.id === id);
        if (!draggedNode) {
            console.log('Could not find dragged node:', id);
            return;
        }

        console.log('Dragged node:', draggedNode);
        const deltaX = x - draggedNode.x;
        const deltaY = y - draggedNode.y;
        console.log('Delta:', { deltaX, deltaY });

        // If we have multiple nodes selected, move them all
        if (selectedNodes.has(id) && selectedNodes.size > 1) {
            console.log('Moving multiple nodes');
            // Create an array of updates
            const updates = Array.from(selectedNodes).map(selectedId => {
                const node = nodes.find(n => n.id === selectedId);
                if (!node) {
                    console.log('Could not find selected node:', selectedId);
                    return null;
                }
                
                console.log('Moving node:', node);
                let newX = node.x + deltaX;
                let newY = node.y + deltaY;
                console.log('New position:', { newX, newY });

                // Snap to grid if timeline is active
                if (isTimelineActive && transformContext?.transformState) {
                    const timeScale = getTimelineConfig(currentScale);
                    const pixelsPerUnit = getPixelsPerUnit(timeScale);
                    const config: TimelineConfig = {
                        scale: timeScale,
                        pixelsPerUnit,
                        startDate: timelineStartDate
                    };
                    newX = snapToGrid(newX, config);
                    console.log('Snapped X:', newX);
                }

                return { id: selectedId, x: newX, y: newY };
            }).filter(update => update !== null) as { id: number; x: number; y: number }[];

            // Use batch update if available
            if (onNodesDragEnd) {
                onNodesDragEnd(updates);
            } else {
                // Fallback to individual updates
                updates.forEach(update => {
                    onNodeDragEnd(update.id, update.x, update.y);
                });
            }
        } else {
            console.log('Moving single node');
            // Single node movement
            if (isTimelineActive && transformContext?.transformState) {
                const timeScale = getTimelineConfig(currentScale);
                const pixelsPerUnit = getPixelsPerUnit(timeScale);
                const config: TimelineConfig = {
                    scale: timeScale,
                    pixelsPerUnit,
                    startDate: timelineStartDate
                };
                x = snapToGrid(x, config);
                console.log('Snapped single node X:', x);
            }
            onNodeDragEnd(id, x, y);
        }
    };

    return (
        <div 
            className="w-full h-full relative graph-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <svg 
                className="absolute inset-0 pointer-events-none"
                style={{ width: `${GRAPH_CONSTANTS.CANVAS_SIZE}px`, height: `${GRAPH_CONSTANTS.CANVAS_SIZE}px` }}
            >
                {/* Timeline grid */}
                {isTimelineActive && (
                    <TimelineGrid
                        startDate={timelineStartDate}
                        scale={currentScale}
                        transformState={transformState}
                    />
                )}

                {/* Render edges */}
                {visibleEdges.map(edge => {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    const targetNode = nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;

                    // Calculate unit vector
                    const dx = targetNode.x - sourceNode.x;
                    const dy = targetNode.y - sourceNode.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const unitDx = dx / length;
                    const unitDy = dy / length;

                    const nodeRadius = getGraphConstant('NODE_RADIUS', settings);
                    const arrowSize = getGraphConstant('ARROW_SIZE', settings);
                    const edgeStrokeWidth = getGraphConstant('EDGE_STROKE_WIDTH', settings);

                    // Calculate start and end points with offset for node radius and arrow
                    const startX = sourceNode.x + (unitDx * (nodeRadius + arrowSize));
                    const startY = sourceNode.y + (unitDy * (nodeRadius + arrowSize));
                    const endX = targetNode.x - (unitDx * (nodeRadius + arrowSize));
                    const endY = targetNode.y - (unitDy * (nodeRadius + arrowSize));

                    // Calculate arrow points
                    const arrowX = endX;
                    const arrowY = endY;
                    const angle = Math.atan2(dy, dx);
                    const arrowAngle = Math.PI / 6; // 30 degrees

                    const arrowPoint1X = arrowX - arrowSize * Math.cos(angle - arrowAngle);
                    const arrowPoint1Y = arrowY - arrowSize * Math.sin(angle - arrowAngle);
                    const arrowPoint2X = arrowX - arrowSize * Math.cos(angle + arrowAngle);
                    const arrowPoint2Y = arrowY - arrowSize * Math.sin(angle + arrowAngle);

                    const isSelected = edge.id === selectedEdge;
                    const strokeColor = edge.isObsolete ? '#ef4444' : (isSelected ? '#3b82f6' : '#94a3b8');

                    return (
                        <g key={edge.id}>
                            {/* Edge line */}
                            <line
                                x1={startX}
                                y1={startY}
                                x2={endX}
                                y2={endY}
                                stroke={strokeColor}
                                strokeWidth={edgeStrokeWidth}
                                strokeDasharray={edge.isPlanned ? '5,5' : 'none'}
                                className="cursor-pointer"
                                onClick={() => onEdgeEdit(edge)}
                            />
                            {/* Arrow */}
                            <path
                                d={`M ${arrowX} ${arrowY} L ${arrowPoint1X} ${arrowPoint1Y} L ${arrowPoint2X} ${arrowPoint2Y} Z`}
                                fill={strokeColor}
                                className="cursor-pointer"
                                onClick={() => onEdgeEdit(edge)}
                            />
                            {/* Edge label */}
                            {edge.title && (
                                <WrappedEdgeLabel
                                    text={edge.title}
                                    x1={startX}
                                    y1={startY}
                                    x2={endX}
                                    y2={endY}
                                    className={edge.isObsolete ? 'text-red-500' : ''}
                                />
                            )}
                        </g>
                    );
                })}

                {/* Selection box */}
                {selectionBox && (
                    <rect
                        x={Math.min(selectionBox.start.x, selectionBox.current.x)}
                        y={Math.min(selectionBox.start.y, selectionBox.current.y)}
                        width={Math.abs(selectionBox.current.x - selectionBox.start.x)}
                        height={Math.abs(selectionBox.current.y - selectionBox.start.y)}
                        fill="rgba(59, 130, 246, 0.1)"
                        stroke="#3b82f6"
                        strokeWidth="1"
                    />
                )}
            </svg>

            {visibleNodes.map(node => (
                <NodeComponent
                    key={node.id}
                    node={node}
                    nodes={nodes}
                    isSelected={node.id === selectedNode}
                    isMultiSelected={selectedNodes.has(node.id)}
                    isCreatingEdge={isCreatingEdge}
                    isEdgeStart={node.id === edgeStart}
                    onNodeClick={onNodeClick}
                    onNodeEdit={onNodeEdit}
                    onNodeDelete={onNodeDelete}
                    onEdgeCreate={onEdgeCreate}
                    onDragEnd={handleNodeDragEnd}
                    onMarkObsolete={onMarkObsolete}
                    isStartNode={selectedStartNodes.includes(node.id)}
                    isGoalNode={selectedGoalNodes.includes(node.id)}
                    isAutocompleteModeActive={isAutocompleteModeActive}
                    onToggleExpand={(id) => {
                        const node = nodes.find(n => n.id === id);
                        if (!node) return;
                        const newExpanded = !node.isExpanded;
                        const updatedNode = { ...node, isExpanded: newExpanded };
                        onNodeEdit(updatedNode);
                    }}
                    onDragOver={onNodeDragOver}
                    onNodeDrop={onNodeDrop}
                    scale={transformState?.scale || 1}
                />
            ))}
        </div>
    );
}

export function NodeGraph({
    nodes,
    edges,
    selectedNode,
    selectedNodes,
    selectedEdge,
    isCreatingEdge,
    edgeStart,
    onNodeClick,
    onNodeEdit,
    onNodeDelete,
    onEdgeCreate,
    onEdgeEdit,
    onEdgeDelete,
    onNodeDragEnd,
    onNodesDragEnd,
    onMarkObsolete,
    selectedStartNodes,
    selectedGoalNodes,
    isAutocompleteModeActive,
    onMultiSelect,
    expandedNodes,
    onNodeDragOver,
    onNodeDrop,
    isTimelineActive,
    timelineStartDate
}: NodeGraphProps) {
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    const [currentScale, setCurrentScale] = useState(1);
    const [transformState, setTransformState] = useState<any>(null);

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
        <div className="relative w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <TransformWrapper
                initialScale={1}
                minScale={0.01}
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
                onTransformed={(ref, state) => {
                    setCurrentScale(state.scale);
                    setTransformState(state);
                }}
            >
                <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{ width: '100%', height: '100%' }}
                >
                    <div className="graph-container w-full h-full relative">
                        <GraphContent
                            nodes={nodes}
                            edges={edges}
                            selectedNode={selectedNode}
                            selectedNodes={selectedNodes}
                            selectedEdge={selectedEdge}
                            isCreatingEdge={isCreatingEdge}
                            edgeStart={edgeStart}
                            onNodeClick={onNodeClick}
                            onNodeEdit={onNodeEdit}
                            onNodeDelete={onNodeDelete}
                            onEdgeCreate={onEdgeCreate}
                            onEdgeEdit={onEdgeEdit}
                            onEdgeDelete={onEdgeDelete}
                            onNodeDragEnd={onNodeDragEnd}
                            onNodesDragEnd={onNodesDragEnd}
                            onMarkObsolete={onMarkObsolete}
                            selectedStartNodes={selectedStartNodes}
                            selectedGoalNodes={selectedGoalNodes}
                            isAutocompleteModeActive={isAutocompleteModeActive}
                            onMultiSelect={onMultiSelect}
                            expandedNodes={expandedNodes}
                            onNodeDragOver={onNodeDragOver}
                            onNodeDrop={onNodeDrop}
                            isCtrlPressed={isCtrlPressed}
                            isTimelineActive={isTimelineActive}
                            timelineStartDate={timelineStartDate}
                            currentScale={currentScale}
                            transformState={transformState}
                        />
                    </div>
                </TransformComponent>
                <ZoomControls />
            </TransformWrapper>
        </div>
    );
}