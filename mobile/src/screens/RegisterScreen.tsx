import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { register as apiRegister } from '../api/auth';

type Props = { navigate: (s: string) => void };

export default function RegisterScreen({ navigate }: Props) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [tel, setTel] = useState('');
  const [cin, setCin] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !pass.trim() || !tel.trim())
      return Alert.alert('Erreur', 'Email, mot de passe et téléphone sont obligatoires');
    setLoading(true);
    try {
      await apiRegister({
        email: email.trim(),
        motDePasse: pass.trim(),
        telephone: tel.trim(),
        ...(cin.trim() ? { cin: cin.trim() } : {}),
      });
      Alert.alert('Succès 🎉', 'Compte créé ! Vous pouvez vous connecter.', [
        { text: 'Se connecter', onPress: () => navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>🌿 LBaraka</Text>
        <Text style={s.sub}>Créez votre compte</Text>

        <Text style={s.label}>Email *</Text>
        <TextInput style={s.input} placeholder="vous@exemple.com"
          autoCapitalize="none" keyboardType="email-address"
          value={email} onChangeText={setEmail} />

        <Text style={s.label}>Mot de passe * (min. 8 caractères)</Text>
        <TextInput style={s.input} placeholder="••••••••"
          secureTextEntry value={pass} onChangeText={setPass} />

        <Text style={s.label}>Téléphone * (ex: 0612345678)</Text>
        <TextInput style={s.input} placeholder="0612345678"
          keyboardType="phone-pad" value={tel} onChangeText={setTel} />

        <Text style={s.label}>CIN (optionnel, ex: AB123456)</Text>
        <TextInput style={s.input} placeholder="AB123456"
          autoCapitalize="characters" value={cin} onChangeText={setCin} />

        <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnT}>S'inscrire</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('Login')}>
          <Text style={s.link}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0fdf4' },
  inner: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#16a34a', textAlign: 'center', marginBottom: 4 },
  sub: { textAlign: 'center', color: '#6b7280', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 11, fontSize: 15, marginBottom: 14, backgroundColor: '#fff' },
  btn: { backgroundColor: '#16a34a', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnT: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { textAlign: 'center', color: '#16a34a', marginTop: 18, fontSize: 14 },
});
