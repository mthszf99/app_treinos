import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';

export const authService = {
  // Criar uma nova conta
  signUp: async (email: string, password: string) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Erro', 'Este endereço de e-mail já está em uso.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Erro', 'O endereço de e-mail introduzido é inválido.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Erro', 'A palavra-passe deve ter pelo menos 6 caracteres.');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao efetuar o registo.');
      }
      throw error;
    }
  },

  // Inicia sessão
  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        Alert.alert('Erro', 'E-mail ou palavra-passe incorretos.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Erro', 'O formato do e-mail é inválido.');
      } else {
        Alert.alert('Erro', 'Não foi possível iniciar sessão.');
      }
      throw error;
    }
  },

  // Termina sessão
  signOut: async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Erro ao terminar sessão:', error);
    }
  },

  //atualmente logado
  getCurrentUser: () => {
    return auth().currentUser;
  }
};