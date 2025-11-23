import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public endpoint to get site settings (for logo/favicon display)
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.siteSettings.findFirst()
    
    return NextResponse.json({
      success: true,
      settings: settings ? {
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl
      } : {
        logoUrl: null,
        faviconUrl: null
      }
    })
  } catch (error) {
    console.error('Error fetching public site settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

