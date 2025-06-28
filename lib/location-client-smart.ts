export const useSmartLocation = () => {
  const getLocation = async (query: string) => {
    const response = await fetch(`/api/location?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Location not found');
    return response.json();
  };

  const provideFeedback = async (query: string, result: any, isCorrect: boolean) => {
    await fetch('/api/location-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, result, isCorrect })
    });
  };

  return { getLocation, provideFeedback };
};