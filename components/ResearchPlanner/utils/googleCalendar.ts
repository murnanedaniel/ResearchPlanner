import { GraphNode, GoogleAuthConfig, AuthResult, CalendarEvent } from '../types';
import { CALENDAR_CONSTANTS } from '../constants';

// Google Calendar API configuration
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

interface TokenResponse {
  error?: string;
  access_token?: string;
}

interface TokenClient {
  callback: (response: TokenResponse) => void;
  requestAccessToken: (options: { prompt: string }) => void;
}

interface GapiClientCalendar {
  calendars: {
    get: (params: { calendarId: string }) => Promise<unknown>;
    insert: (params: { resource: { summary: string; description: string; timeZone: string } }) => Promise<{ result: { id: string } }>;
  };
  calendarList: {
    list: () => Promise<{ result: { items?: CalendarListEntry[] } }>;
  };
}

let tokenClient: TokenClient | null = null;
let gapiInited = false;
let gisInited = false;

interface CalendarListEntry {
  id: string;
  summary: string;
}

// Helper function to load the Google API client library
async function loadGapiClient(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google API client library'));
    document.body.appendChild(script);
  });
}

// Helper function to initialize the GAPI client
async function initializeGapiClient(apiKey: string): Promise<boolean> {
  if (!window.gapi) {
    throw new Error('Google API client library not loaded');
  }

  await new Promise<void>((resolve, reject) => {
    window.gapi.load('client', {
      callback: resolve,
      onerror: () => reject(new Error('Error loading GAPI client'))
    });
  });

  await window.gapi.client.init({
    apiKey: apiKey,
    discoveryDocs: [DISCOVERY_DOC],
  });

  gapiInited = true;
  return true;
}

// Helper function to load the Google Identity Services library
async function loadGisClient(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services library'));
    document.body.appendChild(script);
  });
}

// Helper function to initialize the GIS client
async function initializeGisClient(clientId: string): Promise<boolean> {
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services not loaded');
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES.join(' '),
    callback: () => {}, // defined at request time
  });

  gisInited = true;
  return true;
}

// Helper function to check if user is authenticated
async function checkIfAuthenticated(): Promise<boolean> {
  try {
    const token = window.gapi?.client?.getToken();
    return !!token && !!token.access_token;
  } catch {
    return false;
  }
}

// Helper function to validate token
async function validateToken(token: { access_token: string }): Promise<boolean> {
  try {
    await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 1,
      orderBy: 'startTime'
    });
    return true;
  } catch {
    return false;
  }
}

// Helper function to handle token refresh
async function refreshToken(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }

    tokenClient.callback = (resp: TokenResponse) => {
      if (resp.error !== undefined) {
        reject(new Error(`Token refresh failed: ${resp.error}`));
        return;
      }
      if (resp.access_token) {
        try {
          const token = window.gapi.client.getToken();
          if (token) {
            localStorage.setItem('google-calendar-token', JSON.stringify(token));
          }
        } catch {
          // Silent fail for token save
        }
      }
      resolve();
    };

    tokenClient.requestAccessToken({ prompt: '' });
  });
}

// Validate calendar ID exists
async function validateCalendarId(calendarId: string): Promise<boolean> {
  try {
    await (window.gapi.client as unknown as { calendar: GapiClientCalendar }).calendar.calendars.get({
      calendarId: calendarId
    });
    return true;
  } catch {
    return false;
  }
}

export async function initGoogleAuth(config: GoogleAuthConfig): Promise<AuthResult> {
  try {
    // Reset flags at the start of initialization
    gapiInited = false;
    gisInited = false;
    tokenClient = null;

    // Load and initialize the Google API client library
    await loadGapiClient();
    await initializeGapiClient(config.apiKey);

    // Load and initialize the Google Identity Services library
    await loadGisClient();
    await initializeGisClient(config.clientId);

    // Try to restore token from localStorage
    try {
      const savedToken = localStorage.getItem('google-calendar-token');
      if (savedToken) {
        const token = JSON.parse(savedToken);
        window.gapi.client.setToken(token);

        // Validate the restored token
        const isValid = await validateToken(token);
        if (!isValid) {
          await refreshToken();
        }

        // If we have a valid token, validate the saved calendar ID
        const savedCalendarId = localStorage.getItem(CALENDAR_CONSTANTS.ID_KEY);
        if (savedCalendarId) {
          const isCalendarValid = await validateCalendarId(savedCalendarId);
          if (!isCalendarValid) {
            localStorage.removeItem(CALENDAR_CONSTANTS.ID_KEY);
          }
        }
      }
    } catch {
      window.gapi.client.setToken(null);
      localStorage.removeItem('google-calendar-token');
      localStorage.removeItem(CALENDAR_CONSTANTS.ID_KEY);
    }

    // Check if authenticated
    const isAuthenticated = await checkIfAuthenticated();

    return { gapiInited, gisInited, isAuthenticated };
  } catch (error) {
    // Reset flags and storage on error
    gapiInited = false;
    gisInited = false;
    tokenClient = null;
    localStorage.removeItem('google-calendar-token');
    localStorage.removeItem(CALENDAR_CONSTANTS.ID_KEY);
    throw error;
  }
}

export async function handleAuthClick(): Promise<void> {
  // Wait for initialization if needed
  let retries = 0;
  const maxRetries = 5;
  const retryInterval = 1000;

  while ((!gapiInited || !gisInited || !tokenClient) && retries < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, retryInterval));
    retries++;
  }

  if (!tokenClient || !gapiInited || !gisInited) {
    throw new Error(
      `Google APIs not fully initialized after ${maxRetries} retries.\n` +
      `Status: GAPI: ${gapiInited}, GIS: ${gisInited}, TokenClient: ${!!tokenClient}\n` +
      'Please refresh the page and try again.'
    );
  }

  return new Promise((resolve, reject) => {
    try {
      const client = tokenClient!;
      client.callback = (resp: TokenResponse) => {
        if (resp.error !== undefined) {
          reject(new Error(`Authentication error: ${resp.error}`));
          return;
        }
        if (resp.access_token) {
          try {
            const token = window.gapi.client.getToken();
            if (token) {
              localStorage.setItem('google-calendar-token', JSON.stringify(token));
            }
          } catch {
            // Silent fail for token save
          }
        }
        resolve();
      };

      const currentToken = window.gapi.client.getToken();
      if (!currentToken) {
        client.requestAccessToken({ prompt: 'consent' });
      } else {
        client.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      reject(new Error(`Authentication error: ${err instanceof Error ? err.message : String(err)}`));
    }
  });
}

export function handleSignoutClick() {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken(null);
    localStorage.removeItem('google-calendar-token');
    localStorage.removeItem(CALENDAR_CONSTANTS.ID_KEY);
  }
}

export function isAuthorized(): boolean {
  return gapiInited && gisInited && window.gapi.client.getToken() !== null;
}

// Type declarations for Google APIs
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: { callback: () => void; onerror: () => void }) => void;
      client: {
        init: (config: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
        getToken: () => { access_token: string } | null;
        setToken: (token: { access_token: string } | null) => void;
        calendar: {
          events: {
            insert: (params: { calendarId: string; resource: CalendarEvent }) => Promise<{ result: { id: string } }>;
            update: (params: { calendarId: string; eventId: string; resource: CalendarEvent }) => Promise<void>;
            delete: (params: { calendarId: string; eventId: string }) => Promise<void>;
            get: (params: { calendarId: string; eventId: string }) => Promise<void>;
            list: (params: {
              calendarId: string;
              timeMin: string;
              showDeleted: boolean;
              singleEvents: boolean;
              maxResults: number;
              orderBy: string;
            }) => Promise<{ result: { items: CalendarEvent[] } }>;
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: { client_id: string; scope: string; callback: () => void }): TokenClient;
          revoke(token: string): void;
        };
      };
    };
  }
}

// Function to get or create the dedicated calendar
export async function getOrCreateCalendar(): Promise<string> {
  const savedId = localStorage.getItem(CALENDAR_CONSTANTS.ID_KEY);
  if (savedId) {
    try {
      await (window.gapi.client as unknown as { calendar: GapiClientCalendar }).calendar.calendars.get({
        calendarId: savedId
      });
      return savedId;
    } catch {
      localStorage.removeItem(CALENDAR_CONSTANTS.ID_KEY);
    }
  }

  // List calendars to check if one already exists
  const response = await (window.gapi.client as unknown as { calendar: GapiClientCalendar }).calendar.calendarList.list();
  const existingCalendar = response.result.items?.find(
    (cal: CalendarListEntry) => cal.summary === CALENDAR_CONSTANTS.NAME
  );

  if (existingCalendar) {
    localStorage.setItem(CALENDAR_CONSTANTS.ID_KEY, existingCalendar.id);
    return existingCalendar.id;
  }

  // Create new calendar
  const newCalendar = await (window.gapi.client as unknown as { calendar: GapiClientCalendar }).calendar.calendars.insert({
    resource: {
      summary: CALENDAR_CONSTANTS.NAME,
      description: 'Calendar for Research Planner tasks and milestones',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  const calendarId = newCalendar.result.id;
  localStorage.setItem(CALENDAR_CONSTANTS.ID_KEY, calendarId);
  return calendarId;
}

// Create calendar event from node
export async function createCalendarEvent(node: GraphNode): Promise<string> {
  if (!node.day) throw new Error('Node has no day assigned');

  const calendarId = await getOrCreateCalendar();

  const dateString = node.day instanceof Date
    ? node.day.toISOString().split('T')[0]
    : new Date(node.day).toISOString().split('T')[0];

  const event = {
    summary: node.title,
    description: node.description,
    start: {
      date: dateString,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      date: dateString,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  try {
    const response = await window.gapi.client.calendar.events.insert({
      calendarId: calendarId,
      resource: event
    });
    return response.result.id;
  } catch (error: unknown) {
    const apiError = error as { status?: number };
    if (apiError?.status === 401) {
      await refreshToken();
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event
      });
      return response.result.id;
    }
    throw error;
  }
}

export async function updateCalendarEvent(node: GraphNode, eventId: string): Promise<void> {
  if (!node.day) throw new Error('Node has no day assigned');

  const calendarId = await getOrCreateCalendar();

  // First verify the event exists
  try {
    await window.gapi.client.calendar.events.get({
      calendarId: calendarId,
      eventId: eventId
    });
  } catch (error: unknown) {
    const apiError = error as { status?: number };
    if (apiError?.status === 404) {
      const newEventId = await createCalendarEvent(node);
      node.calendarEventId = newEventId;
      return;
    }
    throw error;
  }

  const dateString = node.day instanceof Date
    ? node.day.toISOString().split('T')[0]
    : new Date(node.day).toISOString().split('T')[0];

  const event = {
    summary: node.title,
    description: node.description,
    start: {
      date: dateString,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      date: dateString,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  try {
    await window.gapi.client.calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      resource: event
    });
  } catch (error: unknown) {
    const apiError = error as { status?: number };
    if (apiError?.status === 401) {
      await refreshToken();
      await window.gapi.client.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: event
      });
      return;
    }
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendarId = await getOrCreateCalendar();

  try {
    await window.gapi.client.calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });
  } catch (error: unknown) {
    const apiError = error as { status?: number };
    if (apiError?.status === 401) {
      await refreshToken();
      await window.gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
      });
      return;
    }
    throw error;
  }
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 100,
      orderBy: 'startTime'
    });
    return response.result.items;
  } catch (error: unknown) {
    const apiError = error as { status?: number };
    if (apiError?.status === 401) {
      await refreshToken();
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 100,
        orderBy: 'startTime'
      });
      return response.result.items;
    }
    throw error;
  }
}
