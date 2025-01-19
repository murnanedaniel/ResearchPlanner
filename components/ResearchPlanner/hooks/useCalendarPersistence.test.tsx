import { renderHook, act } from '@testing-library/react';
import { useCalendarPersistence } from './useCalendarPersistence';

describe('useCalendarPersistence', () => {
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn()
  };
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

  beforeEach(() => {
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  it('saves calendar state correctly', () => {
    const { result } = renderHook(() => useCalendarPersistence());

    const testState = {
      isCalendarSyncEnabled: true,
      isCalendarAuthenticated: true
    };

    act(() => {
      result.current.saveCalendarState(testState);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'research-calendar-state',
      JSON.stringify(testState)
    );
  });

  it('loads calendar state correctly', () => {
    const testState = {
      isCalendarSyncEnabled: true,
      isCalendarAuthenticated: true
    };

    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(testState));

    const { result } = renderHook(() => useCalendarPersistence());
    const loadedState = result.current.loadCalendarState();

    expect(loadedState).toEqual(testState);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('research-calendar-state');
  });

  it('handles missing state correctly', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);

    const { result } = renderHook(() => useCalendarPersistence());
    const loadedState = result.current.loadCalendarState();

    expect(loadedState).toBeNull();
  });

  it('handles invalid state correctly', () => {
    mockLocalStorage.getItem.mockReturnValueOnce('invalid json');

    const { result } = renderHook(() => useCalendarPersistence());
    const loadedState = result.current.loadCalendarState();

    expect(loadedState).toBeNull();
  });
}); 