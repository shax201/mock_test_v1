'use client'

import UserCreatePage from '@/components/admin/shared/UserCreatePage'

export default function CreateInstructorPage() {
  return (
    <UserCreatePage
      userType="instructor"
      createPath="/api/admin/instructors"
      redirectPath={(id) => `/admin/instructors/${id}`}
      showCandidateNumber={false}
    />
  )
}

