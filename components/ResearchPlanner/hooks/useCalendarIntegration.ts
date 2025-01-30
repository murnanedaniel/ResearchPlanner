import { useState, useEffect, useRef } from 'react';
import { useGoogleCalendar } from './useGoogleCalendar';
import { useCalendarPersistence } from './useCalendarPersistence';
import { GraphNode } from '../types';

// Use environment variables for Google Calendar credentials
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;

if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
  console.error('Google Calendar credentials not found in environment variables');
}

interface UseCalendarIntegrationProps {
  nodes: GraphNode[];
  setNodes: (nodes: GraphNode[] | ((prev: GraphNode[]) => GraphNode[])) => void;
}

export function useCalendarIntegration({ nodes, setNodes }: UseCalendarIntegrationProps) {
  // Calendar state
  const [isCalendarSyncEnabled, setIsCalendarSyncEnabled] = useState(false);
  const [dirtyNodes, setDirtyNodes] = useState<Set<number>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const initialLoadRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const calendar = useGoogleCalendar({
    clientId: GOOGLE_CLIENT_ID,
    apiKey: GOOGLE_API_KEY
  });

  const { saveCalendarState, loadCalendarState } = useCalendarPersistence();

  // Load initial calendar state and restore sync preferences
  useEffect(() => {
    // Skip if we're still initializing
    if (calendar.isInitializing) {
      console.log('Skipping state load - still initializing');
      return;
    }

    // Skip if we've already loaded and auth hasn't changed
    if (initialLoadRef.current && !calendar.isAuthenticated) {
      return;
    }

    console.log('\n=== Loading Calendar State ===');
    const savedState = loadCalendarState();
    console.log('Loaded saved state:', savedState);

    // Only restore sync state if initialization is complete
    if (calendar.isInitialized) {
      if (savedState?.isCalendarAuthenticated && calendar.isAuthenticated) {
        console.log('Restoring sync state:', savedState.isCalendarSyncEnabled);
        // Batch the state updates to prevent race conditions
        Promise.resolve().then(() => {
          setIsCalendarSyncEnabled(savedState.isCalendarSyncEnabled);
        });
      } else if (!calendar.isAuthenticated) {
        setIsCalendarSyncEnabled(false);
      }
      initialLoadRef.current = true;
    }
  }, [calendar.isAuthenticated, calendar.isInitializing, calendar.isInitialized]);

  // Combined effect for auth and sync state changes
  useEffect(() => {
    // Skip during initialization
    if (!calendar.isInitialized || calendar.isInitializing) {
      return;
    }

    // Only save state if we're fully initialized
    if (calendar.isInitialized) {
      saveCalendarState({
        isCalendarSyncEnabled,
        isCalendarAuthenticated: calendar.isAuthenticated
      });
    }
  }, [isCalendarSyncEnabled, calendar.isAuthenticated, calendar.isInitializing, calendar.isInitialized]);

  // Unified debounced calendar sync effect
  useEffect(() => {
    if (!isCalendarSyncEnabled || !calendar.isAuthenticated) {
      console.log('\n=== Calendar Sync Effect ===');
      console.log('Sync enabled:', isCalendarSyncEnabled);
      console.log('Calendar authenticated:', calendar.isAuthenticated);
      console.log('Sync skipped: disabled or not authenticated');
      return;
    }

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      console.log('\n=== Debounced Calendar Sync ===');

      try {
        // First handle nodes that need new events created
        const nodesToCreate = nodes.filter(node => 
          node.day && !node.calendarEventId
        );
        
        console.log('Nodes needing new events:', nodesToCreate.length);
        
        // Create new events
        for (const node of nodesToCreate) {
          console.log('\nCreating event for node:', node.title);
          try {
            const eventId = await calendar.syncNode(node);
            console.log('Created event with ID:', eventId);
            // Update node with calendar event ID
            setNodes((prev: GraphNode[]) => prev.map((n: GraphNode) => 
              n.id === node.id ? { ...n, calendarEventId: eventId } : n
            ));
          } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
          }
        }

        // Then handle nodes that need updates
        const nodesToUpdate = nodes.filter(node => 
          node.day && node.calendarEventId && dirtyNodes.has(node.id)
        );

        console.log('Nodes needing updates:', nodesToUpdate.length);

        // Update existing events
        for (const node of nodesToUpdate) {
          console.log('\nUpdating node:', node.title);
          try {
            await calendar.updateNode(node, node.calendarEventId!);
            console.log('Updated event successfully');
            // Clear from dirty set on success
            setDirtyNodes(prev => {
              const next = new Set(prev);
              next.delete(node.id);
              return next;
            });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsSyncing(false);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [nodes, dirtyNodes, isCalendarSyncEnabled, calendar.isAuthenticated]);

  const deleteCalendarEvent = async (eventId: string) => {
    if (isCalendarSyncEnabled && calendar.isAuthenticated) {
      try {
        await calendar.deleteNode(eventId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    }
  };

  return {
    isCalendarSyncEnabled,
    setIsCalendarSyncEnabled,
    isSyncing,
    isCalendarAuthenticated: calendar.isAuthenticated,
    deleteCalendarEvent,
    setDirtyNodes,
    dirtyNodes,
    login: calendar.login,
    logout: calendar.logout,
    error: error,
    isInitializing: calendar.isInitializing
  };
} 