# Google Calendar Integration

## Overview
Integration between ResearchGraph and Google Calendar to sync research tasks and milestones.

## Implementation Steps

### 1. Data Structure Updates
- [x] Add calendar-related field to GraphNode interface
- [x] Update type definitions
- [x] Add calendar-related field to file persistence
- [x] Update timeline snapping code to set the day field

### 2. Authentication Setup
- [x] Create progress tracking document
- [x] Implement xToDate function for grid position to date conversion
- [x] Update node drag handling to set day field
- [x] Add Google Calendar API wrapper functions
- [x] Implement OAuth flow
- [x] Add environment variables for API keys
- [x] Fix authentication state persistence
- [x] Improve authentication state handling
- [x] Add proper initialization checks

### 3. Calendar API Integration
- [x] Create googleCalendar.ts utility
- [x] Basic API wrapper
- [x] Event creation
- [x] Event updates
- [x] Event deletion
- [x] Add calendar toggle to toolbar
- [x] Implement sync effect in ResearchPlanner
- [x] Fix sync state persistence
- [x] Add authentication state checks

### 4. UI Components
- [x] Create calendar settings panel
  - [x] Calendar selection
  - [x] Sync preferences
- [x] Add calendar event indicators
- [x] Add sync status indicators
- [x] Fix sync toggle behavior
- [x] Improve state feedback

### 5. Timeline Integration
- [x] Use existing timeline grid snapping
- [x] Convert grid position to date using existing dateToX function
- [x] Handle timezone conversions
- [x] Add visual indicators for synced events

### 6. Sync Logic
- [x] Implement one-way sync (graph → calendar)
- [x] Handle node updates (when day changes)
- [x] Handle node deletion
- [x] Handle batch operations
- [ ] Implement conflict resolution

### 7. Testing & Validation
- [x] Add tests for calendar state persistence
- [ ] Unit tests for calendar utilities
- [ ] Integration tests for sync logic
- [ ] End-to-end sync testing
- [ ] Error handling validation

### 8. Documentation
- [ ] API documentation
- [ ] Setup instructions
- [ ] Usage guidelines
- [ ] Troubleshooting guide

## Progress Log

### March 2024
- Started implementation planning
- Created progress tracking document
- Revised plan to simplify data structure - using timeline grid for dates
- Added day field to GraphNode interface
- Implemented xToDate function to convert grid position to date
- Updated node drag handling to set day field when snapping to grid
- Created Google Calendar authentication utilities
- Added Google Calendar API wrapper functions
- Created useGoogleCalendar hook with full functionality
- Added calendar sync UI to toolbar
- Implemented calendar sync logic in ResearchPlanner component
- Fixed authentication and sync state persistence issues
- Improved state handling and initialization process
- Added token validation and automatic refresh
- Improved error handling with retry logic for 401 errors
- Added token cleanup for invalid tokens
- Fixed token persistence and restoration

## State Management
- [x] Create useCalendarPersistence hook
- [x] Implement localStorage for sync preferences
- [x] Add tests for calendar state persistence
- [x] Update ResearchPlanner to use persisted state
- [x] Handle re-authentication on page reload
- [x] Fix authentication state persistence
- [x] Improve sync state handling

## Remaining Tasks
- [ ] Add loading states for calendar operations
- [ ] Improve error handling and retry logic
- [ ] Add batch operations for multiple nodes
- [ ] Implement rate limiting
- [ ] Add visual indicators for synced nodes
- [ ] Add force sync/refresh option
- [ ] Fix timeline grid snapping (currently only snaps to a single date)
- [ ] Restore missing node deletion functionality
- [ ] Add comprehensive test coverage:
  - [ ] Test token refresh and validation
  - [ ] Test error handling and retries
  - [ ] Test calendar event CRUD operations
  - [ ] Test sync state persistence
  - [ ] Test timeline grid snapping
  - [ ] Test node deletion with calendar sync

## Known Issues
- Timeline grid snapping is broken: Currently only allows snapping to a single date
- Node deletion functionality is partially missing or broken
- Most calendar functionality remains untested
- Token refresh and validation needs more robust error handling
- Calendar operations lack proper loading states and progress indicators 