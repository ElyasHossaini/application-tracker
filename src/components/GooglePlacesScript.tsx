import { useEffect } from 'react'

declare global {
  interface Window {
    google: any
    initGooglePlaces?: () => void
  }
}

export function GooglePlacesScript() {
  useEffect(() => {
    // Skip if script is already loaded
    if (window.google?.maps?.places) {
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    return () => {
      const script = document.querySelector('script[src*="maps.googleapis.com/maps/api"]')
      if (script) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return null
} 