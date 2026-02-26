export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const endpoints = {
  // Identity
  createFamily: '/api/v1/families',
  getFamily: (id: string) => `/api/v1/families/${id}`,
  getFamilyMembers: (id: string) => `/api/v1/families/${id}/members`,
  createInviteLink: (familyId: string) => `/api/v1/families/${familyId}/invite-links`,
  validateInvite: (token: string) => `/api/v1/invite/${token}`,
  joinFamily: (token: string) => `/api/v1/invite/${token}/join`,
  login: '/api/v1/auth/login',
  refreshToken: '/api/v1/auth/refresh',

  // Meal Call
  menus: '/api/v1/menus',
  mealCalls: '/api/v1/meal-calls',
  activeMealCall: '/api/v1/meal-calls/active',
  mealCall: (id: string) => `/api/v1/meal-calls/${id}`,
  respondMealCall: (id: string) => `/api/v1/meal-calls/${id}/respond`,
  remindMealCall: (id: string) => `/api/v1/meal-calls/${id}/remind`,
  completeMealCall: (id: string) => `/api/v1/meal-calls/${id}/complete`,

  // Notification
  devices: '/api/v1/devices',
} as const;
