import { create } from 'zustand';
import { mealCallApi } from './api';
import type { MealCall, MenuItem, ResponseType } from './types';

interface MealCallState {
  activeMealCall: MealCall | null;
  menus: MenuItem[];
  isLoadingActive: boolean;
  isLoadingMenus: boolean;
}

interface MealCallActions {
  fetchActive: () => Promise<void>;
  fetchMenus: () => Promise<void>;
  create: (params: { menu_item_ids?: string[]; message?: string }) => Promise<MealCall>;
  respond: (id: string, responseType: ResponseType, customMessage?: string) => Promise<void>;
  remind: (id: string) => Promise<string>;
  complete: (id: string) => Promise<void>;
  setActiveMealCall: (mc: MealCall | null) => void;
}

export const useMealCallStore = create<MealCallState & MealCallActions>((set, get) => ({
  activeMealCall: null,
  menus: [],
  isLoadingActive: false,
  isLoadingMenus: false,

  fetchActive: async () => {
    set({ isLoadingActive: true });
    try {
      const mc = await mealCallApi.getActive();
      set({ activeMealCall: mc });
    } finally {
      set({ isLoadingActive: false });
    }
  },

  fetchMenus: async () => {
    set({ isLoadingMenus: true });
    try {
      const menus = await mealCallApi.getMenus();
      set({ menus });
    } finally {
      set({ isLoadingMenus: false });
    }
  },

  create: async (params) => {
    const mc = await mealCallApi.create(params);
    set({ activeMealCall: mc });
    return mc;
  },

  respond: async (id, responseType, customMessage) => {
    const mc = await mealCallApi.respond(id, {
      response_type: responseType,
      custom_message: customMessage,
    });
    // 활성 밥먹자가 같은 id면 상태 업데이트
    if (get().activeMealCall?.id === id) {
      set({ activeMealCall: mc });
    }
  },

  remind: async (id) => {
    const result = await mealCallApi.remind(id);
    return result.message;
  },

  complete: async (id) => {
    const mc = await mealCallApi.complete(id);
    if (get().activeMealCall?.id === id) {
      set({ activeMealCall: null });
    }
  },

  setActiveMealCall: (mc) => set({ activeMealCall: mc }),
}));
