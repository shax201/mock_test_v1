'use client'

import UserEditPage from '@/components/admin/shared/UserEditPage'

export default function EditInstructorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <UserEditPage
      params={params}
      userType="instructor"
      fetchPath={(id) => `/api/admin/instructors/${id}`}
      updatePath={(id) => `/api/admin/instructors/${id}`}
      listPath="/admin/instructors"
      showCandidateNumber={false}
    />
  )
}
