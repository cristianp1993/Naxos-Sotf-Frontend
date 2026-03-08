// ── Tipos para el módulo de gamificación / loyalty ──

export interface LoyaltyMember {
  id: number;
  full_name: string;
  phone_number: string | null;
  points_balance: number;
}

export interface LoyaltySearchMember {
  id: number;
  full_name: string;
  phone_number: string | null;
  document_id: string | null;
  points_balance: number;
}

export interface SearchMembersResponse {
  members: LoyaltySearchMember[];
}

export interface RegisterMemberPayload {
  full_name: string;
  phone_number?: string;
  document_id?: string;
}

export interface RegisterMemberResponse {
  message: string;
  member: LoyaltyMember;
}

export interface CheckPointsResponse {
  member: {
    id: number;
    full_name: string;
    points_balance: number;
  };
}

export interface Reward {
  id: number;
  reward_name: string;
  points_cost: number;
}

export interface RewardsResponse {
  rewards: Reward[];
}

export interface AddPointsPayload {
  member_id: number;
  sale_amount: number;
  reference_id?: string;
  description?: string;
}

export interface AddPointsResponse {
  message: string;
  points_added: number;
  new_balance: number;
  transaction_id: number;
}

export interface RedeemPayload {
  member_id: number;
  reward_id?: number;
  points_to_redeem?: number;
  reference_id?: string;
  description?: string;
}

export interface RedeemResponse {
  message: string;
  reward_name: string;
  points_spent: number;
  new_balance: number;
  transaction_id: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: string[];
}
