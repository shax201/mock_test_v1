'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface PortalLayoutProps {
  children: React.ReactNode
  navigation: NavigationItem[]
  brandName: string
  brandSubtitle: string
  brandColor: 'blue' | 'green'
  logoutRedirect: string
}

export default function PortalLayout({
  children,
  navigation,
  brandName,
  brandSubtitle,
  brandColor,
  logoutRedirect
}: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
      active: 'bg-blue-50 text-blue-700 border-blue-600',
      icon: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      badge: 'bg-blue-600'
    },
    green: {
      bg: 'bg-gradient-to-r from-green-600 to-green-700',
      active: 'bg-green-50 text-green-700 border-green-600',
      icon: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      badge: 'bg-green-600'
    }
  }

  const colors = colorClasses[brandColor]

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    fetchUser()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      if (isProfileOpen && !target.closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileOpen])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setIsProfileOpen(false)
      router.push(logoutRedirect)
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect to login even if logout API fails
      router.push(logoutRedirect)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        {/* Logo and Brand */}
        <div className={`flex items-center justify-between h-16 px-6 ${colors.bg}`}>
          <div className="flex items-center justify-center flex-1">
            {/* IELTS Logo */}
            <img 
              src="https://res.cloudinary.com/dza2t1htw/image/upload/v1763020133/IELTS-logo_d7an4g.png" 
              alt="IELTS Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className={`lg:hidden ${brandColor === 'blue' ? 'text-white hover:text-blue-200' : 'text-white hover:text-green-200'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col h-full">
          <nav className="flex-1 mt-8 px-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? `${colors.active} border-r-2`
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? colors.icon : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User Profile & Logout */}
          <div className="mt-auto p-4 border-t border-gray-200">
            {user && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${colors.badge} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-sm font-medium">
                        {user.name?.charAt(0) || user.email?.charAt(0) || 'A'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>

              {/* Separator */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              {/* Profile dropdown */}
              <div className="relative profile-dropdown">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="-m-1.5 flex items-center p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className={`h-8 w-8 rounded-full ${colors.badge} flex items-center justify-center`}>
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <span className="hidden lg:flex lg:items-center">
                    <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                      {user?.name || 'User'}
                    </span>
                    <svg className="ml-2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu">
                      <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                        <div className="font-medium">{user?.name || 'User'}</div>
                        <div className="text-gray-500">{user?.email}</div>
                        <div className={`text-xs ${colors.icon} mt-1`}>{user?.role}</div>
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

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

