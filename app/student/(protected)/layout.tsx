'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/student/auth/me')
        if (response.ok) {
          const data = await response.json()
          setStudent(data.student)
        } else {
          router.push('/login?type=student')
        }
      } catch (error) {
        router.push('/login?type=student')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <main>{children}</main>
    </div>
  )
}


