import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  SafeAreaView, Alert, Modal, TextInput 
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

// Importações do banco de dados
import { database } from '../database';
import Workout from '../database/models/Workout';
import WorkoutExercise from '../database/models/WorkoutExercise';

export function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  
  // Estados do Modal de Edição
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');

  // Função para carregar os treinos
  const loadWorkouts = async () => {
    try {
      const workoutsCollection = database.get<Workout>('workouts');
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

  // Função para Excluir Treino
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

  // Função para Adicionar um Treino de Teste
  const handleAddTestWorkout = async () => {
    const currentUserUid = auth().currentUser?.uid || 'usuario-desconhecido';

    try {
      await database.write(async () => {
        const workoutsCollection = database.get<Workout>('workouts');
        await workoutsCollection.create((workout) => {
          workout.name = `Treino ${String.fromCharCode(65 + workouts.length)}`;
          workout.goal = 'Ganho de Massa';
          workout.estimatedDuration = 45;
          workout.userId = currentUserUid;
        });
      });
      
      loadWorkouts();
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      Alert.alert('Erro', 'Não foi possível criar o treino.');
    }
  };

  // Funções do Modal de Edição
  const openEditModal = (workout: Workout) => {
    setWorkoutToEdit(workout);
    setNewWorkoutName(workout.name);
    setIsEditModalVisible(true);
  };

  const handleSaveWorkoutName = async () => {
    if (!workoutToEdit || newWorkoutName.trim() === '') {
      setIsEditModalVisible(false);
      return;
    }

    try {
      await database.write(async () => {
        const workoutsCollection = database.get<Workout>('workouts');
        const workoutToUpdate = await workoutsCollection.find(workoutToEdit.id);

        await workoutToUpdate.update((w) => {
          w.name = newWorkoutName.trim();
        });
      });

      setIsEditModalVisible(false);
      setWorkoutToEdit(null);
      loadWorkouts();
    } catch (error) {
      console.error('Erro ao renomear treino:', error);
      Alert.alert('Erro', 'Não foi possível alterar o nome.');
    }
  };

  // Renderização de cada Card
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

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <Text style={styles.editButtonText}>✏️ Renomear</Text>
          </TouchableOpacity>
          <Text style={styles.hintText}>Segure o card para excluir</Text>
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

      {/* Botão Flutuante (+) */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={handleAddTestWorkout}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* MODAL DE EDIÇÃO DE NOME */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Renomear Treino</Text>
            
            <TextInput
              style={styles.modalInput}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
              placeholder="Ex: Peito e Tríceps"
              placeholderTextColor="#64748b"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnSave]} 
                onPress={handleSaveWorkoutName}
              >
                <Text style={styles.modalBtnTextSave}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  hintText: { color: '#64748b', fontSize: 11, fontStyle: 'italic', textAlign: 'right' },
  fab: { position: 'absolute', width: 56, height: 56, alignItems: 'center', justifyContent: 'center', right: 24, bottom: 24, backgroundColor: '#6366f1', borderRadius: 28, elevation: 8, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 4 } },
  fabIcon: { fontSize: 24, color: '#ffffff', fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 15 },
  

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  editButtonText: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1e293b', width: '100%', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc', marginBottom: 16 },
  modalInput: { backgroundColor: '#0f172a', color: '#f8fafc', fontSize: 16, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalBtnCancel: { backgroundColor: 'transparent' },
  modalBtnTextCancel: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
  modalBtnSave: { backgroundColor: '#38bdf8' },
  modalBtnTextSave: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
});