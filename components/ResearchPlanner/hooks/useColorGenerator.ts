import { useCallback } from 'react';

// Key for storing the last used color index in localStorage
const LAST_COLOR_KEY = 'research_planner_last_color';

// Array of tailwind-like colors with good contrast and visibility
const colors = [
    { fill: 'rgb(219 234 254)', stroke: 'rgb(96 165 250)' },   // blue-100, blue-400
    { fill: 'rgb(220 252 231)', stroke: 'rgb(74 222 128)' },   // green-100, green-400
    { fill: 'rgb(254 226 226)', stroke: 'rgb(248 113 113)' },  // red-100, red-400
    { fill: 'rgb(254 249 195)', stroke: 'rgb(250 204 21)' },   // yellow-100, yellow-400
    { fill: 'rgb(237 233 254)', stroke: 'rgb(167 139 250)' },  // purple-100, purple-400
    { fill: 'rgb(255 237 213)', stroke: 'rgb(251 146 60)' },   // orange-100, orange-400
    { fill: 'rgb(243 232 255)', stroke: 'rgb(192 132 252)' },  // fuchsia-100, fuchsia-400
    { fill: 'rgb(236 254 255)', stroke: 'rgb(45 212 191)' },   // cyan-100, cyan-400
];

// Global variable to track the next color index across all hook instances
let globalColorIndex: number | null = null;

export function useColorGenerator() {
    // Initialize globalColorIndex only once
    if (globalColorIndex === null) {
        const storedIndex = typeof window !== 'undefined' ? localStorage.getItem(LAST_COLOR_KEY) : null;
        globalColorIndex = storedIndex ? parseInt(storedIndex, 10) : 0;
    }

    const getNextColor = useCallback(() => {
        if (globalColorIndex === null) return colors[0];
        const color = colors[globalColorIndex % colors.length];
        globalColorIndex = (globalColorIndex + 1) % colors.length;
        localStorage.setItem(LAST_COLOR_KEY, globalColorIndex.toString());
        return color;
    }, []);

    return {
        getNextColor
    };
} 