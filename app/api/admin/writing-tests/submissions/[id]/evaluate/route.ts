import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'
import { emailService } from '@/lib/email/email-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyJWT(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const body = await request.json()

    const { band, task1Band, task2Band, speakingBand } = body

    // Validate band score
    if (band !== undefined && (band < 0 || band > 9)) {
      return NextResponse.json(
        { error: 'Band score must be between 0 and 9' },
        { status: 400 }
      )
    }

    if (task1Band !== undefined && (task1Band < 0 || task1Band > 9)) {
      return NextResponse.json(
        { error: 'Task 1 band score must be between 0 and 9' },
        { status: 400 }
      )
    }

    if (task2Band !== undefined && (task2Band < 0 || task2Band > 9)) {
      return NextResponse.json(
        { error: 'Task 2 band score must be between 0 and 9' },
        { status: 400 }
      )
    }

    if (speakingBand !== undefined && (speakingBand < 0 || speakingBand > 9)) {
      return NextResponse.json(
        { error: 'Speaking band score must be between 0 and 9' },
        { status: 400 }
      )
    }

    // Check if session exists and is a writing test
    const session = await prisma.testSession.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!session || session.testType !== 'WRITING') {
      return NextResponse.json(
        { error: 'Writing test submission not found' },
        { status: 404 }
      )
    }

    // Calculate overall band if task bands are provided
    let overallBand = band
    if (task1Band !== undefined && task2Band !== undefined) {
      // Task 2 is worth 2/3, Task 1 is worth 1/3
      overallBand = (task1Band * 1 + task2Band * 2) / 3
      // Round to nearest 0.5
      overallBand = Math.round(overallBand * 2) / 2
    } else if (task1Band !== undefined) {
      overallBand = task1Band
    } else if (task2Band !== undefined) {
      overallBand = task2Band
    }

    // Get the writing test to find the associated reading test
    const writingTest = await prisma.writingTest.findUnique({
      where: { id: session.testId },
      select: { readingTestId: true }
    })

    // Calculate overall band (average of reading + listening + writing)
    let calculatedOverallBand: number | null = null
    if (writingTest?.readingTestId && overallBand !== undefined) {
      // Find reading test session for the same student and reading test
      const readingSession = await prisma.testSession.findFirst({
        where: {
          studentId: session.studentId,
          testId: writingTest.readingTestId,
          testType: 'READING',
          isCompleted: true
        },
        orderBy: { completedAt: 'desc' }
      })

      // Find listening test session - listening tests are linked to reading tests
      const listeningTest = await prisma.listeningTest.findFirst({
        where: {
          readingTestId: writingTest.readingTestId,
          isActive: true
        },
        select: { id: true }
      })

      let listeningSession = null
      if (listeningTest) {
        listeningSession = await prisma.testSession.findFirst({
          where: {
            studentId: session.studentId,
            testId: listeningTest.id,
            testType: 'LISTENING',
            isCompleted: true
          },
          orderBy: { completedAt: 'desc' }
        })
      }

      // Calculate average if we have all three scores
      const bands: number[] = []
      if (readingSession?.band !== null && readingSession?.band !== undefined) {
        bands.push(readingSession.band)
      }
      if (listeningSession?.band !== null && listeningSession?.band !== undefined) {
        bands.push(listeningSession.band)
      }
      if (overallBand !== null && overallBand !== undefined) {
        bands.push(overallBand)
      }

      if (bands.length === 3) {
        // Calculate average and round to nearest 0.5
        const average = bands.reduce((sum, band) => sum + band, 0) / bands.length
        calculatedOverallBand = Math.round(average * 2) / 2
      }
    }

    // Update the session with evaluation
    const updatedSession = await prisma.testSession.update({
      where: { id: resolvedParams.id },
      data: {
        band: overallBand !== undefined ? overallBand : null,
        score: overallBand !== undefined ? Math.round(overallBand * 10) : null, // Convert band to score (0-90)
        overallBand: calculatedOverallBand
      }
    })

    // Handle speaking band score - create or update SPEAKING test session
    let speakingSession = null
    if (speakingBand !== undefined) {
      // writingTest is already fetched above
      if (writingTest) {
        // Check if speaking session already exists
        const existingSpeakingSession = await prisma.testSession.findFirst({
          where: {
            studentId: session.studentId,
            testId: writingTest.readingTestId,
            testType: 'SPEAKING'
          }
        })

        if (existingSpeakingSession) {
          // Update existing speaking session
          speakingSession = await prisma.testSession.update({
            where: { id: existingSpeakingSession.id },
            data: {
              band: speakingBand,
              score: Math.round(speakingBand * 10),
              isCompleted: true,
              completedAt: new Date()
            }
          })
        } else {
          // Create new speaking session
          speakingSession = await prisma.testSession.create({
            data: {
              testId: writingTest.readingTestId,
              studentId: session.studentId,
              testType: 'SPEAKING',
              band: speakingBand,
              score: Math.round(speakingBand * 10),
              isCompleted: true,
              completedAt: new Date(),
              startedAt: new Date()
            }
          })
        }
      }
    }

    // Revalidate the submissions list page and cache tags
    revalidatePath('/admin/writing-tests/submissions')
    revalidateTag('writing-submissions', 'max')
    // Also revalidate dashboard since it shows pending submissions count
    revalidatePath('/admin')
    revalidateTag('admin-dashboard', 'max')
    // Revalidate student results pages
    revalidateTag('student-results', 'max')
    revalidateTag('student-result-detail', 'max')

    // Send email to student with results
    try {
      // Fetch student details for email
      const sessionWithStudent = await prisma.testSession.findUnique({
        where: { id: resolvedParams.id },
        include: {
          student: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      if (sessionWithStudent?.student?.email) {
        // Format test date (use completedAt if available, otherwise use updatedAt)
        const testDate = updatedSession.completedAt 
          ? new Date(updatedSession.completedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : new Date(updatedSession.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })

        // Construct portal link
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const host = request.headers.get('host') || 'radianceedu.app'
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`
        const portalLink = `${baseUrl}/student`

        // Fetch reading and listening bands for email
        let readingBand: number | null = null
        let listeningBand: number | null = null

        if (writingTest?.readingTestId) {
          // Fetch reading session
          const readingSession = await prisma.testSession.findFirst({
            where: {
              studentId: session.studentId,
              testId: writingTest.readingTestId,
              testType: 'READING',
              isCompleted: true
            },
            orderBy: { completedAt: 'desc' }
          })
          readingBand = readingSession?.band ?? null

          // Fetch listening session
          const listeningTest = await prisma.listeningTest.findFirst({
            where: {
              readingTestId: writingTest.readingTestId,
              isActive: true
            },
            select: { id: true }
          })

          if (listeningTest) {
            const listeningSession = await prisma.testSession.findFirst({
              where: {
                studentId: session.studentId,
                testId: listeningTest.id,
                testType: 'LISTENING',
                isCompleted: true
              },
              orderBy: { completedAt: 'desc' }
            })
            listeningBand = listeningSession?.band ?? null
          }
        }

        // Send email using the new template with results
        await emailService.sendWritingTestResultEmail({
          candidateName: sessionWithStudent.student.name || 'Candidate',
          studentEmail: sessionWithStudent.student.email,
          testDate,
          portalLink,
          writingBand: updatedSession.band,
          overallBand: updatedSession.overallBand,
          readingBand,
          listeningBand,
          speakingBand: speakingSession?.band ?? null
        })

        console.log(`Writing test result email sent successfully to ${sessionWithStudent.student.email}`)
      }
    } catch (emailError) {
      // Log email error but don't fail the evaluation
      console.error('Error sending results email:', emailError)
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: updatedSession.id,
        band: updatedSession.band,
        score: updatedSession.score,
        overallBand: updatedSession.overallBand,
        updatedAt: updatedSession.updatedAt.toISOString()
      },
      speakingSession: speakingSession ? {
        id: speakingSession.id,
        band: speakingSession.band,
        score: speakingSession.score,
        updatedAt: speakingSession.updatedAt.toISOString()
      } : null
    })
  } catch (error) {
    console.error('Error evaluating writing test submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

