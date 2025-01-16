import { render, fireEvent, screen, waitFor, createEvent } from '@testing-library/react';
import { NodeGraph } from '@/components/ResearchPlanner/components/NodeGraph/NodeGraph';
import type { GraphNode, Edge } from '@/components/ResearchPlanner/types';
import { SettingsProvider } from '@/components/ResearchPlanner/context/SettingsContext';

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

const createDataTransfer = () => {
    const data: { [key: string]: string } = {};
    return {
        setData: (format: string, value: string) => {
            data[format] = value;
        },
        getData: (format: string) => data[format],
        dropEffect: 'none',
        effectAllowed: 'all',
        files: [],
        items: [],
        types: [],
    };
};

const renderWithProviders = (ui: React.ReactElement) => {
    return render(
        <SettingsProvider>
            {ui}
        </SettingsProvider>
    );
};

describe('Node Hierarchy and Hull Management', () => {
    const mockHandlers = {
        onNodeClick: jest.fn(),
        onNodeEdit: jest.fn(),
        onNodeDelete: jest.fn(),
        onEdgeCreate: jest.fn(),
        onEdgeEdit: jest.fn(),
        onEdgeDelete: jest.fn(),
        onNodeDragEnd: jest.fn(),
        onNodesDragEnd: jest.fn(),
        onMarkObsolete: jest.fn(),
        onMultiSelect: jest.fn(),
        onNodeDrop: jest.fn(),
        onNodeDragOver: jest.fn(),
    };

    const defaultProps = {
        selectedNode: null,
        selectedNodes: new Set<number>(),
        selectedEdge: null,
        isCreatingEdge: false,
        edgeStart: null,
        selectedStartNodes: [],
        selectedGoalNodes: [],
        isAutocompleteModeActive: false,
        expandedNodes: new Set<number>(),
        isTimelineActive: false,
        timelineStartDate: new Date(),
    };

    const createTestNodes = (): GraphNode[] => [
        {
            id: 1,
            title: 'Potential Parent',
            description: '',
            x: 100,
            y: 100,
            isObsolete: false,
            childNodes: [],
            isExpanded: false
        },
        {
            id: 2,
            title: 'Potential Child',
            description: '',
            x: 200,
            y: 100,
            isObsolete: false,
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Hull Creation on Node Drop', () => {
        it('should create hull when node is dropped onto another node', async () => {
            const nodes = createTestNodes();
            const dataTransfer = createDataTransfer();
            
            const { rerender } = render(
                <SettingsProvider>
                    <NodeGraph
                        nodes={nodes}
                        edges={[]}
                        {...defaultProps}
                        {...mockHandlers}
                    />
                </SettingsProvider>
            );

            // Find the nodes
            const childNode = screen.getByText('Potential Child');
            const parentNode = screen.getByText('Potential Parent');

            // Create and dispatch dragstart event
            const dragStartEvent = createEvent.dragStart(childNode);
            Object.defineProperty(dragStartEvent, 'dataTransfer', {
                value: dataTransfer
            });
            Object.defineProperty(dragStartEvent, 'ctrlKey', {
                value: true
            });
            fireEvent(childNode, dragStartEvent);

            dataTransfer.setData('text/plain', '2');

            // Create and dispatch dragover event
            const dragOverEvent = createEvent.dragOver(parentNode);
            Object.defineProperty(dragOverEvent, 'dataTransfer', {
                value: dataTransfer
            });
            Object.defineProperty(dragOverEvent, 'ctrlKey', {
                value: true
            });
            Object.defineProperty(dragOverEvent, 'preventDefault', {
                value: jest.fn()
            });
            fireEvent(parentNode, dragOverEvent);

            // Create and dispatch drop event
            const dropEvent = createEvent.drop(parentNode);
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: dataTransfer
            });
            Object.defineProperty(dropEvent, 'ctrlKey', {
                value: true
            });
            fireEvent(parentNode, dropEvent);

            // Verify onNodeDrop was called with correct parameters
            expect(mockHandlers.onNodeDrop).toHaveBeenCalledWith(2, 1);

            // Simulate the state update that would occur
            const updatedNodes = [
                {
                    ...nodes[0],
                    childNodes: [2],
                    hullPoints: [
                        { x: 90, y: 90 },
                        { x: 110, y: 90 },
                        { x: 110, y: 110 },
                        { x: 90, y: 110 }
                    ]
                },
                {
                    ...nodes[1],
                    parentId: 1
                }
            ];

            // Rerender with updated nodes
            rerender(
                <SettingsProvider>
                    <NodeGraph
                        nodes={updatedNodes}
                        edges={[]}
                        {...defaultProps}
                        {...mockHandlers}
                    />
                </SettingsProvider>
            );

            // Verify hull is created
            await waitFor(() => {
                const hull = document.querySelector('path');
                expect(hull).toBeInTheDocument();
            });
        });

        it('should not create hull when node is dropped without Ctrl key', () => {
            const nodes = createTestNodes();
            const dataTransfer = createDataTransfer();
            
            renderWithProviders(
                <NodeGraph
                    nodes={nodes}
                    edges={[]}
                    {...defaultProps}
                    {...mockHandlers}
                />
            );

            const childNode = screen.getByText('Potential Child');
            const parentNode = screen.getByText('Potential Parent');

            // Simulate drag and drop without Ctrl key
            fireEvent.dragStart(childNode, {
                dataTransfer
            });

            dataTransfer.setData('text/plain', '2');

            fireEvent.dragOver(parentNode, {
                dataTransfer,
                preventDefault: jest.fn()
            });

            fireEvent.drop(parentNode, {
                dataTransfer
            });

            // Verify onNodeDrop was not called
            expect(mockHandlers.onNodeDrop).not.toHaveBeenCalled();
        });

        it('should handle hull creation with multiple children', async () => {
            const initialNodes = [
                {
                    id: 1,
                    title: 'Parent',
                    description: '',
                    x: 100,
                    y: 100,
                    isObsolete: false,
                    childNodes: [2],
                    hullPoints: [
                        { x: 90, y: 90 },
                        { x: 110, y: 90 },
                        { x: 110, y: 110 },
                        { x: 90, y: 110 }
                    ]
                },
                {
                    id: 2,
                    title: 'First Child',
                    description: '',
                    x: 150,
                    y: 100,
                    isObsolete: false,
                    parentId: 1
                },
                {
                    id: 3,
                    title: 'Second Child',
                    description: '',
                    x: 200,
                    y: 150,
                    isObsolete: false,
                }
            ];

            const dataTransfer = createDataTransfer();
            const { rerender } = renderWithProviders(
                <NodeGraph
                    nodes={initialNodes}
                    edges={[]}
                    {...defaultProps}
                    {...mockHandlers}
                />
            );

            // Verify initial hull exists
            const initialHull = document.querySelector('path');
            expect(initialHull).toBeInTheDocument();

            // Simulate dropping second child
            const secondChild = screen.getByText('Second Child');
            const parentNode = screen.getByText('Parent');

            // Create and dispatch dragstart event
            const dragStartEvent = createEvent.dragStart(secondChild);
            Object.defineProperty(dragStartEvent, 'dataTransfer', {
                value: dataTransfer
            });
            Object.defineProperty(dragStartEvent, 'ctrlKey', {
                value: true
            });
            fireEvent(secondChild, dragStartEvent);

            dataTransfer.setData('text/plain', '3');

            // Create and dispatch dragover event
            const dragOverEvent = createEvent.dragOver(parentNode);
            Object.defineProperty(dragOverEvent, 'dataTransfer', {
                value: dataTransfer
            });
            Object.defineProperty(dragOverEvent, 'ctrlKey', {
                value: true
            });
            Object.defineProperty(dragOverEvent, 'preventDefault', {
                value: jest.fn()
            });
            fireEvent(parentNode, dragOverEvent);

            // Create and dispatch drop event
            const dropEvent = createEvent.drop(parentNode);
            Object.defineProperty(dropEvent, 'dataTransfer', {
                value: dataTransfer
            });
            Object.defineProperty(dropEvent, 'ctrlKey', {
                value: true
            });
            fireEvent(parentNode, dropEvent);

            // Verify onNodeDrop was called
            expect(mockHandlers.onNodeDrop).toHaveBeenCalledWith(3, 1);

            // Simulate the state update
            const updatedNodes = [
                {
                    ...initialNodes[0],
                    childNodes: [2, 3],
                },
                initialNodes[1],
                {
                    ...initialNodes[2],
                    parentId: 1,
                    x: 200,
                    y: 150
                }
            ];

            // Rerender with updated nodes
            rerender(
                <SettingsProvider>
                    <NodeGraph
                        nodes={updatedNodes}
                        edges={[]}
                        {...defaultProps}
                        {...mockHandlers}
                    />
                </SettingsProvider>
            );

            // Verify hull was updated
            await waitFor(() => {
                const updatedHull = document.querySelector('path');
                expect(updatedHull).toBeInTheDocument();
                expect(updatedHull?.getAttribute('d')).not.toBe(initialHull?.getAttribute('d'));
            });
        });
    });
}); 