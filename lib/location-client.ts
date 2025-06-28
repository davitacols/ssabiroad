export const useLocation = () => {
  const getLocation = async (query: string) => {
    const response = await fetch(`/api/location?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Location not found');
    return response.json();
  };

  return { getLocation };
};