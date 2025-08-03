import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cqwwgxgewemzyddwvoxc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxd3dneGdld2VtenlkZHd2b3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDU2NzMsImV4cCI6MjA2OTc4MTY3M30.LpIa5Yh6YLM5Zt3yOEqWJwLh6t5pWDYaMmv5At4yWwY'

// Create the main client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create admin client for server-side operations (requires service role key)
// Note: In production, you should use environment variables for the service role key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export type User = {
  id: string
  email?: string
  created_at: string
}

export type SavedCombo = {
  id?: string
  user_id: string
  numbers: number[]
  saved_at: string
  method: string
  description?: string
} 