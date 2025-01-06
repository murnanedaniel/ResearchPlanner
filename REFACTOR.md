# Container/Presentational Pattern Implementation

## Core Structure

```typescript
// types.ts
interface NodeProps {
  title: string;
  position: { x: number; y: number };
  isSelected: boolean;
  isObsolete: boolean;
  onSelect: () => void;
  onMove: (position: { x: number; y: number }) => void;
  onDelete: () => void;
}

// 1. Presentational Components
// components/presentational/NodeView.tsx
export function NodeView({
  title,
  position,
  isSelected,
  isObsolete,
  onSelect,
  onMove,
  onDelete
}: NodeProps) {
  return (
    <div 
      className={cn(
        'node',
        isSelected && 'selected',
        isObsolete && 'obsolete'
      )}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onClick={onSelect}
    >
      <div className="title">{title}</div>
      <button onClick={onDelete}>Delete</button>
    </div>
  );
}

// 2. Container Components
// components/containers/NodeContainer.tsx
export function NodeContainer({ id }: { id: number }) {
  // Data
  const node = useSelector(state => state.nodes[id]);
  const dispatch = useDispatch();

  // Handlers
  const handleSelect = useCallback(() => {
    dispatch({ type: 'SELECT_NODE', payload: id });
  }, [id]);

  const handleMove = useCallback((position) => {
    dispatch({ type: 'MOVE_NODE', payload: { id, position } });
  }, [id]);

  const handleDelete = useCallback(() => {
    dispatch({ type: 'DELETE_NODE', payload: id });
  }, [id]);

  // Render
  return (
    <NodeView
      title={node.title}
      position={node.position}
      isSelected={node.isSelected}
      isObsolete={node.isObsolete}
      onSelect={handleSelect}
      onMove={handleMove}
      onDelete={handleDelete}
    />
  );
}
```

## Implementation Steps

1. **Create Presentational Components First**
   - Focus on visual appearance
   - Accept all data via props
   - Include no business logic
   - Handle only UI events

2. **Create Container Components**
   - Handle data fetching
   - Manage state
   - Provide event handlers
   - Connect to global state

3. **Example Component Pairs**
   ```
   Presentational         Container
   -------------         ---------
   NodeView             NodeContainer
   EdgeView             EdgeContainer
   GraphView            GraphContainer
   ToolbarView          ToolbarContainer
   SidePanelView        SidePanelContainer
   ```

## Benefits

1. **Clear Separation**
   - UI components are pure functions
   - Logic is isolated in containers
   - Easy to modify either independently

2. **Reusability**
   - Presentational components are highly reusable
   - Can swap out containers for different data sources
   - Can reuse same container with different views

3. **Testing**
   - Presentational components: snapshot tests
   - Container components: logic/integration tests
   - Clear boundaries make testing easier

## Next Steps

1. **Start with Graph Component**
   ```typescript
   // GraphView.tsx
   function GraphView({ nodes, edges, onNodeSelect }) {
     return (
       <div className="graph">
         {nodes.map(node => (
           <NodeView
             key={node.id}
             {...node}
             onSelect={() => onNodeSelect(node.id)}
           />
         ))}
       </div>
     );
   }

   // GraphContainer.tsx
   function GraphContainer() {
     const nodes = useSelector(state => state.nodes);
     const dispatch = useDispatch();

     const handleNodeSelect = useCallback((id) => {
       dispatch({ type: 'SELECT_NODE', payload: id });
     }, []);

     return (
       <GraphView
         nodes={nodes}
         onNodeSelect={handleNodeSelect}
       />
     );
   }
   ```

2. **Then Node Component**
3. **Then Edge Component**
4. **Finally Toolbar and SidePanel**

Would you like to start implementing this pattern with a specific component? 