export interface Point {
  x: number;
  y: number;
}

// Google Calendar related interfaces
export interface GoogleAuthConfig {
  clientId: string;
  apiKey: string;
}

export interface AuthResult {
  gapiInited: boolean;
  gisInited: boolean;
  isAuthenticated: boolean;
}

export interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    date: string;
    timeZone: string;
  };
  end: {
    date: string;
    timeZone: string;
  };
}

export interface GraphNode {
    id: number;
    title: string;
    description: string;
    x: number;
    y: number;
    isObsolete: boolean;
    files?: FileAttachment[];
    parentId?: number;
    childNodes?: number[];
    isExpanded?: boolean;
    hullPoints?: Point[];
    hullColor?: { fill: string; stroke: string; };
    day?: string | Date;  // Can be either a Date object or an ISO string
    calendarEventId?: string;
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
    start: Point;
    current: Point;
}
  
export type NodeClickHandler = (node: GraphNode, event?: React.MouseEvent) => void;
  
export interface GraphData {
    nodes: GraphNode[];
    edges: Edge[];
    timelineActive: boolean;
    timelineStartDate: string;
    expandedNodes: number[];
}