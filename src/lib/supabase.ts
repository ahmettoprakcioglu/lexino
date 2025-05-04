import { createClient } from '@supabase/supabase-js'
import { PostgrestSingleResponse } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simple cache implementation
type CacheEntry<T> = { data: PostgrestSingleResponse<T>; timestamp: number }
const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_DURATION = 5000 // 5 seconds

export const cachedSupabaseQuery = async <T>(
  key: string,
  queryFn: () => Promise<PostgrestSingleResponse<T>>
): Promise<PostgrestSingleResponse<T>> => {
  const cached = cache.get(key) as CacheEntry<T> | undefined
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  const result = await queryFn()
  cache.set(key, { data: result, timestamp: now })
  return result
}

export type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] 