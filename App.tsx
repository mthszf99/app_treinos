import React, { useEffect } from 'react'; // <-- Importe o useEffect aqui
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

// cgamando o seeds
import { seedExercises } from './src/database/seeds';

export default function App() {
  
  useEffect(() => {
    // Roda a carga inicial
    seedExercises();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}