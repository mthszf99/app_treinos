import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class User extends Model {
  static table = 'users'

  @field('name') name!: string
  @field('email') email!: string
  @field('current_weight') currentWeight!: number
  @field('height') height!: number
  
  @readonly @date('created_at') createdAt!: Date

  // Cálculo de IMC dinâmico e automático
  get imc(): number {
    if (!this.height || !this.currentWeight) return 0
    
    const calculatedImc = this.currentWeight / (this.height * this.height)
    return parseFloat(calculatedImc.toFixed(1)) // Retorna com uma casa decimal (Ex: 16.9)
  }

  // Classificação do IMC para ajudar o usuário no painel
  get imcClassification(): string {
    const value = this.imc
    if (value === 0) return 'Dados incompletos'
    if (value < 18.5) return 'Abaixo do peso'
    if (value < 25) return 'Peso normal'
    if (value < 30) return 'Sobrepeso'
    return 'Obesidade'
  }
}