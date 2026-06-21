import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Banco de dados
import { database } from '../database';
import SessionLog from '../database/models/SessionLog';
import Session from '../database/models/Session';
import Exercise from '../database/models/Exercise';

interface LogSet {
  setIndex: number;
  weight: number;
  reps: number;
}

interface GroupedLog {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: LogSet[];
}

export function HistoryDetailsScreen({ route }: any) {
  const { sessionId, workoutName, date, duration } = route.params;
  const navigation = useNavigation<any>();
  const [detailedLogs, setDetailedLogs] = useState<GroupedLog[]>([]);

  useEffect(() => {
    async function loadSessionLogs() {
      try {
        const logCollection = database.get<SessionLog>('session_logs');
        const exerciseCollection = database.get<Exercise>('exercises');

        const allLogs = await logCollection.query().fetch();
        const sessionLogs = allLogs.filter(log => log.sessionId === sessionId);

        const grouped: Record<string, GroupedLog> = {};

        for (const log of sessionLogs) {
          if (!grouped[log.exerciseId]) {
            let exerciseName = 'Exercício Removido';
            let muscleGroup = '-';
            try {
              const exercise = await exerciseCollection.find(log.exerciseId);
              exerciseName = exercise.name;
              muscleGroup = exercise.muscleGroup;
            } catch (e) {}

            grouped[log.exerciseId] = {
              exerciseId: log.exerciseId,
              name: exerciseName,
              muscleGroup,
              sets: [],
            };
          }

          grouped[log.exerciseId].sets.push({
            setIndex: log.setIndex,
            weight: log.weight,
            reps: log.reps,
          });
        }

        const finalArray = Object.values(grouped).map(group => {
          group.sets.sort((a, b) => a.setIndex - b.setIndex);
          return group;
        });

        setDetailedLogs(finalArray);
      } catch (error) {
        console.error('Erro ao carregar detalhes do histórico:', error);
      }
    }

    loadSessionLogs();
  }, [sessionId]);

  // apaga registro de treino
  const handleDeleteHistory = () => {
    Alert.alert(
      'Excluir Histórico',
      'Tem certeza que deseja apagar este treino? Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                const sessionCollection = database.get<Session>('sessions');
                const logCollection = database.get<SessionLog>('session_logs');

                
                const sessionToDelete = await sessionCollection.find(sessionId);

                
                const allLogs = await logCollection.query().fetch();
                const logsToDelete = allLogs.filter(log => log.sessionId === sessionId);

                
                const itemsToDestroy = [
                  sessionToDelete.prepareDestroyPermanently(),
                  ...logsToDelete.map(log => log.prepareDestroyPermanently())
                ];

                
                await database.batch(...itemsToDestroy);
              });

              Alert.alert('Sucesso', 'O registro foi apagado do seu histórico.');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir histórico:', error);
              Alert.alert('Erro', 'Não foi possível excluir o registro.');
            }
          }
        }
      ]
    );
  };

  const renderExerciseLog = ({ item }: { item: GroupedLog }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.muscleBadge}>{item.muscleGroup}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.colText, styles.colSet]}>Série</Text>
        <Text style={[styles.colText, styles.colData]}>Peso</Text>
        <Text style={[styles.colText, styles.colData]}>Reps</Text>
      </View>

      {item.sets.map((set, index) => (
        <View key={index} style={styles.row}>
          <Text style={[styles.rowData, styles.colSet]}>{set.setIndex}</Text>
          <Text style={[styles.rowData, styles.colData, styles.highlight]}>{set.weight} kg</Text>
          <Text style={[styles.rowData, styles.colData]}>{set.reps}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{workoutName}</Text>
        <Text style={styles.subtitle}>Realizado em {date} • {duration}</Text>
      </View>

      <FlatList
        data={detailedLogs}
        keyExtractor={(item) => item.exerciseId}
        renderItem={renderExerciseLog}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum exercício foi registrado com peso e reps nesta sessão.</Text>
        }
      />

      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteHistory}>
          <Text style={styles.deleteButtonText}>Excluir Histórico</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 15, color: '#38bdf8', marginTop: 4, fontWeight: '600' },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', flex: 1 },
  muscleBadge: { backgroundColor: '#0f172a', color: '#94a3b8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 8, marginBottom: 8 },
  colText: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold' },
  colSet: { flex: 0.5, textAlign: 'center' },
  colData: { flex: 1, textAlign: 'center' },
  row: { flexDirection: 'row', paddingVertical: 6, alignItems: 'center' },
  rowData: { color: '#e2e8f0', fontSize: 16, fontWeight: '500' },
  highlight: { color: '#22c55e', fontWeight: 'bold' }, 
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 15 },
  
  // Estilos do novo botão
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#1e293b' },
  deleteButton: { 
    backgroundColor: 'transparent', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ef4444' 
  },
  deleteButtonText: { 
    color: '#ef4444', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});