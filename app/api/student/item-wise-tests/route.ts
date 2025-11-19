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

    const itemWiseTests = await prisma.itemWiseTest.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        testType: true,
        questionType: true,
        moduleType: true,
        isActive: true,
        readingTestIds: true,
        listeningTestIds: true,
        writingTestIds: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const readingIds = Array.from(
      new Set(
        itemWiseTests.flatMap((test) => test.readingTestIds || [])
      )
    )
    const listeningIds = Array.from(
      new Set(
        itemWiseTests.flatMap((test) => test.listeningTestIds || [])
      )
    )
    const writingIds = Array.from(
      new Set(
        itemWiseTests.flatMap((test) => test.writingTestIds || [])
      )
    )

    const relevantTestIds = Array.from(new Set([...readingIds, ...listeningIds, ...writingIds]))

    const [readingTests, listeningTests, writingTests, listeningPartCounts, writingPassageCounts, sessions] = await Promise.all([
      readingIds.length
        ? prisma.readingTest.findMany({
            where: { id: { in: readingIds } },
            select: { id: true, title: true, totalTimeMinutes: true, totalQuestions: true }
          })
        : Promise.resolve([]),
      listeningIds.length
        ? prisma.listeningTest.findMany({
            where: { id: { in: listeningIds } },
            select: { id: true, title: true, audioSource: true, totalTimeMinutes: true }
          })
        : Promise.resolve([]),
      writingIds.length
        ? prisma.writingTest.findMany({
            where: { id: { in: writingIds } },
            select: { id: true, title: true, totalTimeMinutes: true }
          })
        : Promise.resolve([]),
      listeningIds.length
        ? prisma.listeningPart.findMany({
            where: { listeningTestId: { in: listeningIds } },
            select: {
              listeningTestId: true,
              _count: { select: { questions: true } }
            }
          })
        : Promise.resolve([]),
      writingIds.length
        ? prisma.writingPassage.findMany({
            where: { writingTestId: { in: writingIds } },
            select: {
              writingTestId: true,
              _count: { select: { questions: true } }
            }
          })
        : Promise.resolve([]),
      relevantTestIds.length
        ? prisma.testSession.findMany({
            where: {
              studentId: payload.userId,
              testId: { in: relevantTestIds }
            },
            orderBy: { completedAt: 'desc' }
          })
        : Promise.resolve([])
    ])

    const readingMap = new Map(readingTests.map((test) => [test.id, test]))
    const listeningMap = new Map(listeningTests.map((test) => [test.id, test]))
    const writingMap = new Map(writingTests.map((test) => [test.id, test]))

    const listeningQuestionMap = new Map<string, number>()
    listeningPartCounts.forEach(part => {
      listeningQuestionMap.set(
        part.listeningTestId,
        (listeningQuestionMap.get(part.listeningTestId) || 0) + (part._count.questions || 0)
      )
    })

    const writingQuestionMap = new Map<string, number>()
    writingPassageCounts.forEach(passage => {
      writingQuestionMap.set(
        passage.writingTestId,
        (writingQuestionMap.get(passage.writingTestId) || 0) + (passage._count.questions || 0)
      )
    })

    const sessionMap = new Map<string, (typeof sessions)[number]>()
    sessions.forEach(session => {
      const specificKey = `${session.itemWiseTestId || 'global'}:${session.testId}`
      if (!sessionMap.has(specificKey)) {
        sessionMap.set(specificKey, session)
      }
      const globalKey = `global:${session.testId}`
      if (!session.itemWiseTestId && !sessionMap.has(globalKey)) {
        sessionMap.set(globalKey, session)
      }
    })

    const getSessionForTest = (itemWiseTestId: string, testId: string) => {
      return sessionMap.get(`${itemWiseTestId}:${testId}`) || sessionMap.get(`global:${testId}`)
    }

    const formatted = itemWiseTests.map((test) => ({
      id: test.id,
      title: test.title,
      testType: test.testType,
      questionType: test.questionType,
      moduleType: test.moduleType,
      isActive: test.isActive,
      createdAt: test.createdAt.toISOString(),
      updatedAt: test.updatedAt.toISOString(),
      readingTests: (test.readingTestIds || [])
        .map((id) => {
          const reading = readingMap.get(id)
          if (!reading) return null
          const session = getSessionForTest(test.id, id)
          return {
            id,
            title: reading.title,
            totalTimeMinutes: reading.totalTimeMinutes,
            totalQuestions: reading.totalQuestions,
            attempted: Boolean(session?.isCompleted),
            attemptedAt: session?.completedAt?.toISOString() || null,
            sessionId: session?.id
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
      listeningTests: (test.listeningTestIds || [])
        .map((id) => {
          const listening = listeningMap.get(id)
          if (!listening) return null
          const session = getSessionForTest(test.id, id)
          return {
            id,
            title: listening.title,
            audioSource: listening.audioSource,
            totalTimeMinutes: listening.totalTimeMinutes,
            totalQuestions: listeningQuestionMap.get(id) || 0,
            attempted: Boolean(session?.isCompleted),
            attemptedAt: session?.completedAt?.toISOString() || null,
            sessionId: session?.id
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
      writingTests: (test.writingTestIds || [])
        .map((id) => {
          const writing = writingMap.get(id)
          if (!writing) return null
          const session = getSessionForTest(test.id, id)
          return {
            id,
            title: writing.title,
            totalTimeMinutes: writing.totalTimeMinutes,
            totalQuestions: writingQuestionMap.get(id) || 0,
            attempted: Boolean(session?.isCompleted),
            attemptedAt: session?.completedAt?.toISOString() || null,
            sessionId: session?.id
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    }))

    return NextResponse.json({ itemWiseTests: formatted })
  } catch (error) {
    console.error('Error fetching item-wise tests for student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
