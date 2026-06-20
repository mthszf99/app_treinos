import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Workout extends Model {
  static table = 'workouts'

  // O decorator @field conecta a propriedade do JS com a coluna do SQLite
  @field('user_id') userId!: string
  @field('name') name!: string
  @field('goal') goal!: string
  @field('estimated_duration') estimatedDuration!: number // Tempo em minutos
  
  @readonly @date('created_at') createdAt!: Date
}