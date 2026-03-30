import { useState } from 'react';
import { Image, View, Text } from 'react-native';

const DEFAULT_WALLPAPER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=70';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.90.27.250:3000';

type SmartAnnonceImageProps = {
  uri?: string;
  className?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

export default function SmartAnnonceImage({
  uri,
  className,
  resizeMode = 'cover',
}: SmartAnnonceImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Convertir les URLs MinIO directes en URL proxy backend
  let finalUri = uri;
  if (uri && uri.includes('/lbaraka-annonces/')) {
    const marker = '/lbaraka-annonces/';
    const markerIndex = uri.indexOf(marker);

    if (markerIndex !== -1) {
      const objectPath = `lbaraka-annonces/${uri.slice(markerIndex + marker.length)}`;
      finalUri = `${API_URL}/storage/images?path=${encodeURIComponent(objectPath)}`;
    }
  }

  // Utiliser la fallback si pas d'URI
  if (!finalUri || hasError) {
    finalUri = DEFAULT_WALLPAPER;
  }

  return (
    <View className={className}>
      <Image
        source={{ uri: finalUri }}
        className="w-full h-full"
        resizeMode={resizeMode}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          console.warn(`Image load failed for URI: ${uri}`);
          setHasError(true);
          setIsLoading(false);
        }}
      />
      {isLoading && !hasError ? (
        <View className="absolute inset-0 bg-surface-container/50 items-center justify-center">
          <Text className="text-xs text-on-surface-variant">Chargement...</Text>
        </View>
      ) : null}
      {hasError ? (
        <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-md">
          <Text className="text-white text-[10px]">Image indisponible</Text>
        </View>
      ) : null}
    </View>
  );
}
