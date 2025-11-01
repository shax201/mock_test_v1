import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory storage for demo purposes
// In production, you would use a database
const contentStorage = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const { moduleType, partNumber, content } = await request.json()

    // Validate required fields
    if (!moduleType || !partNumber || content === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: moduleType, partNumber, content' },
        { status: 400 }
      )
    }

    // Validate partNumber
    if (![1, 2, 3].includes(partNumber)) {
      return NextResponse.json(
        { error: 'partNumber must be 1, 2, or 3' },
        { status: 400 }
      )
    }

    // Validate moduleType
    if (!['LISTENING', 'READING', 'WRITING', 'SPEAKING'].includes(moduleType)) {
      return NextResponse.json(
        { error: 'moduleType must be one of: LISTENING, READING, WRITING, SPEAKING' },
        { status: 400 }
      )
    }

    console.log('Saving part content:', {
      moduleType,
      partNumber,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    })

    // Store content in memory storage
    const storageKey = `${moduleType}-part${partNumber}`
    contentStorage.set(storageKey, {
      moduleType,
      partNumber,
      content,
      savedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Part content saved successfully',
      data: {
        moduleType,
        partNumber,
        content,
        savedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error saving part content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleType = searchParams.get('moduleType')
    const partNumber = searchParams.get('partNumber')

    if (!moduleType || !partNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters: moduleType, partNumber' },
        { status: 400 }
      )
    }

    // Fetch content from memory storage
    const storageKey = `${moduleType}-part${parseInt(partNumber)}`
    const storedContent = contentStorage.get(storageKey)
    
    if (storedContent) {
      return NextResponse.json({
        success: true,
        data: {
          moduleType,
          partNumber: parseInt(partNumber),
          content: storedContent.content,
          lastModified: storedContent.savedAt
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        data: {
          moduleType,
          partNumber: parseInt(partNumber),
          content: '',
          lastModified: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error('Error fetching part content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
