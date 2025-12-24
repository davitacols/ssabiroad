export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

// Increase body size limit to 50MB for high-resolution images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
};
