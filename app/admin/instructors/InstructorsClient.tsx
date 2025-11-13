'use client'

import UserListClient, { User } from '@/components/admin/shared/UserListClient'

interface InstructorsClientProps {
  initialUsers: User[]
  error: string
}

export default function InstructorsClient({ initialUsers, error }: InstructorsClientProps) {
  return (
    <UserListClient
      initialUsers={initialUsers}
      error={error}
      userType="instructor"
      createPath="/admin/instructors/create"
      detailPath={(id) => `/admin/instructors/${id}`}
      editPath={(id) => `/admin/instructors/${id}/edit`}
      deletePath={(id) => `/api/admin/instructors/${id}`}
      avatarColor="purple"
    />
  )
}

