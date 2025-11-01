import { SignJWT, jwtVerify } from 'jose'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here'
const secret = new TextEncoder().encode(JWT_SECRET)

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat: number
  exp: number
}

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)

  return token
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch (error) {
    return null
  }
}

export function isTokenExpired(payload: JWTPayload): boolean {
  return Date.now() >= payload.exp * 1000
}

export function hasRole(payload: JWTPayload, requiredRole: UserRole): boolean {
  // Admin has access to everything
  if (payload.role === UserRole.ADMIN) {
    return true
  }
  
  // Check if user has the required role
  return payload.role === requiredRole
}

export function hasAnyRole(payload: JWTPayload, roles: UserRole[]): boolean {
  return roles.includes(payload.role)
}
