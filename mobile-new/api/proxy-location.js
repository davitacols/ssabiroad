export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://ssabiroad.vercel.app/api/location-recognition-v2', {
      method: 'POST',
      body: req.body,
      headers: {
        'Content-Type': req.headers['content-type'],
      },
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to proxy request' });
  }
}