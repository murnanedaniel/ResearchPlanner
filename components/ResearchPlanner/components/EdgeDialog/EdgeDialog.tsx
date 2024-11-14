'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Edge } from '../../types';
import { Checkbox } from '@/components/ui/checkbox';

interface EdgeDialogProps {
  isOpen: boolean;
  edge: Edge | null;
  description: string;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
}

export function EdgeDialog({
  isOpen,
  edge,
  description,
  onDescriptionChange,
  onClose
}: EdgeDialogProps) {
  if (!edge) return null;

  const [isPlanned, setIsPlanned] = useState(edge.isPlanned);
  const [isObsolete, setIsObsolete] = useState(edge.isObsolete);

  const handleClose = () => {
    edge.isPlanned = isPlanned;
    edge.isObsolete = isObsolete;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Edge</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Edge description..."
            className="min-h-[100px]"
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="planned"
                checked={isPlanned}
                onCheckedChange={(checked) => setIsPlanned(checked as boolean)}
              />
              <label htmlFor="planned">Planned Path</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="obsolete"
                checked={isObsolete}
                onCheckedChange={(checked) => setIsObsolete(checked as boolean)}
              />
              <label htmlFor="obsolete">Obsolete</label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
