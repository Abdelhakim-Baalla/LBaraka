import { View, Text } from 'react-native';

// GET /transactions/me - Mes transactions (emprunts et prêts)
// POST /transactions/reserve/:annonceId - Réserver une annonce
// GET /transactions/:id/qr-reception - Générer QR Code pour la REMISE
// POST /transactions/:id/validate-reception - Valider la REMISE
// GET /transactions/:id/qr-retour - Générer QR Code pour le RETOUR
// POST /transactions/:id/validate-retour - Confirmer le RETOUR
// POST /transactions/:id/valider-retour - Finaliser le retour (débloquer caution)
export default function TransactionsScreen() {
  return (
    <View style={{ marginTop: 50 }}>
      <Text>Transactions</Text>
    </View>
  );
}
