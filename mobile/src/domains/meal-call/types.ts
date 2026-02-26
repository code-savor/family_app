export interface MenuItem {
  id: string;
  family_id: string;
  name: string;
  emoji_icon: string;
  category: string;
}

export type ResponseType = 'COMING_NOW' | 'COMING_5MIN' | 'NOT_EATING' | 'CUSTOM';

export interface MealResponse {
  id: string;
  member_id: string;
  member_nickname: string;
  response_type: ResponseType;
  custom_message: string | null;
  responded_at: string;
}

export type MealCallStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface MealCall {
  id: string;
  family_id: string;
  caller_id: string;
  caller_nickname: string;
  message: string | null;
  status: MealCallStatus;
  created_at: string;
  completed_at: string | null;
  menus: MenuItem[];
  responses: MealResponse[];
  pending_member_ids: string[];
}
