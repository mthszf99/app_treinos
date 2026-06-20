import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Importações do banco de dados
import { database } from '../database';
import Workout from '../database/models/Workout';

export function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const navigation = useNavigation<any>();
  // Função para buscar os treinos salvos no banco
  const loadWorkouts = async () => {
    try {
      const workoutsCollection = database.get<Workout>('workouts');
      // Busca todos os treinos salvos
      const savedWorkouts = await workoutsCollection.query().fetch();
      setWorkouts(savedWorkouts);
    } catch (error) {
      console.error('Erro ao carregar treinos:', error);
    }
  };

  // Carrega os dados assim que a tela abre
  useEffect(() => {
    loadWorkouts();
  }, []);

  // Função temporária para o botão "+" criar um treino de teste no banco
  const handleAddTestWorkout = async () => {
    try {
      await database.write(async () => {
        const workoutsCollection = database.get<Workout>('workouts');
        await workoutsCollection.create((workout) => {
          // Aqui usamos o seu objetivo e ritmo como padrão
          workout.name = `Treino ${String.fromCharCode(65 + workouts.length)}`; // Gera Treino A, B, C...
          workout.goal = 'Ganho de Massa';
          workout.estimatedDuration = 45; // 45 minutos
          workout.userId = 'user-teste-123'; // Como ainda não temos auth, usamos um ID fixo
        });
      });
      
      Alert.alert('Sucesso', 'Novo treino criado no banco de dados!');
      loadWorkouts(); // Recarrega a lista para mostrar o novo treino na tela
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      Alert.alert('Erro', 'Não foi possível criar o treino.');
    }
  };

  // Renderiza o visual de cada card de treino
  const renderWorkoutCard = ({ item }: { item: Workout }) => (
    <TouchableOpacity style={styles.card}
        onPress={() => navigation.navigate('WorkoutDetails', { 
                workoutId: item.id, 
                workoutName: item.name 
        })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.durationBadge}>{item.estimatedDuration} min</Text>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Objetivo:</Text>
          <Text style={styles.infoText}>{item.goal}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Treinos</Text>
        <Text style={styles.subtitle}>Escolha sua rotina de hoje</Text>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkoutCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Você ainda não possui treinos cadastrados no banco de dados.</Text>
        }
      />

      {/* Botão Flutuante (+). Agora ele chama a função de criar no banco */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={handleAddTestWorkout}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
  },
  listContent: {
    padding: 24,
    paddingBottom: 100, // Espaço para não ficar embaixo do FAB
  },
  card: {
    backgroundColor: '#1e293b', // Slate 800
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  durationBadge: {
    backgroundColor: '#334155',
    color: '#38bdf8', // Azul de destaque
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#6366f1', // Indigo 500
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
    marginTop: -2,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});