import { GraphNode } from '../types';

// Google Calendar API configuration
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

interface GoogleAuthConfig {
  clientId: string;
  apiKey: string;
}

interface AuthResult {
  gapiInited: boolean;
  gisInited: boolean;
  isAuthenticated: boolean;
}

interface TokenResponse {
  error?: string;
  access_token?: string;
}

interface TokenClient {
  callback: (response: TokenResponse) => void;
  requestAccessToken: (options: { prompt: string }) => void;
}

interface CalendarEvent {
  summary: string;
  description: string;
  start: {
    date: string;
    timeZone: string;
  };
  end: {
    date: string;
    timeZone: string;
  };
}

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

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

  gapiInited = true;  // Set the flag after successful initialization
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
    callback: '', // defined at request time
  });

  gisInited = true;  // Set the flag after successful initialization
  return true;
}

// Helper function to check if user is authenticated
async function checkIfAuthenticated(): Promise<boolean> {
  console.log('\n=== Checking Authentication ===');
  try {
    // Check if we have an access token
    const token = window.gapi?.client?.getToken();
    console.log('Current token:', token);
    const isAuth = !!token && !!token.access_token;
    console.log('Is authenticated:', isAuth);
    if (isAuth) {
      console.log('Access token:', token.access_token.substring(0, 10) + '...');
    }
    return isAuth;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Add new helper function to validate token
async function validateToken(token: { access_token: string }): Promise<boolean> {
  try {
    // Try a simple API call to validate the token
    await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 1,
      orderBy: 'startTime'
    });
    return true;
  } catch (error) {
    console.warn('Token validation failed:', error);
    return false;
  }
}

// Add new helper function to handle token refresh
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
        } catch (error) {
          console.warn('Failed to save refreshed token:', error);
        }
      }
      resolve();
    };

    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export async function initGoogleAuth(config: GoogleAuthConfig): Promise<AuthResult> {
  console.log('\n=== Starting Google Auth Initialization ===');
  console.log('Initial state:', { gapiInited, gisInited, tokenClient: !!tokenClient });
  
  try {
    // Reset flags at the start of initialization
    gapiInited = false;
    gisInited = false;
    tokenClient = null;

    // Load and initialize the Google API client library
    console.log('Loading GAPI client...');
    await loadGapiClient();
    await initializeGapiClient(config.apiKey);
    console.log('GAPI initialized successfully');
    
    // Load and initialize the Google Identity Services library
    console.log('Loading GIS client...');
    await loadGisClient();
    await initializeGisClient(config.clientId);
    console.log('GIS initialized successfully');

    // Try to restore token from localStorage
    try {
      const savedToken = localStorage.getItem('google-calendar-token');
      if (savedToken) {
        console.log('Found saved token, attempting to restore...');
        const token = JSON.parse(savedToken);
        window.gapi.client.setToken(token);
        
        // Validate the restored token
        const isValid = await validateToken(token);
        if (!isValid) {
          console.log('Restored token is invalid, attempting refresh...');
          await refreshToken();
        }
      }
    } catch (error) {
      console.warn('Failed to restore/refresh token:', error);
      window.gapi.client.setToken(null);
      localStorage.removeItem('google-calendar-token');
    }

    // Check if authenticated
    const isAuthenticated = await checkIfAuthenticated();
    
    console.log('Initialization complete:', {
      gapiInited,
      gisInited,
      tokenClient: !!tokenClient,
      isAuthenticated,
      hasToken: !!window.gapi?.client?.getToken()
    });
    
    return { gapiInited, gisInited, isAuthenticated };
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    // Reset flags on error
    gapiInited = false;
    gisInited = false;
    tokenClient = null;
    throw error;
  }
}

export async function handleAuthClick(): Promise<void> {
  console.log('\n=== Starting Auth Click Handler ===');
  console.log('Initial state:', {
    gapiInited,
    gisInited,
    tokenClient: !!tokenClient,
    hasToken: !!window.gapi?.client?.getToken()
  });

  // Wait for initialization if needed
  let retries = 0;
  const maxRetries = 5;
  const retryInterval = 1000; // 1 second

  while ((!gapiInited || !gisInited || !tokenClient) && retries < maxRetries) {
    console.log(`Initialization check (attempt ${retries + 1}/${maxRetries}):`, {
      gapiInited,
      gisInited,
      tokenClient: !!tokenClient,
      hasToken: !!window.gapi?.client?.getToken()
    });
    await new Promise(resolve => setTimeout(resolve, retryInterval));
    retries++;
  }

  // Final check of initialization status
  console.log('Final initialization state:', {
    gapiInited,
    gisInited,
    tokenClient: !!tokenClient,
    hasToken: !!window.gapi?.client?.getToken(),
    retries
  });

  if (!tokenClient || !gapiInited || !gisInited) {
    const error = new Error(
      `Google APIs not fully initialized after ${maxRetries} retries.\n` +
      `Status: GAPI: ${gapiInited}, GIS: ${gisInited}, TokenClient: ${!!tokenClient}\n` +
      'Please refresh the page and try again.'
    );
    console.error('Initialization failed:', error);
    throw error;
  }

  return new Promise((resolve, reject) => {
    try {
      console.log('Setting up token request...');
      // Request an access token
      const client = tokenClient!;
      client.callback = (resp: TokenResponse) => {
        if (resp.error !== undefined) {
          const error = new Error(`Authentication error: ${resp.error}`);
          console.error('Token request failed:', error);
          reject(error);
          return;
        }
        console.log('Token request successful');
        if (resp.access_token) {
          console.log('Access token received:', resp.access_token.substring(0, 10) + '...');
          // Save token to localStorage
          try {
            const token = window.gapi.client.getToken();
            if (token) {
              localStorage.setItem('google-calendar-token', JSON.stringify(token));
              console.log('Token saved to localStorage');
            }
          } catch (error) {
            console.warn('Failed to save token:', error);
          }
        }
        resolve();
      };

      const currentToken = window.gapi.client.getToken();
      console.log('Current token state:', {
        hasToken: !!currentToken,
        token: currentToken ? currentToken.access_token.substring(0, 10) + '...' : null
      });

      if (!currentToken) {
        console.log('Requesting token with consent prompt...');
        client.requestAccessToken({ prompt: 'consent' });
      } else {
        console.log('Requesting token without prompt...');
        client.requestAccessToken({ prompt: '' });
      }
    } catch (err) {
      const error = new Error(`Authentication error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Auth click handler failed:', error);
      reject(error);
    }
  });
}

export function handleSignoutClick() {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken(null);
    localStorage.removeItem('google-calendar-token');
    console.log('Token removed from localStorage');
  }
}

export function isAuthorized(): boolean {
  return gapiInited && gisInited && window.gapi.client.getToken() !== null;
}

// Add type declarations for Google APIs
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
        getToken: () => { access_token: string } | null;
        setToken: (token: { access_token: string } | null) => void;
        calendar: {
          events: {
            insert: (params: { calendarId: string; resource: CalendarEvent }) => Promise<{ result: { id: string } }>;
            update: (params: { calendarId: string; eventId: string; resource: CalendarEvent }) => Promise<void>;
            delete: (params: { calendarId: string; eventId: string }) => Promise<void>;
            list: (params: {
              calendarId: string;
              timeMin: string;
              showDeleted: boolean;
              singleEvents: boolean;
              maxResults: number;
              orderBy: string;
            }) => Promise<{ result: { items: any[] } }>;
          };
        };
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: any): TokenClient;
          revoke(token: string): void;
        };
      };
    };
  }
}

// Calendar API functions
export async function createCalendarEvent(node: GraphNode): Promise<string> {
  console.log('\n=== Creating Calendar Event ===');
  if (!node.day) throw new Error('Node has no day assigned');

  // Convert the day to a date string, handling both Date objects and ISO strings
  const dateString = node.day instanceof Date 
    ? node.day.toISOString().split('T')[0]
    : new Date(node.day).toISOString().split('T')[0];

  const event = {
    summary: node.title,
    description: node.description,
    start: {
      date: dateString,  // YYYY-MM-DD format
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      date: dateString,  // Same day event
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  console.log('Creating event:', event);
  console.log('GAPI initialized:', gapiInited);
  console.log('GIS initialized:', gisInited);
  console.log('Token:', window.gapi.client.getToken());

  try {
    const response = await window.gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    console.log('Event created successfully:', response.result);
    return response.result.id;
  } catch (error: any) {
    if (error?.status === 401) {
      console.log('Token expired, attempting refresh...');
      await refreshToken();
      // Retry the operation
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      console.log('Event created successfully after token refresh:', response.result);
      return response.result.id;
    }
    throw error;
  }
}

export async function updateCalendarEvent(node: GraphNode, eventId: string): Promise<void> {
  console.log('\n=== Updating Calendar Event ===');
  if (!node.day) throw new Error('Node has no day assigned');

  // Convert the day to a date string, handling both Date objects and ISO strings
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

  console.log('Updating event:', eventId);
  console.log('Event data:', event);

  try {
    await window.gapi.client.calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event
    });
    console.log('Event updated successfully');
  } catch (error: any) {
    if (error?.status === 401) {
      console.log('Token expired, attempting refresh...');
      await refreshToken();
      // Retry the operation
      await window.gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });
      console.log('Event updated successfully after token refresh');
      return;
    }
    throw error;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  console.log('\n=== Deleting Calendar Event ===');
  console.log('Deleting event:', eventId);

  try {
    await window.gapi.client.calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });
    console.log('Event deleted successfully');
  } catch (error: any) {
    if (error?.status === 401) {
      console.log('Token expired, attempting refresh...');
      await refreshToken();
      // Retry the operation
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
      console.log('Event deleted successfully after token refresh');
      return;
    }
    throw error;
  }
}

export async function listCalendarEvents(): Promise<any[]> {
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
  } catch (error: any) {
    if (error?.status === 401) {
      console.log('Token expired, attempting refresh...');
      await refreshToken();
      // Retry the operation
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