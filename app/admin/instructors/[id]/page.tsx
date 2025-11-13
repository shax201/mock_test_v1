'use client'

import UserDetailPage from '@/components/admin/shared/UserDetailPage'

export default function InstructorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <UserDetailPage
      params={params}
      userType="instructor"
      fetchPath={(id) => `/api/admin/instructors/${id}`}
      listPath="/admin/instructors"
      editPath={(id) => `/admin/instructors/${id}/edit`}
    />
  )
}

