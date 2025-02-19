import { getCookie } from 'cookies-next';

export async function fetchUserData() {
  const token = getCookie('token'); // Assuming the token is stored in cookies

  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch('/api/user', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  const data = await response.json();
  return data;
}