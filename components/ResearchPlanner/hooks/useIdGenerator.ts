import { useCallback, useRef } from 'react';

// Key for storing the last used ID in localStorage
const LAST_ID_KEY = 'research_planner_last_id';

export function useIdGenerator() {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem(LAST_ID_KEY) : null;
    const nextIdRef = useRef<number>(storedId ? parseInt(storedId, 10) + 1 : 1);

    const getNextId = useCallback(() => {
        const id = nextIdRef.current;
        nextIdRef.current += 1;
        // Store the new last used ID
        localStorage.setItem(LAST_ID_KEY, id.toString());
        return id;
    }, []);

    // Initialize with the highest existing ID if provided
    const initializeWithExistingIds = useCallback((existingIds: number[]) => {
        if (existingIds.length > 0) {
            const maxId = Math.max(...existingIds);
            nextIdRef.current = Math.max(maxId + 1, nextIdRef.current);
            localStorage.setItem(LAST_ID_KEY, nextIdRef.current.toString());
        }
    }, []);

    return {
        getNextId,
        initializeWithExistingIds
    };
} 