import { View, Text } from 'react-native';
import { Link } from 'expo-router';

// GET /annonces/:id - Détails d'une annonce
// POST /transactions/reserve/:annonceId - Réserver une annonce
export default function AnnonceDetailsScreen() {
  return (
    <View style={{ marginTop: 50 }}>
      <Text>Annonce Details</Text>
      <Link href="/(tabs)/home">Back to Home</Link>
      <Link href="/(tabs)/transactions">View Transactions</Link>
    </View>
  );
}
