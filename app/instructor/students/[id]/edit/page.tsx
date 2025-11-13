'use client'

import UserEditPage from '@/components/admin/shared/UserEditPage'

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <UserEditPage
      params={params}
      userType="student"
      fetchPath={(id) => `/api/instructor/students/${id}`}
      updatePath={(id) => `/api/instructor/students/${id}`}
      listPath="/instructor/students"
      showCandidateNumber={true}
    />
  )
}

