# Subgraph Implementation in ResearchPlanner

## Overview
The subgraph functionality allows users to create hierarchical relationships between nodes, with parent nodes able to expand/collapse to show/hide their child nodes. Users can create hierarchies both top-down (adding subnodes) and bottom-up (collapsing existing nodes into a parent).

## Implemented Features

### 1. Data Structure Updates
- Added new fields to `GraphNode` interface:
  ```typescript
  parentId?: number | null;    // Reference to parent node
  childNodes?: number[];       // Array of child node IDs
  isExpanded?: boolean;        // Whether subnodes are currently visible
  ```

### 2. Visual Components

#### Node Component
- Added visual stack effect for parent nodes using multiple layered circles
- Implemented expand/collapse button with chevron icon
- Added opacity transitions for expanded state
- Visual indicators:
  - Three stacked circles behind parent nodes
  - Opacity changes for expanded state (30% when expanded)
  - Chevron rotation animation for expand/collapse

#### NodeGraph Component
- Implemented node visibility filtering based on parent expansion state
- Added edge visibility filtering (only shows edges between visible nodes)
- Maintains proper SVG overflow for edges in negative coordinates
- Supports multi-select for node grouping

### 3. State Management
- Added `expandedNodes: Set<number>` to track expanded state
- Added `selectedNodes: Set<number>` for multi-selection
- Implemented handlers:
  ```typescript
  handleAddSubnode(): Creates new child node under selected parent
  handleEditNode(): Manages node expansion state
  handleCollapseToNode(): Creates parent node from selected nodes
  ```
- ESC key handler for collapsing nodes

### 4. User Interface
- Added "Add Subnode" button in Toolbar (active when single node selected)
- Added "Collapse to Node" button (appears when multiple nodes selected)
- Parent nodes show expansion controls on hover
- Semi-transparent state for expanded parent nodes

### 5. Testing
Implemented test suite covering:
- Parent/child node visibility
- Edge visibility based on node expansion
- Expansion state management
- Node editing and state updates

## User Interaction Flow

1. **Creating Subnodes (Top-down)**
   - Select a parent node
   - Click "Add Subnode" button
   - Enter subnode title
   - Parent automatically expands to show new child

2. **Creating Parent Nodes (Bottom-up)**
   - Select multiple nodes using Ctrl+click or Ctrl+drag
   - "Add Subnode" button changes to "Collapse to Node"
   - Enter title for new parent node
   - Click "Collapse to Node" to create parent
   - Selected nodes become children of new parent
   - Parent node is positioned at average of child positions

3. **Managing Visibility**
   - Click expand/collapse button on parent node
   - Use ESC key to collapse selected parent node
   - Visual feedback through opacity and chevron rotation

4. **Edge Behavior**
   - Edges automatically hide/show with node visibility
   - Only edges between visible nodes are rendered

## Technical Details

### Node Visibility Logic
```typescript
const visibleNodes = nodes.filter(node => {
    if (!node.parentId) return true;
    return expandedNodes.has(node.parentId);
});
```

### Edge Visibility Logic
```typescript
const visibleEdges = edges.filter(edge => {
    const sourceVisible = visibleNodes.some(node => node.id === edge.source);
    const targetVisible = visibleNodes.some(node => node.id === edge.target);
    return sourceVisible && targetVisible;
});
```

### Node Collapse Logic
```typescript
const handleCollapseToNode = () => {
    // Calculate average position of selected nodes
    const avgX = selectedNodes.reduce((sum, n) => sum + n.x, 0) / selectedNodes.length;
    const avgY = selectedNodes.reduce((sum, n) => sum + n.y, 0) / selectedNodes.length;

    // Create parent node at average position
    const parentNode = {
        id: getNextId(),
        title: newItemTitle,
        x: avgX,
        y: avgY,
        childNodes: selectedNodesList,
        isExpanded: true
    };

    // Update child nodes with new parent
    const updatedNodes = nodes.map(node => 
        selectedNodes.has(node.id) 
            ? { ...node, parentId: parentNode.id }
            : node
    );
};
```

## Future Enhancements
1. Multi-level expansion controls (expand all children)
2. Improved layout algorithms for subnodes
3. Bulk operations on node hierarchies
4. Visual indicators for nested depth
5. Collapsible node groups
6. Drag-and-drop hierarchy creation
7. Automatic subnode arrangement patterns

## Known Limitations
- Currently only supports single-level parent-child relationships
- Manual positioning of child nodes
- No bulk expansion/collapse operations
- No drag-and-drop support for hierarchy creation 