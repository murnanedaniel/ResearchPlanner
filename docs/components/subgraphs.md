# Subgraph System

The subgraph system enables hierarchical organization of research components through parent-child relationships and visual grouping.

## Subgraph Structure

```typescript
interface SubgraphNode extends Node {
    parentId?: number;
    childNodes?: number[];
    isExpanded?: boolean;
    hullPoints?: Point[];
    hullColor?: { fill: string; stroke: string };
}
```

## Features

### Hierarchy Management
- Parent-child relationships
- Multi-level nesting
- Dynamic expansion
- Visual containment

### Visual Representation
- Convex hull rendering
- Hierarchical indicators
- Expansion controls
- Color coding

### Interaction
- Drag-to-nest
- Click-to-expand
- Group selection
- Bulk operations

### Integration
- Timeline compatibility
- Edge routing
- State persistence
- Layout optimization

## Usage Examples

### Creating a Subgraph
```typescript
const parentNode = {
    id: 1,
    title: "Research Project",
    childNodes: [2, 3],
    isExpanded: true,
    hullColor: {
        fill: "rgba(100, 100, 255, 0.1)",
        stroke: "rgba(100, 100, 255, 0.5)"
    }
};

const childNode = {
    id: 2,
    title: "Experiment 1",
    parentId: 1
};
```

### Hull Calculation
```typescript
// Hull points are automatically calculated
// based on child node positions
const hull = calculateHull({
    parentNode,
    childNodes: [childNode1, childNode2],
    padding: 20
});
``` 