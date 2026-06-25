import React, {useState, useEffect} from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ActivityIndicator, View } from 'react-native';


// Nossas Telas
import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WorkoutDetailsScreen } from '../screens/WorkoutDetailsScreen';
import { ExerciseSelectionScreen } from '../screens/ExerciseSelectionScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HistoryDetailsScreen } from '../screens/HistoryDetailsScreen';
import { AuthScreen } from '../screens/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function WorkoutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="WorkoutsList" component={WorkoutsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutDetails" component={WorkoutDetailsScreen} options={{ title: 'Ficha de Treino' }} />
      <Stack.Screen name="ExerciseSelection" component={ExerciseSelectionScreen} options={{ title: 'Biblioteca de Exercícios' }} />
      <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} options={{ headerShown: false }} />
</Stack.Navigator>
  );
}
function HistoryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#f8fafc',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >

    <Stack.Screen
        name="HistoryList" 
        component={HistoryScreen} 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="HistoryDetails" 
        component={HistoryDetailsScreen} 
        options={{ title: 'Resumo do Treino' }} 
      />

      <Stack.Screen 
        name="WorkoutsList" 
        component={WorkoutsScreen} 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="WorkoutDetails" 
        component={WorkoutDetailsScreen} 
        options={{ title: 'Ficha de Treino' }} 
      />

      <Stack.Screen 
        name="ActiveWorkout" 
        component={ActiveWorkoutScreen} 
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="ExerciseSelection" 
        component={ExerciseSelectionScreen} 
        options={{ title: 'Biblioteca de Exercícios' }} 
      />
    </Stack.Navigator>
  );
}

//stack de autenticação
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  
  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, [initializing]);

  
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* SE O USUÁRIO EXISTIR, MOSTRA O APP SE NÃO MOSTRA O LOGIN */}
      {user ? (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Treinos" component={WorkoutStack} />
          <Tab.Screen name="Histórico" component={HistoryStack} />
          <Tab.Screen name="Perfil" component={ProfileScreen} />
        </Tab.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}