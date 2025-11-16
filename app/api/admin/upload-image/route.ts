import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { UserRole } from '@prisma/client'
import { uploadImage } from '@/lib/storage/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image file' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Image size must be less than 10MB. Please compress your image or use a smaller file.' 
      }, { status: 400 })
    }

    // Validate file size minimum (1KB)
    const minSize = 1024 // 1KB
    if (file.size < minSize) {
      return NextResponse.json({ 
        error: 'Image appears to be empty or corrupted. Please check your image file.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'png'
    const filename = `flowchart_${timestamp}.${fileExtension}`

    // Upload to Cloudinary
    const uploadResult = await uploadImage(file, filename)

    return NextResponse.json({ 
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes
    })
  } catch (error: any) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to upload image' 
    }, { status: 500 })
  }
}

