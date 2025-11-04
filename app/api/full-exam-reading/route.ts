import { NextRequest, NextResponse } from 'next/server'
import testData from '@/app/full-exam-reading/reading-test-data.json'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(testData)
  } catch (error) {
    console.error('Error fetching full exam reading test data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
