'use client';

import React, { useRef, useState } from 'react';
import { X, Ban, ChevronDown } from 'lucide-react';
import type { GraphNode, Point } from '../../types/index';
import { GRAPH_CONSTANTS } from '../../constants';
import { useTransformContext } from 'react-zoom-pan-pinch';
import { ScalingText } from '../shared/ScalingText';
import { getTimelineConfig, getPixelsPerUnit, snapToGrid } from '../../utils/timeline';
import type { TimelineConfig } from '../../utils/timeline';
import { useColorGenerator } from '../../hooks/useColorGenerator';

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
    const levelScale = Math.pow(0.8, hierarchyLevel); // Each level is 80% of its parent
    const nodeScale = Math.min(Math.max(1 / scale, MIN_SCALE), MAX_SCALE) * levelScale;
    const scaledDiameter = GRAPH_CONSTANTS.NODE_DIAMETER * nodeScale;
    const scaledRadius = GRAPH_CONSTANTS.NODE_RADIUS * nodeScale;

    // Use stored color or generate new one
    const hullColor = node.hullColor || getNextColor();

    const handleDragStart = (e: React.DragEvent) => {
        if (!nodeRef.current) return;
        
        const rect = nodeRef.current.getBoundingClientRect();
        setDragOffset({
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
            className={`absolute cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
            style={{
                left: node.x - scaledRadius,
                top: node.y - scaledRadius,
                width: scaledDiameter,
                height: scaledDiameter,
                zIndex: node.isExpanded ? 0 : (isSelected || isMultiSelected ? 2 : 1),
            }}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
        >
            {node.hullPoints && node.hullPoints.length > 0 && (
                <svg
                    className="absolute"
                    style={{
                        left: -1000,  // Large offset to ensure hull is visible
                        top: -1000,
                        width: 2000,  // Large size to accommodate hull
                        height: 2000,
                        pointerEvents: 'none',  // SVG container shouldn't capture events
                        zIndex: -1,  // Put hull behind all nodes
                        overflow: 'visible'  // Allow negative coordinates
                    }}
                >
                    {(() => {
                        const adjustedPoints = node.hullPoints.map(p => ({
                            x: p.x - (node.x - scaledRadius) + 1000,
                            y: p.y - (node.y - scaledRadius) + 1000
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
                            width: scaledDiameter * 0.8,
                            height: scaledDiameter * 0.8,
                            transform: `translate(${4 * nodeScale * 0.8}px, ${4 * nodeScale * 0.8}px)`
                        }}
                    />
                    <div className={`absolute rounded-full border-2 border-slate-300 bg-white
                        ${node.isObsolete ? 'opacity-45' : 'opacity-65'}`}
                        style={{
                            width: scaledDiameter * 0.8,
                            height: scaledDiameter * 0.8,
                            transform: `translate(${2 * nodeScale * 0.8}px, ${2 * nodeScale * 0.8}px)`
                        }}
                    />
                    <div className="absolute rounded-full border-2 border-slate-300 bg-white opacity-30"
                        style={{
                            width: (scaledDiameter - (10 * nodeScale)) * 0.8,
                            height: (scaledDiameter - (10 * nodeScale)) * 0.8,
                            transform: `translate(${8 * nodeScale * 0.8}px, ${8 * nodeScale * 0.8}px)`
                        }}
                    />
                </>
            )}
            
            <div
                className={`relative cursor-pointer flex items-center justify-center
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
                    width: scaledDiameter,
                    height: scaledDiameter,
                    transform: `scale(${nodeScale})`
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