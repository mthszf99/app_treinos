import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const databaseSchema = appSchema({
  version: 1,
  tables: [
    // Tabela de Usuários
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'current_weight', type: 'number' }, // em kg
        { name: 'height', type: 'number' },         // em metros
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Biblioteca de Exercícios global
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'muscle_group', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'execution_url', type: 'string' },
      ],
    }),

    // Agrupamento de treinos criados (Ex: Treino A)
    tableSchema({
      name: 'workouts',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'goal', type: 'string' },
        { name: 'estimated_duration', type: 'number' }, // minutos
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Agenda de dias e horários para os treinos
    tableSchema({
      name: 'workout_schedules',
      columns: [
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'day_of_week', type: 'number' }, // 0 (domingo) a 6 (sábado)
        { name: 'scheduled_time', type: 'string' }, // "07:00"
      ],
    }),

    // Relacionamento de quais exercícios estão em quais treinos
    tableSchema({
      name: 'workout_exercises',
      columns: [
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'order', type: 'number' },       // Ordem de execução: 1, 2, 3...
        { name: 'target_sets', type: 'number' },  // Quantidade de séries padrão: 3, 4...
      ],
    }),

    // Registro de cada sessão de treino iniciada com o cronômetro
    tableSchema({
      name: 'workout_sessions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'workout_id', type: 'string', isIndexed: true },
        { name: 'started_at', type: 'number' },
        { name: 'finished_at', type: 'number' },
        { name: 'duration_seconds', type: 'number' }, // Tempo total do cronômetro
      ],
    }),

    // Histórico detalhado de cada série executada dentro da sessão
    tableSchema({
      name: 'executed_sets',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'set_number', type: 'number' }, // 1ª série, 2ª série...
        { name: 'weight', type: 'number' },     // Carga usada
        { name: 'reps', type: 'number' },       // Repetições feitas
        { name: 'is_completed', type: 'boolean' }, // Se marcou o "check"
      ],
    }),
  ],
})