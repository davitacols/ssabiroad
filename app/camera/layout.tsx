import { generatePageMetadata } from "@/lib/seo-config";

export const metadata = generatePageMetadata(
  'camera',
  'Photo Location Scanner - Upload & Analyze Photos | Pic2Nav',
  'Upload any photo to instantly discover its location using AI. Extract GPS coordinates, identify landmarks, and find nearby attractions. Free photo location scanner.'
);

export default function CameraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}