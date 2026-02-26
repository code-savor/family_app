import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { MealCall, MenuItem, ResponseType } from './types';

export const mealCallApi = {
  async getActive(): Promise<MealCall | null> {
    const { data } = await apiClient.get<MealCall | null>(endpoints.activeMealCall);
    return data;
  },

  async getById(id: string): Promise<MealCall> {
    const { data } = await apiClient.get<MealCall>(endpoints.mealCall(id));
    return data;
  },

  async create(params: { menu_item_ids?: string[]; message?: string }): Promise<MealCall> {
    const { data } = await apiClient.post<MealCall>(endpoints.mealCalls, params);
    return data;
  },

  async respond(id: string, params: { response_type: ResponseType; custom_message?: string }): Promise<MealCall> {
    const { data } = await apiClient.post<MealCall>(endpoints.respondMealCall(id), params);
    return data;
  },

  async remind(id: string): Promise<{ pending_member_ids: string[]; message: string }> {
    const { data } = await apiClient.post(endpoints.remindMealCall(id));
    return data;
  },

  async complete(id: string): Promise<MealCall> {
    const { data } = await apiClient.put<MealCall>(endpoints.completeMealCall(id));
    return data;
  },

  async getMenus(): Promise<MenuItem[]> {
    const { data } = await apiClient.get<MenuItem[]>(endpoints.menus);
    return data;
  },

  async createMenu(params: { name: string; emoji_icon: string; category: string }): Promise<MenuItem> {
    const { data } = await apiClient.post<MenuItem>(endpoints.menus, params);
    return data;
  },
};
