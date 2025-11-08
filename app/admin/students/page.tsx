import { cookies } from 'next/headers'
import { verifyJWT } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import StudentsClient from './StudentsClient'

interface Student {
  id: string
  name: string
  email: string
  createdAt: string
}

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the students query with tags for on-demand revalidation
const getCachedStudents = unstable_cache(
  async (): Promise<Student[]> => {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return students.map(student => ({
      id: student.id,
      name: student.name || '',
      email: student.email,
      createdAt: student.createdAt.toISOString()
    }))
  },
  ['students-list'],
  {
    revalidate: 60,
    tags: ['students']
  }
)

export default async function StudentsPage() {
  // Auth is handled by middleware

  // Fetch students with caching
  let students: Student[] = []
  let error = ''

  try {
    students = await getCachedStudents()
  } catch (err) {
    console.error('Error fetching students:', err)
    error = 'Failed to fetch students'
  }

  return <StudentsClient initialStudents={students} error={error} />
}
