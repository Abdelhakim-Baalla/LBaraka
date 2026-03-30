import { useState } from 'react';
import { Image, View, Text } from 'react-native';

const DEFAULT_WALLPAPER = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=70';

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

  const finalUri = !hasError && uri ? uri : DEFAULT_WALLPAPER;

  return (
    <View className={className}>
      <Image
        source={{ uri: finalUri }}
        className="w-full h-full"
        resizeMode={resizeMode}
        onError={() => setHasError(true)}
      />
      {hasError ? (
        <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-md">
          <Text className="text-white text-[10px]">Image indisponible</Text>
        </View>
      ) : null}
    </View>
  );
}
