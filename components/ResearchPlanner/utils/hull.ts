import { polygonHull } from 'd3-polygon';
import { GraphNode, Point } from '../types/index';
import { GRAPH_CONSTANTS } from '../constants';

export function calculateNodeHull(parentNode: GraphNode, childNodes: GraphNode[]): Point[] {
    // Include parent node in hull calculation
    const points: [number, number][] = [
        [parentNode.x, parentNode.y],
        ...childNodes.map(node => [node.x, node.y] as [number, number])
    ];

    // Add padding points around each node to make hull larger than nodes
    const padding = GRAPH_CONSTANTS.NODE_RADIUS * 2;
    const paddingPoints: [number, number][] = points.flatMap(([x, y]) => [
        [x + padding, y + padding] as [number, number],
        [x + padding, y - padding] as [number, number],
        [x - padding, y + padding] as [number, number],
        [x - padding, y - padding] as [number, number]
    ]);
    points.push(...paddingPoints);

    // Calculate hull
    const hull = polygonHull(points);
    
    // If no hull (less than 3 points), create a circle around the parent
    if (!hull) {
        const numPoints = 8;
        const radius = padding;
        return Array.from({ length: numPoints }, (_, i) => {
            const angle = (i / numPoints) * 2 * Math.PI;
            return {
                x: parentNode.x + radius * Math.cos(angle),
                y: parentNode.y + radius * Math.sin(angle)
            };
        });
    }

    // Convert to our Point format
    return hull.map(([x, y]) => ({ x, y }));
} 