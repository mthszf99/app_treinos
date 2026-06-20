import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Banco de dados
import { database } from '../database';
import Exercise from '../database/models/Exercise';
import WorkoutExercise from '../database/models/WorkoutExercise';

export function ExerciseSelectionScreen({ route }: any) {
  // Recebe o ID do treino que foi passado pela tela anterior
  const { workoutId } = route.params;
  const navigation = useNavigation();
  
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Carrega todos os exercícios da biblioteca
  useEffect(() => {
    async function loadExercises() {
      const exercisesCollection = database.get<Exercise>('exercises');
      const allExercises = await exercisesCollection.query().fetch();
      setExercises(allExercises);
    }
    loadExercises();
  }, []);

  // Função para vincular o exercício selecionado ao treino atual
  const handleAddExercise = async (exercise: Exercise) => {
    try {
      await database.write(async () => {
        const workoutExercisesCollection = database.get<WorkoutExercise>('workout_exercises');
        
        // Conta quantos já existem neste treino para definir a ordem
        const existingLinks = await workoutExercisesCollection.query().fetch();

        // Cria o registro na tabela ponte
        await workoutExercisesCollection.create((link) => {
          link.workoutId = workoutId;
          link.exerciseId = exercise.id;
          link.order = existingLinks.length + 1;
          link.targetSets = 4; // Padrão inicial (ex: 4 séries)
        });
      });

      Alert.alert('Sucesso!', `${exercise.name} adicionado à sua ficha.`);
      navigation.goBack(); // Retorna para a tela do treino automaticamente
    } catch (error) {
      console.error('Erro ao adicionar exercício:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o exercício.');
    }
  };

  const renderItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleAddExercise(item)}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.muscle}>{item.muscleGroup}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  muscle: {
    fontSize: 14,
    color: '#38bdf8',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
});