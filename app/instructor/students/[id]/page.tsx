'use client'

import UserDetailPage from '@/components/admin/shared/UserDetailPage'

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <UserDetailPage
      params={params}
      userType="student"
      fetchPath={(id) => `/api/instructor/students/${id}`}
      listPath="/instructor/students"
      editPath={(id) => `/instructor/students/${id}/edit`}
    />
  )
}

