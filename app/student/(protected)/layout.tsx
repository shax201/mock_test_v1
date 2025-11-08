'use client'

import { useState, useEffect } from 'react'

interface Student {
  id: string
  email: string
  name: string
}

export default function StudentProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auth is handled by middleware, but fetch user info for display
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/student/auth/me')
        if (response.ok) {
          const data = await response.json()
          setStudent(data.student)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <main>{children}</main>
    </div>
  )
}


