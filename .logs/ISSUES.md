# List of issues

- [X] Scrolling in the sidebar scrolls the whole page, not just the sidebar.
- [X] Pressing delete while the text marker is in the sidebar deletes the whole node, not just the text.
- [X] Collapsing a node's children doesn't collapse the childrens' children.
- [X] MDX editor is not working: Type a character and the editor deselects, meaning we can't type. Also, the rendering of markdown doesn't seem to be working properly.
  - Fixed by:
    1. Removing description from editor key prop to prevent remounting
    2. Adding proper styling and configuration
- [ ] The previous snap-to-timeline-grid doesn't work so well with the new configurable node scaling.
  - Attempted solutions:
    1. Adding radius offset after snapping:
       - Added finalRadius after grid snap
       - Result: Still offset from grid lines
    
    2. Converting to logical coordinates:
       - Tried scaling coordinates by levelScale
       - Tried snapping in logical space
       - Result: Made offset worse
    
    3. Compensating for drag offset:
       - Tried adjusting for both view scale and level scale
       - Tried handling drag offset differently
       - Result: Inconsistent behavior
    
    Analysis:
    - Node centers are stored correctly
    - Visual scaling uses CSS transform and position offset
    - Multiple coordinate spaces (screen, graph, visual, grid) making calculations complex
    - Drag coordinates might be relative to visual position rather than logical position

    Next steps:
    1. Add better logging of coordinate transformations
    2. Verify grid line positions
    3. Review drag coordinate calculations
    4. Consider alternative scaling approach

- [ ] Dragging a node has an unpleasant UI appearance - as if it's not meant to be dragged (goes semi-opaque with the cursor showing a not-possible drag icon)
  - Attempted solutions:
    1. Modifying CSS classes for cursor and opacity:
       - Added cursor-grab/grabbing classes
       - Added transition effects
       - Result: Did not override browser's default drag behavior
    
    2. Using custom drag image:
       - Tried invisible drag image
       - Tried cloning the node
       - Tried using node itself as drag image
       - Result: Either lost visual feedback or didn't solve cursor issue
    
    3. Handling drag events:
       - Added stopPropagation
       - Modified drag effect settings
       - Result: Still getting hydration errors and cursor issues
    
    Analysis:
    - The core issue seems to be a conflict between HTML5 Drag and Drop API and the TransformWrapper component
    - The hydration error suggests deeper issues with server/client rendering of drag functionality
    
    Proposed next steps:
    1. Investigate if TransformWrapper's panning configuration can be modified to better handle draggable children
    2. Consider implementing custom drag handling using mouse events (mousedown, mousemove, mouseup) instead of HTML5 drag and drop
    3. Look into other projects using react-zoom-pan-pinch with draggable elements for potential solutions

- [ ] Parent hull should be created when a node is dropped onto a node to create a child node.
- [ ] Parent hull should be REMOVED if a child is deleted AND it's the only child.