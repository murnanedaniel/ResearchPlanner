# Node System

The node system is the core building block of ResearchGraph, providing a flexible way to represent research components.

## Node Structure

```typescript
interface Node {
    id: number;
    title: string;
    description: string;
    x: number;
    y: number;
    isObsolete: boolean;
    parentId?: number;
    childNodes?: number[];
    isExpanded?: boolean;
}
```

## Features

### Creation and Editing
- Click-to-create interface
- Rich text description editor
- Drag-and-drop positioning
- Title and metadata editing

### Hierarchical Management
- Parent-child relationships
- Subgraph visualization
- Expand/collapse functionality
- Visual nesting indicators

### Timeline Integration
- Date-based positioning
- Automatic timeline snapping
- Visual date indicators
- Temporal organization

### Visual States
- Selection highlighting
- Expansion state
- Obsolescence marking
- Parent/child indicators

## Usage Examples

### Basic Node Creation
```typescript
const node = {
    id: 1,
    title: "Research Task",
    description: "Description of the task",
    x: 100,
    y: 200,
    isObsolete: false
};
```

### Hierarchical Node
```typescript
const parentNode = {
    id: 1,
    title: "Parent Task",
    childNodes: [2, 3],
    isExpanded: true
};

const childNode = {
    id: 2,
    title: "Child Task",
    parentId: 1
};
``` 