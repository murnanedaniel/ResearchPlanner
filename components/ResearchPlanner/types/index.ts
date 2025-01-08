export interface GraphNode {
    id: number;
    title: string;
    description: string;
    x: number;
    y: number;
    isObsolete: boolean;
    files?: FileAttachment[];
    parentId?: number | null;
    childNodes?: number[];
    isExpanded?: boolean;
  }
  
  export interface FileAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
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
  
  export interface SelectionBox {
    start: { x: number; y: number };
    current: { x: number; y: number };
  }
  
  export type NodeClickHandler = (node: GraphNode, event?: React.MouseEvent) => void;
  
  export interface GraphData {
    nodes: GraphNode[];
    edges: Edge[];
    timelineActive?: boolean;
    timelineStartDate?: string;  // ISO string format for date
  }