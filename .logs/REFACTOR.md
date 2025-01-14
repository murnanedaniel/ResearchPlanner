# ResearchGraph Refactoring Plan

## Current Architecture Issues

1. **Monolithic Component Structure**
   - `ResearchPlanner.tsx` is too large (~900 lines) and handles too many responsibilities
   - State management, event handling, and UI rendering are tightly coupled
   - Multiple features (nodes, edges, timeline, autocomplete) are intertwined

2. **State Management Complexity**
   - Many interdependent state variables
   - Complex state updates spread across multiple handlers
   - No clear separation between different feature states

3. **Event Handler Sprawl**
   - Many handlers in the main component
   - Similar handlers not grouped by feature
   - Some handlers have mixed responsibilities

4. **Component Organization**
   - `NodeGraph` component is handling too much (rendering, events, zoom)
   - Edge rendering logic mixed with node rendering
   - Timeline features mixed with core graph features

## Proposed Architecture

### 1. Feature-Based Organization
Split the codebase into clear feature modules:

```
components/ResearchPlanner/
├── features/
│   ├── nodes/           # Node-related components and logic
│   ├── edges/           # Edge-related components and logic
│   ├── timeline/        # Timeline feature components
│   ├── autocomplete/    # AI autocomplete feature
│   └── selection/       # Selection and multi-select logic
├── hooks/               # Shared hooks
├── utils/              # Shared utilities
├── types/              # TypeScript types
└── context/            # React Context providers
```

### 2. State Management Layers

```typescript
// Top-level providers
<GraphStateProvider>      // Core graph state
  <SelectionProvider>     // Selection state
    <TimelineProvider>    // Timeline feature
      <AutocompleteProvider>  // AI features
        <ResearchPlanner />
      </AutocompleteProvider>
    </TimelineProvider>
  </SelectionProvider>
</GraphStateProvider>
```

### 3. Core Feature Modules

#### a. Graph Core
- `GraphStateProvider` - Manages core node/edge state
- `useGraphState` - Hook for accessing graph state
- `useGraphOperations` - Hook for graph operations

#### b. Selection System
- `SelectionProvider` - Manages selection state
- `useSelection` - Hook for selection operations
- `useMultiSelect` - Hook for multi-select features

#### c. Timeline Feature
- `TimelineProvider` - Timeline state and operations
- `useTimeline` - Hook for timeline features
- `TimelineGrid` - Timeline visualization

#### d. Autocomplete Feature
- `AutocompleteProvider` - AI feature state
- `useAutocomplete` - Hook for AI operations
- `AutocompleteControls` - UI controls

### 4. Component Hierarchy

```
ResearchPlanner
├── Toolbar
│   ├── NodeControls
│   ├── EdgeControls
│   ├── TimelineControls
│   └── AutocompleteControls
├── NodeGraph
│   ├── Node
│   ├── Edge
│   ├── SelectionBox
│   ├── TimelineGrid
│   └── ZoomControls
└── SidePanel
    ├── NodeEditor
    └── EdgeEditor
```

### 5. API Layer
```
api/
├── autocomplete/
│   ├── route.ts
│   └── types.ts
└── shared/
    ├── client.ts
    └── errors.ts
```

### 6. Testing Structure
```
__tests__/
├── components/
│   ├── ResearchPlanner/
│   │   ├── features/
│   │   └── components/
├── hooks/
└── api/
```

## Refactoring Phases

### Phase 1: State Management
- Create context providers
- Move state into appropriate providers
- Create hooks for state access

**Key Tasks:**
1. Create `GraphStateProvider` and move node/edge state
2. Create `SelectionProvider` for selection management
3. Create `TimelineProvider` for timeline features
4. Create `AutocompleteProvider` for AI features
5. Create corresponding hooks for each provider
6. Integrate with existing hooks (`useLayoutManager`, `useGraphPersistence`)

### Phase 2: Feature Modules
- Create feature-specific directories
- Move components to appropriate features
- Create feature-specific hooks

**Key Tasks:**
1. Set up feature directory structure
2. Move node-related code to nodes feature
3. Move edge-related code to edges feature
4. Move timeline code to timeline feature
5. Move autocomplete code to autocomplete feature
6. Create feature-specific hooks and utilities
7. Implement planned hooks (`useNodeSelection`, `useProjectStorage`)

### Phase 3: Component Cleanup
- Split large components
- Create new smaller components
- Improve prop interfaces

**Key Tasks:**
1. Split `NodeGraph` into smaller components
2. Create separate `Edge` component
3. Create dedicated `ZoomControls` component
4. Split `Toolbar` into feature-specific controls
5. Improve `SidePanel` organization
6. Extract MDX editor configuration into separate module

### Phase 4: Type System
- Create proper TypeScript interfaces
- Add strict typing to hooks
- Improve error handling

**Key Tasks:**
1. Create comprehensive type definitions
2. Add proper typing to all hooks
3. Improve component prop types
4. Add error boundaries and handling
5. Add TypeScript types for API responses

### Phase 5: API Layer
- Create proper API structure
- Add error handling
- Improve type safety

**Key Tasks:**
1. Create API client utilities
2. Add proper error handling
3. Add request/response type definitions
4. Add API documentation
5. Implement proper error responses

### Phase 6: Testing Infrastructure
- Maintain and improve test coverage
- Add new tests for refactored components

**Key Tasks:**
1. Update existing tests for new structure
2. Add tests for new hooks
3. Add API endpoint tests
4. Add integration tests
5. Set up testing utilities

## Implementation Strategy

1. **Start Small**
   - Begin with one feature module (e.g., nodes)
   - Create the provider and hooks
   - Move related components
   - Test thoroughly before moving to next feature

2. **Maintain Functionality**
   - Keep existing code working while refactoring
   - Add tests before making changes
   - Use feature flags if needed
   - Maintain MDX editor functionality

3. **Document Changes**
   - Update documentation as we go
   - Add comments explaining new patterns
   - Keep this refactor doc updated with progress
   - Document API endpoints

## Progress Tracking

- [x] Phase 1: State Management
  - [x] GraphStateProvider (Basic implementation complete)
    - Created GraphContext with nodes/edges state
    - Added file operations (save/load)
    - Added timeline state management
    - Added proper type handling
  - [ ] SelectionProvider
  - [ ] TimelineProvider
  - [ ] AutocompleteProvider
  - [x] Integration with existing hooks
    - Integrated with useGraphPersistence
    - Maintained compatibility with useLayoutManager
    - Added useNodeOperations for node state management
    - Added useEdgeOperations for edge state management

- [ ] Phase 2: Feature Modules
  - [x] Nodes Feature
    - Created useNodeOperations hook
    - Moved node operations from ResearchPlanner
    - Added proper type handling
  - [x] Edges Feature
    - Created useEdgeOperations hook
    - Moved edge operations from ResearchPlanner
    - Added edge selection highlighting
  - [ ] Timeline Feature
  - [ ] Autocomplete Feature
  - [ ] Implement planned hooks

- [ ] Phase 3: Component Cleanup
  - [x] NodeGraph Refactor
    - Split into GraphContent and NodeGraph
    - Improved edge rendering with selection state
    - Fixed zoom controls and container sizing
  - [ ] Toolbar Refactor
  - [ ] SidePanel Refactor
  - [ ] MDX Editor Module

- [ ] Phase 4: Type System
  - [x] Core Types
    - Updated GraphData interface
    - Added proper typing for node/edge operations
    - Fixed type issues with selection state
  - [ ] Hook Types
  - [ ] Component Props
  - [ ] Error Handling
  - [ ] API Types

- [ ] Phase 5: API Layer
  - [ ] API Client
  - [ ] Error Handling
  - [ ] Type Definitions
  - [ ] Documentation
  - [ ] Error Responses

- [ ] Phase 6: Testing Infrastructure
  - [ ] Update Existing Tests
  - [ ] New Hook Tests
  - [ ] API Tests
  - [ ] Integration Tests
  - [ ] Testing Utilities

## Next Steps

1. Continue with Phase 1: Move selection state into its own provider
   - Create SelectionProvider for managing selected nodes/edges
   - Move selection-related state and handlers from ResearchPlanner
   - Update components to use the new provider

2. Improve error handling in GraphProvider
   - Add proper error boundaries
   - Improve type safety
   - Add loading states

3. Begin extracting feature modules
   - Start with nodes feature
   - Create proper directory structure
   - Move related components and hooks
