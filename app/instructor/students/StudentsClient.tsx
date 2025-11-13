'use client'

import UserListClient, { User } from '@/components/admin/shared/UserListClient'

interface StudentsClientProps {
  initialUsers: User[]
  error: string
}

export default function StudentsClient({ initialUsers, error }: StudentsClientProps) {
  return (
    <UserListClient
      initialUsers={initialUsers}
      error={error}
      userType="student"
      createPath="/instructor/students/create"
      detailPath={(id) => `/instructor/students/${id}`}
      editPath={(id) => `/instructor/students/${id}/edit`}
      deletePath={(id) => `/api/instructor/students/${id}`}
      avatarColor="green"
    />
  )
}

