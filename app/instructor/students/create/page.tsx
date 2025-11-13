'use client'

import UserCreatePage from '@/components/admin/shared/UserCreatePage'

export default function CreateStudentPage() {
  return (
    <UserCreatePage
      userType="student"
      createPath="/api/instructor/students"
      redirectPath={(id) => `/instructor/students/${id}`}
      showCandidateNumber={true}
    />
  )
}

