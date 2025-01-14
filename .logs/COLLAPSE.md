# Collapse Implementation in ResearchPlanner

## Overview
The collapse functionality allows users to create hierarchical relationships between nodes, with parent nodes able to expand/collapse to show/hide their child nodes. Users can create hierarchies both top-down (adding subnodes) and bottom-up (collapsing existing nodes into a parent).

## Specification

- Nodes can contain child nodes
- We display either the parent or the child nodes (current code implementation simply displays the children in addition to the parent when the expand button is clicked)
- A convex hull is created around the parent node and its children. This hull is updated whenever the parent node or children are updated (moved, added, deleted)
- The convex hull is almost invisible when the parent node is collapsed, it simply shows the possible area of the children
- When expanded, the convex hull is visible and the children are displayed and the parent is hidden
- The title of the parent is moved from the node to just outside the convex hull to show that all nodes contained in the hull are children of the parent
- Children are 50% the size of the parent (this recursively applies to children of children)