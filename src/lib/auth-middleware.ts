import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from './supabase-server';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email?: string;
  };
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    
    if (error || !user) {
      return NextResponse.json({
        error: 'Authentication required',
        details: error?.message || 'No authenticated user found',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: user.id,
      email: user.email
    };

    // Call the handler
    return await handler(authenticatedRequest);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({
      error: 'Authentication failed',
      details: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    }, { status: 500 });
  }
}

export async function withUserAccess(
  request: NextRequest,
  resourceUserId: string,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get authenticated user
    const { user, error } = await getAuthenticatedUser(request);
    
    if (error || !user) {
      return NextResponse.json({
        error: 'Authentication required',
        details: error?.message || 'No authenticated user found',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Verify user has access to the resource
    if (user.id !== resourceUserId) {
      return NextResponse.json({
        error: 'Access denied',
        details: 'You can only access your own resources',
        code: 'ACCESS_DENIED'
      }, { status: 403 });
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = {
      id: user.id,
      email: user.email
    };

    // Call the handler
    return await handler(authenticatedRequest);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json({
      error: 'Authentication failed',
      details: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    }, { status: 500 });
  }
}

// Helper function to validate request body
export function validateRequestBody<T>(
  body: any,
  requiredFields: (keyof T)[]
): { valid: boolean; error?: string } {
  for (const field of requiredFields) {
    if (!body || body[field] === undefined || body[field] === null) {
      return {
        valid: false,
        error: `Missing required field: ${String(field)}`
      };
    }
  }
  return { valid: true };
}

// Helper function to create error response
export function createErrorResponse(
  message: string,
  details?: string,
  code?: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({
    error: message,
    details,
    code
  }, { status });
}

// Helper function to create success response
export function createSuccessResponse(
  data: any,
  message?: string
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  });
} 