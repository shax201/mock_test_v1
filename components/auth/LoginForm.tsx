'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type UserRole = 'student' | 'instructor' | 'admin'

interface LoginFormProps {
  role: UserRole
  title: string
  subtitle: string
  apiEndpoint: string
  redirectPath: string
  defaultCredentials?: {
    email: string
    password: string
  }
  demoCredentials?: {
    email: string
    password: string
  }
  showDemoButton?: boolean
  showDefaultCredentials?: boolean
  colorScheme?: 'blue' | 'green' | 'purple'
  additionalInfo?: string
}

export default function LoginForm({
  role,
  title,
  subtitle,
  apiEndpoint,
  redirectPath,
  defaultCredentials,
  demoCredentials,
  showDemoButton = false,
  showDefaultCredentials = false,
  colorScheme = 'blue',
  additionalInfo
}: LoginFormProps) {
  const [email, setEmail] = useState(defaultCredentials?.email || '')
  const [password, setPassword] = useState(defaultCredentials?.password || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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

  const colors = colorClasses[colorScheme]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        router.push(redirectPath)
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
    if (!demoCredentials) return
    
    const demoEmail = demoCredentials.email
    const demoPassword = demoCredentials.password
    setEmail(demoEmail)
    setPassword(demoPassword)
    
    setLoading(true)
    setError('')
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      })
      if (response.ok) {
        router.push(redirectPath)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
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

          {showDemoButton && demoCredentials && (
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

          {showDefaultCredentials && defaultCredentials && (
            <div className="text-sm text-gray-600">
              <p>Default credentials:</p>
              <p>Email: {defaultCredentials.email}</p>
              <p>Password: {defaultCredentials.password}</p>
            </div>
          )}

          {additionalInfo && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {additionalInfo}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
