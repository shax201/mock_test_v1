import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { UserRole } from '@prisma/client'
import { deleteFile } from '@/lib/storage/cloudinary'

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { public_id } = await request.json()

    if (!public_id) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    // Delete file from Cloudinary
    const success = await deleteFile(public_id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Audio file deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting audio file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
