import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export default function ShareHandler() {
  const router = useRouter();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleInitialURL = async () => {
      const initialURL = await Linking.getInitialURL();
      if (initialURL) {
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