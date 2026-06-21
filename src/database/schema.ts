import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const databaseSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'current_weight', type: 'number' },
        { name: 'height', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'muscle_group', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'execution_url', type: 'string' },
      ]
    }),
    tableSchema({
      name: 'workouts',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'goal', type: 'string' },
        { name: 'estimated_duration', type: 'number' },
        { name: 'created_at', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'workout_exercises',
      columns: [
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string' },
        { name: 'order', type: 'number' },
        { name: 'target_sets', type: 'number' },
      ]
    }),
    // ADICIONADO: Tabela de Sessões Gerais de Treino
    tableSchema({
      name: 'sessions',
      columns: [
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'started_at', type: 'number' },
        { name: 'ended_at', type: 'number' },
      ]
    }),
    // ADICIONADO: Tabela de Logs de Carga (Kg e Repetições) por série
    tableSchema({
      name: 'session_logs',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string' },
        { name: 'set_index', type: 'number' },
        { name: 'weight', type: 'number' },
        { name: 'reps', type: 'number' },
      ]
    }),
  ]
})