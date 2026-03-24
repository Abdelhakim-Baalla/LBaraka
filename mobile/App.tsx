import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AnnoncesScreen from './src/screens/AnnoncesScreen';
import CarteScreen from './src/screens/CarteScreen';
import CreateAnnonceScreen from './src/screens/CreateAnnonceScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WalletScreen from './src/screens/WalletScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';

type Screen = 'Login' | 'Register' | 'Annonces' | 'Carte' | 'CreateAnnonce' | 'Profile' | 'Wallet' | 'Transactions';

function AppNav() {
  const { token } = useAuth();
  const [screen, setScreen] = useState<Screen>('Login');
  const navigate = (s: Screen) => setScreen(s);

  if (!token) {
    return screen === 'Register'
      ? <RegisterScreen navigate={navigate} />
      : <LoginScreen navigate={navigate} />;
  }

  if (screen === 'Carte') return <CarteScreen navigate={navigate} />;
  if (screen === 'CreateAnnonce') return <CreateAnnonceScreen navigate={navigate} />;
  if (screen === 'Profile') return <ProfileScreen navigate={navigate} />;
  if (screen === 'Wallet') return <WalletScreen navigate={navigate} />;
  if (screen === 'Transactions') return <TransactionsScreen navigate={navigate} />;
  return <AnnoncesScreen navigate={navigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNav />
    </AuthProvider>
  );
}
