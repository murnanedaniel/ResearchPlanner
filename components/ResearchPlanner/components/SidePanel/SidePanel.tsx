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
    <div className="w-1/3 h-full border-l p-4 bg-white flex flex-col">
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={selectedNode ? "Node title" : "Edge title"}
        className="text-lg font-semibold mb-4"
      />

      <MDXEditor
        key={selectedNode?.id || selectedEdge?.id || 'no-selection'}
        markdown={description}
        onChange={onDescriptionChange}
        plugins={[
          headingsPlugin(),
          listsPlugin({
            checkboxClassName: 'form-checkbox h-4 w-4 text-blue-600',
            enableCheckboxes: true,
            syntax: {
              task: true,
              bullet: true,
              ordered: true
            }
          }),
          quotePlugin(),
          markdownShortcutPlugin({
            shortcuts: {
              table: true,
              thematicBreak: true,
              bold: true,
              italic: true,
              link: true,
              image: true,
              list: {
                unordered: true,
                ordered: true,
                checklist: true
              }
            }
          }),
          tablePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          imagePlugin(),
          frontmatterPlugin(),
          codeBlockPlugin({
            defaultCodeBlockLanguage: 'typescript'
          }),
          diffSourcePlugin()
        ]}
        contentEditableClassName="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none font-mono"
      />
    </div>
  );
}