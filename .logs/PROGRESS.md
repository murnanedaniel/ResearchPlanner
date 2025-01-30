# Research Planner Progress Log

## Planned Features

- [ ] Add OAuth Google login
- [ ] Add Google calendar API integration, where description also goes into event description
- [ ] Add hourly history synced to cloud (need heroku database)
- [ ] Add O(100) most recent graphs in session memory (store as updates?), reduce number of saves happening! Or, at least, only add to list on certain KINDS of saves
- [ ] Add push-back feature: Hold alt and move, pushes all dependencies back by same amount
- [ ] Fix drag node appearance
- [ ] Double click to create node, (double click in hull to create child)
- [ ] Remove requirement to enter title text before creation. In fact remove the title create node text box entirely - it's an antipattern
- [ ] Add optional magnifier effect to all nodes in lens
- [X] Make all constants and variables configurable in a settings menu

## Completed Features

### 1. Configurable Settings (December 2024)
#### Completed
- **Settings Context**
  - Created SettingsContext for managing configurable values
  - Added localStorage persistence for settings
  - Added reset to defaults functionality

- **Settings Panel**
  - Added settings button to toolbar
  - Created settings panel with sliders for each value
  - Added min/max constraints for each setting

- **Configurable Values**
  - Node radius
  - Min/max font sizes
  - Edge max width
  - Arrow size
  - Line height

- **Component Updates**
  - Updated Node component to use settings
  - Updated ScalingText to use settings
  - Updated edge rendering to use settings
  - Updated TimelineGrid to use settings

### 2. Autocomplete (December 2023)
#### Completed
- **Selection & UI**
  - Autocomplete mode with start/goal node selection
  - Visual feedback for selected nodes
  - Smart node positioning logic
  - OpenAI API integration

- **Multi-Node Operations**
  - Ctrl+drag selection box
  - Bulk deletion with Delete key
  - State persistence after deletion
  - Multi-node drag movement
  - ESC key to clear all selections
  - ESC key for collapsing nodes with children

- **Context-Aware AI**
  - Full graph structure context
  - Node relationships and dependencies
  - Smart node positioning to prevent overlaps

- **Subgraph Management**
  - Subnode creation and management
  - Expand/collapse functionality
  - ESC key for quick collapse

#### Planned Improvements
- Multiple start/goal nodes support
- Alternative path suggestions
- Confidence scores for suggestions
- Step refinement capabilities
- Undo/redo for autocomplete actions
- Step-by-step node generation
- Performance optimizations for large graphs

### 3. Timeline (January 2024)
#### Completed
- **Core Functionality**
  - Timeline toggle in toolbar
  - Persistent timeline state
  - Date picker for timeline start

- **Dynamic Grid**
  - Zoom-based scale adaptation
    - Daily: high zoom
    - Weekly: medium zoom
    - Monthly: low zoom
  - Current date indicator
  - Full canvas coverage

- **Node Integration**
  - Grid-based snapping
  - Dynamic spacing with zoom
  - Smooth drag operations
  - Multi-node drag snapping

- **Data Persistence**
  - Local storage integration
  - File export/import support
  - Session state management

## 2024-03-20
- Refactored calendar integration into a dedicated hook
  - Created `useCalendarIntegration` hook
  - Moved all calendar-related state and effects
  - Improved type safety with proper interfaces
  - Reduced ResearchPlanner.tsx complexity
  - Maintained all existing functionality

## 2024-03-21
- Enhanced edge operations with dedicated hook functionality
  - Moved edge creation state to `useEdgeOperations` hook
  - Added edge creation flow management
  - Added edge state toggle functions
  - Maintained all existing edge functionality
  - Reduced complexity in ResearchPlanner.tsx
