import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [adresseComplete, setAdresseComplete] = useState('');
  const [ville, setVille] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [langueInterface, setLangueInterface] = useState('FRANCAIS');
  
  // Read-only fields
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setNom(user.profil?.nom || '');
        setPrenom(user.profil?.prenom || '');
        setAdresseComplete(user.profil?.adresseComplete || '');
        setVille(user.profil?.ville || '');
        setLangueInterface(user.profil?.langueInterface || 'FRANCAIS');
        
        // Read-only fields
        setEmail(user.email || '');
        setTelephone(user.telephone || '');
        setCin(user.profil?.cin || '');
        
        if (user.profil?.dateNaissance) {
          const date = new Date(user.profil.dateNaissance);
          setDateNaissance(date.toISOString().split('T')[0]);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Session expirée. Reconnectez-vous.');
      }

      const data = await ApiService.updateUserProfile(token, {
        nom: nom || undefined,
        prenom: prenom || undefined,
        adresseComplete: adresseComplete || undefined,
        ville: ville || undefined,
        dateNaissance: dateNaissance || undefined,
        langueInterface: langueInterface || undefined,
      });

        const userData = await AsyncStorage.getItem('user');
        const user = JSON.parse(userData || '{}');
        user.profil = data.profil;
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        Alert.alert('Succès', 'Profil mis à jour', [
          { text: 'OK', onPress: () => router.back() }
        ]);
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Erreur', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-surface"
    >
      <View
        className="bg-white/90 px-6 pb-3 border-b border-outline-variant/30"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-xl items-center justify-center bg-surface-container">
          <Ionicons name="arrow-back" size={24} color="#012d1d" />
        </Pressable>
        <Text className="text-base font-extrabold tracking-wide text-primary">MODIFIER PROFIL</Text>
        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
          <Ionicons name="create-outline" size={18} color="#1B4332" />
        </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
        <View className="bg-primary rounded-2xl p-4 mb-5">
          <Text className="text-white font-bold text-base">Informations personnelles</Text>
          <Text className="text-white/80 text-xs mt-1">Les champs sensibles restent protégés et non modifiables.</Text>
        </View>

        {/* Read-only Information Section */}
        <View className="bg-white border border-outline-variant/70 rounded-2xl p-4 mb-6">
          <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">
            Informations non modifiables
          </Text>
          
          {email && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="mail-outline" size={16} color="#717973" />
              <Text className="text-sm text-on-surface ml-2">{email}</Text>
            </View>
          )}
          
          {telephone && (
            <View className="flex-row items-center mb-2">
              <Ionicons name="call-outline" size={16} color="#717973" />
              <Text className="text-sm text-on-surface ml-2">{telephone}</Text>
            </View>
          )}
          
          {cin && (
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={16} color="#717973" />
              <Text className="text-sm text-on-surface ml-2">CIN: {cin}</Text>
            </View>
          )}
        </View>

        {/* Editable Fields Section */}
        <Text className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-4">
          Informations modifiables
        </Text>
        
        <View className="space-y-5">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
              Prénom
            </Text>
            <TextInput
              className="w-full bg-surface-container-high rounded-xl px-5 py-4 text-on-surface text-base"
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Votre prénom"
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
              Nom
            </Text>
            <TextInput
              className="w-full bg-surface-container-high rounded-xl px-5 py-4 text-on-surface text-base"
              value={nom}
              onChangeText={setNom}
              placeholder="Votre nom"
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
              Adresse complète
            </Text>
            <TextInput
              className="w-full bg-surface-container-high rounded-xl px-5 py-4 text-on-surface text-base"
              value={adresseComplete}
              onChangeText={setAdresseComplete}
              placeholder="Votre adresse"
              editable={!isLoading}
              multiline
            />
          </View>

          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
              Ville
            </Text>
            <TextInput
              className="w-full bg-surface-container-high rounded-xl px-5 py-4 text-on-surface text-base"
              value={ville}
              onChangeText={setVille}
              placeholder="Votre ville"
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
              Date de naissance
            </Text>
            <TextInput
              className="w-full bg-surface-container-high rounded-xl px-5 py-4 text-on-surface text-base"
              value={dateNaissance}
              onChangeText={setDateNaissance}
              placeholder="YYYY-MM-DD"
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 ml-1 mb-2">
              Langue d'interface
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {['FRANCAIS', 'ARABE', 'AMAZIGH', 'BILINGUE'].map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => setLangueInterface(lang)}
                  disabled={isLoading}
                  className={`w-[48%] rounded-xl py-3 px-4 ${
                    langueInterface === lang ? 'bg-primary-container' : 'bg-surface-container-high'
                  }`}
                >
                  <Text className={`text-center text-sm font-semibold ${
                    langueInterface === lang ? 'text-white' : 'text-on-surface'
                  }`}>
                    {lang === 'FRANCAIS' ? 'FR' : lang === 'ARABE' ? 'AR' : lang === 'AMAZIGH' ? 'AZ' : 'BI'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          className={`w-full bg-primary-container rounded-xl py-5 px-6 flex-row items-center justify-center shadow-lg mt-8 mb-8 ${
            isLoading ? 'opacity-50' : ''
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-lg tracking-wide">Enregistrer</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
