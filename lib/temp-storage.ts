// Temporary storage for when database is unavailable
const tempLocations: any[] = [];

export function saveTempLocation(location: any) {
  const tempLocation = {
    id: `temp-${Date.now()}`,
    ...location,
    createdAt: new Date().toISOString(),
    temp: true
  };
  tempLocations.push(tempLocation);
  console.log('💾 Saved to temp storage:', tempLocation.id);
  return tempLocation;
}

export function getTempLocations() {
  return tempLocations;
}

export function clearTempLocations() {
  tempLocations.length = 0;
}