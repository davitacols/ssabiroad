export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service for Pic2Nav</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: October 23, 2025</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">By using Pic2Nav ("the App"), you agree to these Terms of Service. If you don't agree, please don't use the App.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-2">Pic2Nav provides location recognition and analysis services from photos. The App:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Analyzes photos to identify locations</li>
              <li>Provides location details and nearby information</li>
              <li>Allows saving and sharing of location data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 mb-2">You agree to:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Provide accurate information</li>
              <li>Use the App legally and ethically</li>
              <li>Not misuse or abuse the service</li>
              <li>Not attempt to reverse engineer the App</li>
              <li>Respect intellectual property rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Privacy</h2>
            <p className="text-gray-700">Your use of the App is subject to our Privacy Policy. We collect and process data as described in the Privacy Policy.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accuracy Disclaimer</h2>
            <p className="text-gray-700 mb-2">Location recognition is provided "as is" without guarantees of accuracy. Results may vary based on:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Image quality</li>
              <li>Available metadata</li>
              <li>Geographic location</li>
              <li>Service availability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Uses</h2>
            <p className="text-gray-700 mb-2">You may NOT:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Use the App for illegal activities</li>
              <li>Violate others' privacy</li>
              <li>Harass or harm others</li>
              <li>Distribute malware or spam</li>
              <li>Circumvent security measures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 mb-2">The App and its content are owned by Pic2Nav. You may not:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Copy or modify the App</li>
              <li>Use our trademarks without permission</li>
              <li>Claim ownership of our content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700">The App uses third-party services (Google Maps, etc.). Their terms also apply to your use.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-2">We are not liable for:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Inaccurate location results</li>
              <li>Service interruptions</li>
              <li>Data loss</li>
              <li>Indirect or consequential damages</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Service</h2>
            <p className="text-gray-700 mb-2">We may:</p>
            <ul className="list-disc pl-6 text-gray-700">
              <li>Modify or discontinue features</li>
              <li>Update these terms</li>
              <li>Change pricing (with notice)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700">We may suspend or terminate your access if you violate these terms.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
            <p className="text-gray-700">
              Questions? Contact us at: <a href="mailto:support@pic2nav.com" className="text-blue-600 hover:underline">support@pic2nav.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Entire Agreement</h2>
            <p className="text-gray-700">These terms constitute the entire agreement between you and Pic2Nav regarding the App.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
