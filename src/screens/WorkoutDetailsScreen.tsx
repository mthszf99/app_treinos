import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';

// Banco de dados
import { database } from '../database';
import WorkoutExercise from '../database/models/WorkoutExercise';
import Exercise from '../database/models/Exercise';

export function WorkoutDetailsScreen({ route }: any) {
  const { workoutId, workoutName } = route.params;
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [exercises, setExercises] = useState<any[]>([]);
  
  // Estados para o Modal de Edição
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSets, setNewSets] = useState('');

  const loadWorkoutExercises = async () => {
    try {
      const workoutExercisesCollection = database.get<WorkoutExercise>('workout_exercises');
      const exerciseCollection = database.get<Exercise>('exercises');

      const allLinks = await workoutExercisesCollection.query().fetch();
      const filteredLinks = allLinks.filter(link => link.workoutId === workoutId);

      const enrichedExercises = await Promise.all(
        filteredLinks.map(async (link) => {
          const exerciseData = await exerciseCollection.find(link.exerciseId);
          return {
            id: link.id, // ID na tabela ponte
            name: exerciseData.name,
            muscleGroup: exerciseData.muscleGroup,
            sets: link.targetSets,
            order: link.order,
          };
        })
      );

      // Garante a ordenação correta na tela pelo campo order
      enrichedExercises.sort((a, b) => a.order - b.order);
      setExercises(enrichedExercises);
    } catch (error) {
      console.error('Erro ao carregar exercícios:', error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadWorkoutExercises();
    }
  }, [isFocused]);

  const openEditModal = (item: any) => {
    setSelectedExercise(item);
    setNewSets(item.sets.toString());
    setModalVisible(true);
  };

  const handleUpdateSets = async () => {
    if (!selectedExercise || !newSets) return;
    
    const setsNumber = parseInt(newSets, 10);
    if (isNaN(setsNumber) || setsNumber <= 0) {
      Alert.alert('Atenção', 'Insira um número válido de séries.');
      return;
    }

    try {
      await database.write(async () => {
        const linkCollection = database.get<WorkoutExercise>('workout_exercises');
        const linkToUpdate = await linkCollection.find(selectedExercise.id);
        
        await linkToUpdate.update((link) => {
          link.targetSets = setsNumber;
        });
      });
      
      setModalVisible(false);
      loadWorkoutExercises();
    } catch (error) {
      console.error('Erro ao atualizar séries:', error);
    }
  };

  // FUNÇÃO PARA SUBIR A ORDEM DO EXERCÍCIO
  const handleMoveUp = async () => {
    if (!selectedExercise) return;

    // Encontra a posição atual dele na lista clonada da tela
    const currentIndex = exercises.findIndex(e => e.id === selectedExercise.id);
    if (currentIndex === 0) return; // Já é o primeiro da lista

    const itemA = exercises[currentIndex];
    const itemB = exercises[currentIndex - 1]; // O item que está acima dele

    try {
      await database.write(async () => {
        const linkCollection = database.get<WorkoutExercise>('workout_exercises');
        const recordA = await linkCollection.find(itemA.id);
        const recordB = await linkCollection.find(itemB.id);

        // Inverte as ordens no SQLite
        await recordA.update(r => { r.order = itemB.order; });
        await recordB.update(r => { r.order = itemA.order; });
      });

      setModalVisible(false);
      loadWorkoutExercises();
    } catch (error) {
      console.error('Erro ao reordenar para cima:', error);
    }
  };

  // FUNÇÃO PARA DESCER A ORDEM DO EXERCÍCIO
  const handleMoveDown = async () => {
    if (!selectedExercise) return;

    const currentIndex = exercises.findIndex(e => e.id === selectedExercise.id);
    if (currentIndex === exercises.length - 1) return; // Já é o último da lista

    const itemA = exercises[currentIndex];
    const itemB = exercises[currentIndex + 1]; // O item que está abaixo dele

    try {
      await database.write(async () => {
        const linkCollection = database.get<WorkoutExercise>('workout_exercises');
        const recordA = await linkCollection.find(itemA.id);
        const recordB = await linkCollection.find(itemB.id);

        // Inverte as ordens no SQLite
        await recordA.update(r => { r.order = itemB.order; });
        await recordB.update(r => { r.order = itemA.order; });
      });

      setModalVisible(false);
      loadWorkoutExercises();
    } catch (error) {
      console.error('Erro ao reordenar para baixo:', error);
    }
  };

  const handleRemoveExercise = async () => {
    if (!selectedExercise) return;

    Alert.alert(
      'Remover Exercício',
      `Tem certeza que deseja remover ${selectedExercise.name} do treino?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                const linkCollection = database.get<WorkoutExercise>('workout_exercises');
                const linkToDelete = await linkCollection.find(selectedExercise.id);
                await linkToDelete.destroyPermanently(); 
              });
              
              setModalVisible(false);
              loadWorkoutExercises();
            } catch (error) {
              console.error('Erro ao remover exercício:', error);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <TouchableOpacity 
      style={styles.exerciseCard}
      activeOpacity={0.7}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.indexBadge}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMuscle}>{item.muscleGroup}</Text>
      </View>
      <View style={styles.setsBadge}>
        <Text style={styles.setsText}>{item.sets} séries</Text>
      </View>
    </TouchableOpacity>
  );

  // Validações de posição para desativar botões no Modal
  const isFirstItem = selectedExercise ? exercises.findIndex(e => e.id === selectedExercise.id) === 0 : false;
  const isLastItem = selectedExercise ? exercises.findIndex(e => e.id === selectedExercise.id) === exercises.length - 1 : false;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{workoutName}</Text>
        <Text style={styles.subtitle}>Toque num exercício para configurar a ficha</Text>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum exercício adicionado a este treino.</Text>
        }
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('ExerciseSelection', { workoutId })}
        >
          <Text style={styles.addButtonText}>+ Adicionar Exercício</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE OPÇÕES E REORDENAÇÃO */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Exercício</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedExercise && (
              <>
                <Text style={styles.modalExerciseName}>{selectedExercise.name}</Text>
                
                {/* Ajuste de Séries Alvo */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Meta de Séries da Ficha:</Text>
                  <TextInput
                    style={styles.input}
                    value={newSets}
                    onChangeText={setNewSets}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                {/* BOTÕES DE REORDENAÇÃO */}
                <View style={styles.reorderRow}>
                  <TouchableOpacity 
                    style={[styles.reorderButton, isFirstItem && styles.disabledButton]} 
                    onPress={handleMoveUp}
                    disabled={isFirstItem}
                  >
                    <Text style={styles.reorderButtonText}>▲ Subir Posição</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.reorderButton, isLastItem && styles.disabledButton]} 
                    onPress={handleMoveDown}
                    disabled={isLastItem}
                  >
                    <Text style={styles.reorderButtonText}>▼ Descer Posição</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleUpdateSets}>
                  <Text style={styles.saveButtonText}>Confirmar Alterações</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleRemoveExercise}>
                  <Text style={styles.deleteButtonText}>Remover da Ficha</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 15, color: '#94a3b8', marginTop: 4 },
  listContent: { paddingHorizontal: 24, paddingTop: 8 },
  exerciseCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  indexBadge: {
    backgroundColor: '#0f172a',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  indexText: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold' },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  exerciseMuscle: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  setsBadge: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  setsText: { color: '#38bdf8', fontSize: 13, fontWeight: '600' },
  buttonContainer: { padding: 24 },
  addButton: { backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 15 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 380 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  modalClose: { fontSize: 24, color: '#94a3b8', padding: 5 },
  modalExerciseName: { fontSize: 18, color: '#38bdf8', marginBottom: 20, fontWeight: '600' },
  inputGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  inputLabel: { fontSize: 16, color: '#e2e8f0' },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#f8fafc',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: 70,
    textAlign: 'center',
  },
  reorderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  reorderButton: { flex: 1, backgroundColor: '#334155', padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  reorderButtonText: { color: '#f8fafc', fontSize: 14, fontWeight: '600' },
  disabledButton: { opacity: 0.3 },
  saveButton: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { backgroundColor: 'transparent', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  deleteButtonText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' },
});