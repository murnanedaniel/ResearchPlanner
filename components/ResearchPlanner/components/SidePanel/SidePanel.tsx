'use client';

import React, { useEffect, useState } from 'react';
import { GraphNode, Edge } from '../../types';
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, markdownShortcutPlugin } from '@mdxeditor/editor';
import { Input } from "@/components/ui/input";

interface SidePanelProps {
  selectedNode: GraphNode | null;
  selectedEdge: Edge | null;
  description: string;
  onDescriptionChange: (value: string) => void;
  onTitleChange: (value: string) => void;
}

export function SidePanel({
  selectedNode,
  selectedEdge,
  description,
  onDescriptionChange,
  onTitleChange
}: SidePanelProps) {
  const title = selectedNode?.title || selectedEdge?.title || '';
  const editorKey = selectedNode ? `node-${selectedNode.id}` : selectedEdge?.id ? `edge-${selectedEdge.id}` : 'no-selection';

  return (
    <div className="w-1/3 h-full border-l p-4 bg-white flex flex-col">
      <Input
        key={`title-${editorKey}`}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={selectedNode ? "Node title" : "Edge title"}
        className="text-lg font-semibold mb-4"
      />

      <MDXEditor
        key={editorKey}
        markdown={description}
        onChange={onDescriptionChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          markdownShortcutPlugin()
        ]}
        contentEditableClassName="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
      />
    </div>
  );
}