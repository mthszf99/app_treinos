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
import { database } from '../database';
import User from '../database/models/User';

export function ProfileScreen() {
  // Estados para os campos do perfil
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [weight, setWeight] = useState(''); // Peso em kg
  const [height, setHeight] = useState(''); // Altura em metros

  // Carregar os dados quando a tela abrir
  useEffect(() => {
    async function loadProfile() {
      // Puxa todos os usuários cadastrados (como é perfil, só teremos 1)
      const usersCollection = database.get<User>('users');
      const existingUsers = await usersCollection.query().fetch();

      if (existingUsers.length > 0) {
        const currentUser = existingUsers[0];
        setName(currentUser.name);
        setEmail(currentUser.email);
        setWeight(currentUser.currentWeight.toString());
        setHeight(currentUser.height.toString());
      }
    }
    loadProfile();
  }, []);

  // Cálculo do IMC em tempo real
  const parsedWeight = parseFloat(weight.replace(',', '.'));
  const parsedHeight = parseFloat(height.replace(',', '.'));
  
  const imc =
    parsedWeight && parsedHeight
      ? (parsedWeight / (parsedHeight * parsedHeight)).toFixed(1)
      : '0.0';

  // Classificação do IMC baseada no valor calculado
  const getImcClassification = (value: number) => {
    if (value === 0) return 'Dados incompletos';
    if (value < 18.5) return 'Abaixo do peso';
    if (value < 25) return 'Peso normal';
    if (value < 30) return 'Sobrepeso';
    return 'Obesidade';
  };

  const imcValue = parseFloat(imc);
  const classification = getImcClassification(imcValue);

  // Função para definir a cor do card de IMC dependendo do resultado
  const getImcColor = () => {
    if (imcValue === 0) return '#94a3b8'; // Cinza
    if (imcValue < 18.5) return '#38bdf8'; // Azul (Abaixo do peso)
    if (imcValue < 25) return '#22c55e'; // Verde (Normal)
    return '#f97316'; // Laranja/Vermelho (Sobrepeso+)
  };

// Função de Salvar no WatermelonDB
  const handleSave = async () => {
    // Validação básica
    if (!name || !weight || !height) {
      Alert.alert('Atenção', 'Por favor, preencha pelo menos o nome, peso e altura.');
      return;
    }

    try {
      // Abre a transação de escrita no banco
      await database.write(async () => {
        const usersCollection = database.get<User>('users');
        const existingUsers = await usersCollection.query().fetch();

        if (existingUsers.length > 0) {
          // ATUALIZAR: Se já existe um usuário, vamos atualizar os dados dele
          const currentUser = existingUsers[0];
          await currentUser.update((u) => {
            u.name = name;
            u.email = email;
            u.currentWeight = parsedWeight;
            u.height = parsedHeight;
          });
        } else {
          // CRIAR: Se o banco estiver vazio, cria o primeiro registro
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Meu Perfil</Text>

        {/* Card de Exibição do IMC */}
        <View style={[styles.imcCard, { backgroundColor: getImcColor() }]}>
          <Text style={styles.imcLabel}>Seu IMC Atual</Text>
          <Text style={styles.imcValue}>{imc}</Text>
          <Text style={styles.imcStatus}>{classification}</Text>
        </View>

        {/* Formulário de Dados */}
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
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu-email@exemplo.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Fundo Dark Moderno (Slate 900)
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 24,
  },
  imcCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imcLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  imcValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 8,
  },
  imcStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  form: {
    backgroundColor: '#1e293b', // Slate 800
    borderRadius: 16,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#f8fafc',
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#6366f1', // Indigo 500
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});