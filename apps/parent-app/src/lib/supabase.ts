import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

declare const process: { env: Record<string, string | undefined> }

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://gfcywrxdsfmlmsjytqzg.supabase.co',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmY3l3cnhkc2ZtbG1zanl0cXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTkwNDMsImV4cCI6MjA5NDE5NTA0M30.1Uv_do2whoCXGeGgML3OStktmozJFRm_6A0np4y0LGg',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
)
