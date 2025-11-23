// API Client for frontend

const API_BASE = '/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const coachesAPI = {
  getAll: () => fetchAPI('/coaches'),
  create: (coach: { name: string; specialties: string[] }) =>
    fetchAPI('/coaches', {
      method: 'POST',
      body: JSON.stringify(coach),
    }),
  update: (id: string, coach: { name: string; specialties: string[] }) =>
    fetchAPI(`/coaches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(coach),
    }),
  delete: (id: string) =>
    fetchAPI(`/coaches/${id}`, {
      method: 'DELETE',
    }),
  getRestrictions: (coachId: string) => fetchAPI(`/coaches/${coachId}/restrictions`),
  addRestriction: (coachId: string, restriction: { type: string; value: string }) =>
    fetchAPI(`/coaches/${coachId}/restrictions`, {
      method: 'POST',
      body: JSON.stringify(restriction),
    }),
  removeRestriction: (coachId: string, restrictionId: string) =>
    fetchAPI(`/coaches/${coachId}/restrictions?restrictionId=${restrictionId}`, {
      method: 'DELETE',
    }),
};

export const schedulesAPI = {
  getWeekSchedules: (weekStart: string) => fetchAPI(`/schedules/${weekStart}`),
  setWeekSchedules: (weekStart: string, schedules: any[]) =>
    fetchAPI(`/schedules/${weekStart}`, {
      method: 'POST',
      body: JSON.stringify({ schedules }),
    }),
  generateWeekSchedule: (weekStart: string) =>
    fetchAPI(`/generate/${weekStart}`, {
      method: 'POST',
    }),
  getGeneratedSchedule: (weekStart: string) => fetchAPI(`/generated/${weekStart}`),
  updateGeneratedSchedule: (weekStart: string, schedule: any[]) =>
    fetchAPI(`/generated/${weekStart}`, {
      method: 'PUT',
      body: JSON.stringify({ schedule }),
    }),
};

export const utilityAPI = {
  getCurrentWeek: () => fetchAPI('/current-week'),
  getHistory: (weeks: number = 6) => fetchAPI(`/history?weeks=${weeks}`),
  health: () => fetchAPI('/health'),
};

export function handleAPIError(error: any, defaultMessage: string = 'Ha ocurrido un error'): string {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}
