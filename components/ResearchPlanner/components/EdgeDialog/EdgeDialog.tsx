'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edge } from '../../types';
import { Checkbox } from '@/components/ui/checkbox';

interface EdgeDialogProps {
  isOpen: boolean;
  edge: Edge | null;
  onClose: () => void;
}

export function EdgeDialog({ isOpen, edge, onClose }: EdgeDialogProps) {
  const [isPlanned, setIsPlanned] = React.useState(edge?.isPlanned ?? true);
  const [isObsolete, setIsObsolete] = React.useState(edge?.isObsolete ?? false);

  // Reset state when edge changes
  React.useEffect(() => {
    if (edge) {
      setIsPlanned(edge.isPlanned);
      setIsObsolete(edge.isObsolete);
    }
  }, [edge]);

  if (!edge) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edge.title || 'Edge Properties'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="planned"
              checked={isPlanned}
              onCheckedChange={(checked) => setIsPlanned(!!checked)}
            />
            <label htmlFor="planned">Planned Connection</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="obsolete"
              checked={isObsolete}
              onCheckedChange={(checked) => setIsObsolete(!!checked)}
            />
            <label htmlFor="obsolete">Obsolete Connection</label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
