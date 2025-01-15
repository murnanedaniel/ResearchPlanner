# List of issues

- [X] Scrolling in the sidebar scrolls the whole page, not just the sidebar.
- [X] Pressing delete while the text marker is in the sidebar deletes the whole node, not just the text.
- [X] Collapsing a node's children doesn't collapse the childrens' children.
- [X] MDX editor is not working: Type a character and the editor deselects, meaning we can't type. Also, the rendering of markdown doesn't seem to be working properly.
  - Fixed by:
    1. Removing description from editor key prop to prevent remounting
    2. Adding proper styling and configuration
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