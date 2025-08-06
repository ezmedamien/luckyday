import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const supabaseUrl = 'https://cqwwgxgewemzyddwvoxc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxd3dneGdld2VtenlkZHd2b3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDU2NzMsImV4cCI6MjA2OTc4MTY3M30.LpIa5Yh6YLM5Zt3yOEqWJwLh6t5pWDYaMmv5At4yWwY'

// Create a server-side Supabase client that can handle authentication
export function createServerSupabaseClient(request?: NextRequest) {
  let accessToken: string | undefined

  // Extract token from Authorization header if request is provided
  if (request) {
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7) // Remove 'Bearer ' prefix
      console.log('Access token extracted:', accessToken ? 'Yes' : 'No')
    }
  }

  // Create client with proper server-side auth configuration
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {}
    }
  })

  return supabase
}

// Helper function to get authenticated user from request
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    console.log('Getting authenticated user...')
    const supabase = createServerSupabaseClient(request)
    
    // First, try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check:', { hasSession: !!session, error: sessionError?.message })
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return { user: null, error: sessionError }
    }

    if (!session) {
      console.log('No session found, trying getUser directly...')
      // If no session, try getUser directly
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('getUser error:', error)
        return { user: null, error }
      }

      if (!user) {
        console.log('No user found')
        return { user: null, error: new Error('No authenticated user found') }
      }

      console.log('User found via getUser:', user.id)
      return { user, error: null }
    }

    console.log('User found via session:', session.user.id)
    return { user: session.user, error: null }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return { user: null, error: error as Error }
  }
}

// Helper function to verify user has access to a resource
export async function verifyUserAccess(request: NextRequest, resourceUserId: string) {
  const { user, error } = await getAuthenticatedUser(request)
  
  if (error || !user) {
    return { 
      authorized: false, 
      error: 'Authentication failed',
      details: error?.message || 'No authenticated user found'
    }
  }

  if (user.id !== resourceUserId) {
    return { 
      authorized: false, 
      error: 'Access denied',
      details: 'User ID mismatch - you can only access your own resources'
    }
  }

  return { authorized: true, user }
} 