'use client';

import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ToolbarProps {
  nodeTitle: string;
  onNodeTitleChange: (value: string) => void;
  onAddNode: () => void;
  isCreatingEdge: boolean;
  onToggleEdgeCreate: () => void;
}

export function Toolbar({
  nodeTitle,
  onNodeTitleChange,
  onAddNode,
  isCreatingEdge,
  onToggleEdgeCreate
}: ToolbarProps) {
  return (
    <div className="flex gap-2 mb-4">
      <Input
        placeholder="Node title"
        value={nodeTitle}
        onChange={(e) => onNodeTitleChange(e.target.value)}
      />
      <Button onClick={onAddNode}>Add Node</Button>
      <Button 
        variant={isCreatingEdge ? "secondary" : "outline"}
        onClick={onToggleEdgeCreate}
      >
        {isCreatingEdge ? "Cancel Edge" : "Add Edge"}
      </Button>
    </div>
  );
}