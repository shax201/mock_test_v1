import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { UserRole } from '@prisma/client'
import { uploadAudio } from '@/lib/storage/cloudinary'

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
    const file = formData.get('audio') as File

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio file' }, { status: 400 })
    }

    // Validate file size (25MB max for better upload reliability)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size must be less than 25MB. Please compress your audio file or use a shorter recording.' 
      }, { status: 400 })
    }

    // Validate file size minimum (1KB)
    const minSize = 1024 // 1KB
    if (file.size < minSize) {
      return NextResponse.json({ 
        error: 'File appears to be empty or corrupted. Please check your audio file.' 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'mp3'
    const filename = `audio_${timestamp}.${fileExtension}`

    // Upload to Cloudinary
    const uploadResult = await uploadAudio(file, filename)

    return NextResponse.json({ 
      success: true, 
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      filename: filename,
      size: file.size,
      type: file.type,
      format: uploadResult.format
    })

  } catch (error: any) {
    console.error('Error uploading audio file:', error)
    
    // Handle specific error types
    if (error.message && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Upload timeout. The file may be too large or your connection is slow. Please try a smaller file.' },
        { status: 408 }
      )
    } else if (error.message && error.message.includes('Invalid file format')) {
      return NextResponse.json(
        { error: 'Invalid audio format. Please use MP3, WAV, or other common audio formats.' },
        { status: 400 }
      )
    } else if (error.message && error.message.includes('File too large')) {
      return NextResponse.json(
        { error: 'File is too large for upload. Please compress the audio file.' },
        { status: 413 }
      )
    } else if (error.message && error.message.includes('Authentication failed')) {
      return NextResponse.json(
        { error: 'Upload service configuration error. Please contact support.' },
        { status: 500 }
      )
    } else {
      return NextResponse.json(
        { error: error.message || 'Failed to upload audio file. Please try again.' },
        { status: 500 }
      )
    }
  }
}
