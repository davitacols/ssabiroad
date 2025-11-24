import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Camera Scanner - Upload Photos for AI Location Discovery',
  description: 'Upload any photo or take a picture to discover its location using AI. Extract GPS data, identify landmarks, and find nearby places instantly.',
  keywords: ['photo scanner', 'camera location finder', 'upload photo location', 'AI photo analysis', 'GPS extraction'],
  openGraph: {
    title: 'Camera Scanner - Upload Photos for AI Location Discovery',
    description: 'Upload any photo or take a picture to discover its location using AI. Extract GPS data, identify landmarks, and find nearby places instantly.',
  },
};

export default function CameraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}