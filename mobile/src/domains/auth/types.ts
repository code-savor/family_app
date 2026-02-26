export interface Member {
  id: string;
  family_id: string;
  nickname: string;
  role: 'OWNER' | 'MEMBER';
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  member: Member | null;
}

export interface LoginParams {
  family_id: string;
  nickname: string;
  pin: string;
}

export interface CreateFamilyParams {
  family_name: string;
  owner_nickname: string;
  owner_pin: string;
}

export interface JoinFamilyParams {
  token: string;
  nickname: string;
  pin: string;
}
