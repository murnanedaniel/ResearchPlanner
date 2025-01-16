# Timeline System

The timeline system provides temporal organization for your research plan, allowing you to schedule and visualize research components along a flexible timeline.

## Timeline Configuration

```typescript
interface TimelineConfig {
    isActive: boolean;
    startDate: Date;
    pixelsPerUnit: number;
    scale: 'daily' | 'weekly' | 'monthly';
}
```

## Features

### Time Management
- Multiple time scales
- Dynamic date calculations
- Automatic grid generation
- Date snapping

### Visual Elements
- Date grid lines
- Time scale indicators
- Node date markers
- Period highlighting

### Interaction
- Drag-to-schedule
- Scale switching
- Pan and zoom
- Date selection

### Integration
- Node positioning
- Edge routing
- Subgraph handling
- State persistence

## Usage Examples

### Timeline Setup
```typescript
const timelineConfig = {
    isActive: true,
    startDate: new Date('2024-01-01'),
    pixelsPerUnit: 100,
    scale: 'weekly'
};
```

### Node Timeline Position
```typescript
// Nodes automatically snap to timeline grid
const timelineNode = {
    id: 1,
    title: "Research Phase 1",
    x: timelineToX(new Date('2024-02-01')),
    y: 100
};
```

### Timeline Grid
```typescript
// Grid lines are generated based on scale
const gridLines = generateTimelineGrid({
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    scale: 'monthly'
});
``` 