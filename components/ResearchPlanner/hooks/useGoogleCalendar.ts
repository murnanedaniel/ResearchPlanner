import { useState, useCallback, useEffect, useRef } from 'react';
import { GraphNode, CalendarEvent } from '../types';
import {
  initGoogleAuth,
  handleAuthClick,
  handleSignoutClick,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  listCalendarEvents
} from '../utils/googleCalendar';

interface UseGoogleCalendarConfig {
  clientId: string;
  apiKey: string;
}

interface AuthResult {
  gapiInited: boolean;
  gisInited: boolean;
  isAuthenticated: boolean;
}

interface UseGoogleCalendarReturn {
  isAuthenticated: boolean;
  isInitializing: boolean;
  isInitialized: boolean;
  error: Error | null;
  initialize: () => Promise<AuthResult>;
  login: () => Promise<void>;
  logout: () => void;
  syncNode: (node: GraphNode) => Promise<string>;
  updateNode: (node: GraphNode, eventId: string) => Promise<void>;
  deleteNode: (eventId: string) => Promise<void>;
  listEvents: () => Promise<CalendarEvent[]>;
}

export function useGoogleCalendar({ clientId, apiKey }: UseGoogleCalendarConfig): UseGoogleCalendarReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const initializePromiseRef = useRef<Promise<AuthResult> | null>(null);
  const hasAutoInitializedRef = useRef(false);
  const [hasError, setHasError] = useState(false);

  const initialize = useCallback(async (): Promise<AuthResult> => {
    if (isInitializing && initializePromiseRef.current) {
      return initializePromiseRef.current;
    }

    if (isInitialized && !hasError) {
      return {
        gapiInited: true,
        gisInited: true,
        isAuthenticated
      };
    }

    setIsInitializing(true);

    try {
      const initPromise = initGoogleAuth({ clientId, apiKey });
      initializePromiseRef.current = initPromise;
      const result = await initPromise;
      setIsAuthenticated(result.isAuthenticated);
      setIsInitialized(true);
      setError(null);
      return result;
    } catch (err) {
      setError(err as Error);
      setHasError(true);
      throw err;
    } finally {
      setIsInitializing(false);
      initializePromiseRef.current = null;
    }
  }, [clientId, apiKey, isInitializing, isInitialized, hasError, isAuthenticated]);

  // Auto-initialize on mount, but only once
  useEffect(() => {
    if (!hasAutoInitializedRef.current && !isInitializing && !isAuthenticated && !error) {
      hasAutoInitializedRef.current = true;
      initialize().catch(() => {
        // Silent fail for auto-initialization
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async () => {
    setError(null);

    try {
      // Always initialize first
      if (isInitializing && initializePromiseRef.current) {
        await initializePromiseRef.current;
      } else if (!isAuthenticated) {
        await initialize();
      }

      await handleAuthClick();
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      setIsAuthenticated(false);
      throw err;
    }
  }, [initialize, isInitializing, isAuthenticated]);

  const logout = useCallback(async () => {
    try {
      await handleSignoutClick();
      setIsAuthenticated(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      throw err;
    }
  }, []);

  const syncNode = useCallback(async (node: GraphNode) => {
    if (!isAuthenticated) {
      throw new Error('Google Calendar not initialized. Please call initialize() first.');
    }

    setError(null);
    try {
      const eventId = await createCalendarEvent(node);
      return eventId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown sync error');
      setError(error);
      throw error;
    }
  }, [isAuthenticated]);

  const updateNode = useCallback(async (node: GraphNode, eventId: string) => {
    if (!isAuthenticated) {
      throw new Error('Google Calendar not initialized. Please call initialize() first.');
    }

    setError(null);
    try {
      await updateCalendarEvent(node, eventId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown update error');
      setError(error);
      throw error;
    }
  }, [isAuthenticated]);

  const deleteNode = useCallback(async (eventId: string) => {
    if (!isAuthenticated) {
      throw new Error('Google Calendar not initialized. Please call initialize() first.');
    }

    setError(null);
    try {
      await deleteCalendarEvent(eventId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown delete error');
      setError(error);
      throw error;
    }
  }, [isAuthenticated]);

  const listEvents = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Google Calendar not initialized. Please call initialize() first.');
    }

    setError(null);
    try {
      const events = await listCalendarEvents();
      return events;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown list error');
      setError(error);
      throw error;
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isInitializing,
    isInitialized,
    error,
    initialize,
    login,
    logout,
    syncNode,
    updateNode,
    deleteNode,
    listEvents
  };
}
