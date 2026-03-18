import { createClient } from '@supabase/supabase-js'
import {
  getSupabaseAnonKey,
  getSupabaseProjectUrl,
} from '../config/env.ts'

export const supabaseClient = createClient(
  getSupabaseProjectUrl(),
  getSupabaseAnonKey(),
)
