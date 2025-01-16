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
        console.log('\n=== NodeGraph Drag End ===');
        console.log('Initial position:', { id, x, y });
        
        // Find the dragged node to calculate the delta
        const draggedNode = nodes.find(n => n.id === id);
        if (!draggedNode) {
            console.log('Could not find dragged node:', id);
            return;
        }

        // x and y are now center coordinates
        console.log('Dragged node current position:', {
            id: draggedNode.id,
            x: draggedNode.x,
            y: draggedNode.y
        });
        
        const deltaX = x - draggedNode.x;
        const deltaY = y - draggedNode.y;
        console.log('Movement delta:', { deltaX, deltaY });

        // If timeline is active, log grid details
        if (isTimelineActive && transformContext?.transformState) {
            const timeScale = getTimelineConfig(currentScale);
            const pixelsPerUnit = getPixelsPerUnit(timeScale);
            console.log('Timeline grid:', {
                timeScale,
                pixelsPerUnit,
                viewScale: currentScale,
                proposedX: x,
                nearestGridLine: Math.round(x / pixelsPerUnit) * pixelsPerUnit
            });
        }

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
                let newX = node.x + deltaX;  // node.x is center position
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
                    newX = snapToGrid(newX, config);  // Snap center position to grid
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
                x = snapToGrid(x, config);  // Snap center position to grid
                console.log('Snapped single node X:', x);
            }
            onNodeDragEnd(id, x, y);
        }
    };

    return (
        <div 
            className="relative"
            style={{ width: `${GRAPH_CONSTANTS.CANVAS_SIZE}px`, height: `${GRAPH_CONSTANTS.CANVAS_SIZE}px` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <svg className="absolute top-0 left-0 w-full h-full overflow-visible" style={{ zIndex: 0 }}>
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

                {/* Container Border */}
                <rect
                    x="0"
                    y="0"
                    width={GRAPH_CONSTANTS.CANVAS_SIZE}
                    height={GRAPH_CONSTANTS.CANVAS_SIZE}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="8 8"
                />
                
                {/* Timeline Grid */}
                {isTimelineActive && (
                    <TimelineGrid
                        startDate={timelineStartDate}
                        className="pointer-events-none"
                        scale={currentScale}
                        transformState={transformContext?.transformState}
                    />
                )}
                
                {/* Selection Box */}
                {selectionBox && (
                    <rect
                        x={Math.min(selectionBox.start.x, selectionBox.current.x)}
                        y={Math.min(selectionBox.start.y, selectionBox.current.y)}
                        width={Math.abs(selectionBox.current.x - selectionBox.start.x)}
                        height={Math.abs(selectionBox.current.y - selectionBox.start.y)}
                        className="fill-blue-100 fill-opacity-20 stroke-blue-500 stroke-2"
                        style={{ pointerEvents: 'none' }}
                        data-testid="selection-box"
                    />
                )}
                
                {visibleEdges.map(edge => {
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

                    const nodeRadius = getGraphConstant('NODE_RADIUS', settings);
                    const arrowSize = getGraphConstant('ARROW_SIZE', settings);

                    // Adjust start and end points by node radius
                    const startX = sourceNode.x + (unitDx * (nodeRadius + arrowSize));
                    const startY = sourceNode.y + (unitDy * (nodeRadius + arrowSize));
                    const endX = targetNode.x - (unitDx * (nodeRadius + arrowSize));
                    const endY = targetNode.y - (unitDy * (nodeRadius + arrowSize));

                    return (
                        <g 
                            key={edge.id}
                            className="cursor-pointer group"
                            onClick={(e) => {
                                e.stopPropagation();
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
                                strokeWidth={getGraphConstant('EDGE_STROKE_WIDTH', settings)}
                                markerEnd="url(#arrowhead)"
                                className={`group-hover:stroke-blue-500 ${edge.isObsolete ? 'opacity-50' : ''} ${edge.id === selectedEdge ? 'stroke-blue-500 stroke-[3]' : ''}`}
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
        <div className="relative w-full h-full border border-gray-200 rounded-lg graph-container overflow-hidden bg-white shadow-sm">
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
                    // Single source of truth for all transform updates
                    setCurrentScale(state.scale);
                    setTransformState(state);
                    
                    // Update data attributes directly from transform state
                    const container = document.querySelector('.graph-container');
                    if (container) {
                        container.setAttribute('data-scale', state.scale.toString());
                        container.setAttribute('data-position-x', state.positionX.toString());
                        container.setAttribute('data-position-y', state.positionY.toString());
                    }
                }}
            >
                <TransformComponent
                    wrapperClass="w-full h-full"
                    contentClass="w-full h-full relative"
                >
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
                </TransformComponent>
                <ZoomControls />
            </TransformWrapper>
        </div>
    );
}