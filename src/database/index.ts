import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

// Importamos o Schema que você já criou
import { databaseSchema } from './schema';

// Importamos os Modelos (Por enquanto só temos o User)
import User from './models/User';

// 1. Criamos o Adaptador que se comunica com o SQLite do celular
const adapter = new SQLiteAdapter({
  schema: databaseSchema,
  // dbName: 'app_treinos', // Opcional, o padrão é 'watermelon'
  jsi: true, /* Recomendado para máxima performance no React Native */
  onSetUpError: error => {
    console.error('Falha ao inicializar o banco de dados:', error);
  }
});

// 2. Inicializamos o Banco de Dados
export const database = new Database({
  adapter,
  modelClasses: [
    User,
    // Em breve colocaremos os outros modelos aqui (Workout, Exercise, etc)
  ],
});