import { useState, useCallback, useEffect, useRef } from 'react';
import { GraphNode } from '../types';
import {
  initGoogleAuth,
  handleAuthClick,
  handleSignoutClick,
  isAuthorized,
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
  listEvents: () => Promise<any[]>;
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
      console.log('Already initializing, waiting...');
      return initializePromiseRef.current;
    }

    if (isInitialized && !hasError) {
      console.log('Already initialized successfully');
      return {
        gapiInited: true,
        gisInited: true,
        isAuthenticated
      };
    }

    console.log('Starting initialization...');
    setIsInitializing(true);

    try {
      const initPromise = initGoogleAuth({ clientId, apiKey });
      initializePromiseRef.current = initPromise;
      const result = await initPromise;
      setIsAuthenticated(result.isAuthenticated);
      setIsInitialized(true);
      setError(null);
      return result;
    } catch (error) {
      console.error('Initialization failed:', error);
      setError(error as Error);
      setHasError(true);
      throw error;
    } finally {
      setIsInitializing(false);
      initializePromiseRef.current = null;
    }
  }, [clientId, apiKey, isInitializing, isInitialized, hasError, isAuthenticated]);

  // Auto-initialize on mount, but only once
  useEffect(() => {
    if (!hasAutoInitializedRef.current && !isInitializing && !isAuthenticated && !error) {
      console.log('Auto-initializing calendar...');
      hasAutoInitializedRef.current = true;
      initialize().catch(err => {
        console.error('Auto-initialization failed:', err);
      });
    }
  }, []);

  const login = useCallback(async () => {
    console.log('\n=== Starting Login Process ===');
    setError(null);

    try {
      // Always initialize first
      console.log('Ensuring initialization is complete...');
      if (isInitializing && initializePromiseRef.current) {
        console.log('Waiting for existing initialization to complete...');
        await initializePromiseRef.current;
      } else if (!isAuthenticated) {
        console.log('Starting new initialization...');
        await initialize();
      }

      console.log('Initialization complete, proceeding with login...');
      await handleAuthClick();
      console.log('Login successful');
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login process failed:', err);
      setError(err instanceof Error ? err : new Error('Login failed'));
      setIsAuthenticated(false);
      throw err;
    }
  }, [initialize, isInitializing, isAuthenticated]);

  const logout = useCallback(async () => {
    console.log('Logging out...');
    try {
      await handleSignoutClick();
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed:', err);
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
      console.error('Error syncing node to calendar:', error);
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
      console.error('Error updating calendar event:', error);
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
      console.error('Error deleting calendar event:', error);
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
      console.error('Error listing calendar events:', error);
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