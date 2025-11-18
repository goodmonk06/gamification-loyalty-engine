import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Programs
export const getPrograms = () => api.get('/programs');
export const getProgram = (key: string) => api.get(`/programs/${key}`);
export const createProgram = (data: any) => api.post('/programs', data);
export const updateProgram = (key: string, data: any) => api.put(`/programs/${key}`, data);

// Events
export const getEventDefinitions = (programKey: string) =>
  api.get(`/programs/${programKey}/events`);
export const createEventDefinition = (programKey: string, data: any) =>
  api.post(`/programs/${programKey}/events`, data);

// Badges
export const getBadges = (programKey: string) => api.get(`/badges/${programKey}`);
export const createBadge = (programKey: string, data: any) =>
  api.post(`/badges/${programKey}`, data);

// Users
export const getUsers = (programKey: string, limit = 50, offset = 0) =>
  api.get(`/users/${programKey}/list?limit=${limit}&offset=${offset}`);
export const getUserAccount = (programKey: string, externalUserId: string) =>
  api.get(`/users/${programKey}/${externalUserId}`);
export const getUserHistory = (programKey: string, externalUserId: string) =>
  api.get(`/users/${programKey}/${externalUserId}/history`);

// Event Ingestion
export const ingestEvent = (data: any) => api.post('/events/ingest', data);
