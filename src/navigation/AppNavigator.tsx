import React, {useState, useEffect} from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';


// importação para verificar usuario
import { database } from '../database';
import User from '../database/models/User';

// Nossas Telas
import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutsScreen } from '../screens/WorkoutsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { WorkoutDetailsScreen } from '../screens/WorkoutDetailsScreen';
import { ExerciseSelectionScreen } from '../screens/ExerciseSelectionScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { HistoryDetailsScreen } from '../screens/HistoryDetailsScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';

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
      <Stack.Screen 
      name="WorkoutsList" 
      component={WorkoutsScreen} 
      options={{ headerShown: false }} />

      <Stack.Screen
      name="WorkoutDetails" 
      component={WorkoutDetailsScreen} 
      options={{ title: 'Ficha de Treino' }} />

      <Stack.Screen
        name="ExerciseSelection"
        component={ExerciseSelectionScreen}
        options={{ title: 'Biblioteca de Exercícios' }} />

      <Stack.Screen
        name="ActiveWorkout" 
        component={ActiveWorkoutScreen}
        options={{ headerShown: false }} />

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


function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#1e293b', 
          borderTopColor: '#334155',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#38bdf8', 
        tabBarInactiveTintColor: '#64748b', 
        tabBarIcon: ({ focused, color }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Treinos') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Histórico') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Treinos" component={WorkoutStack} />
      <Tab.Screen name="Histórico" component={HistoryStack} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}


export function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean>(false);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // se o usuario logou, verifica se ele já passou pelo Onboarding
        try {
          const usersCollection = database.get<User>('users');
          const savedUsers = await usersCollection.query().fetch();
          setHasProfile(savedUsers.length > 0);
        } catch (error) {
          console.error("Erro ao verificar perfil no banco:", error);
          setHasProfile(false);
        }
      }
      
      if (initializing) setInitializing(false);
    });
    
    return subscriber;
  }, [initializing]);

  // Tela de carregamento enquanto o Firebase e o SQLite decidem a rota
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        // Se logado, usa uma Pilha Raiz para decidir se vai para o Onboarding ou direto para o App
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={hasProfile ? "MainTabs" : "Onboarding"}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="MainTabs" component={AppTabs} />
        </Stack.Navigator>
      ) : (
        // Se não estiver logado, tranca na tela de Auth
        <AuthStack />
      )}
    </NavigationContainer>
  );
}