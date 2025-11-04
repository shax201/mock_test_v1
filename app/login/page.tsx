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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* User Type Selector */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            type="button"
            onClick={() => setUserType('student')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              userType === 'student'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setUserType('instructor')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              userType === 'instructor'
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Instructor
          </button>
          <button
            type="button"
            onClick={() => setUserType('admin')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              userType === 'admin'
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Admin
          </button>
        </div>

        <div>
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
            <div className="text-sm text-gray-600">
              <p>Default credentials:</p>
              <p>Email: {config.defaultCredentials.email}</p>
              <p>Password: {config.defaultCredentials.password}</p>
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
