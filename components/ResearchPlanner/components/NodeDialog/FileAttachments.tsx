import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, Trash2 } from 'lucide-react';
import { GraphNode } from '../../types';

interface FileAttachmentsProps {
  node: GraphNode;
}

export function FileAttachments({ node }: FileAttachmentsProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement file upload logic
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Attachments</h3>
        <div className="relative">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
            multiple
          />
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">No files attached</p>
    </div>
  );
}