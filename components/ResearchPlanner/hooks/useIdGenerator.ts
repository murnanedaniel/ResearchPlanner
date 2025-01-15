import { useCallback } from 'react';

// Key for storing the last used ID in localStorage
const LAST_ID_KEY = 'research_planner_last_id';

// Global variable to track the next ID across all hook instances
let globalNextId: number | null = null;

export function useIdGenerator() {
    // Initialize globalNextId only once
    if (globalNextId === null) {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem(LAST_ID_KEY) : null;
        globalNextId = storedId ? parseInt(storedId, 10) + 1 : 1;
    }

    const getNextId = useCallback(() => {
        if (globalNextId === null) return 1; // Safeguard
        const id = globalNextId;
        globalNextId += 1;
        // Store the new last used ID
        localStorage.setItem(LAST_ID_KEY, id.toString());
        return id;
    }, []);

    // Initialize with the highest existing ID if provided
    const initializeWithExistingIds = useCallback((existingIds: number[]) => {
        if (existingIds.length > 0) {
            const maxId = Math.max(...existingIds);
            globalNextId = Math.max(maxId + 1, globalNextId || 1);
            localStorage.setItem(LAST_ID_KEY, globalNextId.toString());
        }
    }, []);

    return {
        getNextId,
        initializeWithExistingIds
    };
} 