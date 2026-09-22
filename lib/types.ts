export type Role = 'super_admin' | 'business_owner' | 'staff';
export type BusinessStatus = 'active' | 'suspended' | 'inactive';
export type CardStatus = 'active' | 'inactive' | 'unassigned';

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  google_review_url: string;
  status: BusinessStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  business_id?: string;
  name?: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface PhysicalCard {
  id: string;
  business_id: string;
  card_code: string;
  name: string;
  status: CardStatus;
  created_at: string;
  business?: Business;
}

export interface ReviewSession {
  id: string;
  business_id: string;
  card_id?: string;
  rating?: number;
  feedback?: string;
  review_text?: string;
  google_clicked: boolean;
  completed: boolean;
  created_at: string;
  card_code?: string;
  business_name?: string;
}

export interface AIGeneration {
  id: string;
  business_id: string;
  session_id?: string;
  input_text: string;
  output_text: string;
  model: string;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  business_id: string;
  card_id?: string;
  session_id?: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
