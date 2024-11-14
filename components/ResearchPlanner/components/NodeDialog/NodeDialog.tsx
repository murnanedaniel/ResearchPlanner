'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileAttachments } from './FileAttachments';
import { GraphNode } from '../../types';

interface NodeDialogProps {
  isOpen: boolean;
  node: GraphNode | null;
  description: string;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
}

export function NodeDialog({
  isOpen,
  node,
  description,
  onDescriptionChange,
  onClose,
}: NodeDialogProps) {
  if (!node) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{node.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe this experiment or checkpoint..."
              className="h-32"
            />
          </div>

          <FileAttachments node={node} />
        </div>
      </DialogContent>
    </Dialog>
  );
}