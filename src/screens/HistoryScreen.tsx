import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';

// Banco de dados
import { database } from '../database';
import Session from '../database/models/Session';
import Workout from '../database/models/Workout';

interface HistoryItem {
  id: string;
  workoutName: string;
  date: string;
  duration: string;
}

export function HistoryScreen() {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const sessionCollection = database.get<Session>('sessions');
        const workoutCollection = database.get<Workout>('workouts');

        // Busca
        const allSessions = await sessionCollection.query().fetch();

        // Ordena
        const sortedSessions = allSessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

        // Mostra
        const historyData = await Promise.all(
          sortedSessions.map(async (session) => {
            
            let workoutName = 'Treino Removido';
            try {
              const workout = await workoutCollection.find(session.workoutId);
              workoutName = workout.name;
            } catch (e) {
              
            }

            
            const diffMs = session.endedAt.getTime() - session.startedAt.getTime();
            const diffMins = Math.round(diffMs / 60000);

            
            const dateStr = session.startedAt.toLocaleDateString('pt-BR');

            return {
              id: session.id,
              workoutName,
              date: dateStr,
              duration: `${diffMins} min`,
            };
          })
        );

        setHistory(historyData);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }

    if (isFocused) {
      loadHistory();
    }
  }, [isFocused]);

  const renderItem = ({ item }: { item: HistoryItem }) => (
<TouchableOpacity 
    style={styles.card}
    activeOpacity={0.7}
    onPress={() => navigation.navigate('HistoryDetails', {
      sessionId: item.id,
      workoutName: item.workoutName,
      date: item.date,
      duration: item.duration
    })}
  >

    <View style={styles.card}>
      <View>
        <Text style={styles.workoutName}>{item.workoutName}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{item.duration}</Text>
      </View>
    </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meu Histórico</Text>
        <Text style={styles.subtitle}>Acompanhe a sua evolução</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Você ainda não concluiu nenhum treino.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 15, color: '#94a3b8', marginTop: 4 },
  listContent: { paddingHorizontal: 24, paddingTop: 8 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  workoutName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  dateText: { fontSize: 14, color: '#94a3b8' },
  durationBadge: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  durationText: { color: '#38bdf8', fontSize: 14, fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 40, fontSize: 15 },
});