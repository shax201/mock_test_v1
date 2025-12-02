import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyJWT } from '@/lib/auth/jwt'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
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

    const { questionId } = await params

    // Find the question to get its reading test ID for revalidation
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        passageId: true,
        passage: {
          select: {
            readingTestId: true
          }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const readingTestId = question.passage.readingTestId

    // Delete correct answer first (foreign key constraint)
    await prisma.correctAnswer.deleteMany({
      where: { questionId: questionId }
    })

    // Delete the question
    await prisma.question.delete({
      where: { id: questionId }
    })

    // Revalidate the reading test edit page
    revalidatePath(`/admin/reading-tests/${readingTestId}/edit`)
    revalidateTag('reading-tests')

    return NextResponse.json({ 
      message: 'Question deleted successfully',
      readingTestId 
    })
  } catch (error: any) {
    console.error('Error deleting question:', error)
    
    // Handle Prisma record not found error
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

