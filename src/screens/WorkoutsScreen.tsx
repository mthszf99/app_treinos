import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  SafeAreaView, Alert, Modal, TextInput 
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';


// Importações do banco de dados
import { database } from '../database';
import Workout from '../database/models/Workout';
import WorkoutExercise from '../database/models/WorkoutExercise';

export function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');

  
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


  useEffect(() => {
    if (isFocused) {
      loadWorkouts();
    }
  }, [isFocused]);

  
const handleDeleteWorkout = (workout: Workout) => {
    Alert.alert(
      'Excluir Ficha de Treino',
      `Tem certeza que deseja apagar o "${workout.name}"? Todos os exercícios montados dentro dele serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                const workoutsCollection = database.get<Workout>('workouts');
                const workoutExercisesCollection = database.get<WorkoutExercise>('workout_exercises');

                
                const workoutToDelete = await workoutsCollection.find(workout.id);
                
                const allLinks = await workoutExercisesCollection.query().fetch();
                const linksToDelete = allLinks.filter(link => link.workoutId === workout.id);


                if ((workoutToDelete as any)._preparedState) {
                  (workoutToDelete as any)._preparedState = null;
                }
                linksToDelete.forEach(link => {
                  if ((link as any)._preparedState) {
                    (link as any)._preparedState = null;
                  }
                });

                
                const itemsToDestroy = [
                  workoutToDelete.prepareDestroyPermanently(),
                  ...linksToDelete.map(link => link.prepareDestroyPermanently())
                ];

                await database.batch(...itemsToDestroy);
              });

              loadWorkouts();
            } catch (error) {
              console.error('Erro ao excluir treino:', error);
              Alert.alert('Erro', 'Não foi possível excluir o treino.');
            }
          }
        }
      ]
    );
  };

  
  const handleAddTestWorkout = async () => {
    try {
      await database.write(async () => {
        const workoutsCollection = database.get<Workout>('workouts');
        await workoutsCollection.create((workout) => {
          workout.name = `Treino ${String.fromCharCode(65 + workouts.length)}`;
          workout.goal = 'Ganho de Massa';
          workout.estimatedDuration = 45;
          workout.userId = 'user-teste-123';
        });
      });
      
      loadWorkouts();
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      Alert.alert('Erro', 'Não foi possível criar o treino.');
    }
  };

  
  const renderWorkoutCard = ({ item }: { item: Workout }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.7}
      
      onPress={() => navigation.navigate('WorkoutDetails', { 
        workoutId: item.id, 
        workoutName: item.name 
      })}
      
      onLongPress={() => handleDeleteWorkout(item)}
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
        <Text style={styles.hintText}>Pressione e segure para excluir</Text>
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
  listContent: { padding: 24, paddingBottom: 100 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  durationBadge: { backgroundColor: '#334155', color: '#38bdf8', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 12, overflow: 'hidden', fontWeight: '600' },
  cardBody: { marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { color: '#94a3b8', fontSize: 14, marginRight: 6 },
  infoText: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  hintText: { color: '#64748b', fontSize: 11, marginTop: 12, fontStyle: 'italic', textAlign: 'right' },
  fab: { position: 'absolute', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', right: 24, bottom: 24, backgroundColor: '#6366f1', borderRadius: 28, elevation: 8, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 4 } },
  fabIcon: { fontSize: 24, color: '#ffffff', fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 15 },
});