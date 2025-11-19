import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('student-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // There is not yet a dedicated data source for public mock tests.
    // Return an empty list so the UI can render without console errors.
    return NextResponse.json({ mockTests: [] })
  } catch (error) {
    console.error('Error fetching public mock tests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
