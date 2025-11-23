'use client'

import { useEffect } from 'react'

export default function FaviconUpdater() {
  useEffect(() => {
    // Fetch site settings and update favicon
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings?.faviconUrl) {
          // Update favicon link
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.getElementsByTagName('head')[0].appendChild(link)
          }
          link.href = data.settings.faviconUrl
        }
      })
      .catch(err => {
        console.error('Error fetching favicon:', err)
      })
  }, [])

  return null
}

