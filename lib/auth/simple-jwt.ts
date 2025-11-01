// Simple JWT verification for middleware (Edge Runtime compatible)
export function verifyTokenInMiddleware(token: string): boolean {
  try {
    // Basic token format validation
    if (!token || typeof token !== 'string') {
      return false
    }

    // Check if token has the basic JWT structure (3 parts separated by dots)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }

    // For middleware, we just check if the token exists and has valid format
    // Full verification will be done in the page components
    return true
  } catch (error) {
    return false
  }
}

