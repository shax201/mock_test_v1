'use client'

import { useState, useEffect } from 'react'

export default function DynamicLogo({ defaultLogo }: { defaultLogo?: string }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const defaultLogoUrl = defaultLogo || 'https://res.cloudinary.com/dza2t1htw/image/upload/v1763020133/IELTS-logo_d7an4g.png'

  useEffect(() => {
    // Fetch site settings on client side
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings?.logoUrl) {
          setLogoUrl(data.settings.logoUrl)
        }
      })
      .catch(err => {
        console.error('Error fetching logo:', err)
      })
  }, [])

  // Show both logos if custom logo exists, otherwise just default
  if (logoUrl) {
    return (
      <div className="flex items-center gap-3">
        <img 
          src={logoUrl} 
          alt="Custom Logo" 
          className="h-12 w-auto object-contain"
        />
        <img 
          src={defaultLogoUrl} 
          alt="IELTS Logo" 
          className="h-12 w-auto object-contain opacity-80"
        />
      </div>
    )
  }

  return (
    <img 
      src={defaultLogoUrl} 
      alt="Logo" 
      className="h-12 w-auto object-contain"
    />
  )
}

