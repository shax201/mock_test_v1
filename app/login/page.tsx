'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [userType, setUserType] = useState<'student' | 'instructor' | 'admin'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get user type from URL params or default to student
  useEffect(() => {
    const type = searchParams.get('type') as 'student' | 'instructor' | 'admin'
    if (type && ['student', 'instructor', 'admin'].includes(type)) {
      setUserType(type)
    }
  }, [searchParams])

  // Set default credentials based on user type
  useEffect(() => {
    switch (userType) {
      case 'student':
        setEmail('ahmed.hassan@student.radiance.edu')
        setPassword('student123')
        break
      case 'instructor':
        setEmail('instructor@radiance.edu')
        setPassword('instructor123')
        break
      case 'admin':
        setEmail('admin@radiance.edu')
        setPassword('admin123')
        break
    }
  }, [userType])

  const getConfig = () => {
    switch (userType) {
      case 'student':
        return {
          title: 'Student Portal Login',
          subtitle: 'Sign in to access your IELTS test results and history',
          apiEndpoint: '/api/student/auth/login',
          redirectPath: '/student',
          colorScheme: 'blue' as const,
          showDemoButton: true,
          demoCredentials: {
            email: 'student1@example.com',
            password: 'password123'
          },
          additionalInfo: "Don't have an account? Contact your instructor"
        }
      case 'instructor':
        return {
          title: 'Instructor Login',
          subtitle: 'Sign in to access the IELTS Mock Test Instructor Panel',
          apiEndpoint: '/api/auth/login',
          redirectPath: '/instructor',
          colorScheme: 'green' as const,
          showDefaultCredentials: true,
          defaultCredentials: {
            email: 'instructor@radiance.edu',
            password: 'instructor123'
          }
        }
      case 'admin':
        return {
          title: 'Admin Login',
          subtitle: 'Sign in to access the IELTS Mock Test Admin Panel',
          apiEndpoint: '/api/auth/login',
          redirectPath: '/admin',
          colorScheme: 'purple' as const,
          showDefaultCredentials: true,
          defaultCredentials: {
            email: 'admin@radiance.edu',
            password: 'admin123'
          }
        }
    }
  }

  const config = getConfig()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        router.push(config.redirectPath)
      } else {
        const data = await response.json()
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    if (!config.demoCredentials) return
    
    const demoEmail = config.demoCredentials.email
    const demoPassword = config.demoCredentials.password
    setEmail(demoEmail)
    setPassword(demoPassword)
    
    setLoading(true)
    setError('')
    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      })
      if (response.ok) {
        router.push(config.redirectPath)
      } else {
        const data = await response.json()
        setError(data.error || 'Demo login failed')
      }
    } catch (e) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const colorClasses = {
    blue: {
      focus: 'focus:ring-blue-500 focus:border-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      link: 'text-blue-600 hover:text-blue-500'
    },
    green: {
      focus: 'focus:ring-green-500 focus:border-green-500',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      link: 'text-green-600 hover:text-green-500'
    },
    purple: {
      focus: 'focus:ring-purple-500 focus:border-purple-500',
      button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
      link: 'text-purple-600 hover:text-purple-500'
    }
  }

  const colors = colorClasses[config.colorScheme]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
        {/* User Type Selector */}
        <div className="flex justify-center space-x-2 mb-8">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              userType === 'student'
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setUserType('instructor')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              userType === 'instructor'
                ? 'bg-green-600 text-white shadow-md scale-105'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            Instructor
          </button>
          <button
            type="button"
            onClick={() => setUserType('admin')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              userType === 'admin'
                ? 'bg-purple-600 text-white shadow-md scale-105'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            Admin
          </button>
        </div>

        <div>
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              config.colorScheme === 'blue' ? 'bg-blue-100' :
              config.colorScheme === 'green' ? 'bg-green-100' :
              'bg-purple-100'
            }`}>
              {config.colorScheme === 'blue' && (
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
              {config.colorScheme === 'green' && (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {config.colorScheme === 'purple' && (
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {config.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {config.subtitle}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none ${colors.focus} focus:z-10 sm:text-sm`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none ${colors.focus} focus:z-10 sm:text-sm`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {config.showDemoButton && config.demoCredentials && (
            <div>
              <button
                type="button"
                onClick={handleDemo}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Use demo account
              </button>
            </div>
          )}

          {config.showDefaultCredentials && config.defaultCredentials && (
            <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Default Test Credentials:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-mono">
                  <span className="font-semibold">Email:</span> {config.defaultCredentials.email}
                </p>
                <p className="font-mono">
                  <span className="font-semibold">Password:</span> {config.defaultCredentials.password}
                </p>
              </div>
            </div>
          )}

          {config.additionalInfo && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {config.additionalInfo}
              </p>
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  )
}

export default function UnifiedLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
