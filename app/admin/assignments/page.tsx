import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import AssignmentsClient from './AssignmentsClient'

interface Assignment {
  id: string
  student: {
    id: string
    name: string
    email: string
  }
  readingTest: {
    id: string
    title: string
  }
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  validFrom: string
  validUntil: string
  accessToken: string
  assignedAt: string
  createdAt: string
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the assignments query with tags for on-demand revalidation
const getCachedAssignments = unstable_cache(
  async (): Promise<Assignment[]> => {
    // Check if assignment model exists
    if (!prisma.assignment) {
      console.error('Assignment model not found in Prisma client.')
      return []
    }

    const assignments = await prisma.assignment.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        readingTest: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate status based on dates
    const now = new Date()
    const assignmentsWithStatus = assignments.map(assignment => {
      let status = assignment.status

      // Auto-update status based on dates
      if (new Date(assignment.validFrom) > now) {
        status = 'PENDING'
      } else if (new Date(assignment.validUntil) < now) {
        status = 'EXPIRED'
      } else if (status === 'PENDING' && new Date(assignment.validFrom) <= now) {
        status = 'ACTIVE'
      }

      return {
        id: assignment.id,
        student: {
          id: assignment.student.id,
          name: assignment.student.name || '',
          email: assignment.student.email
        },
        readingTest: {
          id: assignment.readingTest.id,
          title: assignment.readingTest.title
        },
        status,
        validFrom: assignment.validFrom.toISOString(),
        validUntil: assignment.validUntil.toISOString(),
        accessToken: assignment.accessToken,
        assignedAt: assignment.assignedAt?.toISOString() || assignment.createdAt.toISOString(),
        createdAt: assignment.createdAt.toISOString()
      }
    })

    return assignmentsWithStatus
  },
  ['assignments-list'],
  {
    revalidate: 60,
    tags: ['assignments']
  }
)

export default async function AssignmentsPage() {
  // Auth is handled by middleware

  // Fetch assignments with caching
  let assignments: Assignment[] = []
  let error = ''

  try {
    assignments = await getCachedAssignments()
  } catch (err) {
    console.error('Error fetching assignments:', err)
    error = 'Failed to fetch assignments'
  }

  return <AssignmentsClient initialAssignments={assignments} error={error} />
}
