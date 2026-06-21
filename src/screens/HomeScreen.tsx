import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';

// banco de dados
import { database } from '../database';
import Session from '../database/models/Session';
import Workout from '../database/models/Workout';
import User from '../database/models/User';

export function HomeScreen() {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  // estados do dashboard
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [lastWorkoutInfo, setLastWorkoutInfo] = useState<{ name: string; date: string; duration: string } | null>(null);
  const [userName, setUserName] = useState('Atleta');

  // mtea de treinos, inicia com 3 padrao
  const WEEKLY_GOAL = 3;

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const userCollection = database.get<User>('users');
        const savedUsers = await userCollection.query().fetch();

          if (savedUsers.length > 0) {
          const firstName = savedUsers[0].name.split(' ')[0];
          setUserName(firstName);
}


        const sessionCollection = database.get<Session>('sessions');
        const workoutCollection = database.get<Workout>('workouts');


        const allSessions = await sessionCollection.query().fetch();
        const sortedSessions = allSessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentSessions = sortedSessions.filter(session => session.startedAt >= sevenDaysAgo);
        setWeeklyCount(recentSessions.length);

        
        if (sortedSessions.length > 0) {
          const lastSession = sortedSessions[0];
          let workoutName = 'Treino Removido';
          
          try {
            const workout = await workoutCollection.find(lastSession.workoutId);
            workoutName = workout.name;
          } catch (e) {}

          const diffMs = lastSession.endedAt.getTime() - lastSession.startedAt.getTime();
          const diffMins = Math.round(diffMs / 60000);

          setLastWorkoutInfo({
            name: workoutName,
            date: lastSession.startedAt.toLocaleDateString('pt-BR'),
            duration: `${diffMins} min`,
          });
        } else {
          setLastWorkoutInfo(null);
        }

      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      }
    }

    if (isFocused) {
      loadDashboardData();
    }
  }, [isFocused]);

  
  const progressPercentage = Math.min((weeklyCount / WEEKLY_GOAL) * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {userName}! 👋</Text>
          <Text style={styles.subtitle}>Pronto para buscar o seu melhor hoje?</Text>
        </View>

        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Meta da Semana</Text>
            <Text style={styles.cardHighlight}>{weeklyCount} / {WEEKLY_GOAL} treinos</Text>
          </View>
          
          <Text style={styles.progressText}>
            {weeklyCount >= WEEKLY_GOAL 
              ? 'Parabéns! Meta atingida. 💪' 
              : `Faltam ${WEEKLY_GOAL - weeklyCount} treinos para bater a meta.`}
          </Text>

          
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>

        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Último Treino Realizado</Text>
          
          {lastWorkoutInfo ? (
            <View style={styles.lastWorkoutBox}>
              <View style={styles.lastWorkoutIcon}>
                <Text style={styles.iconText}>🔥</Text>
              </View>
              <View style={styles.lastWorkoutDetails}>
                <Text style={styles.lastWorkoutName}>{lastWorkoutInfo.name}</Text>
                <Text style={styles.lastWorkoutDate}>{lastWorkoutInfo.date} • {lastWorkoutInfo.duration}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Você ainda não possui treinos registrados.</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.ctaButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Treinos')}
        >
          <Text style={styles.ctaButtonText}>Começar um Treino Agora</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 32,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  cardHighlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38bdf8',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 6,
  },
  lastWorkoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
  },
  lastWorkoutIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  lastWorkoutDetails: {
    flex: 1,
  },
  lastWorkoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  lastWorkoutDate: {
    fontSize: 13,
    color: '#94a3b8',
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 14,
    fontStyle: 'italic',
  },
  ctaButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});