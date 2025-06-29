import { notFound } from 'next/navigation';
import { LocationDetails } from '@/components/location/location-details';

async function getLocation(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/location/${id}`, {
      cache: 'no-store'
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export default async function LocationPage({ params }: { params: { id: string } }) {
  const location = await getLocation(params.id);
  
  if (!location) {
    notFound();
  }

  return <LocationDetails location={location} />;
}