export const GRAPH_CONSTANTS = {
    NODE_DIAMETER: 96,
    NODE_RADIUS: 48,
    EDGE_STROKE_WIDTH: 2,
    ARROW_SIZE: 10,
    MIN_FONT_SIZE: 4,
    MAX_FONT_SIZE: 12,
    EDGE_TEXT_PADDING: 15,
    EDGE_MAX_WIDTH: 150,
    LINE_HEIGHT: 1.2,
    CANVAS_SIZE: 90000,
    HIERARCHY_LEVEL_SCALE: 0.8
} as const;

// Export a function to get the current value of a constant, which can be overridden by settings
export function getGraphConstant(key: keyof typeof GRAPH_CONSTANTS, settings?: any) {
    // If no settings provided or settings is undefined, return default constant
    if (!settings) {
        return GRAPH_CONSTANTS[key];
    }

    // Handle each setting, falling back to default if the setting is undefined
    switch (key) {
        case 'NODE_RADIUS':
            return settings.nodeRadius ?? GRAPH_CONSTANTS.NODE_RADIUS;
        case 'NODE_DIAMETER':
            return (settings.nodeRadius ?? GRAPH_CONSTANTS.NODE_RADIUS) * 2;
        case 'MIN_FONT_SIZE':
            return settings.minFontSize ?? GRAPH_CONSTANTS.MIN_FONT_SIZE;
        case 'MAX_FONT_SIZE':
            return settings.maxFontSize ?? GRAPH_CONSTANTS.MAX_FONT_SIZE;
        case 'EDGE_MAX_WIDTH':
            return settings.edgeMaxWidth ?? GRAPH_CONSTANTS.EDGE_MAX_WIDTH;
        case 'ARROW_SIZE':
            return settings.arrowSize ?? GRAPH_CONSTANTS.ARROW_SIZE;
        case 'LINE_HEIGHT':
            return settings.lineHeight ?? GRAPH_CONSTANTS.LINE_HEIGHT;
        case 'HIERARCHY_LEVEL_SCALE':
            return settings.hierarchyLevelScale ?? GRAPH_CONSTANTS.HIERARCHY_LEVEL_SCALE;
        default:
            return GRAPH_CONSTANTS[key];
    }
} 