let dbStatus = false;

export async function checkDbHealth() {
  try {
    const response = await fetch('/api/db-test');
    dbStatus = response.ok;
    return dbStatus;
  } catch {
    dbStatus = false;
    return false;
  }
}

export function getDbStatus() {
  return dbStatus;
}