import { View, Text } from 'react-native';
import { Link } from 'expo-router';

// GET /points-relais - Liste des points relais
// GET /points-relais/nearby - Points relais à proximité
// Query params: lat, lng, rayon (km), type (HANOUT | MOSQUEE | ASSOCIATION_QUARTIER)
// GET /points-relais/types - Liste des types disponibles
export default function PointsRelaisScreen() {
  return (
    <View style={{ marginTop: 50 }}>
      <Text>Points Relais</Text>
      <Link href="/(tabs)/map">Back to Map</Link>
    </View>
  );
}
