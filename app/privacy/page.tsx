export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy for Pic2Nav</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: January 2025</p>

        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Location Data</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Precise Location:</strong> GPS coordinates from your device for location identification, nearby places, and geofencing</li>
            <li><strong>Background Location:</strong> Used for geofence alerts when app is closed</li>
            <li><strong>Photo GPS Data:</strong> EXIF metadata from photos for location recognition</li>
            <li><strong>Storage:</strong> Stored locally on device and optionally on secure servers for saved locations</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Photos and Images</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Camera Access:</strong> To capture photos for location recognition</li>
            <li><strong>Photo Library:</strong> To read EXIF metadata and GPS coordinates</li>
            <li><strong>Processing:</strong> Photos processed temporarily to extract location data and identify landmarks</li>
            <li><strong>Storage:</strong> Not permanently stored unless you save them to collections</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Device Information</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Device ID:</strong> Unique identifier for geofence notifications</li>
            <li><strong>Camera Metadata:</strong> Make, model, settings for analysis accuracy</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">User-Generated Content</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Saved locations and collections</li>
            <li>Notes and tags you add</li>
            <li>Location stories (24-hour private history)</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Information</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Provide core app functionality (location recognition, nearby places)</li>
            <li>Enable geofencing and location-based notifications</li>
            <li>Save and organize your location collections</li>
            <li>Display weather and environmental data</li>
            <li>Improve app performance and user experience</li>
            <li>Provide customer support</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Retention</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Location History:</strong> Stored until you delete it</li>
            <li><strong>Photos:</strong> Processed temporarily, not stored permanently</li>
            <li><strong>Collections:</strong> Stored until you delete them</li>
            <li><strong>Stories:</strong> Auto-deleted after 24 hours</li>
            <li><strong>Device Data:</strong> Stored while app is installed</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Sharing</h2>
          <p className="text-gray-700 mb-4"><strong>We do NOT:</strong></p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Sell your personal data to third parties</li>
            <li>Share your location data with advertisers</li>
            <li>Use your photos for any purpose other than location recognition</li>
            <li>Share your data without your explicit consent</li>
          </ul>
          <p className="text-gray-700 mb-4"><strong>We MAY share data with:</strong></p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Google Maps API:</strong> For location services and mapping</li>
            <li><strong>Cloud Storage:</strong> For backing up your saved locations (if enabled)</li>
            <li><strong>Analytics Services:</strong> Anonymized usage data to improve the app</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Rights</h2>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Access your personal data</li>
            <li>Delete your account and all associated data</li>
            <li>Opt-out of location tracking</li>
            <li>Disable geofencing features</li>
            <li>Export your saved locations</li>
            <li>Revoke permissions in device settings</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>All data transmission uses HTTPS encryption</li>
            <li>Location data stored securely with industry-standard encryption</li>
            <li>Photos processed temporarily and not stored permanently</li>
            <li>You can delete your data at any time</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Children's Privacy</h2>
          <p className="text-gray-700 mb-4">Pic2Nav is not intended for children under 13. We do not knowingly collect data from children under 13.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Third-Party Services</h2>
          <p className="text-gray-700 mb-4">We use the following third-party services:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Google Maps Platform:</strong> For mapping and location services</li>
            <li><strong>Expo Services:</strong> For app infrastructure</li>
            <li><strong>Cloud Storage:</strong> For optional data backup</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Permissions Explained</h2>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Required Permissions</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>CAMERA:</strong> To capture photos for location recognition</li>
            <li><strong>ACCESS_FINE_LOCATION:</strong> To get precise GPS coordinates</li>
            <li><strong>ACCESS_COARSE_LOCATION:</strong> To get approximate location</li>
            <li><strong>ACCESS_BACKGROUND_LOCATION:</strong> For geofencing alerts when app is closed</li>
            <li><strong>READ_MEDIA_IMAGES:</strong> To access photos from your library</li>
            <li><strong>ACCESS_MEDIA_LOCATION:</strong> To read GPS data from photo EXIF metadata</li>
          </ul>
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Optional Permissions</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>POST_NOTIFICATIONS:</strong> To send geofence alerts</li>
            <li><strong>WRITE_EXTERNAL_STORAGE:</strong> To save processed photos (Android 12 and below)</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Contact</h2>
          <p className="text-gray-700 mb-4">
            For privacy concerns: <a href="mailto:support@pic2nav.com" className="text-blue-600 hover:underline">support@pic2nav.com</a>
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Changes to Privacy Policy</h2>
          <p className="text-gray-700 mb-4">We may update this privacy policy from time to time. We will notify you of any changes by updating the "Last Updated" date.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Consent</h2>
          <p className="text-gray-700 mb-4">By using Pic2Nav, you consent to this privacy policy.</p>
        </div>
      </div>
    </div>
  );
}
