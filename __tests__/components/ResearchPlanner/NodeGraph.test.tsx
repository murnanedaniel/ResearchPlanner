import { render, fireEvent, screen } from '@testing-library/react';
import { NodeGraph } from '@/components/ResearchPlanner/components/NodeGraph/NodeGraph';
import { GraphNode, Edge } from '@/components/ResearchPlanner/types';

// Mock the TransformWrapper component and its context
jest.mock('react-zoom-pan-pinch', () => ({
    TransformWrapper: ({ children }: any) => children,
    TransformComponent: ({ children }: any) => children,
    useTransformContext: () => ({
        transformState: { scale: 1, positionX: 0, positionY: 0 }
    }),
    useControls: () => ({
        zoomIn: jest.fn(),
        zoomOut: jest.fn(),
        resetTransform: jest.fn()
    })
}));

describe('NodeGraph Parent/Child Functionality', () => {
    const mockHandlers = {
        onNodeClick: jest.fn(),
        onNodeEdit: jest.fn(),
        onNodeDelete: jest.fn(),
        onEdgeCreate: jest.fn(),
        onEdgeEdit: jest.fn(),
        onEdgeDelete: jest.fn(),
        onNodeDragEnd: jest.fn(),
        onMarkObsolete: jest.fn(),
        onMultiSelect: jest.fn(),
    };

    const createTestNodes = (): GraphNode[] => [
        {
            id: 1,
            title: 'Parent Node',
            description: '',
            x: 100,
            y: 100,
            isObsolete: false,
            childNodes: [2, 3],
            isExpanded: false
        },
        {
            id: 2,
            title: 'Child Node 1',
            description: '',
            x: 200,
            y: 100,
            isObsolete: false,
            parentId: 1
        },
        {
            id: 3,
            title: 'Child Node 2',
            description: '',
            x: 300,
            y: 100,
            isObsolete: false,
            parentId: 1
        }
    ];

    const createTestEdges = (): Edge[] => [
        {
            id: 1,
            source: 1,
            target: 2,
            title: 'Edge 1',
            description: '',
            isObsolete: false,
            isPlanned: false
        },
        {
            id: 2,
            source: 2,
            target: 3,
            title: 'Edge 2',
            description: '',
            isObsolete: false,
            isPlanned: false
        }
    ];

    it('should only show parent node when not expanded', () => {
        const nodes = createTestNodes();
        const edges = createTestEdges();
        const expandedNodes = new Set<number>();

        render(
            <NodeGraph
                nodes={nodes}
                edges={edges}
                selectedNode={null}
                selectedNodes={new Set()}
                isCreatingEdge={false}
                edgeStart={null}
                selectedStartNodes={[]}
                selectedGoalNodes={[]}
                isAutocompleteModeActive={false}
                expandedNodes={expandedNodes}
                {...mockHandlers}
            />
        );

        // Parent node should be visible
        expect(screen.getByText('Parent Node')).toBeInTheDocument();
        
        // Child nodes should not be visible
        expect(screen.queryByText('Child Node 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Child Node 2')).not.toBeInTheDocument();
    });

    it('should show child nodes when parent is expanded', () => {
        const nodes = createTestNodes();
        const edges = createTestEdges();
        const expandedNodes = new Set([1]); // Parent node is expanded

        render(
            <NodeGraph
                nodes={nodes}
                edges={edges}
                selectedNode={null}
                selectedNodes={new Set()}
                isCreatingEdge={false}
                edgeStart={null}
                selectedStartNodes={[]}
                selectedGoalNodes={[]}
                isAutocompleteModeActive={false}
                expandedNodes={expandedNodes}
                {...mockHandlers}
            />
        );

        // All nodes should be visible
        expect(screen.getByText('Parent Node')).toBeInTheDocument();
        expect(screen.getByText('Child Node 1')).toBeInTheDocument();
        expect(screen.getByText('Child Node 2')).toBeInTheDocument();
    });

    it('should only show edges between visible nodes', () => {
        const nodes = createTestNodes();
        const edges = createTestEdges();
        
        // First render with parent collapsed
        const { rerender } = render(
            <NodeGraph
                nodes={nodes}
                edges={edges}
                selectedNode={null}
                selectedNodes={new Set()}
                isCreatingEdge={false}
                edgeStart={null}
                selectedStartNodes={[]}
                selectedGoalNodes={[]}
                isAutocompleteModeActive={false}
                expandedNodes={new Set()}
                {...mockHandlers}
            />
        );

        // No edges should be visible when parent is collapsed
        const edgesBefore = document.querySelectorAll('line[stroke="#64748b"]');
        expect(edgesBefore.length).toBe(0);

        // Rerender with parent expanded
        rerender(
            <NodeGraph
                nodes={nodes}
                edges={edges}
                selectedNode={null}
                selectedNodes={new Set()}
                isCreatingEdge={false}
                edgeStart={null}
                selectedStartNodes={[]}
                selectedGoalNodes={[]}
                isAutocompleteModeActive={false}
                expandedNodes={new Set([1])}
                {...mockHandlers}
            />
        );

        // All edges should be visible when parent is expanded
        const edgesAfter = document.querySelectorAll('line[stroke="#64748b"]');
        expect(edgesAfter.length).toBe(2);
    });

    it('should call onNodeEdit when toggling node expansion', () => {
        const nodes = createTestNodes();
        const edges = createTestEdges();
        const expandedNodes = new Set<number>();

        render(
            <NodeGraph
                nodes={nodes}
                edges={edges}
                selectedNode={null}
                selectedNodes={new Set()}
                isCreatingEdge={false}
                edgeStart={null}
                selectedStartNodes={[]}
                selectedGoalNodes={[]}
                isAutocompleteModeActive={false}
                expandedNodes={expandedNodes}
                {...mockHandlers}
            />
        );

        // Find and click the expand button
        const expandButton = screen.getByLabelText('Expand');
        fireEvent.click(expandButton);

        // Check if onNodeEdit was called with the correct arguments
        expect(mockHandlers.onNodeEdit).toHaveBeenCalledWith({
            ...nodes[0],
            isExpanded: true
        });
    });
}); 