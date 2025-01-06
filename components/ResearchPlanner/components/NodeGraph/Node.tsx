'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Ban } from 'lucide-react';
import { GraphNode } from '../../types';
import { GRAPH_CONSTANTS } from '../../constants';
import { useTransformContext } from 'react-zoom-pan-pinch';
import { ScalingText } from '../shared/ScalingText';

interface NodeProps {
    node: GraphNode;
    isSelected: boolean;
    isCreatingEdge: boolean;
    isEdgeStart: boolean;
    onNodeClick: (node: GraphNode) => void;
    onNodeEdit: (node: GraphNode) => void;
    onNodeDelete: (id: number) => void;
    onEdgeCreate: (id: number) => void;
    onDragEnd: (id: number, x: number, y: number) => void;
    onMarkObsolete: (id: number) => void;
    isStartNode: boolean;
    isGoalNode: boolean;
    isAutocompleteModeActive: boolean;
    isMultiSelected?: boolean;
}

export function Node({
    node,
    isSelected,
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
    isMultiSelected
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
            onDragEnd(node.id, x, y);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCreatingEdge) {
            onEdgeCreate(node.id);
        } else {
            onNodeClick(node);
        }
    };

    return (
        <div
            className={`absolute cursor-pointer flex items-center justify-center
                rounded-full border-2 border-slate-300
                ${isSelected || isMultiSelected ? 'ring-2 ring-blue-500' : ''}
                ${isCreatingEdge ? 'hover:ring-2 hover:ring-green-500' : ''}
                ${isEdgeStart ? 'ring-2 ring-green-500' : ''}
                ${node.isObsolete ? 'opacity-50' : ''}
                ${isStartNode ? 'ring-2 ring-emerald-500' : ''}
                ${isGoalNode ? 'ring-2 ring-blue-500' : ''}
                ${isAutocompleteModeActive ? 'hover:ring-2 hover:ring-purple-500' : ''}
                bg-white shadow-md group hover:border-slate-400 transition-colors`}
            style={{
                left: node.x,
                top: node.y,
                width: GRAPH_CONSTANTS.NODE_DIAMETER,
                height: GRAPH_CONSTANTS.NODE_DIAMETER,
                transform: 'translate(-50%, -50%)'
            }}
            onClick={handleClick}
            onDoubleClick={() => onNodeEdit(node)}
        >
            <div className="absolute -top-2 -right-2 flex gap-1">
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
    );
}