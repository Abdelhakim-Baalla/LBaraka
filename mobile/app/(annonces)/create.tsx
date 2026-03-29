import { View, Text } from 'react-native';
import { Link } from 'expo-router';

// POST /annonces - Créer une annonce standard
// Body: titre, description, categorie, mode, condition, montantCaution, photosBase64, geolocalisation
// POST /annonces/food-rescue - Créer une annonce Food Rescue (PARTENAIRE only)
export default function CreateAnnonceScreen() {
  return (
    <View style={{ marginTop: 50 }}>
      <Text>Create Annonce</Text>
      <Link href="/(tabs)/home">Back to Home</Link>
    </View>
  );
}
