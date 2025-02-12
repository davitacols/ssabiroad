export const loadGoogleMapsScript = () => {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    document.head.appendChild(script)
    return new Promise((resolve) => {
      script.onload = resolve
    })
  }
  
  