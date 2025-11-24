export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
          <p className="text-gray-700 mb-4">
            Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
          <p className="text-gray-700 mb-4">
            SSABIRoad uses cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Keep you signed in to your account</li>
            <li>Remember your preferences and settings</li>
            <li>Understand how you interact with our service</li>
            <li>Improve our website performance and functionality</li>
            <li>Provide personalized content and features</li>
            <li>Analyze usage patterns and trends</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Types of Cookies We Use</h2>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Essential Cookies</h3>
          <p className="text-gray-700 mb-4">
            These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and accessibility.
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li><strong>Authentication tokens:</strong> Keep you logged in securely</li>
            <li><strong>Session cookies:</strong> Maintain your session state</li>
            <li><strong>Security cookies:</strong> Protect against fraud and abuse</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Functional Cookies</h3>
          <p className="text-gray-700 mb-4">
            These cookies enable enhanced functionality and personalization.
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li><strong>Preference cookies:</strong> Remember your settings and choices</li>
            <li><strong>Language cookies:</strong> Store your language preference</li>
            <li><strong>UI state cookies:</strong> Remember your interface preferences</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">3.3 Analytics Cookies</h3>
          <p className="text-gray-700 mb-4">
            These cookies help us understand how visitors interact with our website.
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li><strong>Usage analytics:</strong> Track page views and user interactions</li>
            <li><strong>Performance metrics:</strong> Monitor website performance</li>
            <li><strong>Feature usage:</strong> Understand which features are most popular</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">3.4 Third-Party Cookies</h3>
          <p className="text-gray-700 mb-4">
            Some cookies are placed by third-party services we use:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li><strong>Google Cloud Vision API:</strong> For image processing services</li>
            <li><strong>Firebase:</strong> For authentication and data services</li>
            <li><strong>Map providers:</strong> For location and mapping features</li>
            <li><strong>NextAuth.js:</strong> For authentication management</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Local Storage and Session Storage</h2>
          <p className="text-gray-700 mb-4">
            In addition to cookies, we use browser storage technologies:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Local Storage:</strong> Store user preferences, saved locations, and cached data</li>
            <li><strong>Session Storage:</strong> Temporarily store data during your browsing session</li>
            <li><strong>IndexedDB:</strong> Store larger datasets for offline functionality</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Managing Cookies</h2>
          <p className="text-gray-700 mb-4">
            You have control over cookies and can manage them in several ways:
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Browser Settings</h3>
          <p className="text-gray-700 mb-4">
            Most browsers allow you to:
          </p>
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li>View and delete cookies</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies</li>
            <li>Clear cookies when you close your browser</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Impact of Disabling Cookies</h3>
          <p className="text-gray-700 mb-4">
            Please note that disabling cookies may affect your experience:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>You may not be able to stay logged in</li>
            <li>Your preferences won't be saved</li>
            <li>Some features may not work properly</li>
            <li>The website may not function as intended</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookie Duration</h2>
          <p className="text-gray-700 mb-4">
            We use both session and persistent cookies:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
            <li><strong>Persistent cookies:</strong> Remain on your device for a set period or until manually deleted</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Updates to This Policy</h2>
          <p className="text-gray-700">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. We will notify you of any significant changes by posting the updated policy on this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
          <p className="text-gray-700">
            If you have questions about our use of cookies or this Cookie Policy, please contact us through the support channels provided in the application.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. More Information</h2>
          <p className="text-gray-700">
            For more information about how we handle your personal data, please see our Privacy Policy.
          </p>
        </section>
      </div>
    </div>
  );
}
