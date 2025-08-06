import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Self-hosted Supabase configuration with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
                   'https://db.techpinoy.net'

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amNtdGx0d2RjcGJkdnVubXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDM0MDAsImV4cCI6MjA2NDE3OTQwMH0.yap8eSNbFjYJsz43kwUZtGh8O3V7V9YPQC5bgx3cFWs'

// Debug logging for troubleshooting
console.log('🔄 Supabase Configuration:', {
  url: supabaseUrl,
  hasCustomUrl: !!(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL),
  hasCustomKey: !!(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
});

// Debug logging for self-hosted setup
console.log('🔄 Self-hosted Supabase Configuration:', {
  url: supabaseUrl,
  hasCustomUrl: !!(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL),
  hasCustomKey: !!(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
})

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'techpinoy-app'
    }
  }
})

// Development utilities (removed insecure server switching)
export const devUtils = {
  // Get current server info
  getCurrentServer: () => {
    return {
      url: supabaseUrl,
      isProduction: !supabaseUrl.includes('localhost')
    }
  },
  
  // Test connection with enhanced debugging
  testConnection: async () => {
    try {
      console.log('🧪 Testing Supabase connection to:', supabaseUrl);
      
      const { data, error } = await supabase.from('clients').select('count').limit(1)
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
      } else {
        console.log('✅ Supabase connection test successful');
      }
      
      return {
        success: !error,
        error: error?.message,
        data,
        config: {
          url: supabaseUrl,
          hasKey: !!supabaseAnonKey
        }
      }
    } catch (err) {
      console.error('❌ Supabase connection test exception:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        config: {
          url: supabaseUrl,
          hasKey: !!supabaseAnonKey
        }
      }
    }
  }
}

// Console logging for debugging (production safe)
console.log(`🔄 Supabase Client initialized`);
