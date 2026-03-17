import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AnnoncesScreen from './src/screens/AnnoncesScreen';
import CreateAnnonceScreen from './src/screens/CreateAnnonceScreen';

type Screen = 'Login' | 'Register' | 'Annonces' | 'CreateAnnonce';

function AppNav() {
  const { token } = useAuth();
  const [screen, setScreen] = useState<Screen>('Login');
  const navigate = (s: Screen) => setScreen(s);

  if (!token) {
    return screen === 'Register'
      ? <RegisterScreen navigate={navigate} />
      : <LoginScreen navigate={navigate} />;
  }

  if (screen === 'CreateAnnonce') return <CreateAnnonceScreen navigate={navigate} />;
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
