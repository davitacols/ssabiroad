export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      resolve("Google Maps script loaded successfully");
    };
    script.onerror = (error) => {
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });
};
