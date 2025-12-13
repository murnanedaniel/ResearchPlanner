import { useCallback } from 'react';

interface CalendarState {
  isCalendarSyncEnabled: boolean;
  isCalendarAuthenticated: boolean;
}

export function useCalendarPersistence() {
  const saveCalendarState = useCallback((state: CalendarState) => {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem('research-calendar-state', serialized);
    } catch {
      // Silent fail for save errors
    }
  }, []);

  const loadCalendarState = useCallback((): CalendarState | null => {
    try {
      const data = localStorage.getItem('research-calendar-state');
      if (!data) {
        return null;
      }
      return JSON.parse(data) as CalendarState;
    } catch {
      return null;
    }
  }, []);

  return { saveCalendarState, loadCalendarState };
}
