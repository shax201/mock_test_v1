import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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

    // Fetch all completed test sessions for the student
    // Order by updatedAt to get the most recently evaluated sessions first
    const sessions = await prisma.testSession.findMany({
      where: {
        studentId: payload.userId,
        isCompleted: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Group sessions by test combination (reading + writing pairs)
    const testGroups = new Map<string, {
      readingSession?: typeof sessions[0]
      writingSession?: typeof sessions[0]
      readingTest?: any
      writingTest?: any
    }>()

    for (const session of sessions) {
      if (session.testType === 'READING') {
        const readingTest = await prisma.readingTest.findUnique({
          where: { id: session.testId },
          select: { id: true, title: true }
        })

        if (readingTest) {
          // Check if there's a writing test linked to this reading test
          const writingTest = await prisma.writingTest.findFirst({
            where: { readingTestId: readingTest.id },
            select: { id: true, title: true }
          })

          if (writingTest) {
            // Find the most recently updated writing session for this writing test
            // Since sessions are ordered by updatedAt desc, find will get the most recent one
            const writingSession = sessions.find(
              s => s.testType === 'WRITING' && s.testId === writingTest.id && s.studentId === payload.userId
            )

            const groupKey = `${readingTest.id}-${writingTest?.id || 'none'}`
            if (!testGroups.has(groupKey)) {
              testGroups.set(groupKey, {
                readingSession: session,
                writingSession: writingSession,
                readingTest: readingTest,
                writingTest: writingTest
              })
            }
          } else {
            // No writing test linked, create standalone reading result
            const groupKey = `reading-${readingTest.id}`
            if (!testGroups.has(groupKey)) {
              testGroups.set(groupKey, {
                readingSession: session,
                readingTest: readingTest
              })
            }
          }
        }
      } else if (session.testType === 'WRITING') {
        const writingTest = await prisma.writingTest.findUnique({
          where: { id: session.testId },
          include: {
            readingTest: {
              select: { id: true, title: true }
            }
          }
        })

        if (writingTest && writingTest.readingTest) {
          // Find reading session for the linked reading test
          const readingSession = sessions.find(
            s => s.testType === 'READING' && s.testId === writingTest.readingTest!.id && s.studentId === payload.userId
          )

          const groupKey = `${writingTest.readingTest.id}-${writingTest.id}`
          if (!testGroups.has(groupKey)) {
            testGroups.set(groupKey, {
              readingSession: readingSession,
              writingSession: session,
              readingTest: writingTest.readingTest,
              writingTest: { id: writingTest.id, title: writingTest.title }
            })
          }
        } else {
          // Standalone writing test (shouldn't happen but handle it)
          const groupKey = `writing-${session.testId}`
          if (!testGroups.has(groupKey)) {
            testGroups.set(groupKey, {
              writingSession: session,
              writingTest: writingTest ? { id: writingTest.id, title: writingTest.title } : null
            })
          }
        }
      }
    }

    // Format results
    const results = Array.from(testGroups.values()).map((group) => {
      const readingBand = group.readingSession?.band || 0
      const writingBand = group.writingSession?.band || 0
      
      // Calculate overall band
      let overallBand = 0
      if (readingBand > 0 && writingBand > 0) {
        overallBand = (readingBand + writingBand) / 2
      } else if (readingBand > 0) {
        overallBand = readingBand
      } else if (writingBand > 0) {
        overallBand = writingBand
      }

      // Determine test title
      let testTitle = 'Test'
      if (group.readingTest && group.writingTest) {
        testTitle = `${group.readingTest.title} + ${group.writingTest.title}`
      } else if (group.readingTest) {
        testTitle = group.readingTest.title
      } else if (group.writingTest) {
        testTitle = group.writingTest.title
      }

      // Get completion date (use the most recent one)
      const completedAt = group.writingSession?.completedAt || group.readingSession?.completedAt
      const sessionId = group.writingSession?.id || group.readingSession?.id

      return {
        id: sessionId || '',
        testTitle: testTitle,
        overallBand: overallBand,
        listeningBand: 0, // Not implemented yet
        readingBand: readingBand,
        writingBand: writingBand,
        speakingBand: 0, // Not implemented yet
        completedAt: completedAt?.toISOString() || new Date().toISOString(),
        status: 'completed',
        candidateNumber: '' // Can be added if needed
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error fetching student results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

