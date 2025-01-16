# Edge System

The edge system in ResearchGraph manages connections between nodes, representing relationships and dependencies in your research plan.

## Edge Structure

```typescript
interface Edge {
    id: number;
    source: number;
    target: number;
    title: string;
    description: string;
    isPlanned: boolean;
    isObsolete: boolean;
}
```

## Features

### Creation and Editing
- Interactive drag-to-connect
- Bidirectional support
- Rich text descriptions
- Status management

### Visual Representation
- Curved path rendering
- Direction indicators
- Status visualization
- Selection highlighting

### State Management
- Planned vs. completed states
- Obsolescence tracking
- Connection validation
- Automatic updates

### Integration
- Timeline awareness
- Subgraph compatibility
- Node movement handling
- Layout optimization

## Usage Examples

### Basic Edge Creation
```typescript
const edge = {
    id: 1,
    source: 1,
    target: 2,
    title: "Depends on",
    description: "Task 2 must be completed before Task 1",
    isPlanned: true,
    isObsolete: false
};
```

### Edge with Timeline
```typescript
// Edges automatically adapt to node positions
// and timeline layout changes
const timelineEdge = {
    id: 2,
    source: 3,
    target: 4,
    title: "Leads to",
    isPlanned: false
};
``` 