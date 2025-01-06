'use client';

import React, { useRef } from 'react';
import { X, Ban, ChevronDown } from 'lucide-react';
import { GraphNode } from '../../types';
import { GRAPH_CONSTANTS } from '../../constants';
import { useTransformContext } from 'react-zoom-pan-pinch';
import { ScalingText } from '../shared/ScalingText';

interface NodeProps {
    node: GraphNode;
    isSelected: boolean;
    isMultiSelected: boolean;
    isCreatingEdge: boolean;
    isEdgeStart: boolean;
    onNodeClick: (node: GraphNode, event?: React.MouseEvent) => void;
    onNodeEdit: (node: GraphNode) => void;
    onNodeDelete: (id: number) => void;
    onEdgeCreate: (id: number) => void;
    onDragEnd: (id: number, x: number, y: number, isMultiDrag?: boolean) => void;
    onMarkObsolete: (id: number) => void;
    isStartNode?: boolean;
    isGoalNode?: boolean;
    isAutocompleteModeActive?: boolean;
    onToggleExpand?: (id: number) => void;
}

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
    onToggleExpand
}: NodeProps) {
    const dragStartPos = useRef({ x: 0, y: 0 });
    const transformContext = useTransformContext();

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).closest('.graph-container')?.getBoundingClientRect();
        if (rect) {
            dragStartPos.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).closest('.graph-container')?.getBoundingClientRect();
        if (rect && transformContext?.transformState) {
            const { scale, positionX, positionY } = transformContext.transformState;
            const x = ((e.clientX - rect.left) / scale) - (positionX / scale);
            const y = ((e.clientY - rect.top) / scale) - (positionY / scale);
            onDragEnd(node.id, x, y, isMultiSelected);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (isCreatingEdge) {
            onEdgeCreate(node.id);
            return;
        }

        if (isAutocompleteModeActive) {
            onNodeClick(node);
            return;
        }

        // Pass the event to allow parent to check ctrlKey
        onNodeClick(node, e);
    };

    return (
        <div className="absolute" style={{
            left: node.x,
            top: node.y,
            transform: 'translate(-50%, -50%)'
        }}>
            {(node.childNodes?.length ?? 0) > 0 && (
                <>
                    <div className={`absolute rounded-full border-2 border-slate-300 bg-white
                        ${node.isObsolete ? 'opacity-40' : 'opacity-60'}`}
                        style={{
                            width: GRAPH_CONSTANTS.NODE_DIAMETER,
                            height: GRAPH_CONSTANTS.NODE_DIAMETER,
                            transform: 'translate(4px, 4px)'
                        }}
                    />
                    <div className={`absolute rounded-full border-2 border-slate-300 bg-white
                        ${node.isObsolete ? 'opacity-45' : 'opacity-65'}`}
                        style={{
                            width: GRAPH_CONSTANTS.NODE_DIAMETER,
                            height: GRAPH_CONSTANTS.NODE_DIAMETER,
                            transform: 'translate(2px, 2px)'
                        }}
                    />
                    <div className="absolute rounded-full border-2 border-slate-300 bg-white opacity-30"
                        style={{
                            width: GRAPH_CONSTANTS.NODE_DIAMETER - 10,
                            height: GRAPH_CONSTANTS.NODE_DIAMETER - 10,
                            transform: 'translate(8px, 8px)'
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
                    width: GRAPH_CONSTANTS.NODE_DIAMETER,
                    height: GRAPH_CONSTANTS.NODE_DIAMETER
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
                <div
                    className="node-drag-handle w-full h-full flex items-center justify-center p-3"
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <ScalingText text={node.title} />
                </div>
            </div>
        </div>
    );
}