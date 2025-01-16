import { render, fireEvent, screen, createEvent } from '@testing-library/react';
import React from 'react';

// Simple component that handles drag and drop
function DragDropTest({ onDrop }: { onDrop: (isCtrl: boolean) => void }) {
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        console.log('Drop event:', {
            ctrlKey: e.ctrlKey,
            nativeEvent: {
                ctrlKey: e.nativeEvent.ctrlKey
            }
        });
        onDrop(e.ctrlKey || e.nativeEvent.ctrlKey);
    };

    return (
        <div>
            <div
                data-testid="draggable"
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('text', 'test');
                }}
            >
                Drag me
            </div>
            <div
                data-testid="droppable"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                Drop here
            </div>
        </div>
    );
}

describe('Basic Drag and Drop', () => {
    it('should detect ctrl key during drop', () => {
        const mockOnDrop = jest.fn();
        render(<DragDropTest onDrop={mockOnDrop} />);

        const draggable = screen.getByTestId('draggable');
        const droppable = screen.getByTestId('droppable');

        // Create a basic dataTransfer object
        const dataTransfer = {
            setData: jest.fn(),
            getData: jest.fn(),
        };

        // Create and dispatch a dragstart event
        const dragStartEvent = createEvent.dragStart(draggable);
        Object.defineProperty(dragStartEvent, 'dataTransfer', {
            value: dataTransfer
        });
        fireEvent(draggable, dragStartEvent);

        // Create and dispatch a drop event with Ctrl key
        const dropEvent = createEvent.drop(droppable);
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: dataTransfer
        });
        Object.defineProperty(dropEvent, 'ctrlKey', {
            value: true
        });
        fireEvent(droppable, dropEvent);

        // Verify the handler was called with true (Ctrl pressed)
        expect(mockOnDrop).toHaveBeenCalledWith(true);
    });
});