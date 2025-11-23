'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SiteSettings {
  id: string
  logoUrl: string | null
  faviconUrl: string | null
  logoPublicId: string | null
  faviconPublicId: string | null
  updatedAt: string
}

export default function BrandingClient() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/site-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setSuccess('Logo uploaded successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to upload logo')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFavicon(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('favicon', file)

      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setSuccess('Favicon uploaded successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to upload favicon')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setUploadingFavicon(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the logo?')) return

    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('removeLogo', 'true')

      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setSuccess('Logo removed successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to remove logo')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const handleRemoveFavicon = async () => {
    if (!confirm('Are you sure you want to remove the favicon?')) return

    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('removeFavicon', 'true')

      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setSuccess('Favicon removed successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to remove favicon')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Branding Settings</h1>
          <p className="text-gray-600">Manage your site logo and favicon</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium text-green-700">{success}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          {/* Logo Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo</h2>
            <div className="space-y-4">
              {settings?.logoUrl ? (
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <img
                      src={settings.logoUrl}
                      alt="Current Logo"
                      className="h-20 w-auto object-contain border border-gray-200 rounded-lg p-2 bg-gray-50"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Current logo</p>
                    <button
                      onClick={handleRemoveLogo}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove Logo
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No logo uploaded</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Logo
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {uploadingLogo ? 'Uploading...' : 'Choose Logo File'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500">PNG, JPG, SVG (max 5MB)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Favicon Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Favicon</h2>
            <div className="space-y-4">
              {settings?.faviconUrl ? (
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    <img
                      src={settings.faviconUrl}
                      alt="Current Favicon"
                      className="h-16 w-16 object-contain border border-gray-200 rounded-lg p-2 bg-gray-50"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Current favicon</p>
                    <button
                      onClick={handleRemoveFavicon}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove Favicon
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No favicon uploaded</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New Favicon
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept=".ico,.png,.svg,.jpg,.jpeg"
                      onChange={handleFaviconUpload}
                      className="hidden"
                      disabled={uploadingFavicon}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {uploadingFavicon ? 'Uploading...' : 'Choose Favicon File'}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500">ICO, PNG, SVG (max 1MB, recommended: 32x32 or 16x16)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> After uploading, the changes will be reflected across the entire application. 
            You may need to refresh the page or clear your browser cache to see the new logo/favicon.
          </p>
        </div>
      </div>
    </div>
  )
}

