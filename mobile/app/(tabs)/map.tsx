import { View, Text } from 'react-native';
import { Link } from 'expo-router';

// GET /annonces/carte - Annonces à proximité (géolocalisées)
// Query params: lat, lng, rayon (km), categorie (optional)
export default function MapScreen() {
  return (
    <View style={{ marginTop: 50 }}>
      <Text>Map</Text>
      <Link href="/(points-relais)">View Points Relais</Link>
    </View>
  );
}
