'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ListeningTestForm from '@/components/admin/ListeningTestForm'

export default function CreateListeningTestPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/instructor/listening-tests')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Create Listening Test
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create a new IELTS listening test with parts and questions.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/instructor/listening-tests"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Listening Tests
          </Link>
        </div>
      </div>

      {/* Listening Test Form */}
      <ListeningTestForm 
        apiEndpoint="/api/instructor/listening-tests"
        onSuccess={handleSuccess}
      />
    </div>
  )
}

