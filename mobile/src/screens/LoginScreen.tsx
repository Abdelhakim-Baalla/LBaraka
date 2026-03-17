import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';

type Props = { navigate: (s: string) => void };

export default function LoginScreen({ navigate }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e = email.trim();
    const p = pass.trim();
    if (!e || !p) return Alert.alert('Erreur', 'Remplissez tous les champs');
    setLoading(true);
    try {
      const res = await apiLogin(e, p);
      login(res.accessToken);          // ← fix: accessToken (pas access_token)
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.logo}>🌿 LBaraka</Text>
        <Text style={s.sub}>Bienvenue — connectez-vous</Text>

        <Text style={s.label}>Email</Text>
        <TextInput
          style={s.input}
          placeholder="vous@exemple.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={s.label}>Mot de passe</Text>
        <TextInput
          style={s.input}
          placeholder="••••••••"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
        />

        <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnT}>Se connecter</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('Register')}>
          <Text style={s.link}>Pas encore de compte ? S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#16a34a', textAlign: 'center', marginBottom: 4 },
  sub: { textAlign: 'center', color: '#6b7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 11, fontSize: 15, marginBottom: 14 },
  btn: { backgroundColor: '#16a34a', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnT: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', color: '#16a34a', marginTop: 18, fontSize: 14 },
});
