import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { databaseSchema } from './schema';

// Importando os Model
import User from './models/User';
import Exercise from './models/Exercise';
import Workout from './models/Workout';
import WorkoutExercise from './models/WorkoutExercise';


const adapter = new SQLiteAdapter({
  schema: databaseSchema,
  jsi: true,
  onSetUpError: error => {
    console.error('Falha ao inicializar o banco de dados:', error);
  }
});

// Iniciando o Banco de Dados
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Exercise,
    Workout,
    WorkoutExercise,
  ],
});