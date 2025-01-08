# Timeline Feature Implementation Plan

## Overview
The timeline feature adds temporal organization to the research graph by overlaying a date-based grid and implementing date-aligned snapping behavior. The timeline is optional and can be toggled via a checkbox in the toolbar. The grid moves with the graph, maintaining the graph's natural coordinate system while providing temporal context.

## Core Components

### 1. Timeline Controls
- [ ] Add timeline toggle checkbox to Toolbar
- [ ] Add DatePicker component for start date selection
- [ ] Add timeline state persistence to useGraphPersistence

### 2. Grid Visualization
- [ ] Create TimelineGrid component
  - Render SVG grid lines that move with the graph
  - Calculate grid spacing based on zoom
  - Handle different time scales (monthly/weekly/daily)
  - Implement date labels
  - Add "current date" indicator line
- [ ] Add grid positioning system
  - Map x-coordinates to dates (for display only)
  - Handle zoom level transitions

### 3. Node Snapping
- [ ] Implement snap-to-grid functionality
  - Modify node drag behavior when timeline is active
  - Snap x-coordinate to nearest grid line
  - Preserve y-coordinate movement
  - Keep existing node position system

### 4. Zoom Management
- [ ] Implement zoom level detection
  - Track current zoom level
  - Define thresholds for different time scales
- [ ] Create time scale transitions
  - Monthly view (zoom < 0.5)
  - Weekly view (0.5 <= zoom < 1.5)
  - Daily view (zoom >= 1.5)

## Implementation Steps

### Phase 1: Basic Timeline UI
1. Add timeline toggle to Toolbar
   ```typescript
   interface TimelineControlsProps {
     isActive: boolean;
     startDate: Date;
     onToggle: (active: boolean) => void;
     onDateChange: (date: Date) => void;
   }
   ```

2. Implement timeline state
   ```typescript
   // In ResearchPlanner
   const [isTimelineActive, setTimelineActive] = useState(false);
   const [timelineStartDate, setTimelineStartDate] = useState<Date>(new Date());
   ```

### Phase 2: Grid System
1. Implement grid calculations
   ```typescript
   interface GridConfig {
     scale: 'monthly' | 'weekly' | 'daily';
     pixelsPerUnit: number;
     startDate: Date;
   }
   ```

2. Create TimelineGrid component
   ```typescript
   interface TimelineGridProps {
     config: GridConfig;
     transform: Transform;  // Current graph transform
     className?: string;
   }
   ```

3. Add grid rendering
   ```typescript
   function calculateGridLines(
     config: GridConfig,
     transform: Transform,
     viewportWidth: number
   ): Array<{x: number, label: string}> {
     // Calculate visible grid lines based on scale and transform
   }
   ```

### Phase 3: Snapping Behavior
1. Modify node drag handler
   ```typescript
   function handleNodeDrag(e: MouseEvent, node: Node) {
     if (isTimelineActive) {
       const newX = snapToNearestGrid(e.clientX, gridConfig);
       const newY = e.clientY;  // Y moves freely
       updateNodePosition(node.id, newX, newY);
     } else {
       // Existing drag behavior
     }
   }
   ```

2. Implement snap calculation
   ```typescript
   function snapToNearestGrid(x: number, config: GridConfig): number {
     const gridSize = config.pixelsPerUnit;
     return Math.round(x / gridSize) * gridSize;
   }
   ```

### Phase 4: Polish & Performance
1. Visual enhancements
   - Style grid lines (light gray, semi-transparent)
   - Style date labels (small, unobtrusive)
   - Style current date indicator (bold, distinctive color)
   - Add smooth transitions for zoom changes

2. Performance optimizations
   - Only render visible grid lines
   - Debounce zoom calculations
   - Optimize snap calculations during drag

## Technical Details

### Grid Rendering Strategy
```typescript
function renderGrid(config: GridConfig, transform: Transform) {
  const visibleGridLines = calculateVisibleGridLines(config, transform);
  
  return (
    <g className="timeline-grid">
      {visibleGridLines.map(line => (
        <>
          <line 
            x1={line.x} 
            x2={line.x} 
            y1={0} 
            y2="100%" 
            className="grid-line"
          />
          <text 
            x={line.x} 
            y={20} 
            className="grid-label"
          >
            {line.label}
          </text>
        </>
      ))}
      <line 
        x1={currentDateX} 
        x2={currentDateX} 
        y1={0} 
        y2="100%" 
        className="current-date-line"
      />
    </g>
  );
}
```

## Testing Strategy

1. Unit Tests
   - Grid line calculations
   - Snap-to-grid logic
   - Zoom level detection

2. Integration Tests
   - Timeline toggle behavior
   - Node drag behavior with timeline
   - Grid scale transitions

3. Visual Tests
   - Grid rendering
   - Date label placement
   - Current date indicator
   - Snap animation smoothness

## Future Enhancements

1. Visual Improvements
   - Customizable grid styles
   - Better date formatting
   - Zoom level indicator
   - Mini-timeline overview

2. UX Enhancements
   - Keyboard shortcuts for timeline toggle
   - Click-to-jump to date
   - Timeline scroll/zoom controls 