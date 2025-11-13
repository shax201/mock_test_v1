'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface Student {
  id: string
  email: string
  name: string
}

export default function StudentHeader() {
  const [student, setStudent] = useState<Student | null>(null)
  const [activeAssignments, setActiveAssignments] = useState<Array<{ id: string; title: string; token: string; validUntil?: string }>>([])
  const [isTestsOpen, setIsTestsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/student/auth/me')
        if (response.ok) {
          const data = await response.json()
          setStudent(data.student)
        }
      } catch (error) {
        console.error('Error fetching student data:', error)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const res = await fetch('/api/student/assignments')
        if (res.ok) {
          const data = await res.json()
          // Ensure data.assignments is an array before processing
          const assignmentsList = Array.isArray(data.assignments) ? data.assignments : []
          const list = assignmentsList
            .filter((a: any) => a && typeof a === 'object' && a.status === 'ACTIVE')
            .map((a: any) => ({ 
              id: a.id, 
              title: a.testTitle, 
              token: a.accessToken,
              validUntil: a.validUntil 
            }))
          setActiveAssignments(list)
        }
      } catch (error) {
        console.error('Error loading assignments:', error)
      }
    }
    loadAssignments()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (isTestsOpen && !target.closest('.tests-dropdown')) {
        setIsTestsOpen(false)
      }
      
      if (isProfileOpen && !target.closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isTestsOpen, isProfileOpen])

  const handleLogout = async () => {
    try {
      await fetch('/api/student/auth/logout', { method: 'POST' })
      setStudent(null)
      setIsProfileOpen(false)
      router.push('/login?type=student')
    } catch (error) {
      console.error('Error during logout:', error)
      // Still redirect to login even if logout API fails
      router.push('/login?type=student')
    }
  }

  if (!student) return null

  return (
    <>
      {/* Logo Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/student" className="flex items-center">
              {/* IELTS Logo */}
              <img 
                src="https://res.cloudinary.com/dza2t1htw/image/upload/v1763020133/IELTS-logo_d7an4g.png" 
                alt="IELTS Logo" 
                className="h-16 w-auto object-contain"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-[#2F404B] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center space-x-8">
              {/* <Link 
                href="/student" 
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === '/student' 
                    ? 'bg-[#4A8FB1] text-white' 
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Dashboard
              </Link> */}
              <Link
                href="/student/tests"
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname?.startsWith('/student/tests')
                    ? 'bg-[#4A8FB1] text-white'
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Online Tests
              </Link>
              <Link 
                href="/student/assignments" 
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname?.startsWith('/student/assignments') 
                    ? 'bg-[#4A8FB1] text-white' 
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Assigned Test
              </Link>
              <Link 
                href="/student/participation-history" 
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname?.startsWith('/student/participation-history') 
                    ? 'bg-[#4A8FB1] text-white' 
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Test History
              </Link>
              <Link 
                href="/student/results" 
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname?.startsWith('/student/results') 
                    ? 'bg-[#4A8FB1] text-white' 
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Results
              </Link>
              <Link 
                href="/student/courses" 
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname?.startsWith('/student/courses') 
                    ? 'bg-[#4A8FB1] text-white' 
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Assigned Courses
              </Link>
              <Link 
                href="/student/sessions" 
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname?.startsWith('/student/sessions') 
                    ? 'bg-[#4A8FB1] text-white' 
                    : 'text-white hover:text-gray-200'
                }`}
              >
                Online Sessions
              </Link>
              <Link 
                href="/student/ebooks" 
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  pathname?.startsWith('/student/ebooks') 
                    ? 'bg-[#4A8FB1] text-white' 
                    : 'text-white hover:text-gray-200'
                }`}
              >
                EBooks
              </Link>
              {/* Learning Tools Dropdown */}
              <div className="relative tests-dropdown">
                <button
                  onClick={() => setIsTestsOpen(v => !v)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                  Learning Tools
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isTestsOpen && (
                  <div className="absolute z-50 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5" role="menu">
                    <div className="py-1 max-h-80 overflow-auto">
                      {activeAssignments.length > 0 ? (
                        activeAssignments.map((item, index) => {
                          if (!item || typeof item !== 'object' || !item.id) {
                            return null
                          }
                          return (
                            <Link
                              key={item.id || index}
                              href={`/test/${item.token || ''}`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setIsTestsOpen(false)}
                            >
                              {item.title || 'Untitled Test'}
                            </Link>
                          )
                        })
                      ) : (
                        <span className="block px-4 py-2 text-sm text-gray-400">No active tests</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* User Profile Dropdown */}
            <div className="flex items-center profile-dropdown">
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-white hidden sm:block">{student.name}</span>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <div className="font-medium">{student.name}</div>
                        <div className="text-gray-500">{student.email}</div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

