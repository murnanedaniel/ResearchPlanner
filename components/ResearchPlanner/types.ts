export interface GraphNode {
  id: number;
  title: string;
  description: string;
  x: number;
  y: number;
  isObsolete: boolean;
  childNodes?: number[];
  parentId?: number;
  isExpanded?: boolean;
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

export interface GraphData {
  /** Array of graph nodes */
  nodes: GraphNode[];
  /** Array of edges between nodes */
  edges: Edge[];
  /** Whether timeline mode is active */
  timelineActive?: boolean;
  /** ISO string format of timeline start date */
  timelineStartDate?: string;
  /** Array of node IDs that are expanded */
  expandedNodes?: number[];
} 