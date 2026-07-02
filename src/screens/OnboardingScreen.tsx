import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  SafeAreaView, KeyboardAvoidingView, Platform, Alert 
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

// Banco de Dados
import { database } from '../database';
import User from '../database/models/User';

export function OnboardingScreen() {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const authUser = auth().currentUser;
  const navigation = useNavigation<any>();

  const handleFinishOnboarding = async () => {
    if (!name || !weight || !height) {
      Alert.alert('Quase lá!', 'Por favor, preencha todos os campos para montarmos seu perfil.');
      return;
    }

    const parsedWeight = parseFloat(weight.replace(',', '.'));
    const parsedHeight = parseFloat(height.replace(',', '.'));

    try {
      await database.write(async () => {
        const usersCollection = database.get<User>('users');
        
        // Cria o perfil oficial do usuário no banco de dados local
        await usersCollection.create((u) => {
          u.name = name;
          u.email = authUser?.email || '';
          u.currentWeight = parsedWeight;
          u.height = parsedHeight;
        });
      });

      
      Alert.alert('Tudo pronto!', 'Seu perfil foi configurado com sucesso.');
      
      
      navigation.replace('MainTabs'); 
      
    } catch (error) {
      console.error('Erro ao salvar perfil inicial:', error);
      Alert.alert('Erro', 'Não foi possível salvar seus dados.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>Bem-vindo!</Text>
          <Text style={styles.subtitle}>
            Vamos configurar seu perfil para personalizar sua experiência de treino.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Como podemos te chamar?</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome ou apelido"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 70.5"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Altura (m)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 1.75"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={height}
                onChangeText={setHeight}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleFinishOnboarding}
          >
            <Text style={styles.primaryButtonText}>Começar a Treinar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32, alignItems: 'center' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '900', color: '#f8fafc', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', lineHeight: 24 },
  form: { width: '100%', backgroundColor: '#1e293b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', fontSize: 16, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  primaryButton: { backgroundColor: '#38bdf8', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  primaryButtonText: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
});