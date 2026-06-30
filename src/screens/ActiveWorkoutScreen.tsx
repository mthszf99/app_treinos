import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
  FlatList, TextInput, Alert, Vibration
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Hook de Tempo
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
  id: string; 
  exerciseId: string;
  name: string;
  targetSets: number;
  sets: SetRecord[];
  lastRecord?: string; 
}

export function ActiveWorkoutScreen({ route }: any) {
  const { workoutId, workoutName } = route.params;
  const navigation = useNavigation<any>();
  const { formattedTime, start, pause } = useStopwatch();

  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());

  // --- NOVOS ESTADOS PARA O DESCANSO ---
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  // Carrega os exercícios (Lógica mantida)
  useEffect(() => {
    async function loadExercises() {
      try {
        const linkCollection = database.get<WorkoutExercise>('workout_exercises');
        const exerciseCollection = database.get<Exercise>('exercises');
        const sessionCollection = database.get<Session>('sessions');
        const logCollection = database.get<SessionLog>('session_logs');

        const allLinks = await linkCollection.query().fetch();
        const filteredLinks = allLinks.filter(l => l.workoutId === workoutId).sort((a, b) => a.order - b.order);

        const allSessions = await sessionCollection.query().fetch();
        const allLogs = await logCollection.query().fetch();
        const sortedSessions = allSessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

        const structuredExercises = await Promise.all(
          filteredLinks.map(async (link) => {
            const exerciseData = await exerciseCollection.find(link.exerciseId);
            // Cria um array de séries vazias baseado na meta (targetSets)            
            const setsArray = Array.from({ length: link.targetSets }).map(() => ({
              weight: '',
              reps: '',
              isDone: false,
            }));

            let lastRecordStr = undefined;
            const exerciseLogs = allLogs.filter(log => log.exerciseId === exerciseData.id);

            for (const session of sortedSessions) {
              const logsForSession = exerciseLogs.filter(log => log.sessionId === session.id);
              if (logsForSession.length > 0) {
                const bestSet = logsForSession.reduce((prev, current) => 
                  (current.weight > prev.weight) ? current : prev
                );
                lastRecordStr = `${bestSet.weight}kg x ${bestSet.reps}`;
                break;
              }
            }

            return {
              id: link.id,
              exerciseId: exerciseData.id,
              name: exerciseData.name,
              targetSets: link.targetSets,
              sets: setsArray,
              lastRecord: lastRecordStr, 
            };
          })
        );

        setActiveExercises(structuredExercises);
        setSessionStartTime(new Date()); 
        start(); 
      } catch (error) {
        console.error('Erro ao montar treino:', error);
      }
    }
    loadExercises();
  }, []);

  // LÓGICA DO CRONÓMETRO DE DESCANSO
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isResting && restTimeLeft > 0) {
      // Conta os segundos para trás
      interval = setInterval(() => {
        setRestTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isResting && restTimeLeft === 0) {
      // quando o tempo acaba: Vibra e esconde o banner
      Vibration.vibrate([0, 500, 200, 500]);
      setIsResting(false);
    }

    return () => clearInterval(interval);
  }, [isResting, restTimeLeft]);


  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const updated = [...activeExercises];
    const safeValue = field === 'weight' ? value.replace(',', '.') : value;
    updated[exerciseIndex].sets[setIndex][field] = safeValue;
    setActiveExercises(updated);
  };

  // Dispara o descanso ao marcar a série
  const toggleSetDone = (exerciseIndex: number, setIndex: number) => {
    const updated = [...activeExercises];
    const willBeDone = !updated[exerciseIndex].sets[setIndex].isDone;
    updated[exerciseIndex].sets[setIndex].isDone = willBeDone;
    setActiveExercises(updated);

    if (willBeDone) {
      // Inicia descanso de 60 segundos ao concluir uma série
      setRestTimeLeft(60);
      setIsResting(true);
    } else {
      // Se o utilizador desmarcar a série por engano, cancela o timer
      setIsResting(false);
    }
  };

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
            pause(); 
            setIsResting(false); // Para o timer de descanso se estiver a rodar
            try {
              await database.write(async () => {
                const sessionCollection = database.get<Session>('sessions');
                const logCollection = database.get<SessionLog>('session_logs');

                // Cria a Sessão principal
                const newSession = await sessionCollection.create((session) => {
                  session.workoutId = workoutId;
                  session.startedAt = sessionStartTime;
                  session.endedAt = new Date();
                });


                const logsToCreate: any[] = [];
                activeExercises.forEach((exercise) => {
                  exercise.sets.forEach((set, index) => {
                    if (set.isDone && set.weight && set.reps) {
                      logsToCreate.push(
                        logCollection.prepareCreate((log) => {
                          log.sessionId = newSession.id;
                          log.exerciseId = exercise.exerciseId;
                          log.setIndex = index + 1;
                          log.weight = parseFloat(set.weight);
                          log.reps = parseInt(set.reps, 10);
                        })
                      );
                    }
                  });
                });
    // Salva todos os logs de uma vez só em lote
                if (logsToCreate.length > 0) {
                  await database.batch(...logsToCreate);
                }
              });

              Alert.alert('Parabéns!', 'Seu treino foi salvo com sucesso no histórico.');
              navigation.goBack(); 
            } catch (error) {
              console.error('Erro ao salvar sessão:', error);
              Alert.alert('Erro', 'Não foi possível salvar o treino.');
              start(); 
            }
          }
        }
      ]
    );
  };

  // formata o tempo restante para o formato (00:00)
  const formatRestTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderExercise = ({ item: exercise, index: exerciseIndex }: any) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        {exercise.lastRecord && (
          <View style={styles.lastRecordBadge}>
            <Text style={styles.lastRecordText}>⏱️ Última: {exercise.lastRecord}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.rowHeader}>
        <Text style={[styles.columnLabel, styles.colSet]}>Série</Text>
        <Text style={[styles.columnLabel, styles.colInput]}>Kg</Text>
        <Text style={[styles.columnLabel, styles.colInput]}>Reps</Text>
        <Text style={[styles.columnLabel, styles.colCheck]}>Feito</Text>
      </View>


      {exercise.sets.map((set: SetRecord, setIndex: number) => (
        <View key={setIndex} style={[styles.setRow, set.isDone && styles.setRowDone]}>
          <Text style={styles.setText}>{setIndex + 1}</Text>
          
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={set.weight}
            onChangeText={(val) => handleUpdateSet(exerciseIndex, setIndex, 'weight', val)}
            editable={!set.isDone}
            placeholder={exercise.lastRecord ? exercise.lastRecord.split('kg')[0] : '0'}
            placeholderTextColor="#334155"
          />
          
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={set.reps}
            onChangeText={(val) => handleUpdateSet(exerciseIndex, setIndex, 'reps', val)}
            editable={!set.isDone}
            placeholder="0"
            placeholderTextColor="#334155"
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

      {/* NOVO: BANNER DE DESCANSO FLUTUANTE */}
      {isResting && (
        <View style={styles.restBanner}>
          <View style={styles.restHeader}>
            <Text style={styles.restTitle}>Descanso</Text>
            <Text style={styles.restTime}>{formatRestTime(restTimeLeft)}</Text>
          </View>
          
          <View style={styles.restControls}>
            <TouchableOpacity 
              style={styles.restBtnSecondary} 
              onPress={() => setRestTimeLeft(prev => Math.max(0, prev - 15))}
            >
              <Text style={styles.restBtnTextSecondary}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.restBtnPrimary} 
              onPress={() => setIsResting(false)}
            >
              <Text style={styles.restBtnTextPrimary}>Pular</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.restBtnSecondary} 
              onPress={() => setRestTimeLeft(prev => prev + 15)}
            >
              <Text style={styles.restBtnTextSecondary}>+15s</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', flex: 1 },
  lastRecordBadge: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  lastRecordText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },

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
  
  // ESTILOS DO BANNER DE DESCANSO
  restBanner: { backgroundColor: '#38bdf8', marginHorizontal: 24, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  restHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  restTitle: { color: '#0f172a', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  restTime: { color: '#0f172a', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  restControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restBtnSecondary: { backgroundColor: 'rgba(15, 23, 42, 0.1)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  restBtnTextSecondary: { color: '#0f172a', fontWeight: 'bold', fontSize: 15 },
  restBtnPrimary: { backgroundColor: '#0f172a', flex: 1, paddingVertical: 10, marginHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  restBtnTextPrimary: { color: '#38bdf8', fontWeight: 'bold', fontSize: 15 },

  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#1e293b' },
  finishButton: { backgroundColor: '#22c55e', paddingVertical: 18, borderRadius: 12, alignItems: 'center', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  finishButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});