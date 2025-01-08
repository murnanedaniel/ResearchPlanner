'use client';

import React, { useRef, useState } from 'react';
import { X, Ban, ChevronDown } from 'lucide-react';
import { GraphNode } from '../../types';
import { GRAPH_CONSTANTS } from '../../constants';
import { useTransformContext } from 'react-zoom-pan-pinch';
import { ScalingText } from '../shared/ScalingText';
import { getTimelineConfig, getPixelsPerUnit, snapToGrid } from '../../utils/timeline';
import type { TimelineConfig } from '../../utils/timeline';

interface NodeProps {
    node: GraphNode;
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

    // Calculate the node scale based on zoom level
    const nodeScale = Math.min(Math.max(1 / scale, MIN_SCALE), MAX_SCALE);
    const scaledDiameter = GRAPH_CONSTANTS.NODE_DIAMETER * nodeScale;
    const scaledRadius = GRAPH_CONSTANTS.NODE_RADIUS * nodeScale;

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
                zIndex: isSelected || isMultiSelected ? 2 : 1,
            }}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
        >
            {(node.childNodes?.length ?? 0) > 0 && (
                <>
                    <div className={`absolute rounded-full border-2 border-slate-300 bg-white
                        ${node.isObsolete ? 'opacity-40' : 'opacity-60'}`}
                        style={{
                            width: scaledDiameter,
                            height: scaledDiameter,
                            transform: `translate(${4 * nodeScale}px, ${4 * nodeScale}px)`
                        }}
                    />
                    <div className={`absolute rounded-full border-2 border-slate-300 bg-white
                        ${node.isObsolete ? 'opacity-45' : 'opacity-65'}`}
                        style={{
                            width: scaledDiameter,
                            height: scaledDiameter,
                            transform: `translate(${2 * nodeScale}px, ${2 * nodeScale}px)`
                        }}
                    />
                    <div className="absolute rounded-full border-2 border-slate-300 bg-white opacity-30"
                        style={{
                            width: scaledDiameter - (10 * nodeScale),
                            height: scaledDiameter - (10 * nodeScale),
                            transform: `translate(${8 * nodeScale}px, ${8 * nodeScale}px)`
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
                    ${node.isExpanded ? 'opacity-30' : node.isObsolete ? 'opacity-50' : 'opacity-100'}
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