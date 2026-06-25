import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { authService } from '../services/authService';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthentication = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      if (isLogin) {
        await authService.signIn(email, password);
      } else {
        await authService.signUp(email, password);
      }
      
    } catch (error) {
      
      console.log('Erro na autenticação', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>App Treinos</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Bem-vindo de volta! Faça login para continuar.' : 'Crie sua conta e comece a evoluir hoje.'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Palavra-passe"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={handleAuthentication}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.toggleButtonText}>
            {isLogin ? 'Não tem uma conta? Registre-se' : 'Já tem uma conta? Faça Login'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 36, fontWeight: '900', color: '#f8fafc', marginBottom: 8, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20 },
  form: { width: '100%' },
  input: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  toggleButton: { marginTop: 24, alignItems: 'center', padding: 10 },
  toggleButtonText: { color: '#38bdf8', fontSize: 15, fontWeight: '600' },
});