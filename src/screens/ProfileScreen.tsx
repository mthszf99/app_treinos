import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

// Banco de dados e Autenticação
import { database } from '../database';
import User from '../database/models/User';
import auth from '@react-native-firebase/auth';

export function ProfileScreen() {
  // Pega as informações do usuário logado no momento no Firebase
  const authUser = auth().currentUser;

  // Estados para os campos do perfil
  const [name, setName] = useState('');
  // O E-mail já inicia com o e-mail do Firebase
  const [email, setEmail] = useState(authUser?.email || ''); 
  const [weight, setWeight] = useState(''); // Peso em kg
  const [height, setHeight] = useState(''); // Altura em metros

  // Carregar os dados quando a tela abrir
  useEffect(() => {
    async function loadProfile() {
      // Puxa todos os usuários cadastrados
      const usersCollection = database.get<User>('users');
      const existingUsers = await usersCollection.query().fetch();

      if (existingUsers.length > 0) {
        const currentUser = existingUsers[0];
        setName(currentUser.name);
        // Atualiza os estados de peso e altura
        setWeight(currentUser.currentWeight ? currentUser.currentWeight.toString() : '');
        setHeight(currentUser.height ? currentUser.height.toString() : '');
      }
    }
    loadProfile();
  }, []);

  
  const parsedWeight = parseFloat(weight.replace(',', '.'));
  const parsedHeight = parseFloat(height.replace(',', '.'));
  
  const imc =
    parsedWeight && parsedHeight
      ? (parsedWeight / (parsedHeight * parsedHeight)).toFixed(1)
      : '0.0';

  
  const getImcClassification = (value: number) => {
    if (value === 0) return 'Dados incompletos';
    if (value < 18.5) return 'Abaixo do peso';
    if (value < 25) return 'Peso normal';
    if (value < 30) return 'Sobrepeso';
    return 'Obesidade';
  };

  const imcValue = parseFloat(imc);
  const classification = getImcClassification(imcValue);

  
  const getImcColor = () => {
    if (imcValue === 0) return '#94a3b8';
    if (imcValue < 18.5) return '#38bdf8'; 
    if (imcValue < 25) return '#22c55e'; 
    return '#f97316';
  };

  // Função de salvar
  const handleSave = async () => {
    if (!name || !weight || !height) {
      Alert.alert('Atenção', 'Por favor, preencha pelo menos o nome, peso e altura.');
      return;
    }

    try {
      await database.write(async () => {
        const usersCollection = database.get<User>('users');
        const existingUsers = await usersCollection.query().fetch();

        if (existingUsers.length > 0) {
          const currentUser = existingUsers[0];
          await currentUser.update((u) => {
            u.name = name;
            u.email = email;
            u.currentWeight = parsedWeight;
            u.height = parsedHeight;
          });
        } else {
          await usersCollection.create((u) => {
            u.name = name;
            u.email = email;
            u.currentWeight = parsedWeight;
            u.height = parsedHeight;
          });
        }
      });

      Alert.alert('Sucesso!', 'Seus dados foram salvos no banco local.');
    } catch (error) {
      console.error('Erro ao salvar no banco:', error);
      Alert.alert('Erro', 'Ocorreu um problema ao salvar os dados.');
    }
  };

  // Função de Logout
  const handleSignOut = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja desconectar do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
            } catch (error) {
              console.error('Erro ao sair:', error);
              Alert.alert('Erro', 'Não foi possível desconectar.');
            }
          } 
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Meu Perfil</Text>

        {/* Card do IMC */}
        <View style={[styles.imcCard, { backgroundColor: getImcColor() }]}>
          <Text style={styles.imcLabel}>Seu IMC Atual</Text>
          <Text style={styles.imcValue}>{imc}</Text>
          <Text style={styles.imcStatus}>{classification}</Text>
        </View>

        {/* Formulario de Dados */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Digite seu nome"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail (Vinculado à conta)</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false} 
              placeholder="seu-email@exemplo.com"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="Ex: 70"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Altura (m)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="Ex: 1.75"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Salvar Alterações</Text>
          </TouchableOpacity>
        </View>

        {/* SESSÃO NOVA: Conta e Segurança */}
        <View style={styles.firebaseSection}>
          <Text style={styles.sectionTitle}>Conta e Segurança</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Código de Suporte Técnico (Firebase UID):</Text>
            <Text style={styles.infoValue}>{authUser?.uid}</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Text style={styles.logoutButtonText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc', marginBottom: 24 },
  
  imcCard: { borderRadius: 16, padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  imcLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: 1 },
  imcValue: { fontSize: 48, fontWeight: '800', color: '#ffffff', marginVertical: 8 },
  imcStatus: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  
  form: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '500', color: '#94a3b8', marginBottom: 8 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  inputDisabled: { opacity: 0.6, backgroundColor: '#1e293b' }, // Feedback visual para o e-mail travado
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  button: { backgroundColor: '#6366f1', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },

  // Estilos da nova sessão do Firebase
  firebaseSection: { marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
  infoCard: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  infoLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 4 },
  infoValue: { color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace' },
  
  logoutButton: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  logoutButtonText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
});