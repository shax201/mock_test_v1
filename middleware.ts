import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { UserRole } from '@prisma/client'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?type=admin', request.url))
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/login?type=admin', request.url))
    }

    return NextResponse.next()
  }

  // Instructor routes protection
  if (pathname.startsWith('/instructor')) {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?type=instructor', request.url))
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== UserRole.INSTRUCTOR) {
      return NextResponse.redirect(new URL('/login?type=instructor', request.url))
    }

    return NextResponse.next()
  }

  // Student routes protection
  if (pathname.startsWith('/student')) {
    const token = request.cookies.get('student-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?type=student', request.url))
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== UserRole.STUDENT) {
      return NextResponse.redirect(new URL('/login?type=student', request.url))
    }

    return NextResponse.next()
  }

  // Student test routes protection
  if (pathname.startsWith('/test')) {
    const token = request.cookies.get('student-token')?.value
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?type=student', request.url))
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== UserRole.STUDENT) {
      return NextResponse.redirect(new URL('/login?type=student', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/instructor/:path*',
    '/student/:path*',
    '/test/:path*'
  ]
}
