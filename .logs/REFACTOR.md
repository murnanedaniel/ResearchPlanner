## ResearchPlanner Component Size Reduction

### Problem
The ResearchPlanner.tsx component has grown to over 1000 lines, making it difficult to maintain. We need to break it down into smaller, more manageable modules of ~200 lines each.

### Analysis

#### Current Component Statistics
- **Location**: components/ResearchPlanner/ResearchPlanner.tsx
- **Current Size**: ~1000+ lines
- **Target Size**: ~200 lines per module

#### Key Areas to Extract

1. **Calendar Integration** ✅ (2024-03-20)
   - Created `hooks/useCalendarIntegration.ts`
   - Moved all calendar-related state and effects
   - Encapsulated Google Calendar initialization
   - Unified calendar sync logic
   - Added proper TypeScript types
   - Status: Complete

2. **Node Operations**
   - Extend existing `hooks/useNodeOperations.ts`
   - Node CRUD operations
   - Parent-child relationships
   - Position management
   - Hull calculations

3. **Edge Operations**
   - Enhance existing `hooks/useEdgeOperations.ts`
   - Edge creation workflow
   - Edge update handlers
   - Edge deletion logic

4. **Drag-and-Drop System**
   - Create `hooks/useDragHandlers.ts`
   - Node dragging logic
   - Position calculations
   - Multi-select drag operations
   - Grid snapping

5. **Autocomplete Feature**
   - Create `hooks/useAutocomplete.ts`
   - Start/goal node selection
   - Path generation
   - API communication
   - State management

6. **Selection System**
   - Create `hooks/useSelectionHandlers.ts`
   - Single/multi selection
   - Keyboard shortcuts
   - Selection box logic

### Implementation Plan

1. **Phase 1: Calendar Integration** (Week 1)
   - [ ] Create useCalendarSync hook
   - [ ] Move calendar effects
   - [ ] Update ResearchPlanner imports
   - [ ] Verify calendar functionality

2. **Phase 2: Node Operations** (Week 1)
   - [ ] Extend useNodeOperations
   - [ ] Move node handlers
   - [ ] Update component logic
   - [ ] Test node operations

3. **Phase 3: Edge System** (Week 2)
   - [ ] Enhance useEdgeOperations
   - [ ] Move edge creation logic
   - [ ] Update edge handlers
   - [ ] Verify edge functionality

4. **Phase 4: Drag-and-Drop** (Week 2)
   - [ ] Create useDragHandlers
   - [ ] Move position logic
   - [ ] Update drag operations
   - [ ] Test dragging behavior

5. **Phase 5: Autocomplete** (Week 3)
   - [ ] Create useAutocomplete
   - [ ] Move pathfinding logic
   - [ ] Update UI integration
   - [ ] Test autocomplete feature

6. **Phase 6: Selection System** (Week 3)
   - [ ] Create useSelectionHandlers
   - [ ] Move selection logic
   - [ ] Update keyboard shortcuts
   - [ ] Test selection behavior

### Success Criteria
- Each extracted module is under 200 lines
- All functionality remains intact
- Test coverage maintained or improved
- Clear separation of concerns
- Improved maintainability

### Next Steps
1. Begin with Calendar Integration
2. Create test coverage baseline
3. Extract one feature at a time
4. Verify functionality after each extraction

# Refactoring Log

## 2024-03-19: Major UI Layout Refactor

### Changes
- Moved all toolbar functionality into a new collapsible side toolbar on the left side
- Organized toolbar features into accordion sections for better organization:
  - Node Operations
  - Edge Operations
  - AI Autocomplete
  - Timeline
  - Calendar Integration
  - File Operations
- Maintained the existing right side panel for node/edge editing
- Added smooth expand/collapse animation for the side toolbar
- Improved overall UI organization and accessibility

### Technical Details
- Created new `SideToolbar` component with accordion sections
- Added Radix UI components for better accessibility
- Implemented state management for toolbar expansion
- Removed old toolbar components
- Updated main layout to use a three-panel design:
  1. Collapsible left toolbar (new)
  2. Main graph area (center)
  3. Node/edge editor panel (right)

### Dependencies Added
- @radix-ui/react-accordion
- @radix-ui/react-switch
- @radix-ui/react-label
- class-variance-authority
- clsx
- tailwind-merge
