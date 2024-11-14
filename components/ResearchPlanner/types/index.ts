export interface GraphNode {
    id: number;
    title: string;
    x: number;
    y: number;
    description: string;
    files?: AttachedFile[];
    isPlanned?: boolean;
    metadata?: Record<string, any>;
  }
  
  export interface Edge {
    id: number;
    source: number;
    target: number;
    title: string;
    description: string;
    isPlanned: boolean;
    isObsolete: boolean;
  }
  
  export interface AttachedFile {
    id: number;
    name: string;
    type: 'meeting' | 'slide' | 'pdf' | 'literature';
    url: string;
    uploadedAt: Date;
  }
  
  export interface Position {
    x: number;
    y: number;
  }