'use client';

import React, { useRef, useState } from 'react';
import { X, Ban, ChevronDown } from 'lucide-react';
import type { GraphNode, Point } from '../../types/index';
import { GRAPH_CONSTANTS, getGraphConstant } from '../../constants';
import { useTransformContext } from 'react-zoom-pan-pinch';
import { ScalingText } from '../shared/ScalingText';
import { getTimelineConfig, getPixelsPerUnit, snapToGrid } from '../../utils/timeline';
import type { TimelineConfig } from '../../utils/timeline';
import { useColorGenerator } from '../../hooks/useColorGenerator';
import { useSettings } from '../../context/SettingsContext';

interface NodeProps {
    node: GraphNode;
    nodes: GraphNode[];
    isSelected: boolean;
    isMultiSelected: boolean;
    isCreatingEdge: boolean;
    isEdgeStart: boolean;
    onNodeClick: (node: GraphNode, event: React.MouseEvent) => void;
    onNodeEdit: (node: GraphNode) => void;
    onNodeDelete: (id: number) => void;
    onEdgeCreate: (id: number) => void;
    onDragEnd: (id: number, x: number, y: number, isMultiDrag?: boolean) => void;
    onMarkObsolete: (id: number) => void;
    isStartNode: boolean;
    isGoalNode: boolean;
    isAutocompleteModeActive: boolean;
    onToggleExpand: (id: number) => void;
    onDragOver?: (node: GraphNode) => void;
    onNodeDrop?: (sourceId: number, targetId: number) => void;
    scale: number;
}

// Constants for node scaling
const MIN_SCALE = 1.0;  // Node won't get smaller than 100% of original size
const MAX_SCALE = 1.0;  // Node won't get larger than 100% of original size

export function Node({
    node,
    nodes,
    isSelected,
    isMultiSelected,
    isCreatingEdge,
    isEdgeStart,
    onNodeClick,
    onNodeEdit,
    onNodeDelete,
    onEdgeCreate,
    onDragEnd,
    onMarkObsolete,
    isStartNode,
    isGoalNode,
    isAutocompleteModeActive,
    onToggleExpand,
    onDragOver,
    onNodeDrop,
    scale
}: NodeProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const nodeRef = useRef<HTMLDivElement>(null);
    const transformContext = useTransformContext();
    const { getNextColor } = useColorGenerator();
    const { settings } = useSettings();
    
    // Calculate the hierarchy level of this node
    const getNodeLevel = (nodeId: number, visited = new Set<number>()): number => {
        if (visited.has(nodeId)) return 0; // Prevent infinite loops
        visited.add(nodeId);
        
        const currentNode = nodes.find(n => n.id === nodeId);
        if (!currentNode?.parentId) return 0;
        
        return 1 + getNodeLevel(currentNode.parentId, visited);
    };
    
    // Scale based on the node's level in the hierarchy
    const hierarchyLevel = getNodeLevel(node.id);
    const hierarchyLevelScale = getGraphConstant('HIERARCHY_LEVEL_SCALE', settings);
    const levelScale = Math.pow(hierarchyLevelScale, hierarchyLevel); // Scale based on settings
    const nodeScale = Math.min(Math.max(1 / scale, MIN_SCALE), MAX_SCALE) * levelScale;
    const nodeRadius = getGraphConstant('NODE_RADIUS', settings);
    const baseDiameter = nodeRadius * 2;  // Base size without scaling
    const baseRadius = nodeRadius;        // Base size without scaling

    // Calculate final dimensions for positioning
    const finalDiameter = baseDiameter * nodeScale;
    const finalRadius = baseRadius * nodeScale;

    // Use stored color or generate new one
    const hullColor = node.hullColor || getNextColor();

    const handleDragStart = (e: React.DragEvent) => {
        if (!nodeRef.current) return;
        
        const rect = nodeRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        
        console.log('=== Drag Start ===');
        console.log('Node:', {
            id: node.id,
            center: { x: node.x, y: node.y },
            leftEdge: node.x - finalRadius,
            rightEdge: node.x + finalRadius,
            scale: nodeScale,
            finalRadius,
        });
        console.log('Drag offset:', {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        
        e.dataTransfer.setData('text/plain', node.id.toString());
        setIsDragging(true);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setIsDragging(false);
        
        const rect = (e.target as HTMLElement).closest('.graph-container')?.getBoundingClientRect();
        if (!rect || !transformContext?.transformState) return;

        const { scale, positionX, positionY } = transformContext.transformState;
        const x = ((e.clientX - rect.left - positionX) / scale);
        const y = ((e.clientY - rect.top - positionY) / scale);

        console.log('=== Drag End ===');
        console.log('Transform state:', { scale, positionX, positionY });
        console.log('Raw position:', { 
            clientX: e.clientX, 
            clientY: e.clientY,
            rectLeft: rect.left,
            rectTop: rect.top
        });
        console.log('Calculated position:', { x, y });
        console.log('Node details:', {
            id: node.id,
            currentCenter: { x: node.x, y: node.y },
            proposedCenter: { x, y },
            scale: nodeScale,
            finalRadius,
            dragOffset
        });

        onDragEnd(node.id, x, y, isMultiSelected);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (onDragOver) {
            onDragOver(node);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (isCreatingEdge) {
            onEdgeCreate(node.id);
            return;
        }

        if (isAutocompleteModeActive) {
            onNodeClick(node, e);
            return;
        }

        onNodeClick(node, e);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        
        const sourceId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        console.log('Drop event - Source:', sourceId, 'Target:', node.id);
        
        if (!isNaN(sourceId) && sourceId !== node.id) {
            if (e.ctrlKey) {
                console.log('Ctrl-drop - creating parent-child relationship');
                onNodeDrop?.(sourceId, node.id);
            } else {
                console.log('Normal drop - repositioning will be handled by dragEnd');
            }
        } else {
            console.log('Invalid drop - same node or invalid ID');
        }
    };

    return (
        <div
            ref={nodeRef}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`absolute cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
            style={{
                left: node.x - (baseDiameter / 2),
                top: node.y - (baseDiameter / 2),
                width: baseDiameter,
                height: baseDiameter,
                zIndex: node.isExpanded ? 0 : (isSelected || isMultiSelected ? 2 : 1),
                transformOrigin: 'center center'
            }}
        >
            {node.hullPoints && node.hullPoints.length > 0 && (
                <svg
                    className="absolute"
                    style={{
                        left: -1000,
                        top: -1000,
                        width: 2000,
                        height: 2000,
                        pointerEvents: 'none',
                        zIndex: -1,  // Keep hull behind with negative z-index
                        overflow: 'visible'
                    }}
                >
                    {(() => {
                        const adjustedPoints = node.hullPoints.map(p => ({
                            x: p.x - (node.x - finalRadius) + 1000,
                            y: p.y - (node.y - finalRadius) + 1000
                        }));
                        const topPoint = adjustedPoints.reduce((min, p) => p.y < min.y ? p : min);

                        // Create smooth path with quadratic curves
                        const smoothPath = adjustedPoints.reduce((path, point, i, points) => {
                            if (i === 0) return `M ${point.x} ${point.y}`;
                            
                            const prev = points[i - 1];
                            const curr = point;
                            const next = points[(i + 1) % points.length];
                            
                            // Calculate the midpoint between current and next point
                            const midX = (curr.x + next.x) / 2;
                            const midY = (curr.y + next.y) / 2;
                            
                            // Use the current point as control point for a quadratic curve to the midpoint
                            return `${path} Q ${curr.x} ${curr.y}, ${midX} ${midY}`;
                        }, '');
                        
                        return (
                            <>
                                <path
                                    d={`${smoothPath} Z`}
                                    className={`
                                        transition-opacity duration-150 ease-in-out
                                        ${node.isExpanded ? 'cursor-pointer hover:[opacity:0.5]' : 'cursor-default'}
                                        ${node.isExpanded ? '[opacity:0.3]' : '[opacity:0.1]'}
                                    `}
                                    style={{ 
                                        pointerEvents: node.isExpanded ? 'auto' : 'none',
                                        fill: hullColor.fill,
                                        stroke: hullColor.stroke
                                    }}
                                    strokeWidth="2"
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onNodeClick(node, e);
                                    }}
                                />
                                {node.isExpanded && (
                                    <text
                                        x={topPoint.x}
                                        y={topPoint.y - 10}
                                        textAnchor="middle"
                                        style={{ 
                                            fill: hullColor.stroke,
                                            fontSize: `${14}px`,
                                            pointerEvents: 'none',
                                            userSelect: 'none',
                                            fontWeight: 500
                                        }}
                                    >
                                        {node.title}
                                    </text>
                                )}
                            </>
                        );
                    })()}
                </svg>
            )}

            {(node.childNodes?.length ?? 0) > 0 && !node.isExpanded && (
                <>
                    <div className={`absolute rounded-full border-2 border-slate-300 bg-white
                        ${node.isObsolete ? 'opacity-40' : 'opacity-60'}`}
                        style={{
                            width: baseDiameter,
                            height: baseDiameter,
                            transform: `translate(${4 * baseRadius / nodeRadius}px, ${4 * baseRadius / nodeRadius}px) scale(${nodeScale})`
                        }}
                    />
                    <div className={`absolute rounded-full border-2 border-slate-300 bg-white
                        ${node.isObsolete ? 'opacity-45' : 'opacity-65'}`}
                        style={{
                            width: baseDiameter,
                            height: baseDiameter,
                            transform: `translate(${2 * baseRadius / nodeRadius}px, ${2 * baseRadius / nodeRadius}px) scale(${nodeScale})`
                        }}
                    />
                    <div className="absolute rounded-full border-2 border-slate-300 bg-white opacity-30"
                        style={{
                            width: baseDiameter,
                            height: baseDiameter,
                            transform: `translate(${8 * baseRadius / nodeRadius}px, ${8 * baseRadius / nodeRadius}px) scale(${nodeScale})`
                        }}
                    />
                </>
            )}
            
            <div
                className={`absolute cursor-pointer flex items-center justify-center
                    rounded-full border-2 border-slate-300
                    ${isSelected || isMultiSelected ? 'ring-2 ring-blue-500' : ''}
                    ${isCreatingEdge ? 'hover:ring-2 hover:ring-green-500' : ''}
                    ${isEdgeStart ? 'ring-2 ring-green-500' : ''}
                    ${isStartNode ? 'ring-2 ring-emerald-500' : ''}
                    ${isGoalNode ? 'ring-2 ring-blue-500' : ''}
                    ${isAutocompleteModeActive ? 'hover:ring-2 hover:ring-purple-500' : ''}
                    ${node.isExpanded ? 'opacity-0' : node.isObsolete ? 'opacity-50' : 'opacity-100'}
                    bg-white shadow-md group hover:border-slate-400 transition-colors transition-opacity`}
                style={{
                    width: baseDiameter,
                    height: baseDiameter,
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) scale(${nodeScale})`,
                    transformOrigin: 'center center'
                }}
                onClick={handleClick}
                onDoubleClick={() => onNodeEdit(node)}
            >
                <div className="absolute -top-2 -right-2 flex gap-1">
                    {(node.childNodes?.length ?? 0) > 0 && (
                        <button
                            className="p-1 rounded-full bg-blue-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand?.(node.id);
                            }}
                            aria-label={node.isExpanded ? "Collapse" : "Expand"}
                        >
                            <ChevronDown 
                                className={`h-3 w-3 transition-transform ${node.isExpanded ? 'rotate-180' : ''}`}
                            />
                        </button>
                    )}
                    <button
                        className="p-1 rounded-full bg-yellow-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onMarkObsolete(node.id);
                        }}
                        aria-label="Mark as obsolete"
                    >
                        <Ban className="h-3 w-3" />
                    </button>
                    <button
                        className="p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeDelete(node.id);
                        }}
                        aria-label="Delete node"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
                <div className="node-drag-handle w-full h-full flex items-center justify-center p-3">
                    <ScalingText text={node.title} />
                </div>
            </div>
        </div>
    );
}