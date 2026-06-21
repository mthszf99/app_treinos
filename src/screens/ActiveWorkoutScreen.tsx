import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, TextInput, Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Nosso Hook de Tempo
import { useStopwatch } from '../hooks/useStopwatch';

// Banco de dados
import { database } from '../database';
import WorkoutExercise from '../database/models/WorkoutExercise';
import Exercise from '../database/models/Exercise';
import Session from '../database/models/Session';
import SessionLog from '../database/models/SessionLog';

interface SetRecord {
  weight: string;
  reps: string;
  isDone: boolean;
}

interface ActiveExercise {
  id: string; // ID do vínculo (WorkoutExercise)
  exerciseId: string;
  name: string;
  targetSets: number;
  sets: SetRecord[];
}

export function ActiveWorkoutScreen({ route }: any) {
  const { workoutId, workoutName } = route.params;
  const navigation = useNavigation<any>();
  const { formattedTime, start, pause } = useStopwatch();

  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());

  // Carrega os exercícios e monta a estrutura das séries
  useEffect(() => {
    async function loadExercises() {
      try {
        const linkCollection = database.get<WorkoutExercise>('workout_exercises');
        const exerciseCollection = database.get<Exercise>('exercises');

        const allLinks = await linkCollection.query().fetch();
        const filteredLinks = allLinks.filter(l => l.workoutId === workoutId).sort((a, b) => a.order - b.order);

        const structuredExercises = await Promise.all(
          filteredLinks.map(async (link) => {
            const exerciseData = await exerciseCollection.find(link.exerciseId);
            
            // Cria um array de séries vazias baseado na meta (targetSets)
            const setsArray = Array.from({ length: link.targetSets }).map(() => ({
              weight: '',
              reps: '',
              isDone: false,
            }));

            return {
              id: link.id,
              exerciseId: exerciseData.id,
              name: exerciseData.name,
              targetSets: link.targetSets,
              sets: setsArray,
            };
          })
        );

        setActiveExercises(structuredExercises);
        setSessionStartTime(new Date()); // Marca o momento exato do início
        start(); // Dispara o cronômetro
      } catch (error) {
        console.error('Erro ao montar treino:', error);
      }
    }
    loadExercises();
  }, []);

  // Atualiza os valores digitados (Kg ou Reps)
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const updated = [...activeExercises];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setActiveExercises(updated);
  };

  // Marca a série como concluída ou desmarca
  const toggleSetDone = (exerciseIndex: number, setIndex: number) => {
    const updated = [...activeExercises];
    updated[exerciseIndex].sets[setIndex].isDone = !updated[exerciseIndex].sets[setIndex].isDone;
    setActiveExercises(updated);
  };

  // Finaliza o treino e salva tudo no WatermelonDB
  const handleFinishWorkout = async () => {
    Alert.alert(
      'Finalizar Treino',
      'Deseja encerrar a sessão e salvar os dados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar',
          style: 'default',
          onPress: async () => {
            pause(); // Para o tempo
            try {
              await database.write(async () => {
                const sessionCollection = database.get<Session>('sessions');
                const logCollection = database.get<SessionLog>('session_logs');

                // 1. Cria a Sessão principal
                const newSession = await sessionCollection.create((session) => {
                  session.workoutId = workoutId;
                  session.startedAt = sessionStartTime;
                  session.endedAt = new Date();
                });

                // 2. Prepara todos os logs (apenas séries marcadas como "Done" e com dados)
                const logsToCreate: any[] = [];
                activeExercises.forEach((exercise) => {
                  exercise.sets.forEach((set, index) => {
                    if (set.isDone && set.weight && set.reps) {
                      logsToCreate.push(
                        logCollection.prepareCreate((log) => {
                          log.sessionId = newSession.id;
                          log.exerciseId = exercise.exerciseId;
                          log.setIndex = index + 1;
                          log.weight = parseFloat(set.weight.replace(',', '.'));
                          log.reps = parseInt(set.reps, 10);
                        })
                      );
                    }
                  });
                });

                // 3. Salva todos os logs de uma vez só em lote
                if (logsToCreate.length > 0) {
                  await database.batch(...logsToCreate);
                }
              });

              Alert.alert('Parabéns!', 'Seu treino foi salvo com sucesso no histórico.');
              navigation.goBack(); // Volta para a tela anterior
            } catch (error) {
              console.error('Erro ao salvar sessão:', error);
              Alert.alert('Erro', 'Não foi possível salvar o treino.');
              start(); // Retoma o tempo se der erro
            }
          }
        }
      ]
    );
  };

  // Desenha o card de cada exercício com as suas séries
  const renderExercise = ({ item: exercise, index: exerciseIndex }: any) => (
    <View style={styles.exerciseCard}>
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      
      {/* Cabeçalho das Colunas */}
      <View style={styles.rowHeader}>
        <Text style={[styles.columnLabel, styles.colSet]}>Série</Text>
        <Text style={[styles.columnLabel, styles.colInput]}>Kg</Text>
        <Text style={[styles.columnLabel, styles.colInput]}>Reps</Text>
        <Text style={[styles.columnLabel, styles.colCheck]}>Feito</Text>
      </View>

      {/* Linhas das Séries */}
      {exercise.sets.map((set: SetRecord, setIndex: number) => (
        <View key={setIndex} style={[styles.setRow, set.isDone && styles.setRowDone]}>
          <Text style={styles.setText}>{setIndex + 1}</Text>
          
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={set.weight}
            onChangeText={(val) => handleUpdateSet(exerciseIndex, setIndex, 'weight', val)}
            editable={!set.isDone}
          />
          
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={set.reps}
            onChangeText={(val) => handleUpdateSet(exerciseIndex, setIndex, 'reps', val)}
            editable={!set.isDone}
          />
          
          <TouchableOpacity 
            style={[styles.checkbox, set.isDone && styles.checkboxActive]}
            onPress={() => toggleSetDone(exerciseIndex, setIndex)}
          >
            {set.isDone && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{workoutName}</Text>
          <Text style={styles.subtitle}>Sessão em andamento</Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formattedTime}</Text>
        </View>
      </View>

      <FlatList
        data={activeExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
          <Text style={styles.finishButtonText}>Finalizar Treino</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#38bdf8', marginTop: 4, fontWeight: '600' },
  timerBadge: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  timerText: { color: '#f8fafc', fontSize: 20, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  exerciseCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 16 },
  rowHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 8 },
  columnLabel: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold' },
  colSet: { flex: 0.5, textAlign: 'center' },
  colInput: { flex: 1, textAlign: 'center' },
  colCheck: { flex: 0.8, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#0f172a', borderRadius: 8, padding: 8 },
  setRowDone: { opacity: 0.6 },
  setText: { flex: 0.5, color: '#e2e8f0', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  input: { flex: 1, backgroundColor: '#1e293b', color: '#f8fafc', fontSize: 16, textAlign: 'center', borderRadius: 6, marginHorizontal: 4, paddingVertical: 6 },
  checkbox: { flex: 0.8, height: 32, backgroundColor: '#1e293b', borderRadius: 6, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155', marginHorizontal: 12 },
  checkboxActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkmark: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#1e293b' },
  finishButton: { backgroundColor: '#22c55e', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  finishButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});