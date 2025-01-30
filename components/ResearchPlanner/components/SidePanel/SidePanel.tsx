'use client';

import React, { useEffect, useState } from 'react';
import { GraphNode, Edge } from '../../types';
import { 
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  quotePlugin, 
  markdownShortcutPlugin,
  tablePlugin,
  thematicBreakPlugin,
  linkPlugin,
  imagePlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  diffSourcePlugin
} from '@mdxeditor/editor';
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

  return (
    <div className="w-[400px] min-w-[400px] h-full border-l border-border bg-card flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={selectedNode ? "Node title" : "Edge title"}
          className="text-lg font-semibold"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <MDXEditor
          key={`${selectedNode?.id || 'node'}-${selectedEdge?.id || 'edge'}`}
          markdown={description}
          onChange={onDescriptionChange}
          contentEditableClassName="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            markdownShortcutPlugin(),
            tablePlugin(),
            thematicBreakPlugin(),
            linkPlugin(),
            imagePlugin(),
            frontmatterPlugin(),
            codeBlockPlugin(),
            diffSourcePlugin()
          ]}
        />
      </div>
    </div>
  );
}