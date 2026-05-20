import {createClient} from '@supabase/supabase-js';

export type ExerciseKey = 'supino' | 'agachamento';

export interface SupabaseUser {
  id: string;
  shopify_id: string | null;
  username: string;
  created_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise: ExerciseKey;
  weight_kg: number;
  approved_at: string;
}

export interface VideoSubmission {
  id: string;
  username: string;
  user_id: string | null;
  exercise: ExerciseKey;
  weight_kg: number;
  video_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function createSupabaseClient(env: {
  PUBLIC_SUPABASE_URL: string;
  PUBLIC_SUPABASE_ANON_KEY: string;
}) {
  return createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
}

export function createSupabaseAdminClient(env: {
  PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}) {
  return createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}
