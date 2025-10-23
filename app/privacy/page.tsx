export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy for Pic2Nav</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: October 23, 2025</p>

        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Location Data</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>GPS coordinates from photos (EXIF data)</li>
            <li>Device location (when permission granted)</li>
            <li>Used solely for location recognition and analysis</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Photo Data</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Photos selected by user for analysis</li>
            <li>Processed temporarily, not stored permanently</li>
            <li>Used only for location identification</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Device Information</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Camera metadata (make, model, settings)</li>
            <li>Used for analysis accuracy</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Information</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Identify locations from photos</li>
            <li>Provide location details and nearby places</li>
            <li>Improve recognition accuracy</li>
            <li>Display weather and environmental data</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Storage</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Saved locations stored locally on device</li>
            <li>No cloud backup of personal data</li>
            <li>User can delete saved locations anytime</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Sharing</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>We do NOT sell your data</li>
            <li>Location queries sent to mapping services (Google Maps API)</li>
            <li>Image analysis via secure API endpoints</li>
            <li>No sharing with third parties for marketing</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Rights</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Access your saved locations</li>
            <li>Delete saved locations anytime</li>
            <li>Revoke permissions in device settings</li>
            <li>Request data deletion</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Security</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Secure HTTPS connections</li>
            <li>Local encrypted storage (SecureStore)</li>
            <li>No permanent server-side storage</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Children's Privacy</h2>
          <p className="text-gray-700 mb-4">This app is not directed to children under 13.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact</h2>
          <p className="text-gray-700 mb-4">
            For privacy concerns: <a href="mailto:support@pic2nav.com" className="text-blue-600 hover:underline">support@pic2nav.com</a>
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Changes</h2>
          <p className="text-gray-700 mb-4">We may update this policy. Check this page for updates.</p>
        </div>
      </div>
    </div>
  );
}
