import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'
import { UserRole } from '@prisma/client'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
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

    // Student routes protection (includes /student/assignments/reading-tests/[id])
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

    // Student test routes protection (token-based test access)
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
  } catch (error) {
    console.error('Proxy middleware error:', error)
    // For API routes, return error response; for pages, redirect to login
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/instructor/:path*',
    '/student/:path*',
    '/test/:path*'
  ]
}
