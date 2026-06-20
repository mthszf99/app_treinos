import { database } from './index';
import Exercise from './models/Exercise';

export async function seedExercises() {
  try {
    const exercisesCollection = database.get<Exercise>('exercises');
    
    // 1. Verifica se o banco já tem exercícios cadastrados
    const count = await exercisesCollection.query().fetchCount();
    
    // Se já existirem exercícios, interrompe a função para não duplicar dados
    if (count > 0) {
      console.log('Biblioteca de exercícios já está populada.');
      return;
    }

    console.log('Populando biblioteca de exercícios pela primeira vez...');

    // 2. Lista de exercícios base
    const baseExercises = [
      {
        name: 'Supino Reto',
        muscleGroup: 'Peito',
        description: 'Deitado no banco reto, desça a barra até o peito e empurre para cima.',
        executionUrl: '',
      },
      {
        name: 'Puxada Alta (Pulldown)',
        muscleGroup: 'Costas',
        description: 'Sentado na máquina, puxe a barra em direção ao peito inclinando levemente o tronco.',
        executionUrl: '',
      },
      {
        name: 'Agachamento Livre',
        muscleGroup: 'Pernas',
        description: 'Com a barra nos ombros, agache até formar um ângulo de 90 graus mantendo a coluna reta.',
        executionUrl: '',
      },
      {
        name: 'Desenvolvimento de Ombros',
        muscleGroup: 'Ombros',
        description: 'Sentado ou em pé, empurre os halteres para cima acima da cabeça.',
        executionUrl: '',
      },
      {
        name: 'Rosca Direta',
        muscleGroup: 'Bíceps',
        description: 'Em pé, segurando a barra, flexione os cotovelos trazendo a barra até a altura do peito.',
        executionUrl: '',
      },
      {
        name: 'Tríceps Pulley (Corda/Barra)',
        muscleGroup: 'Tríceps',
        description: 'Na polia alta, empurre a barra/corda para baixo estendendo completamente os cotovelos.',
        executionUrl: '',
      },
    ];

    // 3. Executa a escrita em bloco (Batch) para máxima performance
    await database.write(async () => {
      const preparedRecords = baseExercises.map((exerciseData) =>
        exercisesCollection.prepareCreate((exercise) => {
          exercise.name = exerciseData.name;
          exercise.muscleGroup = exerciseData.muscleGroup;
          exercise.description = exerciseData.description;
          exercise.executionUrl = exerciseData.executionUrl;
        })
      );

      // Salva todos de uma vez só no SQLite
      await database.batch(...preparedRecords);
    });

    console.log('Biblioteca de exercícios criada com sucesso!');
  } catch (error) {
    console.error('Erro ao popular banco de exercícios:', error);
  }
}