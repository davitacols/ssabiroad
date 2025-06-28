import { LocationSearchWithFeedback } from '../../components/location-search-with-feedback';

export default function LocationTestFeedbackPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Smart Location Search</h1>
        <p className="text-gray-600">
          Search for locations and help us improve accuracy with your feedback
        </p>
      </div>
      
      <LocationSearchWithFeedback />
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Your feedback helps train our AI to provide better location results</p>
      </div>
    </div>
  );
}