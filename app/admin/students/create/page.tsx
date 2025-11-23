'use client'

import UserCreatePage from '@/components/admin/shared/UserCreatePage'
import CSVStudentUpload from '@/components/admin/CSVStudentUpload'

export default function CreateStudentPage() {
  return (
    <div className="space-y-6">
      {/* CSV Bulk Upload Section */}
      <CSVStudentUpload />
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div>

      {/* Single Student Creation */}
      <UserCreatePage
        userType="student"
        createPath="/api/admin/students"
        redirectPath={(id) => `/admin/students/${id}`}
        showCandidateNumber={true}
      />
    </div>
  )
}
