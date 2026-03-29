import { View, Text } from 'react-native';
import { Link } from 'expo-router';

// GET /annonces - Liste des annonces disponibles
// Query params: categorie (POUSSETTE | BRICOLAGE | MEDICAL | EVENEMENTIEL | NOURRITURE | AUTRE)
export default function HomeScreen() {
  return (
    <View style={{ marginTop: 50 }}>
      <Text>Home</Text>
      <Link href="/(annonces)/create">Create Annonce</Link>
      <Link href="/(annonces)/123">View Annonce Details</Link>
    </View>
  );
}
