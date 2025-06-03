import { Event } from '../types';

// Define the scopes we need for Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export async function initiateGoogleAuth() {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured');
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  const authUrl = `${GOOGLE_OAUTH_URL}?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=code&access_type=offline&prompt=consent`;

  window.location.href = authUrl;
}

export async function fetchGoogleCalendarEvents(accessToken: string): Promise<Event[]> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google Calendar events');
  }

  const data = await response.json();
  
  // Convert Google Calendar events to our Event format
  return data.items.map((item: any) => ({
    id: item.id,
    title: item.summary,
    start: item.start.dateTime || item.start.date,
    end: item.end.dateTime || item.end.date,
    type: 'meeting',
    priority: 'medium',
    description: item.description || '',
    attendees: item.attendees?.map((attendee: any) => attendee.email) || [],
  }));
}
