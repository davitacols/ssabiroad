import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

const processedURLs = new Set<string>();

export default function ShareHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleInitialURL = async () => {
      const initialURL = await Linking.getInitialURL();
      if (initialURL && !processedURLs.has(initialURL)) {
        processedURLs.add(initialURL);
        console.log('Received shared content:', initialURL);
        router.push({
          pathname: '/scanner',
          params: { sharedImage: initialURL }
        });
      }
    };

    handleInitialURL();
  }, []);

  return null;
}