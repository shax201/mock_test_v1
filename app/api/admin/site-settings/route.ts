import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, hasRole } from '@/lib/auth/jwt'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { uploadBrandingAsset, deleteFile } from '@/lib/storage/cloudinary'

// GET - Retrieve current site settings
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    
    if (!payload || !hasRole(payload, UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get or create site settings (singleton pattern)
    let settings = await prisma.siteSettings.findFirst()
    
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {}
      })
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        logoPublicId: settings.logoPublicId,
        faviconPublicId: settings.faviconPublicId,
        updatedAt: settings.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Update site settings (logo/favicon)
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
    const logoFile = formData.get('logo') as File | null
    const faviconFile = formData.get('favicon') as File | null
    const removeLogo = formData.get('removeLogo') === 'true'
    const removeFavicon = formData.get('removeFavicon') === 'true'

    // Get or create site settings
    let settings = await prisma.siteSettings.findFirst()
    
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {}
      })
    }

    const updateData: {
      logoUrl?: string | null
      faviconUrl?: string | null
      logoPublicId?: string | null
      faviconPublicId?: string | null
    } = {}

    // Handle logo upload/removal
    if (removeLogo) {
      // Delete old logo from Cloudinary if exists
      if (settings.logoPublicId) {
        try {
          await deleteFile(settings.logoPublicId)
        } catch (error) {
          console.error('Error deleting old logo from Cloudinary:', error)
          // Continue even if deletion fails
        }
      }
      updateData.logoUrl = null
      updateData.logoPublicId = null
    } else if (logoFile) {
      // Validate file type
      if (!logoFile.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Logo must be an image file' }, { status: 400 })
      }

      // Validate file size (5MB max for logo)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (logoFile.size > maxSize) {
        return NextResponse.json({ 
          error: 'Logo size must be less than 5MB' 
        }, { status: 400 })
      }

      // Delete old logo from Cloudinary if exists
      if (settings.logoPublicId) {
        try {
          await deleteFile(settings.logoPublicId)
        } catch (error) {
          console.error('Error deleting old logo from Cloudinary:', error)
          // Continue even if deletion fails
        }
      }

      // Upload new logo to Cloudinary
      const timestamp = Date.now()
      const fileExtension = logoFile.name.split('.').pop() || 'png'
      const filename = `${timestamp}.${fileExtension}`
      
      const uploadResult = await uploadBrandingAsset(logoFile, 'logo', filename)
      updateData.logoUrl = uploadResult.secure_url
      updateData.logoPublicId = uploadResult.public_id
    }

    // Handle favicon upload/removal
    if (removeFavicon) {
      // Delete old favicon from Cloudinary if exists
      if (settings.faviconPublicId) {
        try {
          await deleteFile(settings.faviconPublicId)
        } catch (error) {
          console.error('Error deleting old favicon from Cloudinary:', error)
          // Continue even if deletion fails
        }
      }
      updateData.faviconUrl = null
      updateData.faviconPublicId = null
    } else if (faviconFile) {
      // Validate file type (favicon should be .ico, .png, or .svg)
      const validTypes = ['image/x-icon', 'image/png', 'image/svg+xml', 'image/jpeg']
      if (!validTypes.includes(faviconFile.type) && !faviconFile.name.match(/\.(ico|png|svg|jpg|jpeg)$/i)) {
        return NextResponse.json({ 
          error: 'Favicon must be .ico, .png, .svg, or .jpg format' 
        }, { status: 400 })
      }

      // Validate file size (1MB max for favicon)
      const maxSize = 1 * 1024 * 1024 // 1MB
      if (faviconFile.size > maxSize) {
        return NextResponse.json({ 
          error: 'Favicon size must be less than 1MB' 
        }, { status: 400 })
      }

      // Delete old favicon from Cloudinary if exists
      if (settings.faviconPublicId) {
        try {
          await deleteFile(settings.faviconPublicId)
        } catch (error) {
          console.error('Error deleting old favicon from Cloudinary:', error)
          // Continue even if deletion fails
        }
      }

      // Upload new favicon to Cloudinary
      const timestamp = Date.now()
      const fileExtension = faviconFile.name.split('.').pop() || 'ico'
      const filename = `${timestamp}.${fileExtension}`
      
      const uploadResult = await uploadBrandingAsset(faviconFile, 'favicon', filename)
      updateData.faviconUrl = uploadResult.secure_url
      updateData.faviconPublicId = uploadResult.public_id
    }

    // Update settings
    const updatedSettings = await prisma.siteSettings.update({
      where: { id: settings.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      settings: {
        id: updatedSettings.id,
        logoUrl: updatedSettings.logoUrl,
        faviconUrl: updatedSettings.faviconUrl,
        logoPublicId: updatedSettings.logoPublicId,
        faviconPublicId: updatedSettings.faviconPublicId,
        updatedAt: updatedSettings.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating site settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

