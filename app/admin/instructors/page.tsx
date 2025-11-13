import { prisma } from '@/lib/db'
import { unstable_cache } from 'next/cache'
import { User } from '@/components/admin/shared/UserListClient'
import InstructorsClient from './InstructorsClient'

// Enable ISR with time-based revalidation (revalidate every 60 seconds)
export const revalidate = 60

// Cache the instructors query with tags for on-demand revalidation
const getCachedInstructors = unstable_cache(
  async (): Promise<User[]> => {
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR'
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

    return instructors.map(instructor => ({
      id: instructor.id,
      name: instructor.name || '',
      email: instructor.email,
      createdAt: instructor.createdAt.toISOString()
    }))
  },
  ['instructors-list'],
  {
    revalidate: 60,
    tags: ['instructors']
  }
)

export default async function InstructorsPage() {
  // Auth is handled by middleware

  // Fetch instructors with caching
  let instructors: User[] = []
  let error = ''

  try {
    instructors = await getCachedInstructors()
  } catch (err) {
    console.error('Error fetching instructors:', err)
    error = 'Failed to fetch instructors'
  }

  return <InstructorsClient initialUsers={instructors} error={error} />
}

