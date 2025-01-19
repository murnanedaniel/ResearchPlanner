import { useCallback } from 'react';

interface CalendarState {
  isCalendarSyncEnabled: boolean;
  isCalendarAuthenticated: boolean;
}

export function useCalendarPersistence() {
  const saveCalendarState = useCallback((state: CalendarState) => {
    console.log('\n=== Saving Calendar State ===');
    console.log('State to save:', state);
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem('research-calendar-state', serialized);
      console.log('State saved successfully');
      
      // Verify the save
      const savedData = localStorage.getItem('research-calendar-state');
      console.log('Verification - Raw saved data:', savedData);
      if (savedData) {
        console.log('Verification - Parsed saved data:', JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Failed to save calendar state:', error);
    }
  }, []);

  const loadCalendarState = useCallback((): CalendarState | null => {
    console.log('\n=== Loading Calendar State ===');
    try {
      const data = localStorage.getItem('research-calendar-state');
      console.log('Raw loaded data:', data);
      if (!data) {
        console.log('No saved state found');
        return null;
      }
      const parsed = JSON.parse(data) as CalendarState;
      console.log('Parsed state:', parsed);
      return parsed;
    } catch (error) {
      console.error('Failed to load calendar state:', error);
      return null;
    }
  }, []);

  return { saveCalendarState, loadCalendarState };
} 