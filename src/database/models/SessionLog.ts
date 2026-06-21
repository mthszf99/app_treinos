import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

export default class SessionLog extends Model {
  static table = 'session_logs'

  @field('session_id') sessionId!: string
  @field('exercise_id') exerciseId!: string
  @field('set_index') setIndex!: number
  @field('weight') weight!: number
  @field('reps') reps!: number
}