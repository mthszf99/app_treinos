import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

// Interface temporária (depois virá do WatermelonDB)
interface Workout {
  id: string;
  name: string;
  goal: string;
  duration: number;
  frequency: string;
}

export function WorkoutsScreen() {
  // Dados simulados para preencher a tela inicialmente
  const [workouts, setWorkouts] = useState<Workout[]>([
    {
      id: '1',
      name: 'Treino A - Peito e Tríceps',
      goal: 'Ganho de Massa',
      duration: 45,
      frequency: '3 dias/semana',
    },
    {
      id: '2',
      name: 'Treino B - Costas e Bíceps',
      goal: 'Ganho de Massa',
      duration: 45,
      frequency: '3 dias/semana',
    },
    {
      id: '3',
      name: 'Treino C - Pernas e Ombros',
      goal: 'Ganho de Massa',
      duration: 45,
      frequency: '3 dias/semana',
    }
  ]);

  const renderWorkoutCard = ({ item }: { item: Workout }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.durationBadge}>{item.duration} min</Text>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Objetivo:</Text>
          <Text style={styles.infoText}>{item.goal}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Frequência:</Text>
          <Text style={styles.infoText}>{item.frequency}</Text>
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
          <Text style={styles.emptyText}>Você ainda não possui treinos cadastrados.</Text>
        }
      />

      {/* Botão Flutuante para criar novo treino */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Mantendo o padrão Dark Slate 900
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