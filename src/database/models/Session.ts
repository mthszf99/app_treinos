import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export default class Session extends Model {
  static table = 'sessions'

  @field('workout_id') workoutId!: string
  @date('started_at') startedAt!: Date
  @date('ended_at') endedAt!: Date
}