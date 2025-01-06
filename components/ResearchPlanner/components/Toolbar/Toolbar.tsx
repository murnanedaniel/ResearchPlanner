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
  isAutocompleteModeActive: boolean;
  onToggleAutocomplete: () => void;
  autocompleteMode: 'start' | 'goal' | null;
  isAutocompleteLoading: boolean;
}

export function Toolbar({
  nodeTitle,
  onNodeTitleChange,
  onAddNode,
  isCreatingEdge,
  onToggleEdgeCreate,
  isAutocompleteModeActive,
  onToggleAutocomplete,
  autocompleteMode,
  isAutocompleteLoading
}: ToolbarProps) {
  return (
    <div className="flex gap-4 mb-4 items-center">
      <div className="flex gap-2 items-center flex-1">
        <input
          type="text"
          value={nodeTitle}
          onChange={(e) => onNodeTitleChange(e.target.value)}
          placeholder="Node title..."
          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={onAddNode}>Add Node</Button>
      </div>

      <div className="flex gap-2">
        <Button 
          variant={isCreatingEdge ? "secondary" : "outline"}
          onClick={onToggleEdgeCreate}
        >
          {isCreatingEdge ? 'Cancel Edge' : 'Create Edge'}
        </Button>

        <Button
          variant={isAutocompleteModeActive ? "secondary" : "outline"}
          onClick={onToggleAutocomplete}
          disabled={isAutocompleteLoading}
        >
          {isAutocompleteLoading ? 'Generating...' : 
           isAutocompleteModeActive ? 
              (autocompleteMode === 'start' ? 'Select Start Node' : 'Select Goal Node') : 
              'Autocomplete'}
        </Button>
      </div>
    </div>
  );
}