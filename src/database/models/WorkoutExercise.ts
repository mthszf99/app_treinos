import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

export default class WorkoutExercise extends Model {
  static table = 'workout_exercises'

  
  @field('workout_id') workoutId!: string
  @field('exercise_id') exerciseId!: string
  
  
  @field('order') order!: number //reordenar as series
  @field('target_sets') targetSets!: number //numero de series
}